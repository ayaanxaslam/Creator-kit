"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { logIn, requestPasswordReset, signUp, updatePassword, type AuthFormState } from "@/lib/auth-actions";
import { Button, Field, Spinner, TextInput } from "@/components/ui";
import { Notice } from "./AuthCard";

const initial: AuthFormState = {};

function SubmitButton({ children, pendingText }: { children: string; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Spinner /> {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

function PasswordField({
  id,
  label,
  error,
  autoComplete,
  hint,
  action,
}: {
  id: string;
  label: string;
  error?: string;
  autoComplete: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <TextInput id={id} type={show ? "text" : "password"} autoComplete={autoComplete} invalid={!!error} className="pr-16" required />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function EmailField({ state }: { state: AuthFormState }) {
  return (
    <Field id="email" label="Email" error={state.fieldErrors?.email}>
      <TextInput
        id="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        defaultValue={state.email}
        invalid={!!state.fieldErrors?.email}
        required
      />
    </Field>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(logIn, initial);
  return (
    <form action={action} noValidate className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="next" value={next ?? ""} />
      <EmailField state={state} />
      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        action={
          <Link href="/forgot-password" className="rounded text-xs text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Forgot password?
          </Link>
        }
      />
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signUp, initial);
  if (state.success) return <Notice tone="success">{state.success}</Notice>;
  return (
    <form action={action} noValidate className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <EmailField state={state} />
      <PasswordField id="password" label="Password" autoComplete="new-password" hint="At least 8 characters." error={state.fieldErrors?.password} />
      <PasswordField id="confirm" label="Confirm password" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);
  if (state.success) return <Notice tone="success">{state.success}</Notice>;
  return (
    <form action={action} noValidate className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <EmailField state={state} />
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePassword, initial);
  return (
    // key resets the inputs after a successful change
    <form key={state.success ?? "form"} action={action} noValidate className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.success && <Notice tone="success">{state.success}</Notice>}
      <PasswordField id="password" label="New password" autoComplete="new-password" hint="At least 8 characters." error={state.fieldErrors?.password} />
      <PasswordField id="confirm" label="Confirm new password" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <div className="sm:w-auto">
        <SubmitButton pendingText="Updating…">Update password</SubmitButton>
      </div>
    </form>
  );
}
