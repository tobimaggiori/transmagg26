/**
 * Auditoría estática: el endpoint /api/dashboard-financiero debe filtrar la
 * respuesta por los permisos granulares del operador.
 */

import fs from "fs"
import path from "path"

const ROUTE_PATH = path.resolve(
  __dirname,
  "../app/api/dashboard-financiero/route.ts"
)

describe("Auditoría estática: API /api/dashboard-financiero", () => {
  const contenido = fs.readFileSync(ROUTE_PATH, "utf-8")

  it("importa getPermisosUsuario para leer permisos del operador", () => {
    expect(contenido).toMatch(/getPermisosUsuario/)
  })

  it("filtra la respuesta por permiso por cada sección sensible", () => {
    const secciones = [
      "dashboard.deuda_empresas",
      "dashboard.deuda_fleteros",
      "dashboard.pendiente_facturar",
      "dashboard.pendiente_liquidar",
      "dashboard.cheques_cartera",
      "dashboard.cheques_emitidos",
      "contabilidad.fci",
      "dashboard.cuentas_bancos",
      "dashboard.cuentas_brokers",
      "dashboard.cuentas_billeteras",
    ]
    for (const s of secciones) {
      expect(contenido).toContain(`"${s}"`)
    }
  })
})
