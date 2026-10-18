import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { homeCopy } from "@/content/site";
import { getPublicProjects } from "@/lib/public-content";

export async function HomeHero() {
  const featuredProject = (await getPublicProjects({ featured: true, limit: 1 }))[0];
  return (
    <section aria-labelledby="home-title" className="py-16 sm:py-24 lg:py-32" id="home">
      <PageContainer>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)] lg:items-end lg:gap-16">
          <div className="max-w-5xl">
            <p className="mb-7 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{homeCopy.eyebrow}</p>
            <h1 className="max-w-5xl font-display text-[clamp(3.25rem,8.4vw,7.8rem)] leading-[0.94] tracking-[-0.065em]" id="home-title">
              {homeCopy.titleLead} <em className="font-display font-normal text-accent">{homeCopy.titleAccent}</em>
            </h1>
            <p className="mt-8 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              {homeCopy.description}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <ButtonLink href="/contact" variant="primary">Discuss a project <span aria-hidden="true">↗</span></ButtonLink>
              <Link className="text-sm font-medium underline decoration-line underline-offset-4 transition-colors hover:text-accent" href="/work">Explore my work</Link>
            </div>
          </div>

          <aside aria-label="Featured project preview" className="border-t border-line pt-5 lg:mb-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-accent">Featured project</p>
            {featuredProject ? (
              <div className="mt-6 border-l border-accent pl-5">
                <p className="font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">{featuredProject.title}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{featuredProject.summary}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.13em] text-muted">{featuredProject.status}</p>
                <Link className="mt-6 inline-flex text-sm font-medium text-accent underline decoration-line underline-offset-4" href={`/work/${featuredProject.slug}`}>View project <span aria-hidden="true" className="ml-2">↗</span></Link>
              </div>
            ) : <p className="mt-6 border-l border-accent pl-5 text-sm leading-6 text-muted">Selected work will appear here when a project is approved for publication.</p>}
            <div aria-hidden="true" className="mt-8 grid grid-cols-3 border-y border-line text-center text-[0.6rem] font-medium uppercase tracking-[0.11em] text-muted">
              <span className="py-3">Systems</span><span className="border-x border-line py-3">Workflows</span><span className="py-3">Delivery</span>
            </div>
          </aside>
        </div>
      </PageContainer>
    </section>
  );
}
