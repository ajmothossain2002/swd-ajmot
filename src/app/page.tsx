import {
  AboutPreviewSection,
  CapabilitiesSection,
  ContactCtaSection,
  JournalPreviewSection,
  PricingPreviewSection,
  ProcessSection,
  SelectedWorkSection,
  ServicesSection,
} from "@/components/home/home-sections";
import { HomeHero } from "@/components/home/home-hero";

export const metadata = createPageMetadata(
  "Web development for business",
  "Business websites, frontend development, custom web applications, APIs, and maintenance for practical business needs.",
  "/",
);

export default function HomePage() {
  return (
    <main id="main-content">
      <HomeHero />
      <SelectedWorkSection />
      <ServicesSection />
      <ProcessSection />
      <CapabilitiesSection />
      <AboutPreviewSection />
      <PricingPreviewSection />
      <JournalPreviewSection />
      <ContactCtaSection />
    </main>
  );
}
import { createPageMetadata } from "@/lib/seo";
