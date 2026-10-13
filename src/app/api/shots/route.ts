import { errorResponse, generateStructured, readInput, requireUser } from "@/lib/ai";
import { shotsInputSchema, shotsOutputSchema } from "@/lib/schemas";

export const maxDuration = 120;

export async function POST(request: Request) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;

  const input = await readInput(request, shotsInputSchema);
  if (input.error) return input.error;
  const { idea, format, duration } = input.data;

  try {
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
Finish with 2-4 short practical filming tips specific to this video.`,
    );
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
