export type ApprovedProjectLink = {
  label: string;
  url: string;
  approved: true;
};

export type ProjectImage = {
  src: string;
  alt: string;
};

export type ProjectCaseStudy = {
  slug: string;
  title: string;
  summary: string;
  problem: string;
  role: string;
  approach: string;
  technologies: string[];
  evidence: string[];
  image?: ProjectImage;
  publicLinks?: ApprovedProjectLink[];
};

// Add projects only after content and publication rights have been verified.
export const projects: ProjectCaseStudy[] = [];

export const selectedProjects = projects;

export function findProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getApprovedExternalLinks(project: ProjectCaseStudy) {
  return (project.publicLinks ?? []).filter((link) => {
    if (link.approved !== true) return false;

    try {
      const url = new URL(link.url);
      return url.protocol === "https:" && url.hostname.length > 0 && !url.username && !url.password;
    } catch {
      return false;
    }
  });
}

export function getApprovedProjectImage(image: ProjectImage | undefined) {
  if (!image || !image.src.startsWith("/") || image.src.startsWith("//") || image.src.includes("\\")) {
    return undefined;
  }

  return image.alt.trim() ? image : undefined;
}
