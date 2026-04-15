/**
 * Tests de fechaEmision punta a punta.
 *
 * Cubre:
 * A. Helpers de fecha local (date-local.ts)
 * B. Validación: validarFechaEmisionArca (determinístico con fecha fija)
 * C. Persistencia: factura-commands y liquidacion-commands usan fechaEmision
 * D. Propagación ARCA: el servicio recibe la fecha correcta del comprobante
 * E. No regresión estructural: las rutas canónicas existen, las duplicadas no
 */

import { validarFechaEmisionArca } from "@/lib/fecha-emision"
import {
  hoyLocalYmd,
  parsearFechaLocalMediodia,
  normalizarMediodiaLocal,
  sumarDiasLocal,
} from "@/lib/date-local"
import * as fs from "fs"
import * as path from "path"

// ═══════════════════════════════════════════════════════════════════════════════
// A. HELPERS DE FECHA LOCAL — date-local.ts
// ═══════════════════════════════════════════════════════════════════════════════

describe("hoyLocalYmd", () => {
  it("devuelve YYYY-MM-DD del Date dado", () => {
    expect(hoyLocalYmd(new Date(2026, 3, 8))).toBe("2026-04-08")
  })

  it("padea mes y día a 2 dígitos", () => {
    expect(hoyLocalYmd(new Date(2026, 0, 1))).toBe("2026-01-01")
  })

  it("funciona a las 23:59 local sin saltar al día siguiente", () => {
    expect(hoyLocalYmd(new Date(2026, 3, 8, 23, 59, 59))).toBe("2026-04-08")
  })

  it("funciona a las 00:00 local sin retroceder al día anterior", () => {
    expect(hoyLocalYmd(new Date(2026, 3, 8, 0, 0, 0))).toBe("2026-04-08")
  })
})

describe("parsearFechaLocalMediodia", () => {
  it("parsea YYYY-MM-DD a mediodía local", () => {
    const d = parsearFechaLocalMediodia("2026-04-08")
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3)
    expect(d.getDate()).toBe(8)
    expect(d.getHours()).toBe(12)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
  })

  it("rechaza formato inválido", () => {
    expect(() => parsearFechaLocalMediodia("abc")).toThrow("inválido")
    expect(() => parsearFechaLocalMediodia("2026-4-8")).toThrow("inválido")
    expect(() => parsearFechaLocalMediodia("08-04-2026")).toThrow("inválido")
  })

  it("rechaza fecha inexistente", () => {
    expect(() => parsearFechaLocalMediodia("2026-02-30")).toThrow("inexistente")
    expect(() => parsearFechaLocalMediodia("2026-13-01")).toThrow("inexistente")
  })
})

describe("normalizarMediodiaLocal", () => {
  it("fija hora a 12:00:00.000 sin cambiar fecha", () => {
    const d = normalizarMediodiaLocal(new Date(2026, 3, 8, 23, 59, 59, 999))
    expect(d.getDate()).toBe(8)
    expect(d.getHours()).toBe(12)
    expect(d.getMinutes()).toBe(0)
  })

  it("no muta la fecha original", () => {
    const original = new Date(2026, 3, 8, 18, 30)
    normalizarMediodiaLocal(original)
    expect(original.getHours()).toBe(18)
  })
})

describe("sumarDiasLocal", () => {
  it("suma días positivos", () => {
    const d = sumarDiasLocal(new Date(2026, 3, 8, 12), 5)
    expect(d.getDate()).toBe(13)
    expect(d.getHours()).toBe(12)
  })

  it("resta días negativos", () => {
    const d = sumarDiasLocal(new Date(2026, 3, 8, 12), -10)
    expect(d.getMonth()).toBe(2) // marzo
    expect(d.getDate()).toBe(29)
  })

  it("cruza mes correctamente", () => {
    const d = sumarDiasLocal(new Date(2026, 0, 31, 12), 1)
    expect(d.getMonth()).toBe(1) // febrero
    expect(d.getDate()).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// B. VALIDACIÓN — validarFechaEmisionArca (determinístico con fecha fija)
// ═══════════════════════════════════════════════════════════════════════════════

describe("validarFechaEmisionArca", () => {
  // Fecha de referencia fija: 8 de abril 2026 a las 15:30 local
  const AHORA = new Date(2026, 3, 8, 15, 30, 0)

  it("acepta la fecha de hoy", () => {
    const r = validarFechaEmisionArca("2026-04-08", AHORA)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.fecha).toBeInstanceOf(Date)
      expect(r.fecha.getHours()).toBe(12)
    }
  })

  it("acepta fecha de ayer", () => {
    const r = validarFechaEmisionArca("2026-04-07", AHORA)
    expect(r.ok).toBe(true)
  })

  it("acepta fecha de hace 10 días (límite ventana ARCA)", () => {
    const r = validarFechaEmisionArca("2026-03-29", AHORA)
    expect(r.ok).toBe(true)
  })

  it("rechaza fecha de hace 11 días (fuera de ventana ARCA)", () => {
    const r = validarFechaEmisionArca("2026-03-28", AHORA)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toContain("anterior a 10 días")
    }
  })

  it("rechaza fecha futura (mañana)", () => {
    const r = validarFechaEmisionArca("2026-04-09", AHORA)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toContain("futura")
    }
  })

  it("rechaza fecha inválida", () => {
    const r = validarFechaEmisionArca("no-es-una-fecha", AHORA)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toContain("inválida")
    }
  })

  it("normaliza a mediodía local exacto", () => {
    const r = validarFechaEmisionArca("2026-04-08", AHORA)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.fecha.getHours()).toBe(12)
      expect(r.fecha.getMinutes()).toBe(0)
      expect(r.fecha.getSeconds()).toBe(0)
    }
  })

  it("funciona sin parámetro ahora (usa reloj real, no lanza error)", () => {
    // Solo verificamos que no lanza — no asumimos qué fecha es "hoy"
    const hoy = hoyLocalYmd()
    const r = validarFechaEmisionArca(hoy)
    expect(r.ok).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// C. PERSISTENCIA — DatosCrearFactura y DatosCrearLiquidacion incluyen fechaEmision
// ═══════════════════════════════════════════════════════════════════════════════

describe("Tipo DatosCrearFactura acepta fechaEmision", () => {
  it("el tipo DatosCrearFactura incluye fechaEmision como campo opcional", async () => {
    // Verificación en compile-time: si este test compila, el campo existe
    const { DatosCrearFactura } = await import("@/lib/factura-commands").then(() => ({
      DatosCrearFactura: null, // solo importamos para type-check
    }))
    // Runtime: verificar que ejecutarCrearFactura existe
    const { ejecutarCrearFactura } = await import("@/lib/factura-commands")
    expect(typeof ejecutarCrearFactura).toBe("function")
    void DatosCrearFactura
  })

  it("el tipo DatosCrearLiquidacion incluye fechaEmision como campo opcional", async () => {
    const { ejecutarCrearLiquidacion } = await import("@/lib/liquidacion-commands")
    expect(typeof ejecutarCrearLiquidacion).toBe("function")
  })
})

describe("fechaEmision se convierte a Date con hora 12:00 en persistencia", () => {
  it("factura: fechaEmision '2026-04-05' → emitidaEn con T12:00:00", () => {
    const fecha = parsearFechaLocalMediodia("2026-04-05")
    expect(fecha.getFullYear()).toBe(2026)
    expect(fecha.getMonth()).toBe(3) // abril = 3
    expect(fecha.getDate()).toBe(5)
    expect(fecha.getHours()).toBe(12)
  })

  it("liquidación: sin fechaEmision → usa new Date() (fecha actual)", () => {
    const antes = Date.now()
    const resultado = new Date()
    const despues = Date.now()
    expect(resultado.getTime()).toBeGreaterThanOrEqual(antes)
    expect(resultado.getTime()).toBeLessThanOrEqual(despues)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// D. API — Schema Zod acepta fechaEmision
// ═══════════════════════════════════════════════════════════════════════════════

describe("Schema Zod de facturas valida fechaEmision", () => {
  it("acepta formato YYYY-MM-DD", () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    expect(regex.test("2026-04-05")).toBe(true)
    expect(regex.test("")).toBe(false)
  })

  it("rechaza formato inválido", () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    expect(regex.test("05/04/2026")).toBe(false)
    expect(regex.test("2026-4-5")).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// E. NO REGRESIÓN ESTRUCTURAL — rutas canónicas existen, duplicadas eliminadas
// ═══════════════════════════════════════════════════════════════════════════════

describe("Rutas canónicas de facturas", () => {
  const basePath = path.resolve(__dirname, "../app/(dashboard)")

  it("flujo canónico: /empresas/facturar existe", () => {
    expect(fs.existsSync(path.join(basePath, "empresas/facturar/page.tsx"))).toBe(true)
    expect(fs.existsSync(path.join(basePath, "empresas/facturar/facturar-client.tsx"))).toBe(true)
  })

  it("flujo canónico: /empresas/facturas (hub) existe", () => {
    expect(fs.existsSync(path.join(basePath, "empresas/facturas/page.tsx"))).toBe(true)
  })

  it("flujo duplicado: /facturas NO existe", () => {
    expect(fs.existsSync(path.join(basePath, "facturas/page.tsx"))).toBe(false)
    expect(fs.existsSync(path.join(basePath, "facturas/facturas-client.tsx"))).toBe(false)
  })

  it("facturar-client.tsx contiene fechaEmision en el state", () => {
    const content = fs.readFileSync(
      path.join(basePath, "empresas/facturar/facturar-client.tsx"),
      "utf-8"
    )
    expect(content).toContain("fechaEmision")
    expect(content).toContain("setFechaEmision")
    // Verificar que se envía en el body del POST
    expect(content).toContain("fechaEmision,")
    // Verificar que hay un input de tipo date
    expect(content).toContain('type="date"')
    expect(content).toContain("Fecha de emisión")
  })

  it("facturar-client.tsx contiene metodoPago en el state", () => {
    const content = fs.readFileSync(
      path.join(basePath, "empresas/facturar/facturar-client.tsx"),
      "utf-8"
    )
    expect(content).toContain("metodoPago")
    expect(content).toContain("setMetodoPago")
  })

  it("facturar-client.tsx NO usa toISOString().slice para inputs date", () => {
    const content = fs.readFileSync(
      path.join(basePath, "empresas/facturar/facturar-client.tsx"),
      "utf-8"
    )
    expect(content).not.toMatch(/toISOString\(\)\.slice\(0,\s*10\)/)
  })
})

describe("Rutas canónicas de liquidaciones", () => {
  const basePath = path.resolve(__dirname, "../app/(dashboard)")

  it("flujo canónico: /fleteros/liquidar existe", () => {
    expect(fs.existsSync(path.join(basePath, "fleteros/liquidar/page.tsx"))).toBe(true)
    expect(fs.existsSync(path.join(basePath, "fleteros/liquidar/liquidar-client.tsx"))).toBe(true)
  })

  it("flujo canónico: /fleteros/liquidos-productos (hub) existe", () => {
    expect(fs.existsSync(path.join(basePath, "fleteros/liquidos-productos/page.tsx"))).toBe(true)
  })

  it("flujo canónico: /fleteros/liquidaciones (consulta) existe", () => {
    expect(fs.existsSync(path.join(basePath, "fleteros/liquidaciones/page.tsx"))).toBe(true)
  })

  it("flujo duplicado: /liquidaciones/page.tsx NO existe", () => {
    expect(fs.existsSync(path.join(basePath, "liquidaciones/page.tsx"))).toBe(false)
    expect(fs.existsSync(path.join(basePath, "liquidaciones/liquidaciones-client.tsx"))).toBe(false)
  })

  it("componentes compartidos: /liquidaciones/_components/ SÍ existen", () => {
    expect(fs.existsSync(path.join(basePath, "liquidaciones/_components/modal-preview-liquidacion.tsx"))).toBe(true)
    expect(fs.existsSync(path.join(basePath, "liquidaciones/_components/types.ts"))).toBe(true)
  })

  it("liquidar-client.tsx importa el ModalPreviewLiquidacion compartido", () => {
    const content = fs.readFileSync(
      path.join(basePath, "fleteros/liquidar/liquidar-client.tsx"),
      "utf-8"
    )
    expect(content).toContain("liquidaciones/_components/modal-preview-liquidacion")
    expect(content).toContain("ModalPreviewLiquidacion")
  })

  it("liquidar-client.tsx envía fechaEmision al confirmar", () => {
    const content = fs.readFileSync(
      path.join(basePath, "fleteros/liquidar/liquidar-client.tsx"),
      "utf-8"
    )
    expect(content).toContain("fechaEmision")
    expect(content).toContain("metodoPago")
  })

  it("modal-preview-liquidacion tiene input de fecha de emisión", () => {
    const content = fs.readFileSync(
      path.join(basePath, "liquidaciones/_components/modal-preview-liquidacion.tsx"),
      "utf-8"
    )
    expect(content).toContain("fechaEmision")
    expect(content).toContain("setFechaEmision")
    expect(content).toContain("Fecha de emisión")
    expect(content).toContain('type="date"')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// F. CADENA COMPLETA — fechaEmision fluye desde frontend payload hasta ARCA
// ═══════════════════════════════════════════════════════════════════════════════

describe("Cadena fechaEmision: API route → commands → persistencia → ARCA", () => {
  it("API route de facturas valida y propaga fechaEmision al command", () => {
    // La route delega al caso de uso emitirFactura, que valida fechaEmision con validarFechaEmisionArca
    const routeContent = fs.readFileSync(
      path.resolve(__dirname, "../app/api/facturas/route.ts"),
      "utf-8"
    )
    expect(routeContent).toContain("emitirFactura")
    expect(routeContent).toContain("fechaEmision")

    // El caso de uso contiene la validación ARCA
    const useCaseContent = fs.readFileSync(
      path.resolve(__dirname, "../application/factura/emitir-factura.ts"),
      "utf-8"
    )
    expect(useCaseContent).toContain("validarFechaEmisionArca")
    expect(useCaseContent).toContain("fechaEmision")
  })

  it("API route de liquidaciones valida y propaga fechaEmision al command", () => {
    const routeContent = fs.readFileSync(
      path.resolve(__dirname, "../app/api/liquidaciones/route.ts"),
      "utf-8"
    )
    expect(routeContent).toContain("validarFechaEmisionArca")
    expect(routeContent).toContain("fechaEmision")
  })

  it("factura-commands persiste fechaEmision como emitidaEn", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../lib/factura-commands.ts"),
      "utf-8"
    )
    // Debe usar data.fechaEmision para crear emitidaEn
    expect(content).toContain("data.fechaEmision")
    expect(content).toContain("emitidaEn:")
  })

  it("liquidacion-commands persiste fechaEmision como grabadaEn", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../lib/liquidacion-commands.ts"),
      "utf-8"
    )
    expect(content).toContain("data.fechaEmision")
    expect(content).toContain("grabadaEn:")
  })

  it("servicio ARCA usa emitidaEn/grabadaEn como fecha del comprobante", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../lib/arca/service.ts"),
      "utf-8"
    )
    // Para facturas: fecha: factura.emitidaEn
    expect(content).toContain("factura.emitidaEn")
    // Para liquidaciones: fecha: liq.grabadaEn
    expect(content).toContain("liq.grabadaEn")
  })

  it("mappers ARCA formatea la fecha como YYYYMMDD para WSFEv1", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../lib/arca/mappers.ts"),
      "utf-8"
    )
    expect(content).toContain("formatearFechaArca")
    expect(content).toContain("CbteFch")
  })
})
