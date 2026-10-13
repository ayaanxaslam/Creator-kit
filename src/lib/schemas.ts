import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Shared option lists (used by forms and request validation)          */
/* ------------------------------------------------------------------ */

export const PLATFORMS = ["Instagram Reels", "TikTok", "YouTube Shorts"] as const;

export const PLATFORM_LABELS: Record<string, string> = {
  "Instagram Reels": "Reels",
  TikTok: "TikTok",
  "YouTube Shorts": "Shorts",
};

export const CONTENT_STYLES = [
  "Educational",
  "Entertaining",
  "Storytelling",
  "Tutorial / How-to",
  "Behind the scenes",
  "Talking head",
  "Product showcase",
  "Trend / Meme",
] as const;

export const DURATIONS = ["15 seconds", "30 seconds", "45 seconds", "60 seconds", "90 seconds"] as const;

export const FORMATS = [
  "Talking head",
  "Voiceover with B-roll",
  "Tutorial / Screen recording",
  "Product review / Unboxing",
  "Day in the life / Vlog",
  "Skit / Comedy",
  "Before and after",
] as const;

const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

/* ------------------------------------------------------------------ */
/* Request inputs                                                      */
/* ------------------------------------------------------------------ */

export const ideasInputSchema = z.object({
  niche: text("Niche", 2, 120),
  audience: text("Target audience", 2, 160),
  platform: z.enum(PLATFORMS, { error: "Choose a platform." }),
  style: z.enum(CONTENT_STYLES, { error: "Choose a content style." }),
});
export type IdeasInput = z.infer<typeof ideasInputSchema>;

export const scriptInputSchema = z.object({
  topic: text("Video topic", 3, 300),
  platform: z.enum(PLATFORMS, { error: "Choose a platform." }),
  audience: text("Target audience", 2, 160),
  duration: z.enum(DURATIONS, { error: "Choose a duration." }),
});
export type ScriptInput = z.infer<typeof scriptInputSchema>;

export const shotsInputSchema = z.object({
  idea: text("Video idea", 5, 600),
  format: z.enum(FORMATS, { error: "Choose a format." }),
  duration: z.enum(DURATIONS, { error: "Choose a duration." }),
});
export type ShotsInput = z.infer<typeof shotsInputSchema>;

/* ------------------------------------------------------------------ */
/* Model outputs (structured output schemas)                           */
/* ------------------------------------------------------------------ */

export const ideasOutputSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string().describe("Short, specific video title"),
      hook: z.string().describe("The exact first line spoken or shown in the first 2 seconds"),
      explanation: z.string().describe("1-2 sentences on what the video covers and why it works"),
    }),
  ),
});
export type IdeasOutput = z.infer<typeof ideasOutputSchema>;

export const scriptOutputSchema = z.object({
  title: z.string(),
  hook: z.object({
    voiceover: z.string().describe("What is said in the opening 1-3 seconds"),
    onScreenText: z.string(),
    shot: z.string(),
  }),
  beats: z.array(
    z.object({
      timestamp: z.string().describe("e.g. 0:03-0:10"),
      voiceover: z.string().describe("Voiceover or dialogue for this beat"),
      shot: z.string().describe("Suggested shot for this beat"),
      onScreenText: z.string().describe("On-screen text overlay, or empty string if none"),
    }),
  ),
  ending: z.string().describe("How the video wraps up"),
  cta: z.string().describe("Suggested call to action"),
});
export type ScriptOutput = z.infer<typeof scriptOutputSchema>;

export const shotsOutputSchema = z.object({
  title: z.string(),
  shots: z.array(
    z.object({
      timestamp: z.string().describe("e.g. 0:00-0:03"),
      shotType: z
        .string()
        .describe("Category such as Close-up, Hand shot, Screen recording, Product reveal, Wide, Medium, B-roll"),
      cameraAngle: z.string(),
      whatToFilm: z.string(),
      transition: z.string().describe("Transition into the next shot"),
      editingNotes: z.string(),
    }),
  ),
  tips: z.array(z.string()).describe("2-4 short practical filming tips for this video"),
});
export type ShotsOutput = z.infer<typeof shotsOutputSchema>;
