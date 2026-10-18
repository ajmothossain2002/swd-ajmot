import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldBaseProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

function FieldLabel({
  error,
  hint,
  id,
  label,
}: FieldBaseProps) {
  return (
    <>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      {hint ? (
        <span className="mb-2 block text-xs text-muted" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="mb-2 block text-xs text-accent" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </>
  );
}

type TextFieldProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "aria-describedby">;

export function TextField({ error, hint, id, label, ...props }: TextFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <FieldLabel error={error} hint={hint} id={id} label={label} />
      <input
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className="min-h-12 w-full border border-line bg-surface px-4 py-3 text-sm placeholder:text-muted/70 focus-visible:border-focus"
        id={id}
        {...props}
      />
    </div>
  );
}

type TextAreaFieldProps = FieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "aria-describedby">;

export function TextAreaField({ error, hint, id, label, ...props }: TextAreaFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <FieldLabel error={error} hint={hint} id={id} label={label} />
      <textarea
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className="min-h-36 w-full resize-y border border-line bg-surface px-4 py-3 text-sm placeholder:text-muted/70 focus-visible:border-focus"
        id={id}
        {...props}
      />
    </div>
  );
}
