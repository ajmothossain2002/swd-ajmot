export type PricingOption = {
  title: string;
  audience: string;
  summary: string;
  deliverables: string[];
  quoteLabel: string;
  featured?: boolean;
};

// Scope outlines are indicative and are not approved fixed packages or prices.
export const pricingOptions: PricingOption[] = [
  {
    title: "Business Website",
    audience: "For a business that needs a clear customer-facing website.",
    summary: "A focused website or landing page shaped around the offer, audience, and required content.",
    deliverables: ["Page structure and responsive frontend", "Contact or enquiry flow when configured", "Content and launch scope agreed per project"],
    quoteLabel: "Custom quote after scope discussion",
  },
  {
    title: "E-commerce Application",
    audience: "For a product business planning a focused e-commerce experience.",
    summary: "A product-facing storefront and supporting application requirements scoped to the project.",
    deliverables: ["Storefront and product experience", "Backend and integration requirements scoped together", "Specific external services confirmed before work begins"],
    quoteLabel: "Custom quote after scope discussion",
  },
  {
    title: "Custom Business Application",
    audience: "For a team with a workflow that needs purpose-built software.",
    summary: "A web application, ERP module, dashboard, API, or connected workflow built from agreed requirements.",
    deliverables: ["Application structure and agreed modules", "Frontend, backend, and data requirements scoped", "Integration and deployment needs reviewed"],
    quoteLabel: "Custom quote after scope discussion",
    featured: true,
  },
];

export const additionalEngagements = [
  { title: "API integrations", description: "A defined connection between an application and the external services it needs." },
  { title: "Additional modules", description: "An extension to an existing application, scoped around its current architecture." },
  { title: "Maintenance", description: "Optional application care and support, agreed as a separate engagement." },
  { title: "Enhancements", description: "Focused improvements or fixes for an existing website or application." },
] as const;

export const pricingFaqs = [
  {
    question: "How is a project quote determined?",
    answer: "The quote depends on the requested functionality, scope, integrations, existing systems, and requirements. A specific estimate can be discussed after the project brief is understood.",
  },
  {
    question: "Are these fixed packages?",
    answer: "No. These are starting scope categories to make the conversation easier. Deliverables are indicative, and the final scope is agreed for each project.",
  },
  {
    question: "Is maintenance included?",
    answer: "Ongoing maintenance is optional and is not automatically included. Its scope and support expectations would be agreed separately.",
  },
  {
    question: "Can I add integrations or modules later?",
    answer: "Additional integrations, modules, and enhancements can be discussed as separate work, subject to the existing application's architecture and requirements.",
  },
] as const;
