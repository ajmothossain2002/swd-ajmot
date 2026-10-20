import "dotenv/config";
import { spawnSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { homepageProjects, projects, selectedProjects } from "../src/content/projects.js";
import { initializeStaticContent } from "../src/lib/cms/static-content-initializer.mjs";

function run(script: string) {
  const npmCli = process.env.npm_execpath;
  const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
  const args = npmCli ? [npmCli, "run", script] : ["run", script];
  const result = spawnSync(command, args, { env: process.env, stdio: "inherit", shell: !npmCli && process.platform === "win32" });
  if (result.error || result.status !== 0) {
    console.error(`Vercel build step failed: ${script}.`);
    process.exit(result.status ?? 1);
  }
}

async function main() {
  if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
    if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
      console.error("Production Vercel builds require DATABASE_URL and DIRECT_URL before migrations or content initialization can run.");
      process.exit(1);
    }

    // Schema must be current before the atomic initializer queries its marker table.
    run("db:migrate:deploy");
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
    try {
      const result = await initializeStaticContent({
        db: prisma,
        projects,
        homepageSlugs: homepageProjects.map(({ slug }) => slug),
        selectedSlugs: selectedProjects.map(({ slug }) => slug),
      });
      console.info(JSON.stringify(result, null, 2));
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Z0-9_]+$/.test(error.code)
        ? ` (${error.code})`
        : "";
      const name = error instanceof Error && /^[A-Za-z][A-Za-z0-9]*$/.test(error.name) ? ` ${error.name}` : "";
      console.error(`Production content initialization failed${code}${name}. Check database connectivity and migration status.`);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  } else {
    console.info(`Skipping production migrations and initial content import for VERCEL=${process.env.VERCEL ?? "unset"}, VERCEL_ENV=${process.env.VERCEL_ENV ?? "local"}.`);
  }

  run("build");
}

main().catch((error: unknown) => {
  const name = error instanceof Error && /^[A-Za-z][A-Za-z0-9]*$/.test(error.name) ? ` ${error.name}` : "";
  console.error(`Vercel build setup failed${name}.`);
  process.exitCode = 1;
});
