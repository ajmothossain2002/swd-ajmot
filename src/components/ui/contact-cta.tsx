import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";

type ContactCtaProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function ContactCta({
  id = "contact-cta",
  eyebrow = "Start a conversation",
  title = "Let’s build something useful.",
  description = "Have a business process to improve or an application to build? Share what you’re working on and we can discuss the right scope.",
}: ContactCtaProps) {
  return (
    <section aria-labelledby={`${id}-title`} className="theme-light bg-cream py-16 sm:py-20" id={id}>
      <PageContainer>
        <div className="grid gap-8 border-t border-cream-line pt-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-accent">{eyebrow}</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.04] tracking-[-0.05em] sm:text-6xl" id={`${id}-title`}>{title}</h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted sm:text-base">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <ButtonLink href="/contact" variant="primary">Discuss a project <span aria-hidden="true">↗</span></ButtonLink>
            <Link className="text-sm font-medium text-cream-ink underline decoration-cream-line underline-offset-4 transition-colors hover:text-cream-accent" href="/work">Explore my work</Link>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
