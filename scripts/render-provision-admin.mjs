import { spawnSync } from "node:child_process";

if (process.env.RENDER !== "true" || process.env.RENDER_SERVICE_TYPE !== "web") {
  console.error("Render admin provisioning must run in the Render web service build.");
  process.exit(1);
}

if (process.env.IS_PULL_REQUEST === "true") {
  console.info("Skipping administrator provisioning for a Render pull request preview.");
  process.exit(0);
}

const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;
const action = process.env.ADMIN_BOOTSTRAP_ACTION || "provision";

if (!email && !password) {
  console.info("Skipping initial administrator provisioning; ADMIN_EMAIL and ADMIN_PASSWORD are not set.");
  process.exit(0);
}

if (!email || !password) {
  console.error("Administrator bootstrap requires both ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(1);
}

if (action !== "provision" && action !== "password") {
  console.error("ADMIN_BOOTSTRAP_ACTION must be either provision or password.");
  process.exit(1);
}

const npmCli = process.env.npm_execpath;
const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
const script = action === "password" ? "admin:password" : "admin:provision";
const args = npmCli ? [npmCli, "run", script] : ["run", script];
const result = spawnSync(command, args, {
  env: process.env,
  stdio: "inherit",
  shell: !npmCli && process.platform === "win32",
});

if (result.error || result.status !== 0) {
  console.error("Render administrator bootstrap failed; the new deploy must not start.");
  process.exit(result.status ?? 1);
}
