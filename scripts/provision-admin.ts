import { hashPassword } from "../src/lib/auth/password.mjs";
import { prisma } from "./admin-prisma.js";
import { randomUUID } from "node:crypto";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Set ADMIN_EMAIL to the initial administrator email address.");
  }
  if (!password || password.length < 15 || password.length > 128) {
    throw new Error("Set ADMIN_PASSWORD to a password between 15 and 128 characters.");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email }, include: { accounts: true } });
  if (existing) {
    const hasCredential = existing.accounts.some((account) => account.providerId === "credential" && account.accountId === existing.id && account.password);
    if (hasCredential) {
      console.log("The configured administrator already exists. No account data was changed.");
      return;
    }
    throw new Error("An administrator exists without a verified credential account. Manual review is required; provisioning will not change its password.");
  }

  const count = await prisma.adminUser.count();
  if (count > 0) throw new Error("An administrator already exists. Provisioning will not add or replace an account.");

  const passwordHash = await hashPassword(password);
  const id = randomUUID();
  await prisma.adminUser.create({
    data: {
      id,
      email,
      name: "Admin",
      passwordHash: null,
      accounts: {
        create: {
          accountId: id,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });
  console.log("The initial administrator account has been provisioned.");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Administrator provisioning failed.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
