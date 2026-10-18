import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "quiet" | "inverted";
type ButtonSize = "default" | "small";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-accent",
  secondary: "border border-line bg-transparent text-ink hover:border-ink",
  quiet: "bg-transparent text-ink hover:bg-accent-soft",
  inverted: "border border-paper/50 bg-transparent text-paper hover:bg-paper hover:text-ink",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "min-h-12 px-6 py-3",
  small: "min-h-10 px-4 py-2",
};

function classes(variant: ButtonVariant, size: ButtonSize, className = "") {
  return `inline-flex items-center justify-center gap-2 rounded-pill text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  children,
  className,
  href,
  size = "default",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={classes(variant, size, className)} href={href} {...props}>
      {children}
    </Link>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  children,
  className,
  size = "default",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button className={classes(variant, size, className)} type={type} {...props}>
      {children}
    </button>
  );
}
