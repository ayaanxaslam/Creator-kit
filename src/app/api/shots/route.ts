import { errorResponse, generateStructured, readInput, requireUser } from "@/lib/ai";
import { avoidList, previousVersions, trySaveGeneration } from "@/lib/generations";
import { getProfile, profilePrompt } from "@/lib/profile";
import { shotsInputSchema, shotsOutputSchema } from "@/lib/schemas";

export const maxDuration = 120;

export async function POST(request: Request) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;

  const input = await readInput(request, shotsInputSchema);
  if (input.error) return input.error;
  const { idea, format, duration } = input.data;

  try {
    const [previous, profile] = await Promise.all([previousVersions("shots", input.data), getProfile()]);
    const result = await generateStructured(
      shotsOutputSchema,
      "shot_list",
      `Create a practical shot list for a short-form vertical video.

Video idea: ${idea}
Format: ${format}
Target duration: ${duration}

For each shot give a timestamp, a shot type, the camera angle, exactly what to film, the transition into the next shot and editing notes (cuts, speed, text, sound, zooms).
Use screen recordings, hand shots, close-ups and product reveals wherever they genuinely fit this idea — don't force them in.
Everything must be filmable with a phone by one person. Timestamps must run in order and cover the full ${duration}.
Finish with 2-4 short practical filming tips specific to this video.${profilePrompt(profile)}${avoidList(
        "Earlier shot lists for this same video are listed below. Plan a fresh approach with different opening shots and visual ideas:",
        previous,
      )}`,
    );
    const saved = await trySaveGeneration("shots", input.data, result);
    return Response.json({ ...result, ...saved });
  } catch (err) {
    return errorResponse(err);
  }
}
