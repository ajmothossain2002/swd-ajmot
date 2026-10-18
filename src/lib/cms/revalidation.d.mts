type CmsMutation = { operation?: "create" | "update" | "delete"; previous?: { slug?: string; project?: { slug?: string } }; result?: { slug?: string; project?: { slug?: string } } };
export function pathsForProjectMutation(mutation?: CmsMutation): string[];
export function pathsForPostMutation(mutation?: CmsMutation): string[];
export function pathsForCaseStudyMutation(mutation?: CmsMutation): string[];
export function createCmsMutationRevalidator(invalidatePath: (path: string) => void, getPaths: (mutation: CmsMutation) => string[]): (mutation: CmsMutation) => Promise<void>;
