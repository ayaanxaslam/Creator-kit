import type { IdeasOutput, ScriptOutput, ShotsOutput } from "./schemas";

type Idea = IdeasOutput["ideas"][number];

export function formatIdea(idea: Idea, n?: number) {
  return `${n ? `${n}. ` : ""}${idea.title}\nHook: ${idea.hook}${idea.message ? `\nMessage: ${idea.message}` : ""}\n${idea.explanation}`;
}

export function formatIdeas(ideas: Idea[]) {
  return ideas.map((idea, i) => formatIdea(idea, i + 1)).join("\n\n");
}

export function formatScript(s: ScriptOutput) {
  const lines = [
    s.title.toUpperCase(),
    "",
    "HOOK",
    `Voiceover: ${s.hook.voiceover}`,
    s.hook.onScreenText ? `On-screen text: ${s.hook.onScreenText}` : null,
    `Shot: ${s.hook.shot}`,
    "",
    ...s.beats.flatMap((b) => [
      `[${b.timestamp}]`,
      `Voiceover: ${b.voiceover}`,
      b.onScreenText ? `On-screen text: ${b.onScreenText}` : null,
      `Shot: ${b.shot}`,
      "",
    ]),
    "ENDING",
    s.ending,
    "",
    "CALL TO ACTION",
    s.cta,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function formatVoiceover(s: ScriptOutput) {
  return [s.hook.voiceover, ...s.beats.map((b) => b.voiceover), s.ending, s.cta].filter(Boolean).join("\n\n");
}

export function formatShots(p: ShotsOutput) {
  return [
    p.title.toUpperCase(),
    "",
    ...p.shots.map(
      (s, i) =>
        `${i + 1}. [${s.timestamp}] ${s.shotType} — ${s.cameraAngle}\n   Film: ${s.whatToFilm}\n   Transition: ${s.transition}\n   Edit: ${s.editingNotes}`,
    ),
    "",
    "FILMING TIPS",
    ...p.tips.map((t) => `- ${t}`),
  ].join("\n");
}
