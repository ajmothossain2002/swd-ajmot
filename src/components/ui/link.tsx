import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type TextLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
};

export function TextLink({ children, className = "", href, ...props }: TextLinkProps) {
  return (
    <Link
      className={`group inline-flex items-center gap-2 text-sm font-medium underline decoration-line underline-offset-4 transition-colors hover:text-accent ${className}`}
      href={href}
      {...props}
    >
      {children}
      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none">
        ↗
      </span>
    </Link>
  );
}
