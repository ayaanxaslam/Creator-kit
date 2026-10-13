import { requireUser } from "@/lib/ai";
import { lastInput, type Tool } from "@/lib/generations";
import { getProfile } from "@/lib/profile";

const TOOLS: Tool[] = ["ideas", "script", "shots"];

/**
 * Values to pre-fill a tool's form with, so users don't retype the same things:
 * what they used last time for this tool, plus their saved creator profile.
 */
export async function GET(request: Request) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;

  const tool = new URL(request.url).searchParams.get("tool") as Tool;
  if (!TOOLS.includes(tool)) return Response.json({ error: "Unknown tool.", code: "validation" }, { status: 400 });

  const [input, profile] = await Promise.all([lastInput(tool), getProfile()]);
  return Response.json({ input, profile }, { headers: { "Cache-Control": "no-store" } });
}
