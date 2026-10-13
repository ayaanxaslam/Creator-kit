import { errorResponse, generateStructured, readInput, requireUser } from "@/lib/ai";
import { ideasInputSchema, ideasOutputSchema } from "@/lib/schemas";

export const maxDuration = 120;

export async function POST(request: Request) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;

  const input = await readInput(request, ideasInputSchema);
  if (input.error) return input.error;
  const { niche, audience, platform, style } = input.data;

  try {
    const result = await generateStructured(
      ideasOutputSchema,
      "video_ideas",
      `Generate exactly 10 distinct short-form video ideas.

Niche: ${niche}
Target audience: ${audience}
Platform: ${platform}
Preferred content style: ${style}

For each idea give:
- title: a specific, clickable title (not a generic topic)
- hook: the exact opening line spoken or shown in the first 2 seconds
- explanation: 1-2 sentences on what the video covers and why it will resonate with this audience on ${platform}

Vary the angles (mistakes, myths, step-by-steps, comparisons, stories, challenges, etc.) so no two ideas feel alike.`,
    );
    return Response.json({ ideas: result.ideas.slice(0, 10) });
  } catch (err) {
    return errorResponse(err);
  }
}
