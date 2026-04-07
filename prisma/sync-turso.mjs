/**
 * sync-turso.mjs
 *
 * Sincroniza el schema de la DB local (dev.db) a Turso.
 * - Detecta tablas faltantes en Turso y las crea (copiando el CREATE TABLE de dev.db)
 * - Detecta columnas faltantes en tablas existentes y ejecuta ALTER TABLE ADD COLUMN
 *
 * Uso: node prisma/sync-turso.mjs
 * Requiere: DATABASE_URL en .env apuntando a Turso (libsql://)
 */

import { createClient } from "@libsql/client"
import { config } from "dotenv"

config()

const tursoUrl = process.env.DATABASE_URL
if (!tursoUrl || !tursoUrl.startsWith("libsql://")) {
  console.error("ERROR: DATABASE_URL debe ser una URL de Turso (libsql://...)")
  process.exit(1)
}

const urlObj = new URL(tursoUrl)
const authToken = urlObj.searchParams.get("authToken")
const baseUrl = `${urlObj.protocol}//${urlObj.host}`

const local = createClient({ url: "file:./prisma/dev.db" })
const remote = createClient({ url: baseUrl, authToken: authToken ?? undefined })

async function getTableNames(client) {
  const res = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'"
  )
  return res.rows.map((r) => String(r.name))
}

async function getCreateSQL(client, table) {
  const res = await client.execute(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`
  )
  return res.rows[0]?.sql ? String(res.rows[0].sql) : null
}

async function getColumns(client, table) {
  const res = await client.execute(`PRAGMA table_info("${table}")`)
  return res.rows.map((r) => ({
    name: String(r.name),
    type: String(r.type),
    notnull: r.notnull,
    dflt_value: r.dflt_value,
  }))
}

async function sync() {
  const localTables = await getTableNames(local)
  const remoteTables = new Set(await getTableNames(remote))
  let changes = 0

  // 1. Crear tablas faltantes
  for (const table of localTables) {
    if (!remoteTables.has(table)) {
      const sql = await getCreateSQL(local, table)
      if (sql) {
        console.log(`  [CREAR] ${table}`)
        await remote.execute(sql)
        changes++
      }
    }
  }

  // 2. Agregar columnas faltantes en tablas existentes
  for (const table of localTables) {
    if (!remoteTables.has(table)) continue // ya la creamos arriba con todas las columnas

    const localCols = await getColumns(local, table)
    const remoteCols = await getColumns(remote, table)
    const remoteColNames = new Set(remoteCols.map((c) => c.name))

    const missing = localCols.filter((c) => !remoteColNames.has(c.name))

    for (const col of missing) {
      const notNull = col.notnull ? "NOT NULL" : ""
      const dflt = col.dflt_value != null ? `DEFAULT ${col.dflt_value}` : ""
      const sql = `ALTER TABLE "${table}" ADD COLUMN "${col.name}" ${col.type} ${notNull} ${dflt}`.trim()
      console.log(`  [COLUMNA] ${table}.${col.name}: ${sql}`)
      await remote.execute(sql)
      changes++
    }
  }

  if (changes === 0) {
    console.log("Turso ya está sincronizado con el schema local.")
  } else {
    console.log(`\n${changes} cambio(s) aplicado(s) a Turso.`)
  }

  local.close()
  remote.close()
}

sync().catch((err) => {
  console.error("Error sincronizando:", err)
  process.exit(1)
})
