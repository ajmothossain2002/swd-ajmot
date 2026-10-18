import { createPageMetadata } from "@/lib/seo";
import { WorkGrid } from "@/components/pages/work-grid";

export const metadata = createPageMetadata(
  "Selected work",
  "Browse public web development projects and case studies by Ajmot Hossain.",
  "/work",
);

export default function WorkPage() {
  return <main id="main-content"><WorkGrid /></main>;
}
