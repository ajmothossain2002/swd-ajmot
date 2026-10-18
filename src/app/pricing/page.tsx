import { ButtonLink } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";

const categories = [
  { title: "Starter", description: "A focused business website or landing page." },
  { title: "Business", description: "A broader website or set of frontend improvements." },
  { title: "Custom", description: "A web application, dashboard, API, or integration with a defined scope." },
] as const;

export const metadata = createPageMetadata(
  "Project pricing",
  "Explore project scope categories and discuss a quote for web development work. Prices and terms are not yet published.",
  "/pricing",
);

export default function PricingPage() {
  return (
    <main id="main-content">
      <section aria-labelledby="pricing-page-title" className="py-section">
        <PageContainer>
          <div className="max-w-3xl">
            <SectionHeading as="h1" eyebrow="Pricing" id="pricing-page-title" title="Start with the scope." />
            <p className="mt-5 text-base leading-7 text-muted">These categories help frame a conversation. Pricing and package details have not been approved.</p>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-9 md:grid-cols-3">
            {categories.map((category) => (
              <article className="flex min-h-52 flex-col border-t border-line pt-5" key={category.title}>
                <h2 className="font-display text-2xl tracking-[-0.03em]">{category.title}</h2>
                <p className="mt-4 text-sm leading-6 text-muted">{category.description}</p>
                <p className="mt-auto pt-8 text-xs font-semibold uppercase tracking-[0.14em] text-accent">Details not approved</p>
              </article>
            ))}
          </div>
          <div className="mt-12 border-t border-line pt-7">
            <p className="max-w-2xl text-sm leading-6 text-muted">Amounts, inclusions, timelines, revisions, and payment terms remain unapproved. Share a project brief to discuss the work.</p>
            <ButtonLink className="mt-6" href="/contact" variant="secondary">Discuss a project</ButtonLink>
          </div>
        </PageContainer>
      </section>
    </main>
  );
}
import { createPageMetadata } from "@/lib/seo";
