import { z } from "zod";
import { requireUser } from "@/lib/ai";
import {
  StorageNotSetUpError,
  TOOL_OUTPUT_SCHEMAS,
  deleteGeneration,
  getGeneration,
  titleFor,
  updateGenerationOutput,
} from "@/lib/generations";

type Context = { params: Promise<{ id: string }> };

const idSchema = z.uuid();

function storageError(err: unknown) {
  if (err instanceof StorageNotSetUpError) {
    return Response.json({ error: err.message, code: "storage_not_set_up" }, { status: 503 });
  }
  console.error("[CreatorKit] generations API:", err);
  return Response.json({ error: "Couldn't reach your saved items. Please try again.", code: "storage_error" }, { status: 502 });
}

const notFound = () => Response.json({ error: "That item doesn't exist or was deleted.", code: "not_found" }, { status: 404 });

async function readId(context: Context) {
  const { id } = await context.params;
  return idSchema.safeParse(id).success ? id : null;
}

export async function GET(_request: Request, context: Context) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;
  const id = await readId(context);
  if (!id) return notFound();

  try {
    const generation = await getGeneration(id);
    return generation ? Response.json(generation) : notFound();
  } catch (err) {
    return storageError(err);
  }
}

/** Save the user's edits to a generation's output. */
export async function PATCH(request: Request, context: Context) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;
  const id = await readId(context);
  if (!id) return notFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body.", code: "invalid_json" }, { status: 400 });
  }

  try {
    const existing = await getGeneration(id);
    if (!existing) return notFound();

    const parsed = TOOL_OUTPUT_SCHEMAS[existing.tool].safeParse((body as { output?: unknown })?.output);
    if (!parsed.success) return Response.json({ error: "Those changes couldn't be saved.", code: "validation" }, { status: 400 });

    const output = parsed.data as Record<string, unknown>;
    const title = existing.tool === "ideas" ? undefined : titleFor(existing.tool, existing.input, output);
    const ok = await updateGenerationOutput(id, output, title);
    return ok ? Response.json({ ok: true }) : notFound();
  } catch (err) {
    return storageError(err);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;
  const id = await readId(context);
  if (!id) return notFound();

  try {
    return (await deleteGeneration(id)) ? Response.json({ ok: true }) : notFound();
  } catch (err) {
    return storageError(err);
  }
}
