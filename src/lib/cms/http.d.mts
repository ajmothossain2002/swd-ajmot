type Authorization = (request: Request) => Promise<{ ok: true } | Response>;
type ListQuery = { page: number; pageSize: number; q: string; filters: Record<string, string | undefined> };
type Service = {
  list: (db: unknown, query: ListQuery) => Promise<unknown>;
  create: (db: unknown, input: unknown) => Promise<unknown>;
  get: (db: unknown, id: string) => Promise<unknown>;
  update: (db: unknown, id: string, input: unknown) => Promise<unknown>;
  delete: (db: unknown, id: string) => Promise<unknown>;
};
type ItemContext = { params: Promise<{ id: string }> };
type MutationRecord = { slug?: string; project?: { slug?: string } };
type Mutation = { operation: "create" | "update" | "delete"; previous?: MutationRecord; result?: MutationRecord };
type AfterMutation = (mutation: Mutation) => Promise<void> | void;
export function createCollectionHandlers(options: { authorize: Authorization; db: unknown; service: Pick<Service, "list" | "create">; filters?: string[]; afterMutation?: AfterMutation }): {
  GET(request: Request): Promise<Response>;
  POST(request: Request): Promise<Response>;
};
export function createItemHandlers(options: { authorize: Authorization; db: unknown; service: Pick<Service, "get" | "update" | "delete">; afterMutation?: AfterMutation }): {
  GET(request: Request, context: ItemContext): Promise<Response>;
  PATCH(request: Request, context: ItemContext): Promise<Response>;
  DELETE(request: Request, context: ItemContext): Promise<Response>;
};
