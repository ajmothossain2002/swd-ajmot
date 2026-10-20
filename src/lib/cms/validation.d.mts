type ValidationIssue = { path: (string | number)[]; message: string };
type ValidationResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: { issues: ValidationIssue[] } };
type ValidationSchema = { safeParse(value: unknown): ValidationResult };

export const projectCreateSchema: ValidationSchema;
export const projectPatchSchema: ValidationSchema;
export const postCreateSchema: ValidationSchema;
export const postPatchSchema: ValidationSchema;
export const caseStudyCreateSchema: ValidationSchema;
export const caseStudyPatchSchema: ValidationSchema;
