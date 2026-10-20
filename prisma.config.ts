import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use the migration connection when configured. For local PostgreSQL,
    // DATABASE_URL can serve both runtime and migration traffic.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
