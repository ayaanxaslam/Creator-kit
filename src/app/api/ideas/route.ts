import { errorResponse, generateStructured, readInput, requireUser } from "@/lib/ai";
import { avoidList, previousIdeaTitles, trySaveGeneration } from "@/lib/generations";
import { resolveProfile, withProfile } from "@/lib/profile";
import { ideasInputSchema, ideasOutputSchema } from "@/lib/schemas";

export const maxDuration = 120;

export async function POST(request: Request) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;

  const input = await readInput(request, ideasInputSchema, (body) => body?.profile);
  if (input.error) return input.error;
  const { niche, audience, platform, style } = input.data;

  try {
    const [previous, profile] = await Promise.all([previousIdeaTitles(), resolveProfile(input.extra)]);
    const result = await generateStructured(
      ideasOutputSchema,
      "video_ideas",
      withProfile("ideas", profile, `Generate exactly 10 distinct short-form video ideas.

Niche: ${niche}
Target audience: ${audience}
Platform: ${platform}
Preferred content style: ${style}

For each idea give:
- title: a specific, clickable title (not a generic topic)
- hook: the exact opening line spoken or shown in the first 2 seconds
- message: the core message or takeaway the viewer should leave with, in one clear sentence
- explanation: 1-2 sentences on what the video covers and why it will resonate with this audience on ${platform}

Vary the angles (mistakes, myths, step-by-steps, comparisons, stories, challenges, etc.) so no two ideas feel alike.${avoidList(
        "The creator has already been given the ideas below. Every new idea must be clearly different from all of them — no rewordings, no same angle on the same subject:",
        previous,
      )}`),
    );
    const output = { ideas: result.ideas.slice(0, 10) };
    const saved = await trySaveGeneration("ideas", input.data, output);
    return Response.json({ ...output, ...saved });
  } catch (err) {
    return errorResponse(err);
  }
}
