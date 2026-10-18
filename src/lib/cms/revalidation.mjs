const slugs = (...values) => values.filter((value) => typeof value === "string" && value.length > 0);

export function pathsForProjectMutation({ previous, result } = {}) {
  return [...new Set(["/", "/work", "/sitemap.xml", ...slugs(previous?.slug, result?.slug).map((slug) => `/work/${slug}`)])];
}

export function pathsForPostMutation({ previous, result } = {}) {
  return [...new Set(["/blog", "/sitemap.xml", ...slugs(previous?.slug, result?.slug).map((slug) => `/blog/${slug}`)])];
}

export function pathsForCaseStudyMutation({ previous, result } = {}) {
  return [...new Set(["/", "/work", "/sitemap.xml", ...slugs(previous?.project?.slug, result?.project?.slug).map((slug) => `/work/${slug}`)])];
}

export function createCmsMutationRevalidator(invalidatePath, getPaths) {
  return async (mutation) => {
    for (const path of getPaths(mutation)) {
      try {
        invalidatePath(path);
      } catch {
        // A persisted mutation remains successful if cache invalidation fails.
      }
    }
  };
}
