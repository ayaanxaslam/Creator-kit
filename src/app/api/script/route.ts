import { errorResponse, generateStructured, readInput, requireUser } from "@/lib/ai";
import { scriptInputSchema, scriptOutputSchema } from "@/lib/schemas";

export const maxDuration = 120;

export async function POST(request: Request) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;

  const input = await readInput(request, scriptInputSchema);
  if (input.error) return input.error;
  const { topic, platform, audience, duration } = input.data;

  try {
    const result = await generateStructured(
      scriptOutputSchema,
      "video_script",
      `Write a complete short-form video script.

Topic: ${topic}
Platform: ${platform}
Target audience: ${audience}
Target duration: ${duration}

Structure:
- hook: the opening 1-3 seconds (voiceover, on-screen text and shot)
- beats: the body of the video in order, each with a timestamp, voiceover or dialogue, a suggested shot and on-screen text (empty string if none)
- ending: how the video wraps up
- cta: one natural call to action that fits ${platform}

Pace the script so it can be read aloud comfortably within ${duration} (roughly 2.5 spoken words per second). Timestamps must cover the full duration.`,
    );
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
