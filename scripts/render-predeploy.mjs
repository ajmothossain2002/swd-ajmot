import { spawnSync } from "node:child_process";

if (process.env.RENDER !== "true" || process.env.RENDER_SERVICE_TYPE !== "web") {
  console.error("Render database setup must run as a Render web service pre-deploy command.");
  process.exit(1);
}

if (process.env.IS_PULL_REQUEST === "true") {
  console.info("Skipping database migrations and initial content import for a Render pull request preview.");
  process.exit(0);
}

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error("Render production pre-deploy requires DATABASE_URL and DIRECT_URL.");
  process.exit(1);
}

function run(script) {
  const npmCli = process.env.npm_execpath;
  const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
  const args = npmCli ? [npmCli, "run", script] : ["run", script];
  const result = spawnSync(command, args, {
    env: process.env,
    stdio: "inherit",
    shell: !npmCli && process.platform === "win32",
  });

  if (result.error || result.status !== 0) {
    console.error(`Render pre-deploy step failed: ${script}.`);
    process.exit(result.status ?? 1);
  }
}

run("db:migrate:deploy");
run("cms:import-static");
