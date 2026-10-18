import type { HTMLAttributes, ReactNode } from "react";

type TagProps = HTMLAttributes<HTMLSpanElement> & { children: ReactNode };

export function Tag({ children, className = "", ...props }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill border border-line px-3 py-1 text-xs leading-5 text-muted ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
