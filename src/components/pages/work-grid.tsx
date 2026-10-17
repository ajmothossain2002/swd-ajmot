import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ui/project-card";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getApprovedProjectImage, selectedProjects } from "@/content/projects";

type WorkGridProps = {
  selectedCategory?: string;
};

export function WorkGrid({ selectedCategory = "" }: WorkGridProps) {
  const categories = [...new Set(selectedProjects.map((project) => project.category))];
  const activeCategory = categories.includes(selectedCategory) ? selectedCategory : "";
  const visibleProjects = activeCategory
    ? selectedProjects.filter((project) => project.category === activeCategory)
    : selectedProjects;

  return (
    <section aria-labelledby="work-page-title" className="py-section">
      <PageContainer>
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)] lg:items-end">
          <div className="max-w-4xl">
            <SectionHeading as="h1" eyebrow="Work / Portfolio" id="work-page-title" title="Selected projects." />
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
              Business applications and web projects, presented with the details and status currently confirmed.
            </p>
          </div>
          <form action="/work" className="flex flex-wrap items-end gap-3 lg:justify-self-end" method="get">
            <div className="grid gap-2">
              <label className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted" htmlFor="project-category">Filter projects</label>
              <select className="min-h-11 min-w-52 border border-line bg-surface px-3 text-sm text-ink" defaultValue={activeCategory} id="project-category" name="category">
                <option value="">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <Button size="small" type="submit" variant="secondary">Apply</Button>
            {activeCategory ? <Link className="min-h-10 self-center text-xs text-muted underline underline-offset-4 hover:text-ink" href="/work">Clear filter</Link> : null}
          </form>
        </div>

        {visibleProjects.length ? (
          <div className="mt-12 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project) => (
              <ProjectCard
                category={project.category}
                description={project.summary}
                featured={project.featured && !activeCategory}
                href={`/work/${project.slug}`}
                image={getApprovedProjectImage(project.image)}
                key={project.slug}
                status={project.status}
                tags={project.technologies}
                title={project.title}
              />
            ))}
          </div>
        ) : (
          <p className="mt-12 border-t border-line py-8 font-display text-2xl leading-snug sm:text-3xl">
            No projects match this category.
          </p>
        )}
      </PageContainer>
    </section>
  );
}
