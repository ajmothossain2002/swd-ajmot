type StaticProject = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  status: string;
  visibility: string;
  featured?: boolean;
  problem?: string;
  businessContext?: string;
  role?: string;
  approach?: string;
  capabilities?: string[];
  challenges?: unknown[];
  architectureNote?: string;
  technologies?: string[];
  evidence?: string[];
  publicLinks?: unknown[];
};

export const STATIC_CONTENT_INITIALIZATION_KEY: string;
export function initializeStaticContent(options: {
  db: unknown;
  projects: StaticProject[];
  homepageSlugs?: string[];
  selectedSlugs?: string[];
}): Promise<Record<string, unknown>>;
