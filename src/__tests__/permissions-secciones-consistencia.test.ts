/**
 * Consistencia: toda sección usada en un guard `tienePermiso` debe estar
 * registrada en SECCIONES (granular) o en PERMISOS_SECCION (rol-based).
 * Si se usa una sección que no está en ninguna de las dos, el guard
 * devuelve false siempre → bloqueo silencioso (bug).
 */

import fs from "fs"
import path from "path"
import { SECCIONES } from "@/lib/secciones"
import { PERMISOS_SECCION } from "@/lib/permissions"

const ROOT = path.resolve(__dirname, "../app/(dashboard)")

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (entry.isFile() && full.endsWith(".tsx")) acc.push(full)
  }
  return acc
}

describe("Consistencia: secciones usadas en tienePermiso existen en SECCIONES o PERMISOS_SECCION", () => {
  it("toda sección referenciada está definida", () => {
    const granulares = new Set<string>(Object.values(SECCIONES))
    const roleBased = new Set<string>(Object.keys(PERMISOS_SECCION))

    const archivos = walk(ROOT)
    const huérfanas: Array<{ archivo: string; seccion: string }> = []

    for (const archivo of archivos) {
      const contenido = fs.readFileSync(archivo, "utf-8")
      const matches = [...contenido.matchAll(/tienePermiso\([^,]+,\s*[^,]+,\s*"([^"]+)"\s*\)/g)]
      for (const m of matches) {
        const s = m[1]
        if (!granulares.has(s) && !roleBased.has(s)) {
          huérfanas.push({ archivo: path.relative(ROOT, archivo), seccion: s })
        }
      }
    }

    if (huérfanas.length > 0) {
      const msg = huérfanas
        .map((h) => `  - ${h.archivo} referencia "${h.seccion}" — no existe en SECCIONES ni en PERMISOS_SECCION`)
        .join("\n")
      throw new Error(
        `Referencias a secciones inexistentes en guards (bloqueo silencioso):\n${msg}\n\n` +
          `Agregarlas a SECCIONES (src/lib/secciones.ts) para granular o a PERMISOS_SECCION ` +
          `(src/lib/permissions.ts) para role-based.`
      )
    }
  })
})
