import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-inverse text-inverse-fg hover:opacity-90 shadow-sm",
  secondary: "border border-border bg-background text-foreground hover:bg-surface-2 hover:border-border-strong",
  ghost: "text-muted hover:text-foreground hover:bg-surface-2",
};

export const buttonClass = (variant: ButtonVariant = "primary", className?: string) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 h-10 text-sm font-medium transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    buttonVariants[variant],
    className,
  );

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Form fields                                                         */
/* ------------------------------------------------------------------ */

const controlClass = (invalid?: boolean) =>
  cn(
    "w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted/70 transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
    invalid ? "border-danger" : "border-border hover:border-border-strong",
  );

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
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

function describedBy(id: string, invalid?: boolean) {
  return invalid ? `${id}-error` : `${id}-hint`;
}

export function TextInput({ id, invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { id: string; invalid?: boolean }) {
  return (
    <input
      id={id}
      name={id}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(id, invalid)}
      className={cn(controlClass(invalid), "h-10", className)}
      {...props}
    />
  );
}

export function TextArea({ id, invalid, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; invalid?: boolean }) {
  return (
    <textarea
      id={id}
      name={id}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(id, invalid)}
      className={cn(controlClass(invalid), "min-h-28 resize-y py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  id,
  invalid,
  options,
  placeholder,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { id: string; invalid?: boolean; options: readonly string[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select
        id={id}
        name={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(id, invalid)}
        className={cn(controlClass(invalid), "h-10 appearance-none pr-9 cursor-pointer", className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

/** Segmented single-choice control (used for platform). */
export function Segmented({
  id,
  label,
  options,
  value,
  onChange,
  error,
  labels,
}: {
  id: string;
  label: string;
  options: readonly string[];
  labels?: Record<string, string>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 block text-sm font-medium text-foreground">{label}</legend>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface p-1">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              id={`${id}-${o}`}
              type="button"
              role="radio"
              aria-label={o}
              aria-checked={active}
              onClick={() => onChange(o)}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-150 sm:text-[13px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                active ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted hover:text-foreground",
              )}
            >
              {labels?.[o] ?? o}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* Layout bits                                                         */
/* ------------------------------------------------------------------ */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border border-border bg-background", className)}>{children}</div>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide",
        tone === "accent" ? "bg-accent-soft text-accent-fg" : "bg-surface-2 text-muted",
      )}
    >
      {children}
    </span>
  );
}
