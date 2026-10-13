"use client";

import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { EditableText } from "@/components/EditableText";
import { CameraIcon } from "@/components/icons";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ResultsToolbar, ToolForm, ToolPage } from "@/components/ToolPage";
import { Card, Field, Select, TextArea } from "@/components/ui";
import { NON_RETRYABLE, useGenerate } from "@/hooks/useGenerate";
import { usePrefill } from "@/hooks/usePrefill";
import { formatShots } from "@/lib/format";
import { DURATIONS, FORMATS, shotsInputSchema, type ShotsInput, type ShotsOutput } from "@/lib/schemas";
import { validate } from "@/lib/validate";

const LOADING = ["Blocking out the scenes…", "Choosing camera angles…", "Planning transitions…", "Writing editing notes…"];

type Shot = ShotsOutput["shots"][number];

/** Keyed on the query string so a handoff link from another tool always pre-fills a fresh form. */
export function ShotsTool() {
  const params = useSearchParams();
  return <ShotsToolForm key={params.toString()} params={params} />;
}

function ShotsToolForm({ params }: { params: ReadonlyURLSearchParams }) {
  const initialDuration = params.get("duration") ?? "";
  const [initialValues] = useState(() => ({
    idea: params.get("idea") ?? "",
    format: "",
    duration: (DURATIONS as readonly string[]).includes(initialDuration) ? initialDuration : "30 seconds",
  }));
  const [values, setValues] = useState(initialValues);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [lastInput, setLastInput] = useState<ShotsInput | null>(null);
  const { status, data, edit, error, fieldErrors, generate, load, saveState } = useGenerate<ShotsInput, ShotsOutput>("/api/shots");

  const savedId = params.get("id");

  // Fill in the format and length they used last time
  usePrefill({
    tool: "shots",
    fillForm: !savedId && !params.get("idea"),
    fields: ["format", "duration"],
    defaults: initialValues,
    setValues,
  });

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
    const { data: input, errors } = validate(shotsInputSchema, values);
    setClientErrors(errors);
    if (!input) return;
    setLastInput(input);
    generate(input);
  }

  const updateShot = (i: number, key: keyof Shot, v: string) =>
    edit((d) => ({ ...d, shots: d.shots.map((s, n) => (n === i ? { ...s, [key]: v } : s)) }));
  const updateTip = (i: number, v: string) => edit((d) => ({ ...d, tips: d.tips.map((t, n) => (n === i ? v : t)) }));

  return (
    <ToolPage
      icon={<CameraIcon className="size-[18px]" />}
      title="Shot Planner"
      description="Describe your video and get a shot-by-shot plan: timestamps, angles, what to film, transitions and editing notes."
      form={
        <ToolForm onSubmit={submit} loading={loading} hasResult={!!data}>
          <Field id="idea" label="Video idea" hint="A sentence or two about what happens in the video." error={errors.idea}>
            <TextArea
              id="idea"
              value={values.idea}
              onChange={(e) => set("idea")(e.target.value)}
              placeholder="e.g. Unboxing and first impressions of a budget mechanical keyboard, ending with a typing sound test"
              invalid={!!errors.idea}
              maxLength={600}
            />
          </Field>
          <Field id="format" label="Format" error={errors.format}>
            <Select id="format" value={values.format} onChange={(e) => set("format")(e.target.value)} options={FORMATS} placeholder="Choose a format" invalid={!!errors.format} />
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
              title={data.title}
              meta={`${data.shots.length} shots${lastInput ? ` · ${lastInput.format} · ${lastInput.duration}` : ""}`}
              onRegenerate={() => lastInput && generate(lastInput)}
              loading={loading}
              saveState={saveState}
              actions={<CopyButton label="Copy shot list" getText={() => formatShots(data)} />}
            />
            <ol className="space-y-3">
              {data.shots.map((s, i) => (
                <li key={i}>
                  <Card className="p-4 transition-all duration-200 hover:border-border-strong hover:shadow-sm sm:p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-muted">#{i + 1}</span>
                      <span className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-foreground">{s.timestamp}</span>
                      <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-fg">{s.shotType}</span>
                    </div>
                    <EditableText label={`Shot ${i + 1} what to film`} value={s.whatToFilm} onChange={(v) => updateShot(i, "whatToFilm", v)} className="text-[15px] font-medium" />
                    <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-3">
                      {(
                        [
                          ["cameraAngle", "Camera angle"],
                          ["transition", "Transition"],
                          ["editingNotes", "Editing notes"],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key} className="min-w-0">
                          <dt className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">{label}</dt>
                          <dd>
                            <EditableText label={`Shot ${i + 1} ${label}`} value={s[key]} onChange={(v) => updateShot(i, key, v)} className="text-sm text-muted" />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Card>
                </li>
              ))}
            </ol>
            {data.tips.length > 0 && (
              <Card className="mt-4 bg-surface p-5">
                <h3 className="mb-2 text-sm font-semibold text-foreground">Filming tips</h3>
                <ul className="space-y-1">
                  {data.tips.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-[11px] size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <EditableText label={`Tip ${i + 1}`} value={t} onChange={(v) => updateTip(i, v)} className="text-sm text-muted" />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<CameraIcon className="size-5" />}
            title="Your shot list will appear here"
            description="Describe the video and choose a format. You'll get a practical, phone-friendly plan to film it."
          />
        )
      }
    />
  );
}
