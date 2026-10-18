import {
  AboutPreviewSection,
  CapabilitiesSection,
  ContactCtaSection,
  JournalPreviewSection,
  PricingPreviewSection,
  ProcessSection,
  SelectedWorkSection,
  ServicesSection,
  StrengthsSection,
} from "@/components/home/home-sections";
import { HomeHero } from "@/components/home/home-hero";

export const metadata = createPageMetadata(
  "Ajmot Hossain | Full-Stack Developer for Business Applications",
  "Ajmot Hossain builds business systems, interactive web applications, frontend experiences, backend services, and workflow-focused software.",
  "/",
);

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main id="main-content">
      <HomeHero />
      <StrengthsSection />
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
