import { ButtonLink } from "@/components/ui/button";
import type { PricingOption } from "@/content/pricing";

export function PricingCard({ option }: { option: PricingOption }) {
  return (
    <article className={`flex h-full flex-col border p-6 sm:p-7 ${option.featured ? "border-accent bg-card" : "border-line bg-card/40"}`}>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-accent">{option.audience}</p>
      <h2 className="mt-5 font-display text-3xl leading-tight tracking-[-0.04em]">{option.title}</h2>
      <p className="mt-4 text-sm leading-6 text-muted">{option.summary}</p>
      <div className="mt-7 border-t border-line pt-5">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">Indicative scope</p>
        <ul className="mt-4 space-y-3">
          {option.deliverables.map((deliverable) => (
            <li className="flex gap-3 text-sm leading-6" key={deliverable}>
              <span aria-hidden="true" className="text-accent">—</span>
              <span>{deliverable}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-auto border-t border-line pt-6 text-xs font-medium leading-5 text-muted">{option.quoteLabel}</p>
      <ButtonLink aria-label={`Discuss a ${option.title} project`} className="mt-4 w-full" href="/contact" size="small" variant={option.featured ? "primary" : "secondary"}>Discuss your project <span aria-hidden="true">↗</span></ButtonLink>
    </article>
  );
}
