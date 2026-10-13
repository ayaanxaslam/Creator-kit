"use client";

import Link from "next/link";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";
import { EditableText } from "@/components/EditableText";
import { ArrowRightIcon, ScriptIcon } from "@/components/icons";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ResultsToolbar, ToolForm, ToolPage } from "@/components/ToolPage";
import { Badge, Card, Field, Segmented, Select, TextArea, TextInput, buttonClass } from "@/components/ui";
import { NON_RETRYABLE, useGenerate } from "@/hooks/useGenerate";
import { formatScript, formatVoiceover } from "@/lib/format";
import { DURATIONS, PLATFORMS, PLATFORM_LABELS, scriptInputSchema, type ScriptInput, type ScriptOutput } from "@/lib/schemas";
import { validate } from "@/lib/validate";

const LOADING = ["Outlining the story…", "Writing a hook that stops the scroll…", "Timing every beat…", "Adding shots and on-screen text…"];

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">{children}</p>;
}

/** Keyed on the query string so a handoff link from another tool always pre-fills a fresh form. */
export function ScriptTool() {
  const params = useSearchParams();
  return <ScriptToolForm key={params.toString()} params={params} />;
}

function ScriptToolForm({ params }: { params: ReadonlyURLSearchParams }) {
  const initialPlatform = params.get("platform") ?? "";
  const [values, setValues] = useState({
    topic: params.get("topic") ?? "",
    platform: (PLATFORMS as readonly string[]).includes(initialPlatform) ? initialPlatform : "TikTok",
    audience: params.get("audience") ?? "",
    duration: "30 seconds",
  });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [lastInput, setLastInput] = useState<ScriptInput | null>(null);
  const { status, data, edit, error, fieldErrors, generate, load, saveState } = useGenerate<ScriptInput, ScriptOutput>("/api/script");

  const savedId = params.get("id");
  useEffect(() => {
    if (!savedId) return;
    load(savedId).then((input) => {
      if (!input) return;
      setValues(input);
      setLastInput(input);
    });
  }, [savedId, load]);

  const errors = { ...fieldErrors, ...clientErrors };
  const loading = status === "loading";

  const set = (key: keyof typeof values) => (v: string) => {
    setValues((s) => ({ ...s, [key]: v }));
    setClientErrors((e) => ({ ...e, [key]: "" }));
  };

  function submit() {
    const { data: input, errors } = validate(scriptInputSchema, values);
    setClientErrors(errors);
    if (!input) return;
    setLastInput(input);
    generate(input);
  }

  const patch = edit;
  const updateHook = (key: keyof ScriptOutput["hook"], v: string) => patch((s) => ({ ...s, hook: { ...s.hook, [key]: v } }));
  const updateBeat = (i: number, key: keyof ScriptOutput["beats"][number], v: string) =>
    patch((s) => ({ ...s, beats: s.beats.map((b, n) => (n === i ? { ...b, [key]: v } : b)) }));

  return (
    <ToolPage
      icon={<ScriptIcon className="size-[18px]" />}
      title="Script Generator"
      description="Turn a topic into a timed, ready-to-film script — hook, voiceover, shots, on-screen text, ending and call to action."
      form={
        <ToolForm onSubmit={submit} loading={loading} hasResult={!!data}>
          <Field id="topic" label="Video topic" hint="What is this video about?" error={errors.topic}>
            <TextArea
              id="topic"
              value={values.topic}
              onChange={(e) => set("topic")(e.target.value)}
              placeholder="e.g. 3 mistakes beginners make when meal prepping"
              invalid={!!errors.topic}
              maxLength={300}
              className="min-h-24"
            />
          </Field>
          <Segmented id="platform" label="Platform" options={PLATFORMS} labels={PLATFORM_LABELS} value={values.platform} onChange={set("platform")} error={errors.platform} />
          <Field id="audience" label="Target audience" error={errors.audience}>
            <TextInput
              id="audience"
              value={values.audience}
              onChange={(e) => set("audience")(e.target.value)}
              placeholder="e.g. Students cooking on a budget"
              invalid={!!errors.audience}
              maxLength={160}
            />
          </Field>
          <Field id="duration" label="Duration" error={errors.duration}>
            <Select id="duration" value={values.duration} onChange={(e) => set("duration")(e.target.value)} options={DURATIONS} invalid={!!errors.duration} />
          </Field>
        </ToolForm>
      }
      results={
        loading ? (
          <LoadingState messages={LOADING} rows={4} />
        ) : status === "error" && error ? (
          <ErrorState message={error.message} onRetry={() => lastInput && generate(lastInput)} retryable={!NON_RETRYABLE.includes(error.code ?? "")} />
        ) : data ? (
          <div className="animate-fade-up">
            <ResultsToolbar
              title="Your script"
              meta={lastInput ? `${lastInput.platform} · ${lastInput.duration}` : undefined}
              onRegenerate={() => lastInput && generate(lastInput)}
              loading={loading}
              saveState={saveState}
              actions={
                <>
                  <CopyButton label="Voiceover" getText={() => formatVoiceover(data)} className="hidden sm:inline-flex" />
                  <CopyButton label="Copy script" getText={() => formatScript(data)} />
                </>
              }
            />
            <Card className="overflow-hidden">
              <div className="border-b border-border px-5 py-4 sm:px-6">
                <EditableText label="Script title" value={data.title} onChange={(v) => patch((s) => ({ ...s, title: v }))} className="text-lg font-semibold tracking-tight" />
              </div>

              {/* Hook */}
              <div className="border-b border-border bg-accent-soft/40 px-5 py-5 sm:px-6">
                <div className="mb-3 flex items-center gap-2">
                  <Badge tone="accent">Opening hook</Badge>
                </div>
                <EditableText label="Hook voiceover" value={data.hook.voiceover} onChange={(v) => updateHook("voiceover", v)} className="text-[15px] font-medium" />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>On-screen text</Label>
                    <EditableText label="Hook on-screen text" value={data.hook.onScreenText} onChange={(v) => updateHook("onScreenText", v)} className="text-sm" placeholder="None" />
                  </div>
                  <div>
                    <Label>Shot</Label>
                    <EditableText label="Hook shot" value={data.hook.shot} onChange={(v) => updateHook("shot", v)} className="text-sm text-muted" />
                  </div>
                </div>
              </div>

              {/* Beats */}
              <ol className="divide-y divide-border">
                {data.beats.map((b, i) => (
                  <li key={i} className="grid gap-3 px-5 py-5 transition-colors hover:bg-surface sm:grid-cols-[88px_minmax(0,1fr)] sm:px-6">
                    <div>
                      <span className="inline-block rounded-md border border-border bg-background px-2 py-0.5 font-mono text-xs text-muted">{b.timestamp}</span>
                    </div>
                    <div className="min-w-0">
                      <Label>Voiceover / dialogue</Label>
                      <EditableText label={`Beat ${i + 1} voiceover`} value={b.voiceover} onChange={(v) => updateBeat(i, "voiceover", v)} className="text-[15px]" />
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Shot</Label>
                          <EditableText label={`Beat ${i + 1} shot`} value={b.shot} onChange={(v) => updateBeat(i, "shot", v)} className="text-sm text-muted" />
                        </div>
                        <div>
                          <Label>On-screen text</Label>
                          <EditableText label={`Beat ${i + 1} on-screen text`} value={b.onScreenText} onChange={(v) => updateBeat(i, "onScreenText", v)} className="text-sm" placeholder="None" />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Ending + CTA */}
              <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
                <div className="bg-background px-5 py-5 sm:px-6">
                  <Label>Ending</Label>
                  <EditableText label="Ending" value={data.ending} onChange={(v) => patch((s) => ({ ...s, ending: v }))} className="text-sm" />
                </div>
                <div className="bg-background px-5 py-5 sm:px-6">
                  <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-accent-fg">Call to action</p>
                  <EditableText label="Call to action" value={data.cta} onChange={(v) => patch((s) => ({ ...s, cta: v }))} className="text-sm font-medium" />
                </div>
              </div>
            </Card>
            <div className="mt-4 flex justify-end">
              <Link
                href={`/shots?${new URLSearchParams({ idea: lastInput?.topic ?? data.title, duration: lastInput?.duration ?? "" })}`}
                className={buttonClass("ghost", "h-9 text-xs")}
              >
                Plan the shots for this video <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<ScriptIcon className="size-5" />}
            title="Your script will appear here"
            description="Describe your topic, choose a platform and length, and get a fully timed script you can edit and copy."
          />
        )
      }
    />
  );
}
