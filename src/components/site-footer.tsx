import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { selectedProjects } from "@/content/projects";
import { siteNavigation, serviceGroups } from "@/content/site";

const footerProjects = selectedProjects.filter((project) => project.slug !== "private-store");

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper py-12 sm:py-16">
      <PageContainer>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(13rem,1.1fr)_minmax(9rem,0.7fr)_minmax(12rem,0.9fr)_minmax(13rem,1fr)] lg:gap-8">
          <div className="max-w-xs">
            <Link aria-label="Ajmot Hossain — home" className="font-display text-2xl tracking-[-0.04em]" href="/">Ajmot Hossain</Link>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.13em] text-accent">Full-Stack Developer</p>
            <p className="mt-5 text-sm leading-6 text-muted">Business-critical web applications built around practical workflows.</p>
            <ButtonLink className="mt-6" href="/contact" size="small" variant="secondary">Discuss a project <span aria-hidden="true">↗</span></ButtonLink>
          </div>

          <nav aria-label="Footer pages">
            <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">Explore</h2>
            <ul className="mt-4 space-y-3">
              {siteNavigation.map((item) => (
                <li key={item.href}><Link className="text-sm text-ink transition-colors hover:text-accent" href={item.href}>{item.label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer services">
            <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">Services</h2>
            <ul className="mt-4 space-y-3">
              {serviceGroups.map((group) => (
                <li key={group.id}><Link className="text-sm text-ink transition-colors hover:text-accent" href={`/services#${group.id}`}>{group.title}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Selected case studies">
            <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">Selected work</h2>
            <ul className="mt-4 space-y-3">
              {footerProjects.slice(0, 4).map((project) => (
                <li key={project.slug}><Link className="text-sm text-ink transition-colors hover:text-accent" href={`/work/${project.slug}`}>{project.title}</Link></li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Ajmot Hossain</p>
          <Link className="w-fit underline decoration-line underline-offset-4 transition-colors hover:text-ink" href="/privacy">Privacy notice</Link>
        </div>
      </PageContainer>
    </footer>
  );
}
