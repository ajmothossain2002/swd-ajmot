export function verifyCoverImage(db: unknown, coverImageId?: string | null): Promise<void>;
export function resolveTags(db: unknown, names?: string[]): Promise<{ id: string }[]>;
export function publishedData(data: Record<string, unknown>, current?: { status?: string; publishedAt?: Date | null } | null): Record<string, unknown>;
