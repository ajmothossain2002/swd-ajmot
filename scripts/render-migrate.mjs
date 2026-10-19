import { spawnSync } from "node:child_process";

if (process.env.RENDER !== "true" || process.env.RENDER_SERVICE_TYPE !== "web") {
  console.error("Render database migrations must run in the Render web service build or pre-deploy step.");
  process.exit(1);
}

if (process.env.IS_PULL_REQUEST === "true") {
  console.info("Skipping database migrations for a Render pull request preview.");
  process.exit(0);
}

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error("Render production migrations require DATABASE_URL and DIRECT_URL.");
  process.exit(1);
}

const npmCli = process.env.npm_execpath;
const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
const args = npmCli ? [npmCli, "run", "db:migrate:deploy"] : ["run", "db:migrate:deploy"];
const result = spawnSync(command, args, {
  env: process.env,
  stdio: "inherit",
  shell: !npmCli && process.platform === "win32",
});

if (result.error || result.status !== 0) {
  console.error("Render database migration failed; the new deploy must not start.");
  process.exit(result.status ?? 1);
}
