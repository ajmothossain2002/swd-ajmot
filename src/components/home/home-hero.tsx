import { ButtonLink } from "@/components/ui/button";
import { TextLink } from "@/components/ui/link";
import { PageContainer } from "@/components/ui/page-container";
import { homeCopy } from "@/content/site";

export function HomeHero() {
  return (
    <section aria-labelledby="home-title" className="py-section" id="home">
      <PageContainer>
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.65fr)] lg:items-end lg:gap-20">
          <div className="max-w-4xl">
            <p className="mb-7 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {homeCopy.eyebrow}
            </p>
            <h1
              className="font-display text-[clamp(3rem,9.4vw,8.5rem)] leading-[0.91] tracking-[-0.065em]"
              id="home-title"
            >
              {homeCopy.titleLead} <span className="text-accent">{homeCopy.titleAccent}</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              {homeCopy.description}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
              <ButtonLink href="/contact" variant="primary">
                Start a project <span aria-hidden="true">↗</span>
              </ButtonLink>
              <TextLink href="/#work">View my work</TextLink>
            </div>
          </div>

          <aside aria-label="Development services" className="border-t border-line pt-5 lg:mb-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent">
              From first page to connected systems
            </p>
            <ul className="mt-7 divide-y divide-line">
              <li className="py-3.5 text-sm">Websites and landing pages</li>
              <li className="py-3.5 text-sm">Frontend and applications</li>
              <li className="py-3.5 text-sm">APIs, integrations, and improvements</li>
            </ul>
          </aside>
        </div>
      </PageContainer>
    </section>
  );
}
