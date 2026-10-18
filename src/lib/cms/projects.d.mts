type Query = { page: number; pageSize: number; q: string; filters: Record<string, string | undefined> };
export function listProjects(db: unknown, query: Query): Promise<unknown>;
export function getProject(db: unknown, id: string): Promise<unknown>;
export function createProject(db: unknown, input: unknown): Promise<unknown>;
export function updateProject(db: unknown, id: string, input: unknown): Promise<unknown>;
export function deleteProject(db: unknown, id: string): Promise<unknown>;
