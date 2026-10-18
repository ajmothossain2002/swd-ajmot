import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("foundation includes the App Router entry points and project configuration", () => {
  const requiredFiles = [
    "package.json",
    "next.config.ts",
    "tsconfig.json",
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/not-found.tsx",
    "src/app/globals.css",
  ];

  for (const file of requiredFiles) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} should exist`);
  }
});

test("package scripts expose the requested quality and runtime commands", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );

  for (const script of ["dev", "build", "start", "lint", "type-check", "test"]) {
    assert.equal(typeof manifest.scripts[script], "string", `${script} script should be defined`);
    assert.ok(manifest.scripts[script].length > 0, `${script} script should not be empty`);
  }
});

test("design tokens and shared site components remain part of the foundation", () => {
  const stylesheet = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
  const header = fs.readFileSync(path.join(root, "src/components/site-header.tsx"), "utf8");

  for (const token of ["--paper", "--ink", "--accent", "--focus", "--spacing-gutter", "--container-site"]) {
    assert.ok(stylesheet.includes(token), `${token} should be defined`);
  }

  assert.match(header, /<details[\s\S]*<summary/);
  assert.match(stylesheet, /prefers-reduced-motion/);
});

test("homepage sections have real navigation targets and use shared project cards", () => {
  const siteContent = fs.readFileSync(path.join(root, "src/content/site.ts"), "utf8");
  const homepage = fs.readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
  const sections = fs.readFileSync(path.join(root, "src/components/home/home-sections.tsx"), "utf8");

  for (const target of ["home", "work", "services", "pricing", "about", "journal", "contact"]) {
    assert.ok(sections.includes(`id="${target}"`) || target === "home", `${target} section has an anchor`);
  }

  for (const route of ["/", "/services", "/work", "/pricing", "/about", "/blog", "/contact"]) {
    assert.ok(siteContent.includes(`href: "${route}"`), `${route} navigation has a destination`);
  }

  assert.match(homepage, /<SelectedWorkSection \/>/);
  assert.match(sections, /import \{ ProjectCard \}/);
  assert.match(sections, /selectedProjects\.map\(\(project\)/);
  assert.match(fs.readFileSync(path.join(root, "src/content/projects.ts"), "utf8"), /export const projects: ProjectCaseStudy\[\] = \[\]/);
});

test("service, work, pricing, about, and case-study routes exist", () => {
  for (const routeFile of [
    "src/app/services/page.tsx",
    "src/app/work/page.tsx",
    "src/app/work/[slug]/page.tsx",
    "src/app/pricing/page.tsx",
    "src/app/about/page.tsx",
  ]) {
    assert.ok(fs.existsSync(path.join(root, routeFile)), `${routeFile} should exist`);
  }

  const projectRoute = fs.readFileSync(path.join(root, "src/app/work/[slug]/page.tsx"), "utf8");
  assert.match(projectRoute, /findProjectBySlug\(slug\)/);
  assert.match(projectRoute, /if \(!project\) notFound\(\)/);
});

test("pricing and project links require approval and safe public URLs", () => {
  const pricing = fs.readFileSync(path.join(root, "src/app/pricing/page.tsx"), "utf8");
  const projectContent = fs.readFileSync(path.join(root, "src/content/projects.ts"), "utf8");
  const caseStudy = fs.readFileSync(path.join(root, "src/components/pages/case-study.tsx"), "utf8");

  for (const category of ["Starter", "Business", "Custom"]) assert.ok(pricing.includes(category));
  assert.match(pricing, /not been approved/i);
  assert.match(projectContent, /approved: true/);
  assert.match(projectContent, /url\.protocol === "https:"/);
  assert.match(projectContent, /getApprovedProjectImage/);
  assert.match(caseStudy, /getApprovedExternalLinks\(project\)/);
});
