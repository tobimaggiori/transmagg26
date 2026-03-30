/**
 * Propósito: Instancia singleton de Prisma Client para Transmagg.
 * Usa el adapter LibSQL para SQLite (requerido por Prisma 7).
 * Previene múltiples conexiones en desarrollo (hot-reload de Next.js).
 */

import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

/**
 * createPrismaClient: -> PrismaClient
 *
 * Devuelve una instancia de PrismaClient configurada con el adapter LibSQL,
 * usando DATABASE_URL del entorno o "file:./prisma/dev.db" como fallback.
 * Existe para centralizar la creación del cliente Prisma y garantizar
 * que el adapter LibSQL se aplique correctamente (requerido por Prisma 7).
 *
 * Ejemplos:
 * // Con DATABASE_URL="file:./prisma/dev.db" → cliente SQLite local
 * createPrismaClient() // => PrismaClient con adapter libsql local
 * // Con DATABASE_URL="libsql://db.turso.io?authToken=..." → cliente Turso
 * createPrismaClient() // => PrismaClient con adapter libsql remoto
 * // Sin DATABASE_URL → usa "file:./prisma/dev.db" por defecto
 * createPrismaClient() // => PrismaClient con SQLite local en prisma/dev.db
 */
function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db"
  // LibSQL acepta "file:" para SQLite local o URLs de Turso/Cloudflare para producción
  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
