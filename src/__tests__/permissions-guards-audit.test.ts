/**
 * Auditoría estática de guards de permisos en páginas del dashboard.
 *
 * Garantía: cualquier page.tsx bajo src/app/(dashboard)/ que use
 * `puedeAcceder(rol, S)` + `redirect("/dashboard")` para una sección `S`
 * que también está habilitada para OPERADOR_TRANSMAGG, es un BUG:
 * `puedeAcceder` solo chequea el rol, NO el permiso granular del operador.
 * El guard correcto debe usar `tienePermiso(userId, rol, S)`.
 *
 * Excepciones legítimas:
 * - Páginas que sólo usan `esAdmin(rol)` (bloquean a todos los operadores).
 * - Páginas cuyas secciones NO incluyen OPERADOR_TRANSMAGG en PERMISOS_SECCION
 *   (no aplica la regla granular).
 *
 * Este test se corre en CI: si alguien agrega una nueva page con el patrón
 * incorrecto, falla el build antes de llegar a producción.
 */

import fs from "fs"
import path from "path"
import { PERMISOS_SECCION } from "@/lib/permissions"

const DASHBOARD_ROOT = path.resolve(__dirname, "../app/(dashboard)")

function walkPages(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkPages(full, acc)
    else if (entry.isFile() && entry.name === "page.tsx") acc.push(full)
  }
  return acc
}

/** Extrae las secciones usadas dentro de llamadas a puedeAcceder(X, "...") */
function extraerSeccionesPuedeAcceder(contenido: string): string[] {
  const matches = [...contenido.matchAll(/puedeAcceder\([^,]+,\s*"([^"]+)"\s*\)/g)]
  return matches.map((m) => m[1])
}

/** Devuelve true si la sección está habilitada para OPERADOR_TRANSMAGG. */
function permiteOperador(seccion: string): boolean {
  const roles = PERMISOS_SECCION[seccion]
  if (!roles) return false
  return roles.includes("OPERADOR_TRANSMAGG")
}

describe("Auditoría estática: guards de páginas del dashboard", () => {
  const archivos = walkPages(DASHBOARD_ROOT)

  it("todas las page.tsx que usen puedeAcceder con una sección operador-accesible deben usar también tienePermiso", () => {
    const violaciones: Array<{ archivo: string; seccion: string }> = []

    for (const archivo of archivos) {
      const contenido = fs.readFileSync(archivo, "utf-8")
      const usaRedirectDashboard = contenido.includes('redirect("/dashboard")')
      if (!usaRedirectDashboard) continue

      const secciones = extraerSeccionesPuedeAcceder(contenido)
      const usaTienePermiso = /tienePermiso\s*\(/.test(contenido)

      for (const s of secciones) {
        if (!permiteOperador(s)) continue
        // La sección es operador-accesible. Verificamos que use tienePermiso
        // (sola o en combinación con puedeAcceder). Si el archivo ya llama
        // tienePermiso, asumimos que el guard está bien construido.
        if (!usaTienePermiso) {
          violaciones.push({ archivo: path.relative(DASHBOARD_ROOT, archivo), seccion: s })
        }
      }
    }

    if (violaciones.length > 0) {
      const msg = violaciones
        .map((v) => `  - ${v.archivo} usa puedeAcceder("${v.seccion}") sin tienePermiso()`)
        .join("\n")
      throw new Error(
        `Páginas con guard débil (solo por rol, sin chequeo granular de permiso del operador):\n${msg}\n\n` +
          `Usar tienePermiso(session.user.id, rol, "seccion") en lugar de puedeAcceder(rol, "seccion") ` +
          `para secciones que OPERADOR_TRANSMAGG puede tener deshabilitadas.`
      )
    }
  })
})
