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
  eyebrow: "Ajmot Hossain · Full-Stack Developer",
  titleLead: "Building software around the way businesses",
  titleAccent: "actually work.",
  description:
    "I’m Ajmot Hossain, a Full-Stack Developer focused on business applications, complex workflows, and interactive web experiences. I work across frontend architecture, backend systems, database operations, and deployment to turn business requirements into practical software.",
} as const;

export const professionalStrengths = [
  {
    title: "Business systems",
    description: "ERP development for connected operational areas such as sales, accounting, inventory, and HRMS.",
  },
  {
    title: "Frontend architecture",
    description: "Interactive frontend experiences and interfaces structured around real application workflows.",
  },
  {
    title: "Backend and data",
    description: "Backend services, APIs, database-backed workflows, and integrations.",
  },
  {
    title: "End-to-end delivery",
    description: "System design, frontend and backend development, and deployment work across an application.",
  },
] as const;

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

export const serviceGroups = [
  {
    id: "business-websites",
    title: "Business websites",
    description: "Customer-facing websites and e-commerce experiences shaped around the business and its audience.",
    services: [
      { title: "Business website development", description: "Clear, responsive company websites and landing pages." },
      { title: "E-commerce website development", description: "Product-focused storefront experiences and their application workflows." },
      { title: "Website redesign", description: "Responsive frontend improvements for an existing website." },
    ],
  },
  {
    id: "custom-applications",
    title: "Custom applications",
    description: "Application interfaces and business workflows built for a specific set of requirements.",
    services: [
      { title: "Custom web applications", description: "Purpose-built applications shaped around how a team works." },
      { title: "ERP and business workflows", description: "Connected modules and role-based access for operational software." },
      { title: "Booking and management applications", description: "Application foundations for booking and management needs." },
      { title: "Dashboards and reporting interfaces", description: "Interfaces that bring relevant application information into view." },
    ],
  },
  {
    id: "backend-integrations",
    title: "Backend and integrations",
    description: "Services and data workflows that support a website or application.",
    services: [
      { title: "Backend APIs", description: "Server-side endpoints and application logic for web products." },
      { title: "Database-driven applications", description: "Application workflows backed by structured data." },
      { title: "Third-party integrations", description: "Connect an application with the external services it needs." },
      { title: "Role-based permissions", description: "Access rules for application modules and user responsibilities." },
    ],
  },
  {
    id: "maintenance-improvements",
    title: "Maintenance and improvement",
    description: "Focused support for an existing website or application.",
    services: [
      { title: "Application maintenance", description: "Ongoing care scoped around the application and agreed needs." },
      { title: "Bug fixes and enhancements", description: "Targeted fixes and product improvements." },
      { title: "Technical improvements", description: "Review and refinement of application behavior and implementation." },
    ],
  },
] as const;

export const developmentProcess = [
  {
    number: "01",
    title: "Discover",
    description: "Understand the business need, users, existing systems, and constraints.",
  },
  {
    number: "02",
    title: "Plan",
    description: "Shape the first scope, technical direction, and delivery priorities together.",
  },
  {
    number: "03",
    title: "Design",
    description: "Map the information, interactions, and application structure before implementation.",
  },
  {
    number: "04",
    title: "Build",
    description: "Implement the agreed interface, business logic, and integrations in clear steps.",
  },
  {
    number: "05",
    title: "Test",
    description: "Review core workflows, responsive behavior, and the agreed requirements.",
  },
  {
    number: "06",
    title: "Launch",
    description: "Prepare the approved release and handoff for the selected hosting setup.",
  },
  {
    number: "07",
    title: "Maintain",
    description: "Discuss ongoing fixes and improvements as a separately scoped engagement.",
  },
] as const;

export const serviceFaqs = [
  {
    question: "What types of applications can you build?",
    answer: "Business websites, product-focused e-commerce experiences, custom web applications, ERP and workflow systems, booking tools, dashboards, APIs, and integrations.",
  },
  {
    question: "How does a project begin?",
    answer: "Start by sharing the business need, intended users, and what the application should help them do. We can use that brief to discuss a suitable scope and next steps.",
  },
  {
    question: "How are scope and pricing determined?",
    answer: "They depend on the required functionality, integrations, existing systems, and the size of the agreed work. Pricing is discussed after the requirements are understood.",
  },
  {
    question: "Can you work on an existing application?",
    answer: "Yes. Existing application fixes, frontend improvements, integrations, and enhancements are among the services offered. The current code and requested changes determine fit and scope.",
  },
  {
    question: "Do you offer ongoing maintenance?",
    answer: "Maintenance can be discussed as a separately scoped engagement. Availability and support expectations need to be agreed for each project.",
  },
  {
    question: "How can I discuss a project?",
    answer: "Use the contact form to share a short brief. Email delivery depends on the site's contact settings being configured.",
  },
] as const;

export const technicalCapabilities = [
  "React and Next.js",
  "Frontend architecture",
  "C++",
  "gRPC",
  "Protocol Buffers",
  "Python",
  "FastAPI",
  "PostgreSQL",
  "Backend APIs and integrations",
  "Deployment",
] as const;

export const homepageCopy = {
  about:
    "I’m a full-stack developer with experience spanning business systems, frontend development, backend services, and deployment. My work includes an internally used ERP system and projects designed around specific business and community workflows.",
  workPending: "Project details and approved images haven’t been provided for publication yet.",
  pricing:
    "Pricing details haven’t been provided yet. Share a brief to discuss the scope of your project.",
  journal:
    "Articles will appear here when writing is ready to share.",
  contactPending:
    "Tell me what you’re building, improving, or trying to connect. Share a project brief through the contact form.",
} as const;
