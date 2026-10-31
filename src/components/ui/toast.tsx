"use client";

import { useEffect } from "react";

type ToastProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  duration?: number;
};

export function Toast({
  open,
  onClose,
  title,
  message,
  duration = 7000,
}: ToastProps) {
  useEffect(() => {
    if (!open || duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md"
      role="status"
    >
      <div className="flex items-start gap-4 border border-line bg-card p-5 text-ink shadow-2xl ring-1 ring-white/10 sm:min-w-80">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent"
        >
          ✓
        </span>
        <div className="flex-1 pr-2">
          <p className="text-sm font-semibold tracking-[-0.01em] text-ink">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{message}</p>
        </div>
        <button
          aria-label="Dismiss notification"
          className="text-base leading-none text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}

