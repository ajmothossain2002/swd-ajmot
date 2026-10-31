import Image from "next/image";
import { ContactCta } from "@/components/ui/contact-cta";
import { PageContainer } from "@/components/ui/page-container";
import { Tag } from "@/components/ui/tag";
import { getApprovedExternalLinks, getApprovedProjectImage, type ProjectCaseStudy } from "@/content/projects";

export function CaseStudy({ project }: { project: ProjectCaseStudy }) {
  const image = getApprovedProjectImage(project.image);
  const publicLinks = getApprovedExternalLinks(project);
  const details = [
    ...(project.problem ? [{ title: "Overview", body: project.problem }] : []),
    ...(project.businessContext ? [{ title: "Business context", body: project.businessContext }] : []),
    ...(project.role ? [{ title: "My responsibility", body: project.role }] : []),
    ...(project.approach ? [{ title: "Approach", body: project.approach }] : []),
  ];

  return (
    <>
    <article className="py-section">
      <PageContainer>
        <header className="max-w-4xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{project.category}</p>
          <h1 className="font-display text-5xl leading-[0.98] tracking-[-0.055em] sm:text-7xl">{project.title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">{project.summary}</p>
          <p className="mt-5 inline-flex border border-line px-3 py-2 text-xs leading-5 text-muted">{project.status}</p>
          {project.technologies.length ? (
            <ul aria-label="Technologies" className="mt-7 flex flex-wrap gap-2">
              {project.technologies.map((technology) => <li key={technology}><Tag>{technology}</Tag></li>)}
            </ul>
          ) : null}
        </header>

        <div className="relative mt-12 aspect-[16/8] overflow-hidden border border-line bg-accent-soft">
          {image ? (
            <>
              <Image alt={image.alt} className="object-cover" fill priority sizes="(max-width: 768px) 100vw, 84rem" src={image.src} />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper/85 via-paper/30 to-accent/15" />
            </>
          ) : (
            <div aria-label="No approved screenshots are available for this project" className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10" role="img">
              <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,transparent_49.8%,var(--color-line)_50%,transparent_50.2%)]" />
              <p className="relative text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-accent">Project imagery</p>
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-xl font-display text-3xl leading-tight tracking-[-0.04em] sm:text-5xl">Screenshots are not available for publication.</p>
                <p className="max-w-52 text-xs leading-5 text-muted">This space is reserved for approved project material.</p>
              </div>
            </div>
          )}
        </div>

        {details.length ? (
          <section aria-labelledby="project-overview" className="mt-14 grid gap-10 lg:grid-cols-[minmax(13rem,0.65fr)_minmax(0,1.35fr)]">
            <h2 className="font-display text-2xl tracking-[-0.03em]" id="project-overview">Overview</h2>
            <div className="grid gap-9 sm:grid-cols-2">
              {details.map(({ body, title }) => (
                <div className="border-t border-line pt-4" key={title}>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p className="mt-8 max-w-2xl text-sm leading-6 text-muted">Additional project scope, role, and implementation details have not been approved for publication.</p>
        )}

        {project.capabilities?.length ? (
          <section aria-labelledby="project-capabilities" className="mt-14 grid gap-8 border-y border-line py-8 lg:grid-cols-[minmax(13rem,0.65fr)_minmax(0,1.35fr)]">
            <div>
              <h2 className="font-display text-2xl tracking-[-0.03em]" id="project-capabilities">{project.capabilityLabel ?? "System capabilities"}</h2>
              {project.capabilityLabel === "Known focus areas" ? <p className="mt-2 text-xs leading-5 text-muted">Project focus areas; implementation details remain to be verified.</p> : null}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {project.capabilities.map((capability) => <li className="border-b border-line pb-3 text-sm leading-6" key={capability}>{capability}</li>)}
            </ul>
          </section>
        ) : null}

        {project.challenges?.length ? (
          <section aria-labelledby="project-challenges" className="mt-14 grid gap-8 lg:grid-cols-[minmax(13rem,0.65fr)_minmax(0,1.35fr)]">
            <h2 className="font-display text-2xl tracking-[-0.03em]" id="project-challenges">Engineering challenges</h2>
            <div className="grid gap-8 sm:grid-cols-2">
              {project.challenges.map((challenge, index) => (
                <div className="border-t border-line pt-4" key={challenge.title}>
                  <p className="text-xs font-medium tracking-[0.16em] text-accent">0{index + 1}</p>
                  <h3 className="mt-3 font-medium">{challenge.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{challenge.description}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {project.architectureNote ? (
          <section aria-labelledby="project-architecture" className="mt-14 grid gap-8 border-t border-line pt-7 lg:grid-cols-[minmax(13rem,0.65fr)_minmax(0,1.35fr)]">
            <h2 className="font-display text-2xl tracking-[-0.03em]" id="project-architecture">Architecture and technology</h2>
            <p className="max-w-3xl text-sm leading-7 text-muted">{project.architectureNote}</p>
          </section>
        ) : null}

        <section aria-labelledby="project-evidence" className="mt-14 grid gap-8 border-t border-line pt-7 lg:grid-cols-[minmax(13rem,0.65fr)_minmax(0,1.35fr)]">
          <h2 className="font-display text-2xl tracking-[-0.03em]" id="project-evidence">Project status and evidence</h2>
          <ul className="space-y-3 text-sm leading-6 text-muted">
            {project.evidence.map((item) => <li className="border-l border-accent pl-4" key={item}>{item}</li>)}
          </ul>
        </section>

        {publicLinks.length ? (
          <nav aria-label="Public project links" className="mt-12 border-t border-line pt-6">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {publicLinks.map((link) => (
                <li key={link.url}>
                  <a className="text-sm font-medium underline decoration-line underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus" href={link.url} rel="noreferrer" target="_blank">{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </PageContainer>
    </article>
    <ContactCta id={`${project.slug}-contact`} eyebrow="Discuss a similar project" title="Let’s build something useful." description="Have a business system or workflow in mind? Share the context and we can discuss the scope." />
    </>
  );
}
