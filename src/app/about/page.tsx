import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { additionalExperience, education, experience } from "@/content/profile";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata(
  "About Ajmot Hossain | Full-Stack Developer",
  "Ajmot Hossain is a full-stack developer working across business systems, frontend and backend development, and deployment.",
  "/about",
);

export default function AboutPage() {
  return (
    <main id="main-content">
      <section aria-labelledby="about-page-title" className="border-b border-line py-16 sm:py-24 lg:py-32">
        <PageContainer>
          <div className="grid gap-8 md:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.3fr)] md:items-start">
            <SectionHeading as="h1" eyebrow="About" id="about-page-title" title="Ajmot Hossain" />
            <div className="max-w-3xl">
              <p className="font-display text-2xl leading-snug tracking-[-0.02em] sm:text-4xl">Full-stack development grounded in business needs—from system design and application interfaces to backend services and deployment.</p>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted">My experience includes developing business applications, building frontend experiences, and working across backend systems. I have contributed to an internally used ERP and taken on software development responsibilities spanning system design, frontend, backend, and deployment.</p>
              <div className="mt-8 flex flex-wrap gap-6">
                <ButtonLink href="/contact" variant="secondary">Discuss a project</ButtonLink>
                <Link className="inline-flex min-h-11 items-center text-sm font-medium underline decoration-line underline-offset-4 hover:text-accent" href="/work">View case studies</Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section aria-labelledby="experience-title" className="py-section">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.3fr)]">
            <div>
              <SectionHeading eyebrow="Experience" id="experience-title" title="A path through engineering." />
              <p className="mt-5 max-w-sm text-sm leading-6 text-muted">A concise career overview using the roles and timing currently confirmed.</p>
            </div>
            <div>
              <ol className="divide-y divide-line border-y border-line">
                {experience.map((item, index) => (
                  <li className="grid gap-3 py-6 sm:grid-cols-[minmax(10rem,0.55fr)_minmax(0,1fr)] sm:gap-8" key={item.organization}>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">0{index + 1} · {item.period}</p>
                    <div>
                      <h2 className="font-display text-2xl tracking-[-0.03em]">{item.role}</h2>
                      <p className="mt-1 text-sm font-medium">{item.organization}</p>
                      <p className="mt-3 text-sm leading-6 text-muted">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <aside aria-label="Additional experience" className="mt-8 border-l border-accent pl-5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-accent">Additional experience</p>
                <h2 className="mt-2 font-medium">{additionalExperience.title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">{additionalExperience.detail}</p>
              </aside>
            </div>
          </div>
        </PageContainer>
      </section>

      <section aria-labelledby="education-title" className="theme-light border-y border-line bg-cream py-section">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.3fr)]">
            <SectionHeading eyebrow="Education" id="education-title" title="Learning foundations." />
            <ul className="grid gap-8 sm:grid-cols-2">
              {education.map((item) => (
                <li className="border-t border-line pt-4" key={item.place}>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">{item.qualification}</p>
                  <h2 className="mt-3 font-display text-2xl tracking-[-0.03em]">{item.place}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </PageContainer>
      </section>

      <section aria-labelledby="about-contact-title" className="py-16 sm:py-20">
        <PageContainer>
          <div className="flex flex-col gap-6 border-t border-line pt-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-accent">Next step</p>
              <h2 className="mt-3 max-w-xl font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl" id="about-contact-title">Have a business workflow to improve?</h2>
            </div>
            <ButtonLink href="/contact" variant="primary">Contact me <span aria-hidden="true">↗</span></ButtonLink>
          </div>
        </PageContainer>
      </section>
    </main>
  );
}
