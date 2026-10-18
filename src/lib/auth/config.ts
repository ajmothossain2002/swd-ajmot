import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password.mjs";

const localBuildSecret = "development-only-secret-not-for-production-000000000000";

export const auth = betterAuth({
  appName: "Ajmot Hossain Portfolio",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || localBuildSecret,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  user: { modelName: "adminUser" },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 15,
    maxPasswordLength: 128,
    password: { hash: hashPassword, verify: verifyPassword },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "ajmot-admin",
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    customRules: { "/sign-in/email": { window: 60, max: 10 } },
  },
});
