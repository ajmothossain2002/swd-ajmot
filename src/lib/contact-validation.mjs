export const CONTACT_SERVICES = [
  { value: "business-website", label: "Business website or landing page" },
  { value: "frontend-development", label: "Frontend development" },
  { value: "web-application", label: "Custom web application or dashboard" },
  { value: "backend-integration", label: "Backend API or integration" },
  { value: "maintenance", label: "Website maintenance or improvements" },
];

const serviceValues = new Set(CONTACT_SERVICES.map(({ value }) => value));
const contactMethods = new Set(["email", "phone", "whatsapp", "no-preference"]);

/** @typedef {"name" | "email" | "service" | "projectDescription" | "businessName" | "budgetRange" | "timeline" | "existingWebsite" | "preferredContactMethod"} ContactField */
/** @typedef {{ name: string, email: string, service: string, projectDescription: string, businessName: string, budgetRange: string, timeline: string, existingWebsite: string, preferredContactMethod: string }} ContactPayload */

/** @param {unknown} payload */
export function validateContactPayload(payload) {
  /** @type {Record<string, string>} */
  const errors = {};
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, errors: { form: "Enter your project details and try again." } };
  }

  const source = /** @type {Record<string, unknown>} */ (payload);
  /** @param {string} key @param {number} maximum @param {boolean} required */
  const text = (key, maximum, required = false) => {
    const raw = source[key];
    if (typeof raw !== "string") {
      if (required) errors[key] = "This field is required.";
      return "";
    }
    const value = raw.trim();
    if (required && !value) errors[key] = "This field is required.";
    else if (value.length > maximum) errors[key] = `Use ${maximum} characters or fewer.`;
    return value;
  };

  const name = text("name", 120, true);
  const email = text("email", 254, true);
  const service = text("service", 80, true);
  const projectDescription = text("projectDescription", 5000, true);
  const businessName = text("businessName", 160);
  const budgetRange = text("budgetRange", 160);
  const timeline = text("timeline", 160);
  const existingWebsite = text("existingWebsite", 2048);
  const preferredContactMethod = text("preferredContactMethod", 32);

  const emailPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
  if (email && (!emailPattern.test(email) || /[\r\n]/.test(email))) {
    errors.email = "Enter a valid email address.";
  }
  if (service && !serviceValues.has(service)) errors.service = "Choose one of the listed services.";
  if (preferredContactMethod && !contactMethods.has(preferredContactMethod)) {
    errors.preferredContactMethod = "Choose one of the listed contact methods.";
  }
  if (existingWebsite) {
    try {
      const url = new URL(existingWebsite);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) {
        errors.existingWebsite = "Enter a public website URL beginning with http:// or https://.";
      }
    } catch {
      errors.existingWebsite = "Enter a public website URL beginning with http:// or https://.";
    }
  }

  const value = { name, email, service, projectDescription, businessName, budgetRange, timeline, existingWebsite, preferredContactMethod };
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true, errors: {}, value };
}
