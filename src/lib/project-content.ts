import type { ApprovedProjectLink, ProjectCaseStudy, ProjectImage } from "@/content/projects";

export function getApprovedExternalLinks(project: Pick<ProjectCaseStudy, "publicLinks">) {
  return (project.publicLinks ?? []).filter((link: ApprovedProjectLink) => {
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
  if (!image || !image.alt.trim() || image.src.includes("\\")) return undefined;
  if (image.src.startsWith("/") && !image.src.startsWith("//")) return image;
  try {
    const url = new URL(image.src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && !url.username && !url.password ? image : undefined;
  } catch {
    return undefined;
  }
}
