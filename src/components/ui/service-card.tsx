import type { ReactNode } from "react";

type ServiceCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function ServiceCard({ children, description, title }: ServiceCardProps) {
  return (
    <article className="group flex h-full flex-col border-t border-line py-5 transition-colors duration-200 hover:border-accent">
      <h3 className="text-lg font-medium tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">{description}</p>
      {children ? <div className="mt-auto pt-5">{children}</div> : null}
    </article>
  );
}
