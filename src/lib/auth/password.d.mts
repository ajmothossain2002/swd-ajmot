export function hashPassword(password: string): Promise<string>;
export function verifyPassword(data: { hash: string; password: string }): Promise<boolean>;
