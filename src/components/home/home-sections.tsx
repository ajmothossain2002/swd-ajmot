import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ContactCta } from "@/components/ui/contact-cta";
import { PageContainer } from "@/components/ui/page-container";
import { ProjectCard } from "@/components/ui/project-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceCard } from "@/components/ui/service-card";
import { Tag } from "@/components/ui/tag";
import {
  developmentProcess,
  homepageCopy,
  professionalStrengths,
  services,
  technicalCapabilities,
} from "@/content/site";
import { getApprovedProjectImage } from "@/lib/project-content";
import { getPublicProjects } from "@/lib/public-content";

export async function SelectedWorkSection() {
  const homepageProjects = (await getPublicProjects({ featured: true })).slice(0, 4);
  return (
    <section aria-labelledby="work-title" className="border-y border-line py-section" id="work">
      <PageContainer>
        <div className="grid gap-7 md:grid-cols-[minmax(0,0.8fr)_minmax(18rem,1fr)] md:items-end">
          <SectionHeading eyebrow="Selected work" id="work-title" title="Work, in context." />
          <p className="max-w-xl text-base leading-7 text-muted md:justify-self-end">
            Case studies grounded in the project information available for publication. Approved visuals can be added as they are supplied.
          </p>
        </div>

        {homepageProjects.length > 0 ? (
          <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2">
            {homepageProjects.map((project) => (
              <ProjectCard
                category={project.category}
                description={project.summary}
                featured={project.featured}
                href={`/work/${project.slug}`}
                image={getApprovedProjectImage(project.image)}
                key={project.slug}
                status={project.status}
                tags={project.tags?.length ? project.tags : project.technologies}
                title={project.title}
              />
            ))}
            <Link className="flex min-h-48 flex-col justify-between border-t border-line py-5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus" href="/work">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent">More projects</span>
              <span className="flex items-end justify-between gap-4 font-display text-3xl tracking-[-0.04em] sm:text-4xl">
                Explore the work index <span aria-hidden="true" className="text-xl text-accent">↗</span>
              </span>
            </Link>
          </div>
        ) : (
          <div className="mt-12 border-t border-line py-8 sm:py-10">
            <p className="max-w-2xl font-display text-2xl leading-snug tracking-[-0.02em] sm:text-3xl">
              {homepageCopy.workPending}
            </p>
          </div>
        )}
      </PageContainer>
    </section>
  );
}

export function StrengthsSection() {
  return (
    <section aria-labelledby="strengths-title" className="border-y border-line bg-surface py-12 sm:py-16" id="strengths">
      <PageContainer>
        <div className="grid gap-8 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(0,1.3fr)] lg:items-start">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-accent">How I work</p>
            <h2 className="mt-3 max-w-xs font-display text-3xl leading-tight tracking-[-0.04em]" id="strengths-title">From business logic to the interface.</h2>
          </div>
          <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {professionalStrengths.map((strength, index) => (
              <li className="border-t border-line pt-4" key={strength.title}>
                <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-accent">0{index + 1}</p>
                <h3 className="mt-2 text-base font-medium">{strength.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{strength.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </PageContainer>
    </section>
  );
}

export function ServicesSection() {
  return (
    <section aria-labelledby="services-title" className="py-section" id="services">
      <PageContainer>
        <div className="max-w-2xl">
          <SectionHeading eyebrow="Services" id="services-title" title="Practical development, end to end." />
          <p className="mt-5 text-base leading-7 text-muted">
            Flexible support for a new launch, a focused feature, or the next improvement to an existing site.
          </p>
        </div>
        <div className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              description={service.description}
              key={service.title}
              title={service.title}
            >
              <ButtonLink href="/contact" size="small" variant="secondary">Discuss this service</ButtonLink>
            </ServiceCard>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}

export function ProcessSection() {
  return (
    <section aria-labelledby="process-title" className="border-y border-line bg-surface py-section" id="process">
      <PageContainer>
        <div className="grid gap-12 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.5fr)]">
          <div>
            <SectionHeading eyebrow="Process" id="process-title" title="A clear path from brief to handoff." />
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted">
              A proposed sequence for new work, adapted to the scope and needs of each project.
            </p>
          </div>
          <ol className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
            {developmentProcess.map((step) => (
              <li className="border-t border-line pt-4" key={step.number}>
                <p className="text-xs font-medium tracking-[0.16em] text-accent">{step.number}</p>
                <h3 className="mt-4 text-lg font-medium tracking-[-0.02em]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </PageContainer>
    </section>
  );
}

export function CapabilitiesSection() {
  return (
    <section aria-labelledby="capabilities-title" className="py-section" id="capabilities">
      <PageContainer>
        <div className="grid gap-8 border-y border-line py-8 md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.5fr)] md:items-center md:py-10">
          <SectionHeading eyebrow="Technical capabilities" id="capabilities-title" title="The tools serve the work." />
          <div>
            <ul aria-label="Technical capabilities" className="flex flex-wrap gap-2.5">
              {technicalCapabilities.map((capability) => (
                <li key={capability}>
                  <Tag>{capability}</Tag>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-muted">Technologies listed include distinct services in the ERP system; see its case study for architecture context.</p>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

export function AboutPreviewSection() {
  return (
    <section aria-labelledby="about-title" className="theme-light bg-cream py-section" id="about">
      <PageContainer>
        <div className="grid gap-8 md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] md:items-start">
          <SectionHeading eyebrow="About" id="about-title" title="Engineering with the business in view." />
          <div className="max-w-2xl">
            <p className="text-lg leading-8 sm:text-xl sm:leading-9">{homepageCopy.about}</p>
            <ButtonLink className="mt-6" href="/about" variant="secondary">More about Ajmot <span aria-hidden="true">↗</span></ButtonLink>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

export function PricingPreviewSection() {
  return (
    <section aria-labelledby="pricing-title" className="py-section" id="pricing">
      <PageContainer>
        <div className="grid gap-8 border-t border-line pt-7 md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] md:items-start">
          <SectionHeading eyebrow="Pricing" id="pricing-title" title="Scope first. Clear next steps." />
          <div className="max-w-2xl">
            <p className="text-base leading-7 text-muted">{homepageCopy.pricing}</p>
            <ButtonLink className="mt-6" href="/contact" variant="secondary">
              Discuss a project <span aria-hidden="true">↗</span>
            </ButtonLink>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

export function JournalPreviewSection() {
  return (
    <section aria-labelledby="journal-title" className="border-y border-line py-12" id="journal">
      <PageContainer>
        <div className="grid gap-4 sm:grid-cols-[minmax(12rem,0.65fr)_minmax(0,1fr)] sm:items-baseline">
          <SectionHeading eyebrow="Journal" id="journal-title" title="Notes from the work." compact />
          <p className="text-sm leading-6 text-muted">{homepageCopy.journal}</p>
        </div>
      </PageContainer>
    </section>
  );
}

export function ContactCtaSection() {
  return <ContactCta id="contact" />;
}
