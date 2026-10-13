import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

export class GenerationError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new GenerationError(
      "AI generation isn't configured yet. Set ANTHROPIC_API_KEY (in .env.local locally, or in your Vercel project's environment variables) and redeploy.",
      503,
      "not_configured",
    );
  }
  client ??= new Anthropic({ timeout: 120_000, maxRetries: 2 });
  return client;
}

const SYSTEM_PROMPT = `You are CreatorKit, an expert short-form video strategist for Instagram Reels, TikTok and YouTube Shorts.
You write for creators of every level, including beginners, so your output is concrete, practical and filmable on a phone.
Everything you produce must be specific to the creator's niche, audience and platform — never generic filler.
Write hooks the way people actually talk. Avoid clichés like "In today's video" or "Hey guys". Do not use emojis or hashtags unless asked.`;

/** Run one structured generation and return the parsed, schema-validated result. */
export async function generateStructured<T extends z.ZodType>(schema: T, prompt: string): Promise<z.infer<T>> {
  const anthropic = getClient();

  const response = await anthropic.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new GenerationError(
      "The AI declined this request. Try rephrasing your inputs.",
      422,
      "refusal",
    );
  }
  if (response.stop_reason === "max_tokens" || !response.parsed_output) {
    throw new GenerationError("The AI returned an incomplete result. Please try again.", 502, "bad_output");
  }
  return response.parsed_output as z.infer<T>;
}

/** Map any thrown error to a safe, user-facing JSON response. */
export function errorResponse(err: unknown) {
  if (err instanceof GenerationError) {
    return Response.json({ error: err.message, code: err.code }, { status: err.status });
  }

  console.error("[CreatorKit] generation failed:", err);

  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return Response.json(
      { error: "The AI API key is invalid or lacks access. Check ANTHROPIC_API_KEY.", code: "auth" },
      { status: 503 },
    );
  }
  if (err instanceof Anthropic.RateLimitError) {
    return Response.json(
      { error: "Too many requests right now. Wait a moment and try again.", code: "rate_limited" },
      { status: 429 },
    );
  }
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return Response.json({ error: "The AI took too long to respond. Please try again.", code: "timeout" }, { status: 504 });
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return Response.json({ error: "Couldn't reach the AI service. Check your connection and try again.", code: "network" }, { status: 503 });
  }
  if (err instanceof Anthropic.BadRequestError) {
    return Response.json({ error: "The AI service rejected the request. Please adjust your inputs and try again.", code: "bad_request" }, { status: 400 });
  }
  if (err instanceof Anthropic.APIError) {
    return Response.json({ error: "The AI service is having trouble. Please try again shortly.", code: "upstream" }, { status: 502 });
  }
  return Response.json({ error: "Something went wrong. Please try again.", code: "unknown" }, { status: 500 });
}

/** Parse a JSON body against a schema, returning field errors on failure. */
export async function readInput<T extends z.ZodType>(request: Request, schema: T) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: Response.json({ error: "Invalid request body.", code: "invalid_json" }, { status: 400 }) };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return {
      error: Response.json(
        { error: "Please fix the highlighted fields.", code: "validation", fieldErrors },
        { status: 400 },
      ),
    };
  }
  return { data: result.data as z.infer<T> };
}
