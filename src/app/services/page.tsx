import { ContactCta } from "@/components/ui/contact-cta";
import { FaqSection } from "@/components/ui/faq-section";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceRow } from "@/components/ui/service-row";
import { developmentProcess, serviceFaqs, serviceGroups } from "@/content/site";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata(
  "Web Development Services | Ajmot Hossain",
  "Business websites, e-commerce experiences, custom applications, backend APIs, integrations, and maintenance.",
  "/services",
);

export default function ServicesPage() {
  return (
    <main id="main-content">
      <section aria-labelledby="services-page-title" className="py-16 sm:py-24 lg:py-32">
        <PageContainer>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(15rem,0.7fr)] lg:items-end">
            <div className="max-w-4xl">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.19em] text-accent">Services</p>
              <h1 className="font-display text-[clamp(3.25rem,8vw,7rem)] leading-[0.96] tracking-[-0.06em]" id="services-page-title">
                Services built around <em className="font-display font-normal text-accent">your business.</em>
              </h1>
            </div>
            <p className="max-w-xl text-base leading-7 text-muted lg:justify-self-end">
              From customer-facing websites to connected business systems, I build web solutions around real requirements, practical workflows, and maintainable software.
            </p>
          </div>
        </PageContainer>
      </section>

      <section aria-label="Service categories" className="border-y border-line bg-surface py-6 sm:py-10">
        <PageContainer>
          {serviceGroups.map((group, groupIndex) => {
            const previousServices = serviceGroups
              .slice(0, groupIndex)
              .reduce((count, previousGroup) => count + previousGroup.services.length, 0);

            return (
            <section aria-labelledby={`${group.id}-title`} className="grid gap-6 py-9 sm:py-12 lg:grid-cols-[minmax(13rem,0.65fr)_minmax(0,1.35fr)] lg:gap-10" id={group.id} key={group.id}>
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-accent">Service group</p>
                <h2 className="mt-3 font-display text-2xl leading-tight tracking-[-0.035em] sm:text-3xl" id={`${group.id}-title`}>{group.title}</h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{group.description}</p>
              </div>
              <div>
                {group.services.map((service, serviceIndex) => (
                  <ServiceRow description={service.description} key={service.title} number={String(previousServices + serviceIndex + 1).padStart(2, "0")} title={service.title} />
                ))}
              </div>
            </section>
            );
          })}
        </PageContainer>
      </section>

      <section aria-labelledby="process-title" className="py-section" id="process">
        <PageContainer>
          <div className="grid gap-8 lg:grid-cols-[minmax(13rem,0.65fr)_minmax(0,1.35fr)]">
            <div>
              <SectionHeading eyebrow="A proposed process" id="process-title" title="From the first brief to the next improvement." />
              <p className="mt-5 max-w-sm text-sm leading-6 text-muted">A practical way to approach new work. The exact steps depend on the project and are agreed together.</p>
            </div>
            <ol className="grid gap-x-7 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {developmentProcess.map((step) => (
                <li className="border-t border-line pt-4" key={step.number}>
                  <p className="text-xs font-medium tracking-[0.16em] text-accent">{step.number}</p>
                  <h3 className="mt-3 font-display text-2xl tracking-[-0.03em]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </PageContainer>
      </section>

      <FaqSection id="services-faq" eyebrow="Frequently asked" title="A few useful details." items={serviceFaqs} />
      <ContactCta id="services-contact" title="Let’s build something useful." description="Have a business process to improve or an application to build? Tell me what you’re working on, and we can discuss a practical next step." />
    </main>
  );
}
