import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata(
  "Contact",
  "Send Ajmot Hossain a project enquiry about websites, frontend development, applications, APIs, integrations, or maintenance.",
  "/contact",
);

export default function ContactPage() {
  return (
    <main id="main-content">
      <section aria-labelledby="contact-page-title" className="py-section">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)]">
            <div>
              <SectionHeading as="h1" eyebrow="Contact" id="contact-page-title" title="Tell me about your project." />
              <p className="mt-5 max-w-sm text-sm leading-6 text-muted">Share the essentials and the enquiry will be sent by email when delivery is configured.</p>
              <aside aria-labelledby="contact-privacy-title" className="mt-10 border-t border-line pt-5">
                <h2 className="text-sm font-semibold" id="contact-privacy-title">Privacy</h2>
                <p className="mt-3 text-sm leading-6 text-muted">When delivery is configured, your submitted details are sent to the configured recipient using Resend. This site does not save enquiries to a database. Resend processes the message to deliver it; its own retention and privacy terms apply. See the <Link className="underline underline-offset-4 hover:text-accent" href="/privacy">privacy notice</Link>.</p>
              </aside>
            </div>
            <ContactForm />
          </div>
        </PageContainer>
      </section>
    </main>
  );
}
