import { prisma } from "./admin-prisma.js";
import { hashPassword } from "../src/lib/auth/password.mjs";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 15 || password.length > 128) {
    throw new Error("Set ADMIN_EMAIL and a new ADMIN_PASSWORD between 15 and 128 characters.");
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) throw new Error("No administrator matches ADMIN_EMAIL. No account data was changed.");
  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.account.update({
      where: { providerId_accountId: { providerId: "credential", accountId: admin.id } },
      data: { password: passwordHash },
    }),
    prisma.session.deleteMany({ where: { userId: admin.id } }),
  ]);
  console.log("The administrator password was changed and active sessions were revoked.");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Password update failed.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
