import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import type { z } from "zod";
import { scriptOutputSchema, shotsOutputSchema, storedIdeasSchema } from "./schemas";
import { createClient } from "./supabase/server";

export type Tool = "ideas" | "script" | "shots";

export const TOOL_OUTPUT_SCHEMAS = {
  ideas: storedIdeasSchema,
  script: scriptOutputSchema,
  shots: shotsOutputSchema,
} satisfies Record<Tool, z.ZodType>;

export interface GenerationSummary {
  id: string;
  tool: Tool;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Generation extends GenerationSummary {
  input: Record<string, string>;
  output: unknown;
}

/** Thrown when the generations table hasn't been created in Supabase yet. */
export class StorageNotSetUpError extends Error {
  constructor() {
    super("Saving isn't set up yet: run the SQL in supabase/migrations in the Supabase SQL Editor.");
  }
}

function isMissingTable(error: PostgrestError) {
  return error.code === "42P01" || error.code === "PGRST205" || /could not find the table/i.test(error.message);
}

function fail(error: PostgrestError): never {
  if (isMissingTable(error)) throw new StorageNotSetUpError();
  throw new Error(`[generations] ${error.code}: ${error.message}`);
}

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new StorageNotSetUpError();
  return supabase;
}

/** Save a new generation for the signed-in user. Returns its id. */
export async function saveGeneration(tool: Tool, title: string, input: object, output: object) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("generations")
    .insert({ tool, title: title.slice(0, 200), input, output })
    .select("id")
    .single();
  if (error) fail(error);
  return data.id as string;
}

/** The signed-in user's saved generations, newest first. */
export async function listGenerations(tool?: Tool, limit = 100): Promise<GenerationSummary[]> {
  const supabase = await db();
  let query = supabase
    .from("generations")
    .select("id, tool, title, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (tool) query = query.eq("tool", tool);
  const { data, error } = await query;
  if (error) fail(error);
  return data as GenerationSummary[];
}

export async function getGeneration(id: string): Promise<Generation | null> {
  const supabase = await db();
  const { data, error } = await supabase.from("generations").select("*").eq("id", id).maybeSingle();
  if (error) fail(error);
  return data as Generation | null;
}

/** Update a generation's output (user edits). Returns false if it doesn't exist / isn't theirs. */
export async function updateGenerationOutput(id: string, output: object, title?: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("generations")
    .update(title === undefined ? { output } : { output, title: title.slice(0, 200) })
    .eq("id", id)
    .select("id");
  if (error) fail(error);
  return data.length > 0;
}

export async function deleteGeneration(id: string) {
  const supabase = await db();
  const { data, error } = await supabase.from("generations").delete().eq("id", id).select("id");
  if (error) fail(error);
  return data.length > 0;
}

/**
 * Titles of ideas this user has already been given, newest first, so new
 * batches don't repeat them. Returns [] if storage isn't available.
 */
export async function previousIdeaTitles(limit = 60): Promise<string[]> {
  try {
    const supabase = await db();
    const { data, error } = await supabase
      .from("generations")
      .select("output")
      .eq("tool", "ideas")
      .order("created_at", { ascending: false })
      .limit(15);
    if (error) fail(error);
    const titles = (data as { output: unknown }[]).flatMap(({ output }) => {
      const parsed = storedIdeasSchema.safeParse(output);
      return parsed.success ? parsed.data.ideas.map((i) => i.title) : [];
    });
    return [...new Set(titles)].slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Short descriptions of earlier results for the exact same input, so a
 * regenerate takes a fresh angle. Returns [] if storage isn't available.
 */
export async function previousVersions(tool: "script" | "shots", input: Record<string, string>, limit = 3): Promise<string[]> {
  try {
    const supabase = await db();
    const { data, error } = await supabase
      .from("generations")
      .select("output")
      .eq("tool", tool)
      .contains("input", input)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) fail(error);
    return (data as { output: unknown }[]).flatMap(({ output }) => {
      if (tool === "script") {
        const parsed = scriptOutputSchema.safeParse(output);
        return parsed.success ? [`"${parsed.data.title}" — hook: "${parsed.data.hook.voiceover}"`] : [];
      }
      const parsed = shotsOutputSchema.safeParse(output);
      return parsed.success
        ? [`"${parsed.data.title}" — opening shots: ${parsed.data.shots.slice(0, 3).map((s) => s.whatToFilm).join(" / ")}`]
        : [];
    });
  } catch {
    return [];
  }
}

/** Title shown in the Saved list. */
export function titleFor(tool: Tool, input: Record<string, string>, output: Record<string, unknown>) {
  if (tool === "ideas") return `${input.niche} · ${input.platform}`;
  return typeof output.title === "string" && output.title ? output.title : (input.topic ?? input.idea ?? "Untitled");
}

/** Save a fresh result, never failing the request: returns the new id, or null if it couldn't be saved. */
export async function trySaveGeneration(tool: Tool, input: Record<string, string>, output: Record<string, unknown>) {
  try {
    const id = await saveGeneration(tool, titleFor(tool, input, output), input, output);
    return { id, saved: true as const };
  } catch (err) {
    console.error("[CreatorKit] couldn't save generation:", err instanceof StorageNotSetUpError ? err.message : err);
    return { id: null, saved: false as const, saveError: err instanceof StorageNotSetUpError ? "not_set_up" : "failed" };
  }
}

/** Bulleted "don't repeat these" block for prompts, or "" if there's nothing to avoid. */
export function avoidList(heading: string, items: string[]) {
  if (items.length === 0) return "";
  return `\n\n${heading}\n${items.map((i) => `- ${i}`).join("\n")}`;
}
