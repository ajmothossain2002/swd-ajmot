type Query = { page: number; pageSize: number; q: string; filters: Record<string, string | undefined> };
export function listPosts(db: unknown, query: Query): Promise<unknown>;
export function getPost(db: unknown, id: string): Promise<unknown>;
export function createPost(db: unknown, input: unknown): Promise<unknown>;
export function updatePost(db: unknown, id: string, input: unknown): Promise<unknown>;
export function deletePost(db: unknown, id: string): Promise<unknown>;
