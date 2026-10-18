export type ContactField =
  | "name"
  | "email"
  | "service"
  | "projectDescription"
  | "businessName"
  | "budgetRange"
  | "timeline"
  | "existingWebsite"
  | "preferredContactMethod";

export type ContactPayload = {
  name: string;
  email: string;
  service: string;
  projectDescription: string;
  businessName: string;
  budgetRange: string;
  timeline: string;
  existingWebsite: string;
  preferredContactMethod: string;
};

export const CONTACT_SERVICES: readonly { value: string; label: string }[];
export function validateContactPayload(payload: unknown):
  | { valid: true; errors: Record<string, never>; value: ContactPayload }
  | { valid: false; errors: Record<string, string> };
