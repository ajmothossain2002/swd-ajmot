import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { homepageProjects, projects, selectedProjects } from "../src/content/projects.js";
import { initializeStaticContent } from "../src/lib/cms/static-content-initializer.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be configured before running the static content initializer.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

/**
 * Explicit local content import. Existing rows are never overwritten.
 * Projects retain their already-approved public/private visibility; case studies
 * always enter as drafts and require a separate authenticated publish action.
 */
async function main() {
  try {
    const result = await initializeStaticContent({
      db: prisma,
      projects,
      homepageSlugs: homepageProjects.map(({ slug }) => slug),
      selectedSlugs: selectedProjects.map(({ slug }) => slug),
    });
    console.info(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Avoid logging connection strings or provider details from Prisma exceptions.
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Z0-9_]+$/.test(error.code)
    ? ` (${error.code})`
    : "";
  const databaseCode = error && typeof error === "object" && "meta" in error && error.meta && typeof error.meta === "object" && "code" in error.meta && typeof error.meta.code === "string" && /^[A-Z0-9_]+$/.test(error.meta.code)
    ? ` database ${error.meta.code}`
    : "";
  const name = error instanceof Error && /^[A-Za-z][A-Za-z0-9]*$/.test(error.name) ? ` ${error.name}` : "";
  console.error(`Static content import failed${code}${databaseCode}${name}. Check database connectivity and review the reported constraints.`);
  process.exitCode = 1;
});
