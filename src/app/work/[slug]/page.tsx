import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseStudy } from "@/components/pages/case-study";
import { findProjectBySlug, projects } from "@/content/projects";
import { createPageMetadata } from "@/lib/seo";

export const dynamicParams = true;

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = findProjectBySlug(slug);
  if (!project) return { title: "Project not found | Ajmot Hossain", robots: { index: false, follow: false } };
  return createPageMetadata(project.title, project.summary, `/work/${project.slug}`);
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = findProjectBySlug(slug);

  if (!project) notFound();

  return <main id="main-content"><CaseStudy project={project} /></main>;
}
