import { ButtonLink } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = createPageMetadata(
  "About Ajmot Hossain",
  "Learn about Ajmot Hossain's web development services for business websites, frontend experiences, applications, and integrations.",
  "/about",
);

export default function AboutPage() {
  return (
    <main id="main-content">
      <section aria-labelledby="about-page-title" className="py-section">
        <PageContainer>
          <div className="grid gap-8 md:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.3fr)] md:items-start">
            <SectionHeading as="h1" eyebrow="About" id="about-page-title" title="Ajmot Hossain" />
            <div className="max-w-2xl">
              <p className="font-display text-2xl leading-snug tracking-[-0.02em] sm:text-3xl">Web development for business websites, frontend experiences, custom applications, and integrations.</p>
              <p className="mt-6 text-sm leading-6 text-muted">A fuller professional biography, career history, credentials, and profile links have not yet been provided for publication.</p>
              <ButtonLink className="mt-8" href="/contact" variant="secondary">Discuss a project</ButtonLink>
            </div>
          </div>
        </PageContainer>
      </section>
    </main>
  );
}
import { createPageMetadata } from "@/lib/seo";
