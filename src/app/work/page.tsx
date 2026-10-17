import { createPageMetadata } from "@/lib/seo";
import { WorkGrid } from "@/components/pages/work-grid";

export const metadata = createPageMetadata(
  "Selected work",
  "Browse public web development projects and case studies by Ajmot Hossain.",
  "/work",
);

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;
  const selectedCategory = typeof category === "string" ? category : "";

  return <main id="main-content"><WorkGrid selectedCategory={selectedCategory} /></main>;
}
