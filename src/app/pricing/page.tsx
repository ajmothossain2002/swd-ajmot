import { ContactCta } from "@/components/ui/contact-cta";
import { FaqSection } from "@/components/ui/faq-section";
import { PageContainer } from "@/components/ui/page-container";
import { PricingCard } from "@/components/ui/pricing-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { additionalEngagements, pricingFaqs, pricingOptions } from "@/content/pricing";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata(
  "Project pricing",
  "Discuss a custom scope for business websites, e-commerce applications, or custom business software. No fixed prices are published.",
  "/pricing",
);

export default function PricingPage() {
  return (
    <main id="main-content">
      <section aria-labelledby="pricing-page-title" className="py-16 sm:py-24 lg:py-32">
        <PageContainer>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)] lg:items-end">
            <div className="max-w-4xl">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.19em] text-accent">Pricing & engagement</p>
              <h1 className="font-display text-[clamp(3.25rem,8vw,7rem)] leading-[0.96] tracking-[-0.06em]" id="pricing-page-title">
                Good scope makes for <em className="font-display font-normal text-accent">clearer work.</em>
              </h1>
            </div>
            <p className="max-w-xl text-base leading-7 text-muted lg:justify-self-end">Every project is scoped around its requirements. These engagement categories are starting points for a conversation, not fixed packages or prices.</p>
          </div>
        </PageContainer>
      </section>

      <section aria-labelledby="engagement-options-title" className="border-y border-line bg-surface py-section">
        <PageContainer>
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Project engagement options" id="engagement-options-title" title="Start with what you need." />
            <p className="max-w-md text-sm leading-6 text-muted">Deliverables below are indicative. The agreed scope depends on your requirements and the existing systems involved.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {pricingOptions.map((option) => <PricingCard key={option.title} option={option} />)}
          </div>
          <p className="mt-7 text-xs leading-5 text-muted">No monetary amounts, turnaround promises, revision limits, or payment terms are published.</p>
        </PageContainer>
      </section>

      <section aria-labelledby="additional-services-title" className="py-section">
        <PageContainer>
          <div className="grid gap-8 lg:grid-cols-[minmax(13rem,0.65fr)_minmax(0,1.35fr)]">
            <div>
              <SectionHeading eyebrow="Additional services" id="additional-services-title" title="Work that can be scoped alongside." />
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted">Optional additions are discussed in context of the requested application and its current implementation.</p>
            </div>
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {additionalEngagements.map((item) => (
                <li className="border-t border-line py-5" key={item.title}>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </PageContainer>
      </section>

      <section aria-labelledby="maintenance-title" className="theme-light bg-cream py-12 sm:py-16" id="maintenance">
        <PageContainer>
          <div className="grid gap-7 md:grid-cols-[minmax(14rem,0.75fr)_minmax(0,1.25fr)] md:items-center">
            <SectionHeading eyebrow="Ongoing maintenance" id="maintenance-title" title="Available as a separate conversation." />
            <p className="max-w-2xl text-sm leading-7 text-muted">Ongoing application care is optional and is not included by default. The application, requested changes, and support expectations would need to be reviewed and agreed before an engagement begins.</p>
          </div>
        </PageContainer>
      </section>

      <FaqSection id="pricing-faq" eyebrow="Pricing FAQ" title="About the scope." items={pricingFaqs} />
      <ContactCta id="pricing-contact" title="Let’s discuss your requirements." description="Share the business need, the application or website you have in mind, and any systems it needs to work with." />
    </main>
  );
}
