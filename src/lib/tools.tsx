import { CameraIcon, LightbulbIcon, ScriptIcon } from "@/components/icons";

export const TOOLS = [
  {
    href: "/ideas",
    name: "Idea Generator",
    short: "Ideas",
    description: "10 specific video ideas with hooks, tailored to your niche and audience.",
    Icon: LightbulbIcon,
  },
  {
    href: "/script",
    name: "Script Generator",
    short: "Script",
    description: "A timed script with hook, voiceover, shots, on-screen text and CTA.",
    Icon: ScriptIcon,
  },
  {
    href: "/shots",
    name: "Shot Planner",
    short: "Shots",
    description: "A practical shot list with angles, transitions and editing notes.",
    Icon: CameraIcon,
  },
] as const;
