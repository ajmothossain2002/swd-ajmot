import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | null = null;

function ensurePrisma(): PrismaClient {
  if (_prisma) return _prisma;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be configured before using the database.");
  }

  _prisma = new PrismaClient();
  return _prisma;
}

const prismaProxy = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = ensurePrisma();
      // @ts-expect-error dynamic proxy
      return (client as any)[prop];
    },
    has(_target, prop) {
      const client = ensurePrisma();
      return prop in (client as any);
    },
  },
) as unknown as PrismaClient;

export default prismaProxy;

export function getPrisma(): PrismaClient | undefined {
  try {
    return ensurePrisma();
  } catch {
    return undefined;
  }
}
