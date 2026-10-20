import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { createCmsWorkbook, inspectCmsWorkbook, normalizeCmsJson } from "../src/lib/cms/excel-workbook.ts";

const pack = {
  packageName: "Ajmot Hossain Portfolio CMS Bulk Content Pack",
  packageVersion: "1.0",
  collections: {
    projects: [{
      slug: "example-project",
      title: "Example project",
      summary: "A project summary",
      category: "Example",
      status: "In progress",
      visibility: "PUBLIC",
      featured: false,
      sortOrder: 0,
      coverImageId: null,
      tags: ["Example"],
    }],
    caseStudies: [{
      projectSlug: "example-project",
      slug: "example-project",
      status: "DRAFT",
      publishedAt: null,
      evidence: ["Verified context. ".repeat(20)],
      capabilities: [],
      challenges: [],
      technologies: [],
      publicLinks: [],
      mediaAssetIds: [],
    }],
    blogPosts: [{
      slug: "example-article",
      title: "Example article",
      description: "A draft article",
      category: "Engineering",
      markdown: "# Draft",
      status: "DRAFT",
      publishedAt: null,
      coverImageId: null,
      tags: [],
    }],
  },
  importNotes: ["Content-only pack."],
  counts: { projects: 1, caseStudies: 1, blogPosts: 1 },
};

const projectsImportPack = {
  "packageName": "Ajmot Hossain Portfolio CMS Bulk Content Pack",
  "packageVersion": "1.0",
  "collections": {
    "projects": [
      {
        "slug": "enterprise-erp-system",
        "title": "Enterprise ERP System",
        "summary": "An internally used business system spanning HRMS, sales, accounting, invoicing, inventory, and CRM.",
        "category": "Business systems · Internal ERP",
        "status": "Used internally",
        "visibility": "PUBLIC",
        "featured": true,
        "sortOrder": 0,
        "coverImageId": null,
        "tags": [
          "ERP",
          "Enterprise Software",
          "HRMS",
          "CRM",
          "Inventory",
          "Accounting",
          "Business Automation"
        ]
      },
      {
        "slug": "gpu-store",
        "title": "GPU Store",
        "summary": "A direct-to-consumer e-commerce application focused on GPU products, built with Next.js and Appwrite and deployed on Vercel.",
        "category": "E-commerce",
        "status": "Deployed on Vercel",
        "visibility": "PUBLIC",
        "featured": false,
        "sortOrder": 1,
        "coverImageId": null,
        "tags": [
          "E-commerce",
          "Next.js",
          "Appwrite",
          "TanStack Query",
          "Vercel"
        ]
      },
      {
        "slug": "event-community-accounting-erp",
        "title": "Event and Community Accounting ERP",
        "summary": "A community accounting and ERP project focused on chanda collections, donations, subscriptions, member records, and related accounting workflows.",
        "category": "Community accounting · ERP",
        "status": "Built as a project; deployment and adoption unconfirmed",
        "visibility": "PUBLIC",
        "featured": false,
        "sortOrder": 2,
        "coverImageId": null,
        "tags": [
          "ERP",
          "Accounting",
          "Community Management",
          "Payments",
          "Docker"
        ]
      },
      {
        "slug": "the-villagers-cafe",
        "title": "The Villagers Cafe",
        "summary": "A business website project associated with The Villagers Cafe. Implemented features and live deployment still need confirmation.",
        "category": "Business website",
        "status": "Deployment status not confirmed",
        "visibility": "PUBLIC",
        "featured": false,
        "sortOrder": 3,
        "coverImageId": null,
        "tags": [
          "Business Website",
          "Small Business"
        ]
      },
      {
        "slug": "barberx",
        "title": "BarberX",
        "summary": "A barber booking backend project organized into authentication, booking, and notification services using Spring Boot.",
        "category": "Booking application",
        "status": "Project status not confirmed",
        "visibility": "PUBLIC",
        "featured": false,
        "sortOrder": 4,
        "coverImageId": null,
        "tags": [
          "Java",
          "Spring Boot",
          "Microservices",
          "SQLite",
          "JDK 21"
        ]
      },
      {
        "slug": "rental-application",
        "title": "Car and Bike Rental Application",
        "summary": "A vehicle-rental web application with a Next.js/React frontend and API integration.",
        "category": "Rental application",
        "status": "Project status not confirmed",
        "visibility": "PUBLIC",
        "featured": false,
        "sortOrder": 5,
        "coverImageId": null,
        "tags": [
          "Next.js",
          "React",
          "API Integration",
          "Rental"
        ]
      },
      {
        "slug": "meta-tag-scraper",
        "title": "Website Meta Tag Scraper",
        "summary": "A web utility focused on inspecting metadata tags from websites. The exact feature scope and implementation details have not been confirmed.",
        "category": "Developer utility",
        "status": "Project details need confirmation",
        "visibility": "PUBLIC",
        "featured": false,
        "sortOrder": 6,
        "coverImageId": null,
        "tags": [
          "Web Utility",
          "SEO",
          "Metadata"
        ]
      },
      {
        "slug": "pokedex",
        "title": "Pokédex",
        "summary": "A Pokédex-style application listed among the portfolio projects. Its data source and specific interactions have not been confirmed.",
        "category": "Web application",
        "status": "Project details need confirmation",
        "visibility": "PUBLIC",
        "featured": false,
        "sortOrder": 7,
        "coverImageId": null,
        "tags": [
          "React",
          "Web Application",
          "Pokédex"
        ]
      },
      {
        "slug": "private-store",
        "title": "Private Store",
        "summary": "A private e-commerce application; implementation, client, and deployment details are intentionally not included in the public portfolio.",
        "category": "E-commerce · Private project",
        "status": "Private project",
        "visibility": "PRIVATE",
        "featured": false,
        "sortOrder": 8,
        "coverImageId": null,
        "tags": [
          "E-commerce",
          "Private"
        ]
      }
    ],
    "caseStudies": [],
    "blogPosts": []
  },
  "importNotes": [
    "Projects-only test pack. Import this file from the Admin Projects bulk import section. Each record has no database ID, so importing creates new project records."
  ],
  "counts": {
    "projects": 9,
    "caseStudies": 0,
    "blogPosts": 0
  }
};

test("combined JSON packs validate one selected collection at a time", async () => {
  const input = Buffer.from(JSON.stringify(pack));

  for (const [collection, expected] of [
    ["projects", { projects: 1, caseStudies: 0, blogPosts: 0 }],
    ["caseStudies", { projects: 0, caseStudies: 1, blogPosts: 0 }],
    ["blogPosts", { projects: 0, caseStudies: 0, blogPosts: 1 }],
  ]) {
    const workbook = await normalizeCmsJson(input, collection);
    const result = await inspectCmsWorkbook(workbook, collection);
    assert.deepEqual(result.counts, expected);
    assert.deepEqual(result.issues, []);
  }
});

test("projects import pack validates all 9 records for the projects section", async () => {
  const input = Buffer.from(JSON.stringify(projectsImportPack));
  const workbook = await normalizeCmsJson(input, "projects");
  const result = await inspectCmsWorkbook(workbook, "projects");

  assert.deepEqual(result.counts, { projects: 9, caseStudies: 0, blogPosts: 0 });
  assert.deepEqual(result.issues, []);
});

test("section template contains only its matching content sheet and instructions", async () => {
  const bytes = await createCmsWorkbook({} , "projects", true);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);

  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ["Projects", "Instructions"]);
  assert.deepEqual(workbook.getWorksheet("Projects").getRow(1).values.slice(1), [
    "id", "slug", "title", "summary", "category", "status", "visibility", "featured", "sortOrder", "tags", "coverImageId",
  ]);
});

test("project workbook accepts blank IDs and slugs and newline-separated tags", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Projects");
  sheet.addRow(["id", "slug", "title", "summary", "category", "status", "visibility", "featured", "sortOrder", "tags", "coverImageId"]);
  sheet.addRow(["", "", "Hello World", "A useful summary", "Web", "In progress", "PUBLIC", false, 0, "Portfolio\nNext.js", ""]);
  const bytes = Buffer.from(await workbook.xlsx.writeBuffer());
  const result = await inspectCmsWorkbook(bytes, "projects");

  assert.deepEqual(result.issues, []);
  assert.equal(result.parsed.Projects[0].id, undefined);
  assert.equal(result.parsed.Projects[0].data.slug, "hello-world");
  assert.deepEqual(result.parsed.Projects[0].data.tags, ["Portfolio", "Next.js"]);
});
