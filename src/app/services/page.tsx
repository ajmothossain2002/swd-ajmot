import { ButtonLink } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceCard } from "@/components/ui/service-card";
import { services } from "@/content/site";

export const metadata = createPageMetadata(
  "Web development services",
  "Business websites, frontend development, custom applications, backend APIs, integrations, and website maintenance.",
  "/services",
);

export default function ServicesPage() {
  return (
    <main id="main-content">
      <section aria-labelledby="services-page-title" className="py-section">
        <PageContainer>
          <div className="max-w-3xl">
            <SectionHeading as="h1" eyebrow="Services" id="services-page-title" title="Practical web development for your next step." />
            <p className="mt-5 text-base leading-7 text-muted">Choose focused support for a new website, a custom feature, or improvements to an existing product.</p>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <ServiceCard description={service.description} key={service.title} title={service.title}>
                <ButtonLink href="/contact" size="small" variant="secondary">Discuss this service</ButtonLink>
              </ServiceCard>
            ))}
          </div>
        </PageContainer>
      </section>
    </main>
  );
}
import { createPageMetadata } from "@/lib/seo";
