"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { saveProfile } from "@/lib/profile-actions";
import { setCurrentProfile } from "@/lib/profile-store";
import { PROFILE_LIMITS, type Profile } from "@/lib/schemas";
import { CheckIcon, UserIcon } from "./icons";
import { Card, Field, TextArea, cn } from "./ui";

const FIELDS: { key: keyof Profile; label: string; hint: string; placeholder: string; rows: number }[] = [
  {
    key: "bio",
    label: "About you",
    hint: "Your bio — who you are, what you do, your story or experience.",
    placeholder: "e.g. Former barista turned home-coffee nerd. I test cheap gear so you don't have to.",
    rows: 3,
  },
  {
    key: "helps",
    label: "Who are you trying to help?",
    hint: "The people your content is for, and what they struggle with.",
    placeholder: "e.g. Students and first-time home baristas who want café coffee on a budget.",
    rows: 2,
  },
  {
    key: "message",
    label: "What messages do you want to get out?",
    hint: "The ideas, beliefs or lessons you want your videos to share.",
    placeholder: "e.g. Great coffee doesn't need expensive gear. Technique beats price. Anyone can learn.",
    rows: 3,
  },
];

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY = 900;

/**
 * Creator profile form. Changes are saved to the user's account automatically
 * and used to personalise every idea, script and shot list.
 */
export function ProfileCard({ initial, collapsible = false }: { initial: Profile; collapsible?: boolean }) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Profile, string>>>({});
  const filled = FIELDS.filter((f) => initial[f.key].trim()).length;
  const [open, setOpen] = useState(!collapsible || filled === 0);
  const dirty = useRef(false);

  // Share what's on screen with the generator, even before auto-save finishes
  useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!dirty.current) return;
    setSaveState("saving");
    const timer = setTimeout(async () => {
      try {
        const result = await saveProfile(profile);
        dirty.current = false;
        if (result.ok) {
          setSaveState("saved");
          setError(null);
          setFieldErrors({});
        } else {
          setSaveState("error");
          setError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
        }
      } catch {
        setSaveState("error");
        setError("Couldn't save right now. Please try again.");
      }
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [profile]);

  const update = (key: keyof Profile) => (value: string) => {
    dirty.current = true;
    setProfile((p) => ({ ...p, [key]: value }));
  };

  const filledNow = FIELDS.filter((f) => profile[f.key].trim()).length;

  const status = (
    <span className="inline-flex items-center gap-1 text-xs text-muted" aria-live="polite">
      {saveState === "saving" && "Saving…"}
      {saveState === "saved" && (
        <>
          <CheckIcon className="size-3 text-accent" /> Saved to your account
        </>
      )}
      {saveState === "error" && <span className="text-danger">{error}</span>}
    </span>
  );

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => collapsible && setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="creator-profile-fields"
        disabled={!collapsible}
        className={cn(
          "flex w-full items-center gap-3 px-5 py-4 text-left sm:px-6",
          collapsible && "transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-none",
          !collapsible && "cursor-default",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent">
          <UserIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">Your creator profile</span>
          <span className="block text-xs text-muted">
            {filledNow === 0
              ? "Tell us about you so every idea fits you and your audience."
              : `${filledNow} of 3 answered · used for all your ideas, scripts and shot lists`}
          </span>
        </span>
        {collapsible && (
          <svg
            className={cn("size-4 shrink-0 text-muted transition-transform duration-200", open && "rotate-180")}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      {open && (
        <div id="creator-profile-fields" className="animate-fade-up space-y-4 border-t border-border px-5 pb-5 pt-4 sm:px-6">
          {FIELDS.map((f) => (
            <Field key={f.key} id={`profile-${f.key}`} label={f.label} hint={f.hint} error={fieldErrors[f.key]}>
              <TextArea
                id={`profile-${f.key}`}
                value={profile[f.key]}
                onChange={(e) => update(f.key)(e.target.value)}
                placeholder={f.placeholder}
                maxLength={PROFILE_LIMITS[f.key]}
                rows={f.rows}
                invalid={!!fieldErrors[f.key]}
                className="min-h-0"
              />
            </Field>
          ))}
          <div className="flex min-h-5 items-center justify-between gap-3">
            {status}
            {collapsible && (
              <Link href="/account" className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline">
                Also on your Account page
              </Link>
            )}
          </div>
        </div>
      )}
      {!open && saveState !== "idle" && <div className="border-t border-border px-5 py-2 sm:px-6">{status}</div>}
    </Card>
  );
}

export function ProfileSkeleton() {
  return <div className="h-[72px] animate-shimmer rounded-xl border border-border bg-surface" aria-hidden="true" />;
}
