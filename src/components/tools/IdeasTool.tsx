"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ArrowRightIcon, LightbulbIcon } from "@/components/icons";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ResultsToolbar, ToolForm, ToolPage } from "@/components/ToolPage";
import { Card, Field, Segmented, Select, TextInput } from "@/components/ui";
import { EditableText } from "@/components/EditableText";
import { NON_RETRYABLE, useGenerate } from "@/hooks/useGenerate";
import { formatIdea, formatIdeas } from "@/lib/format";
import { CONTENT_STYLES, PLATFORMS, PLATFORM_LABELS, ideasInputSchema, type IdeasInput, type IdeasOutput } from "@/lib/schemas";
import { validate } from "@/lib/validate";

const LOADING = ["Studying your niche…", "Thinking like your audience…", "Writing scroll-stopping hooks…", "Polishing 10 ideas…"];

/** Keyed on the query string so opening a saved item (?id=) always starts fresh. */
export function IdeasTool() {
  const params = useSearchParams();
  return <IdeasToolForm key={params.toString()} savedId={params.get("id")} />;
}

function IdeasToolForm({ savedId }: { savedId: string | null }) {
  const [values, setValues] = useState({ niche: "", audience: "", platform: "TikTok", style: "" });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [lastInput, setLastInput] = useState<IdeasInput | null>(null);
  const { status, data, edit, error, fieldErrors, generate, load, saveState } = useGenerate<IdeasInput, IdeasOutput>("/api/ideas");

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
    const { data: input, errors } = validate(ideasInputSchema, values);
    setClientErrors(errors);
    if (!input) return;
    setLastInput(input);
    generate(input);
  }

  function updateIdea(i: number, key: keyof IdeasOutput["ideas"][number], v: string) {
    edit((d) => ({ ideas: d.ideas.map((idea, n) => (n === i ? { ...idea, [key]: v } : idea)) }));
  }

  return (
    <ToolPage
      icon={<LightbulbIcon className="size-[18px]" />}
      title="Video Idea Generator"
      description="Tell us who you create for. Get 10 specific ideas, each with a title, an opening hook and why it works."
      form={
        <ToolForm onSubmit={submit} loading={loading} hasResult={!!data}>
          <Field id="niche" label="Niche" hint="Be specific — “home espresso” beats “coffee”." error={errors.niche}>
            <TextInput
              id="niche"
              value={values.niche}
              onChange={(e) => set("niche")(e.target.value)}
              placeholder="e.g. Budget meal prep"
              invalid={!!errors.niche}
              maxLength={120}
            />
          </Field>
          <Field id="audience" label="Target audience" hint="Who should stop scrolling?" error={errors.audience}>
            <TextInput
              id="audience"
              value={values.audience}
              onChange={(e) => set("audience")(e.target.value)}
              placeholder="e.g. Busy university students"
              invalid={!!errors.audience}
              maxLength={160}
            />
          </Field>
          <Segmented id="platform" label="Platform" options={PLATFORMS} labels={PLATFORM_LABELS} value={values.platform} onChange={set("platform")} error={errors.platform} />
          <Field id="style" label="Content style" error={errors.style}>
            <Select
              id="style"
              value={values.style}
              onChange={(e) => set("style")(e.target.value)}
              options={CONTENT_STYLES}
              placeholder="Choose a style"
              invalid={!!errors.style}
            />
          </Field>
        </ToolForm>
      }
      results={
        loading ? (
          <LoadingState messages={LOADING} rows={5} />
        ) : status === "error" && error ? (
          <ErrorState message={error.message} onRetry={() => lastInput && generate(lastInput)} retryable={!NON_RETRYABLE.includes(error.code ?? "")} />
        ) : data ? (
          <div className="animate-fade-up">
            <ResultsToolbar
              title={`${data.ideas.length} video ideas`}
              meta={lastInput ? `${lastInput.niche} · ${lastInput.platform} · ${lastInput.style}` : undefined}
              onRegenerate={() => lastInput && generate(lastInput)}
              loading={loading}
              saveState={saveState}
              actions={<CopyButton label="Copy all" getText={() => formatIdeas(data.ideas)} />}
            />
            <ol className="space-y-3">
              {data.ideas.map((idea, i) => (
                <li key={i}>
                  <Card className="group p-4 transition-all duration-200 hover:border-border-strong hover:shadow-sm sm:p-5">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-2 font-mono text-[11px] font-medium text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <EditableText
                          label={`Idea ${i + 1} title`}
                          value={idea.title}
                          onChange={(v) => updateIdea(i, "title", v)}
                          className="text-[15px] font-semibold"
                        />
                        <div className="border-l-2 border-accent pl-3">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-accent-fg">Hook</p>
                          <EditableText label={`Idea ${i + 1} hook`} value={idea.hook} onChange={(v) => updateIdea(i, "hook", v)} className="text-sm italic" />
                        </div>
                        <EditableText
                          label={`Idea ${i + 1} explanation`}
                          value={idea.explanation}
                          onChange={(v) => updateIdea(i, "explanation", v)}
                          className="text-sm text-muted"
                        />
                        <Link
                          href={`/script?${new URLSearchParams({ topic: idea.title, platform: lastInput?.platform ?? "", audience: lastInput?.audience ?? "" })}`}
                          className="inline-flex items-center gap-1 rounded text-xs font-medium text-muted transition-colors hover:text-accent-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Write a script for this <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                      <CopyButton compact label="Copy idea" getText={() => formatIdea(idea)} />
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <EmptyState
            icon={<LightbulbIcon className="size-5" />}
            title="Your ideas will appear here"
            description="Fill in your niche and audience, pick a platform and style, then hit Generate."
          />
        )
      }
    />
  );
}
