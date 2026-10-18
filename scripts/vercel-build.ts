import { spawnSync } from "node:child_process";

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

if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    console.error("Production Vercel builds require DATABASE_URL and DIRECT_URL before migrations or content initialization can run.");
    process.exit(1);
  }

  // Schema must be current before the atomic initializer queries its marker table.
  run("db:migrate:deploy");
  run("cms:import-static");
} else {
  console.info(`Skipping production migrations and initial content import for VERCEL=${process.env.VERCEL ?? "unset"}, VERCEL_ENV=${process.env.VERCEL_ENV ?? "local"}.`);
}

run("build");
