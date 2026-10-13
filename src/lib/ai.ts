import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { getOpenAIKey } from "./supabase/config";
import { getCurrentUser } from "./supabase/server";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

// Reasoning models (GPT-5 family and later, o-series) accept a reasoning effort.
// "low" keeps generation fast; older non-reasoning models reject the parameter.
const SUPPORTS_REASONING = /^(gpt-[5-9]|o\d)/.test(MODEL);

export class GenerationError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}

let client: OpenAI | null = null;

function getClient() {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new GenerationError(
      "AI generation isn't available right now. Please try again in a few minutes.",
      503,
      "not_configured",
    );
  }
  client ??= new OpenAI({ apiKey, timeout: 120_000, maxRetries: 2 });
  return client;
}

const SYSTEM_PROMPT = `You are CreatorKit, an expert short-form video strategist for Instagram Reels, TikTok and YouTube Shorts.
You write for creators of every level, including beginners, so your output is concrete, practical and filmable on a phone.
Everything you produce must be specific to the creator's niche, audience and platform — never generic filler.
Write hooks the way people actually talk. Avoid clichés like "In today's video" or "Hey guys". Do not use emojis or hashtags unless asked.`;

/** Run one structured generation and return the parsed, schema-validated result. */
export async function generateStructured<T extends z.ZodType>(schema: T, name: string, prompt: string): Promise<z.infer<T>> {
  const openai = getClient();

  const response = await openai.responses.parse({
    model: MODEL,
    instructions: SYSTEM_PROMPT,
    input: prompt,
    max_output_tokens: 16000,
    ...(SUPPORTS_REASONING && { reasoning: { effort: "low" as const } }),
    text: { format: zodTextFormat(schema, name) },
  });

  const refused = response.output.some(
    (item) => item.type === "message" && item.content.some((part) => part.type === "refusal"),
  );
  if (refused || response.incomplete_details?.reason === "content_filter") {
    throw new GenerationError("The AI declined this request. Try rephrasing your inputs.", 422, "refusal");
  }
  if (response.status === "incomplete" || !response.output_parsed) {
    throw new GenerationError("The AI returned an incomplete result. Please try again.", 502, "bad_output");
  }
  return response.output_parsed as z.infer<T>;
}

/** Returns a 401 response when the request has no signed-in user, otherwise null. */
export async function requireUser() {
  if (await getCurrentUser()) return null;
  return Response.json(
    { error: "Your session has expired. Please log in again.", code: "unauthorized" },
    { status: 401 },
  );
}

/** Map any thrown error to a safe, user-facing JSON response. */
export function errorResponse(err: unknown) {
  if (err instanceof GenerationError) {
    return Response.json({ error: err.message, code: err.code }, { status: err.status });
  }

  console.error("[CreatorKit] generation failed:", err);

  if (err instanceof OpenAI.AuthenticationError || err instanceof OpenAI.PermissionDeniedError) {
    console.error("[CreatorKit] OpenAI rejected the API key — check the OpenAI key in the environment variables.");
    return Response.json(
      { error: "AI generation isn't available right now. Please try again in a few minutes.", code: "auth" },
      { status: 503 },
    );
  }
  if (err instanceof OpenAI.NotFoundError) {
    console.error(`[CreatorKit] OpenAI model "${MODEL}" isn't available to this API key — set OPENAI_MODEL to a model the key can use.`);
    return Response.json(
      { error: "AI generation isn't available right now. Please try again in a few minutes.", code: "model" },
      { status: 503 },
    );
  }
  if (err instanceof OpenAI.RateLimitError) {
    return Response.json(
      {
        error: "Too many requests right now. Wait a moment and try again.",
        code: "rate_limited",
      },
      { status: 429 },
    );
  }
  if (err instanceof OpenAI.APIConnectionTimeoutError) {
    return Response.json({ error: "The AI took too long to respond. Please try again.", code: "timeout" }, { status: 504 });
  }
  if (err instanceof OpenAI.APIConnectionError) {
    return Response.json({ error: "Couldn't reach the AI service. Check your connection and try again.", code: "network" }, { status: 503 });
  }
  if (err instanceof OpenAI.BadRequestError) {
    return Response.json({ error: "The AI service rejected the request. Please adjust your inputs and try again.", code: "bad_request" }, { status: 400 });
  }
  if (err instanceof OpenAI.APIError) {
    return Response.json({ error: "The AI service is having trouble. Please try again shortly.", code: "upstream" }, { status: 502 });
  }
  return Response.json({ error: "Something went wrong. Please try again.", code: "unknown" }, { status: 500 });
}

/** Parse a JSON body against a schema, returning field errors on failure. */
export async function readInput<T extends z.ZodType>(
  request: Request,
  schema: T,
  pickExtra?: (body: Record<string, unknown> | null) => unknown,
) {
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
  return {
    data: result.data as z.infer<T>,
    extra: pickExtra?.(body && typeof body === "object" ? (body as Record<string, unknown>) : null),
  };
}
