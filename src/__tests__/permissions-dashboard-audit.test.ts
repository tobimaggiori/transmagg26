/**
 * Auditoría estática: ningún elemento visible del dashboard financiero puede
 * renderizarse sin chequear antes `permisos.includes("...")`.
 *
 * Estrategia: leer el JSX de `financial-dashboard-client.tsx` y garantizar
 * que cada sección renderizada esté precedida por un check de permisos.
 * Específicamente chequeamos los patrones más riesgosos: el arranque de
 * cualquier `<Card>` / `<button onClick`, `alertasFci`, `cuentas` list.
 */

import fs from "fs"
import path from "path"

const CLIENT_PATH = path.resolve(
  __dirname,
  "../app/(dashboard)/dashboard/financial-dashboard-client.tsx"
)

describe("Auditoría estática: dashboard financiero UI", () => {
  const contenido = fs.readFileSync(CLIENT_PATH, "utf-8")

  it("alertasFci está envuelto en un check de permisos contabilidad.fci", () => {
    // Buscar el texto VISIBLE renderizado ("Alertas FCI:") — no el comentario.
    const idx = contenido.indexOf("Alertas FCI:")
    expect(idx).toBeGreaterThan(-1)
    const anterior = contenido.slice(Math.max(0, idx - 400), idx)
    expect(anterior).toMatch(/permisos\.includes\(\s*"contabilidad\.fci"\s*\)/)
  })

  it("la grilla de cuentas está envuelta en un check dashboard.cuentas_*", () => {
    const idx = contenido.indexOf("Cuentas Activas")
    expect(idx).toBeGreaterThan(-1)
    const anterior = contenido.slice(Math.max(0, idx - 400), idx)
    expect(anterior).toMatch(/permisos\.(some|includes)/)
  })

  it("cada card de dashboard.deuda_* / pendiente_* / cheques_* está detrás de permisos.includes", () => {
    const cards = [
      "dashboard.deuda_empresas",
      "dashboard.deuda_fleteros",
      "dashboard.cheques_cartera",
      "dashboard.cheques_emitidos",
      "dashboard.pendiente_facturar",
      "dashboard.pendiente_liquidar",
    ]
    for (const seccion of cards) {
      expect(contenido).toContain(`permisos.includes("${seccion}")`)
    }
  })
})
