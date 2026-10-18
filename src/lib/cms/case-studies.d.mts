type Query = { page: number; pageSize: number; q: string; filters: Record<string, string | undefined> };
export function listCaseStudies(db: unknown, query: Query): Promise<unknown>;
export function getCaseStudy(db: unknown, id: string): Promise<unknown>;
export function createCaseStudy(db: unknown, input: unknown): Promise<unknown>;
export function updateCaseStudy(db: unknown, id: string, input: unknown): Promise<unknown>;
export function deleteCaseStudy(db: unknown, id: string): Promise<unknown>;
