import { ProjectCard } from "@/components/ui/project-card";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getApprovedProjectImage, selectedProjects } from "@/content/projects";

export function WorkGrid() {
  return (
    <section aria-labelledby="work-page-title" className="py-section">
      <PageContainer>
        <div className="max-w-3xl">
          <SectionHeading as="h1" eyebrow="Work" id="work-page-title" title="Selected projects." />
          <p className="mt-5 text-base leading-7 text-muted">
            Case studies will be added when project details and publication approval are available.
          </p>
        </div>
        {selectedProjects.length ? (
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
          <p className="mt-12 border-t border-line py-8 font-display text-2xl leading-snug sm:text-3xl">
            No public case studies are available yet.
          </p>
        )}
      </PageContainer>
    </section>
  );
}
