import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqSectionProps = {
  id: string;
  eyebrow?: string;
  title: string;
  items: readonly FaqItem[];
};

export function FaqSection({ id, eyebrow = "Questions", items, title }: FaqSectionProps) {
  return (
    <section aria-labelledby={`${id}-title`} className="py-section" id={id}>
      <PageContainer>
        <div className="grid gap-9 lg:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.3fr)]">
          <SectionHeading eyebrow={eyebrow} id={`${id}-title`} title={title} />
          <div className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <details className="faq-item group" key={item.question}>
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span aria-hidden="true" className="faq-icon shrink-0 text-xl font-normal text-accent transition-transform duration-200 motion-reduce:transition-none">+</span>
                </summary>
                <p className="max-w-2xl pb-5 pr-10 text-sm leading-6 text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
