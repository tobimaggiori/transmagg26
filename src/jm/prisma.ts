/**
 * Cliente Prisma para el sistema "Javier Maggiori".
 * Base de datos independiente — no comparte tablas con Transmagg.
 * Schema en prisma-jm/schema.prisma, migraciones en prisma-jm/migrations.
 */

import { PrismaClient } from ".prisma/jm-client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrismaJm = globalThis as unknown as {
  prismaJm: PrismaClient | undefined
}

function createPrismaJmClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.JM_DATABASE_URL! })
  return new PrismaClient({ adapter })
}

export const prismaJm: PrismaClient = globalForPrismaJm.prismaJm ?? createPrismaJmClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrismaJm.prismaJm = prismaJm
}
