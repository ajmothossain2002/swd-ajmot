import Link from "next/link";

type ServiceRowProps = {
  number: string;
  title: string;
  description: string;
  href?: string;
};

export function ServiceRow({ number, title, description, href = "/contact" }: ServiceRowProps) {
  return (
    <article className="grid gap-4 border-t border-line py-5 sm:grid-cols-[3rem_minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-start sm:gap-6">
      <p className="text-[0.65rem] font-semibold tracking-[0.15em] text-accent">{number}</p>
      <h3 className="text-base font-medium tracking-[-0.01em]">{title}</h3>
      <p className="max-w-xl text-sm leading-6 text-muted">{description}</p>
      <Link aria-label={`Discuss ${title}`} className="w-fit text-xs font-semibold uppercase tracking-[0.12em] text-accent underline decoration-line underline-offset-4 transition-colors hover:text-ink" href={href}>
        Discuss <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
