import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata(
  "Privacy notice",
  "How project enquiry form submissions are validated, sent, and handled on this website.",
  "/privacy",
);

export default function PrivacyPage() {
  return (
    <main id="main-content">
      <article aria-labelledby="privacy-title" className="py-section">
        <PageContainer>
          <div className="max-w-3xl">
            <SectionHeading as="h1" eyebrow="Privacy" id="privacy-title" title="Contact form privacy notice." />
            <div className="prose-editorial mt-8">
              <h2>Information submitted</h2>
              <p>The contact form asks for a name, email address, service, and project description. Business name, budget range, timeline, existing website, and preferred contact method are optional.</p>
              <h2>How it is handled</h2>
              <p>When email delivery is configured, the submitted details are sent to the configured recipient through Resend for delivery. This site does not save enquiries to a database. If delivery is not configured or the email provider rejects the request, the form reports that it was not sent.</p>
              <p>In production, an Upstash Redis rate-limit counter uses a SHA-256-derived key based on the request IP address and expires within one hour. The address itself and form submission are not saved to that store. During local development, a per-process in-memory counter is used instead and is not persisted.</p>
              <h2>Provider and retention</h2>
              <p>Resend processes an enquiry to deliver the email. Its own privacy, security, and retention terms apply to provider-side processing. The recipient&apos;s email system may also retain the message under its own policies.</p>
              <h2>What to include</h2>
              <p>Please do not send passwords, payment details, health information, or other sensitive personal information through the project form.</p>
              <p>This notice describes the current form implementation. Update it if the form, provider, retention, or hosting behavior changes.</p>
            </div>
          </div>
        </PageContainer>
      </article>
    </main>
  );
}
