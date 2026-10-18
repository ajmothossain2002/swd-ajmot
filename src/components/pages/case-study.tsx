import Image from "next/image";
import { PageContainer } from "@/components/ui/page-container";
import { Tag } from "@/components/ui/tag";
import { getApprovedExternalLinks, getApprovedProjectImage, type ProjectCaseStudy } from "@/content/projects";

export function CaseStudy({ project }: { project: ProjectCaseStudy }) {
  const image = getApprovedProjectImage(project.image);
  const publicLinks = getApprovedExternalLinks(project);
  const sections = [
    { title: "Problem", body: project.problem },
    { title: "Role", body: project.role },
    { title: "Approach", body: project.approach },
  ];

  return (
    <article className="py-section">
      <PageContainer>
        <header className="max-w-4xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Case study</p>
          <h1 className="font-display text-5xl leading-[0.98] tracking-[-0.055em] sm:text-7xl">{project.title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">{project.summary}</p>
          {project.technologies.length ? (
            <ul aria-label="Technologies" className="mt-7 flex flex-wrap gap-2">
              {project.technologies.map((technology) => <li key={technology}><Tag>{technology}</Tag></li>)}
            </ul>
          ) : null}
        </header>

        {image ? (
          <div className="relative mt-12 aspect-[16/9] overflow-hidden border border-line bg-accent-soft">
            <Image alt={image.alt} className="object-cover" fill sizes="(max-width: 768px) 100vw, 84rem" src={image.src} />
          </div>
        ) : null}

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(13rem,0.65fr)_minmax(0,1.35fr)]">
          <h2 className="font-display text-2xl tracking-[-0.03em]">Project details</h2>
          <div className="grid gap-9 sm:grid-cols-2">
            {sections.map(({ body, title }) => (
              <section aria-labelledby={`case-${title.toLowerCase()}`} className="border-t border-line pt-4" key={title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent" id={`case-${title.toLowerCase()}`}>{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
              </section>
            ))}
            <section aria-labelledby="case-evidence" className="border-t border-line pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent" id="case-evidence">Available evidence</h3>
              {project.evidence.length ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
                  {project.evidence.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : <p className="mt-3 text-sm leading-6 text-muted">No public evidence has been approved for this project.</p>}
            </section>
          </div>
        </div>

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
  );
}
