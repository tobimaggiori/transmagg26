import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma-jm/schema.prisma",
  migrations: {
    path: "prisma-jm/migrations",
  },
  datasource: {
    url: process.env["JM_DATABASE_URL"] ?? "",
  },
});
