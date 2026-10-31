export type ApprovedProjectLink = {
  label: string;
  url: string;
  approved: true;
};

export type ProjectImage = {
  src: string;
  alt: string;
};

export type ProjectChallenge = {
  title: string;
  description: string;
};

export type ProjectCaseStudy = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  status: string;
  visibility: "public" | "private";
  role?: string;
  problem?: string;
  businessContext?: string;
  approach?: string;
  capabilities?: string[];
  capabilityLabel?: string;
  challenges?: ProjectChallenge[];
  architectureNote?: string;
  technologies: string[];
  evidence: string[];
  image?: ProjectImage;
  publicLinks?: ApprovedProjectLink[];
  featured?: boolean;
};

// Public summaries use only project information supplied by Ajmot. Add links,
// screenshots, and deeper implementation details after they are approved.
export const projects: ProjectCaseStudy[] = [
  {
    slug: "enterprise-erp-system",
    title: "Enterprise ERP System",
    summary:
      "An internally used business system spanning HRMS, sales, accounting, invoicing, inventory, and CRM.",
    category: "Business systems · Internal ERP",
    status: "Used internally",
    visibility: "public",
    role: "End-to-end development",
    problem:
      "The system was built to support work across HRMS, sales, accounting, invoicing, inventory, and CRM, alongside bulk import/export and utility tools.",
    businessContext:
      "An enterprise application used internally, with modules for business operations and role-based access to application areas.",
    approach:
      "Developed application capabilities across multiple services. The supplied project information identifies separate C++/gRPC/Protocol Buffers and Python/FastAPI/PostgreSQL technology groups; exact service boundaries are not documented here.",
    capabilities: [
      "HRMS, sales, accounting, invoicing, inventory, and CRM",
      "Bulk import and export",
      "Role-based access to application modules",
      "Audit tracking",
      "Calculator, converter, and voice-to-text utilities",
    ],
    capabilityLabel: "System capabilities",
    challenges: [
      {
        title: "Module-level access control",
        description:
          "Implementing role-based access across application modules so access follows the responsibilities assigned to each user.",
      },
      {
        title: "Accounting and invoice workflows",
        description:
          "Connecting the accounting engine with invoice workflows while keeping the interaction between those business areas clear.",
      },
    ],
    architectureNote:
      "C++ with gRPC and Protocol Buffers, and Python with FastAPI and PostgreSQL, are technologies used across different services in the broader system. The relationship between those services and the overall architecture has not been confirmed, so this case study does not label the system monolithic or microservices-based.",
    technologies: ["C++", "gRPC", "Protocol Buffers", "Python", "FastAPI", "PostgreSQL"],
    evidence: [
      "Project scope, listed capabilities, technologies, role, challenges, and internal-use status were supplied by Ajmot.",
      "Approved interface prototype supplied by Ajmot.",
    ],
    image: {
      src: "/assets/projects/enterprise-erp-system.jpg",
      alt: "Enterprise ERP System dashboard interface showing finance, sales, and inventory management",
    },
    featured: true,
  },
  {
    slug: "gpu-store",
    title: "GPU Store",
    summary: "An e-commerce application focused on GPU products.",
    category: "E-commerce",
    status: "Deployment status not confirmed",
    visibility: "public",
    technologies: [],
    evidence: [
      "The project is described as an e-commerce application. Build scope, role, technology, and public availability have not been confirmed.",
    ],
    image: {
      src: "/assets/projects/gpu-store.jpg",
      alt: "GPU Store e-commerce product showcase and custom gaming PC specifications",
    },
  },
  {
    slug: "the-villagers-cafe",
    title: "The Villagers Cafe",
    summary: "A business website project for The Villagers Cafe.",
    category: "Business website",
    status: "Deployment status not confirmed",
    visibility: "public",
    technologies: [],
    evidence: [
      "The project is described as a business website. Specific functionality, publication permission, and live URL have not been confirmed.",
    ],
    image: {
      src: "/assets/projects/the-villagers-cafe.jpg",
      alt: "The Villagers Cafe web interface featuring restaurant menu and online ordering",
    },
  },
  {
    slug: "event-community-accounting-erp",
    title: "Event and Community Accounting ERP",
    summary:
      "A project designed around accounting needs for Kolkata puja clubs and other local businesses.",
    category: "Community accounting · ERP",
    status: "Built as a project; deployment and adoption unconfirmed",
    visibility: "public",
    role: "System design and development",
    problem:
      "The project is intended to organize accounting areas relevant to community events, including chanda collections, donations, and subscriptions.",
    businessContext:
      "Designed with Kolkata puja clubs and other local businesses as its intended users. Production deployment and real-world adoption have not been confirmed.",
    approach:
      "The project focuses on chanda collections, donations, subscriptions, and accounting. Detailed workflows are not described here because a demonstrable implementation has not been supplied for review.",
    capabilities: [
      "Known focus areas: chanda collections, donations, subscriptions, and accounting",
    ],
    capabilityLabel: "Known focus areas",
    technologies: [],
    evidence: [
      "Project status, intended users, role, and focus areas were supplied by Ajmot.",
      "Approved interface prototype supplied by Ajmot.",
    ],
    image: {
      src: "/assets/projects/event-community-accounting-erp.jpg",
      alt: "Event and Community Accounting ERP dashboard displaying donation and campaign statistics",
    },
  },
  {
    slug: "barberx",
    title: "BarberX",
    summary: "A barber booking and backend project.",
    category: "Booking application",
    status: "Project status not confirmed",
    visibility: "public",
    technologies: [],
    evidence: [
      "The project is described as a barber booking/backend project. Specific workflows, role, technology, and public availability have not been confirmed.",
    ],
    image: {
      src: "/assets/projects/barberx.jpg",
      alt: "BarberX appointment booking dashboard displaying clients, schedules, and salon services",
    },
  },
  {
    slug: "private-store",
    title: "Private Store",
    summary: "An e-commerce application; further project details are kept private.",
    category: "E-commerce · Private project",
    status: "Private project",
    visibility: "private",
    technologies: [],
    evidence: [
      "Only a high-level project description is approved for this portfolio. No private code, repository, customer information, or deployment details are included.",
    ],
  },
  {
    slug: "rental-application",
    title: "Rental Application",
    summary: "A car or vehicle rental project.",
    category: "Rental application",
    status: "Project status not confirmed",
    visibility: "public",
    technologies: [],
    evidence: [
      "The project is described as a car or vehicle rental application. Specific workflows, role, technology, and public availability have not been confirmed.",
    ],
    image: {
      src: "/assets/projects/rental-application.jpg",
      alt: "Car rental application dashboard showing available vehicles, booking dates, and reservations",
    },
  },
];

const projectPriority = [
  "enterprise-erp-system",
  "gpu-store",
  "event-community-accounting-erp",
  "the-villagers-cafe",
  "barberx",
  "private-store",
  "rental-application",
];

export const selectedProjects = projectPriority.flatMap((slug) =>
  projects.filter((project) => project.slug === slug && project.visibility === "public"),
);
export const publicProjects = projects.filter((project) => project.visibility === "public");
export const homepageProjects = selectedProjects.filter((project) =>
  project.featured || ["gpu-store", "event-community-accounting-erp", "the-villagers-cafe"].includes(project.slug),
);

export function findProjectBySlug(slug: string) {
  return publicProjects.find((project) => project.slug === slug);
}

export function getApprovedExternalLinks(project: ProjectCaseStudy) {
  return (project.publicLinks ?? []).filter((link) => {
    if (link.approved !== true) return false;

    try {
      const url = new URL(link.url);
      return url.protocol === "https:" && url.hostname.length > 0 && !url.username && !url.password;
    } catch {
      return false;
    }
  });
}

export function getApprovedProjectImage(image: ProjectImage | undefined) {
  if (!image || !image.src.startsWith("/") || image.src.startsWith("//") || image.src.includes("\\")) {
    return undefined;
  }

  return image.alt.trim() ? image : undefined;
}
