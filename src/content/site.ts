export const siteNavigation = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const homeCopy = {
  eyebrow: "Ajmot Hossain · Web developer",
  titleLead: "Web development",
  titleAccent: "for business.",
  description:
    "Business websites, frontend experiences, custom applications and integrations—built around the practical needs of your business.",
} as const;

export const services = [
  {
    title: "Business websites",
    description:
      "Company websites and landing pages shaped around your offer, audience, and next step.",
  },
  {
    title: "Frontend development",
    description:
      "Responsive React and Next.js interfaces with clear structure and accessible interactions.",
  },
  {
    title: "Custom web applications",
    description:
      "Web applications and dashboards built around the workflows your team needs.",
  },
  {
    title: "Backend APIs and integrations",
    description:
      "APIs and integrations that connect your website or application to the services it uses.",
  },
  {
    title: "Maintenance and improvements",
    description:
      "Fixes, refinements, and ongoing improvements for an existing website or application.",
  },
] as const;

export const developmentProcess = [
  {
    number: "01",
    title: "Understand the brief",
    description:
      "Clarify the business goal, audience, scope, and constraints before choosing an approach.",
  },
  {
    number: "02",
    title: "Plan the build",
    description:
      "Agree on the structure, technical direction, and the work needed for the first release.",
  },
  {
    number: "03",
    title: "Build and refine",
    description:
      "Develop the experience in focused steps and review the details as the work takes shape.",
  },
  {
    number: "04",
    title: "Review and hand over",
    description:
      "Check the finished scope together and prepare the agreed work for handoff.",
  },
] as const;

export const technicalCapabilities = [
  "React and Next.js",
  "Frontend development",
  "Custom web applications",
  "Dashboards",
  "Backend APIs",
  "Integrations",
  "Website maintenance",
] as const;

export const homepageCopy = {
  about:
    "Ajmot Hossain works across business websites, frontend development, custom applications, and integrations—bringing practical product needs and web engineering together.",
  workPending:
    "Project details and approved images haven’t been provided for publication yet.",
  pricing:
    "Pricing details haven’t been provided yet. Share a brief to discuss the scope of your project.",
  journal:
    "Articles will appear here when writing is ready to share.",
  contactPending:
    "A public email address or contact destination hasn’t been provided yet.",
} as const;
