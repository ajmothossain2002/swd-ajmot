import { ButtonLink } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { ProjectCard } from "@/components/ui/project-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceCard } from "@/components/ui/service-card";
import { Tag } from "@/components/ui/tag";
import {
  developmentProcess,
  homepageCopy,
  services,
  technicalCapabilities,
} from "@/content/site";
import { getApprovedProjectImage, selectedProjects } from "@/content/projects";

export function SelectedWorkSection() {
  return (
    <section aria-labelledby="work-title" className="border-y border-line py-section" id="work">
      <PageContainer>
        <div className="grid gap-7 md:grid-cols-[minmax(0,0.8fr)_minmax(18rem,1fr)] md:items-end">
          <SectionHeading eyebrow="Selected work" id="work-title" title="Work, in context." />
          <p className="max-w-xl text-base leading-7 text-muted md:justify-self-end">
            Examples should show the thinking behind the build as well as the finished interface.
          </p>
        </div>

        {selectedProjects.length > 0 ? (
          <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2">
            {selectedProjects.map((project) => (
              <ProjectCard
                description={project.summary}
                href={`/work/${project.slug}`}
                image={getApprovedProjectImage(project.image)}
                key={project.slug}
                tags={project.technologies}
                title={project.title}
              />
            ))}
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
              Each project starts with a shared understanding of the work and what it needs to do.
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
          <ul aria-label="Technical capabilities" className="flex flex-wrap gap-2.5">
            {technicalCapabilities.map((capability) => (
              <li key={capability}>
                <Tag>{capability}</Tag>
              </li>
            ))}
          </ul>
        </div>
      </PageContainer>
    </section>
  );
}

export function AboutPreviewSection() {
  return (
    <section aria-labelledby="about-title" className="bg-accent-soft py-section" id="about">
      <PageContainer>
        <div className="grid gap-8 md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] md:items-start">
          <SectionHeading eyebrow="About" id="about-title" title="Engineering with the business in view." />
          <div className="max-w-2xl">
            <p className="text-lg leading-8 sm:text-xl sm:leading-9">{homepageCopy.about}</p>
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
  return (
    <section aria-labelledby="contact-title" className="bg-ink py-16 text-paper sm:py-20" id="contact">
      <PageContainer>
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-paper/70">
              Contact
            </p>
            <h2 className="font-display text-4xl leading-tight tracking-[-0.04em] sm:text-6xl" id="contact-title">
              Have a project in mind?
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-paper/75" id="contact-details">
              {homepageCopy.contactPending}
            </p>
          </div>
          <ButtonLink href="/contact" variant="inverted">
            Start a project <span aria-hidden="true">↗</span>
          </ButtonLink>
        </div>
      </PageContainer>
    </section>
  );
}
