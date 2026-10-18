import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { CaseStudy } from "@/components/pages/case-study";
import { getPublicProject } from "@/lib/public-content";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProject(slug);
  if (!project) return { title: "Project not found | Ajmot Hossain", robots: { index: false, follow: false } };
  const canonicalSlug = project.redirectTo ?? project.slug;
  const title = canonicalSlug === "enterprise-erp-system"
    ? `ERP Development Case Study: ${project.title}`
    : project.title;
  return createPageMetadata(title, project.summary, `/work/${canonicalSlug}`);
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublicProject(slug);

  if (!project) notFound();
  if (project.redirectTo) permanentRedirect(`/work/${project.redirectTo}`);

  return <main id="main-content"><CaseStudy project={project} /></main>;
}
