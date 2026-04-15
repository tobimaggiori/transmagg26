/**
 * Propósito: Tests para el módulo de emisión directa ARCA.
 *
 * Semántica transaccional:
 * - ARCA OK → documento EMITIDA + PDF + viajes actualizados
 * - ARCA FAIL → sin documento, sin efectos, viajes intactos
 */

const mockEjecutarCrearFactura = jest.fn()
const mockEjecutarCrearLiquidacion = jest.fn()
const mockEjecutarCrearNotaCD = jest.fn()
const mockCrearNotaEmpresaEmitida = jest.fn()
const mockAutorizarFacturaArca = jest.fn()
const mockAutorizarLiquidacionArca = jest.fn()
const mockAutorizarNotaCDArca = jest.fn()

const mockTx = {
  viajeEnFactura: { findMany: jest.fn() },
  viajeEnLiquidacion: { findMany: jest.fn() },
  asientoIibb: { deleteMany: jest.fn() },
  asientoIva: { deleteMany: jest.fn() },
  facturaEmitida: { delete: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  liquidacion: { delete: jest.fn(), findUnique: jest.fn() },
  notaCreditoDebito: { delete: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  viaje: { updateMany: jest.fn() },
}
const mockPrisma = {
  ...mockTx,
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}

jest.mock("@/lib/factura-commands", () => ({
  ejecutarCrearFactura: mockEjecutarCrearFactura,
}))
jest.mock("@/lib/liquidacion-commands", () => ({
  ejecutarCrearLiquidacion: mockEjecutarCrearLiquidacion,
}))
jest.mock("@/lib/nota-cd-commands", () => ({
  ejecutarCrearNotaCD: mockEjecutarCrearNotaCD,
  crearNotaEmpresaEmitida: mockCrearNotaEmpresaEmitida,
}))
jest.mock("@/lib/arca/service", () => ({
  autorizarFacturaArca: mockAutorizarFacturaArca,
  autorizarLiquidacionArca: mockAutorizarLiquidacionArca,
  autorizarNotaCDArca: mockAutorizarNotaCDArca,
}))
jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import {
  emitirFacturaDirecta,
  emitirLiquidacionDirecta,
  emitirNotaCDDirecta,
  emitirNotaEmpresaDirecta,
} from "@/lib/emision-directa"
import { ArcaRechazoError, WsaaError } from "@/lib/arca/errors"

beforeEach(() => {
  jest.clearAllMocks()
  mockTx.viajeEnFactura.findMany.mockResolvedValue([])
  mockTx.viajeEnLiquidacion.findMany.mockResolvedValue([])
  mockTx.asientoIibb.deleteMany.mockResolvedValue({ count: 0 })
  mockTx.asientoIva.deleteMany.mockResolvedValue({ count: 0 })
  mockTx.facturaEmitida.delete.mockResolvedValue({})
  mockTx.facturaEmitida.update.mockResolvedValue({ id: "fact-1", estado: "EMITIDA" })
  mockTx.facturaEmitida.findUnique.mockResolvedValue({ id: "fact-1", estado: "EMITIDA" })
  mockTx.liquidacion.delete.mockResolvedValue({})
  mockTx.liquidacion.findUnique.mockResolvedValue({ id: "liq-1" })
  mockTx.notaCreditoDebito.delete.mockResolvedValue({})
  mockTx.notaCreditoDebito.update.mockResolvedValue({ id: "nota-1", estado: "EMITIDA" })
  mockTx.notaCreditoDebito.findUnique.mockResolvedValue({ id: "nota-1", estado: "EMITIDA" })
  mockTx.viaje.updateMany.mockResolvedValue({ count: 1 })
})

const ARCA_RESULT = {
  ok: true,
  cae: "74120000000001",
  caeVto: new Date("2026-02-15"),
  nroComprobante: 42,
  ptoVenta: 1,
  tipoCbte: 1,
  qrData: "https://qr.example.com",
}

// ═══════════════════════════════════════════════════════════════════════════════
// Factura
// ═══════════════════════════════════════════════════════════════════════════════

describe("emitirFacturaDirecta", () => {
  const data = { empresaId: "e1", viajeIds: ["v1", "v2"], tipoCbte: 1, ivaPct: 21 }

  it("ARCA OK → documento EMITIDA + arca result", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockResolvedValue(ARCA_RESULT)

    const r = await emitirFacturaDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.arca.cae).toBe("74120000000001")
    // Creación ya pone EMITIDA, no necesita update adicional
  })

  it("ARCA FAIL → ok=false, sin documento, con mensaje claro", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockRejectedValue(new ArcaRechazoError("10016: CUIT inválido"))

    const r = await emitirFacturaDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.status).toBe(422)
    expect(r.code).toBe("ARCA_RECHAZO")
    expect(r.error).toContain("CUIT inválido")
    expect(r.reintentable).toBe(false)
  })

  it("ARCA FAIL permanente → revierte factura y viajes", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockRejectedValue(new ArcaRechazoError("Datos inválidos"))

    await emitirFacturaDirecta(data, "op1", "key-1")

    // Debe haber ejecutado compensación
    expect(mockPrisma.$transaction).toHaveBeenCalled()
    // Viajes revertidos a PENDIENTE_FACTURAR
    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1", "v2"] } },
      data: { estadoFactura: "PENDIENTE_FACTURAR" },
    })
    // Factura eliminada
    expect(mockTx.facturaEmitida.delete).toHaveBeenCalledWith({ where: { id: "fact-1" } })
  })

  it("ARCA FAIL transitorio → conserva factura, retorna reintentable", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockRejectedValue(new WsaaError("ECONNREFUSED"))

    const r = await emitirFacturaDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reintentable).toBe(true)
    expect(r.documentoId).toBe("fact-1")
    // NO debe haber ejecutado compensación
    expect(mockTx.facturaEmitida.delete).not.toHaveBeenCalled()
  })

  it("creación falla → error sin intentar ARCA ni compensar", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: false, status: 404, error: "Empresa no encontrada" })

    const r = await emitirFacturaDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.status).toBe(404)
    expect(mockAutorizarFacturaArca).not.toHaveBeenCalled()
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Liquidación
// ═══════════════════════════════════════════════════════════════════════════════

describe("emitirLiquidacionDirecta", () => {
  const data = {
    fleteroId: "f1",
    comisionPct: 5,
    ivaPct: 21,
    viajes: [
      { viajeId: "v1", fechaViaje: "2026-01-01", kilos: 30000, tarifaFletero: 40 },
      { viajeId: "v2", fechaViaje: "2026-01-02", kilos: 25000, tarifaFletero: 35 },
    ],
  }

  it("ARCA OK → documento con CAE + arca result", async () => {
    mockEjecutarCrearLiquidacion.mockResolvedValue({ ok: true, liquidacion: { id: "liq-1" } })
    mockAutorizarLiquidacionArca.mockResolvedValue(ARCA_RESULT)

    const r = await emitirLiquidacionDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.arca.cae).toBe("74120000000001")
  })

  it("ARCA FAIL permanente → sin efectos, viajes revertidos", async () => {
    mockEjecutarCrearLiquidacion.mockResolvedValue({ ok: true, liquidacion: { id: "liq-1" } })
    mockAutorizarLiquidacionArca.mockRejectedValue(new ArcaRechazoError("Datos inválidos"))

    const r = await emitirLiquidacionDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toContain("rechazado por ARCA")
    expect(r.code).toBe("ARCA_RECHAZO")
    // Compensación ejecutada
    expect(mockTx.liquidacion.delete).toHaveBeenCalledWith({ where: { id: "liq-1" } })
    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1", "v2"] } },
      data: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
    })
  })

  it("ARCA FAIL transitorio → conserva liquidación, retorna reintentable", async () => {
    mockEjecutarCrearLiquidacion.mockResolvedValue({ ok: true, liquidacion: { id: "liq-1" } })
    mockAutorizarLiquidacionArca.mockRejectedValue(new WsaaError("ECONNREFUSED"))

    const r = await emitirLiquidacionDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reintentable).toBe(true)
    expect(r.documentoId).toBe("liq-1")
    expect(mockTx.liquidacion.delete).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// NC/ND emitidas
// ═══════════════════════════════════════════════════════════════════════════════

describe("emitirNotaCDDirecta — NC_EMITIDA", () => {
  const ncTotal = {
    tipo: "NC_EMITIDA",
    subtipo: "ANULACION_TOTAL",
    facturaId: "fact-1",
    montoNeto: 1000,
    ivaPct: 21,
    descripcion: "Anulación total",
  }

  it("ARCA OK → nota emitida con CAE", async () => {
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-1" } })
    mockAutorizarNotaCDArca.mockResolvedValue(ARCA_RESULT)

    const r = await emitirNotaCDDirecta(ncTotal, "op1", "key-1")

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.arca.cae).toBe("74120000000001")
  })

  it("ARCA FAIL → nota eliminada, viajes revertidos a FACTURADO", async () => {
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-1" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new ArcaRechazoError("Error ARCA"))
    // La compensación busca viajes de la factura
    mockTx.viajeEnFactura.findMany.mockResolvedValue([{ viajeId: "v1" }, { viajeId: "v2" }])

    const r = await emitirNotaCDDirecta(ncTotal, "op1", "key-1")

    expect(r.ok).toBe(false)
    // Nota eliminada
    expect(mockTx.notaCreditoDebito.delete).toHaveBeenCalledWith({ where: { id: "nota-1" } })
    // Viajes revertidos a FACTURADO (estaban PENDIENTE_FACTURAR tras NC total)
    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1", "v2"] } },
      data: { estadoFactura: "FACTURADO" },
    })
  })
})

describe("emitirNotaCDDirecta — NC parcial ARCA FAIL", () => {
  it("revierte viajes a FACTURADO (estaban en PENDIENTE tras NC parcial)", async () => {
    const ncParcial = {
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_PARCIAL",
      facturaId: "fact-1",
      montoNeto: 500,
      ivaPct: 21,
      descripcion: "Ajuste parcial",
      viajesIds: ["v1"],
    }
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-2" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new ArcaRechazoError("Error"))

    await emitirNotaCDDirecta(ncParcial, "op1", "key-1")

    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1"] } },
      data: { estadoFactura: "FACTURADO" },
    })
  })
})

describe("emitirNotaCDDirecta — ND_EMITIDA ARCA FAIL", () => {
  it("nota eliminada, sin revertir viajes (ND no toca viajes)", async () => {
    const nd = {
      tipo: "ND_EMITIDA",
      subtipo: "DIFERENCIA_TARIFA",
      facturaId: "fact-1",
      montoNeto: 200,
      ivaPct: 21,
      descripcion: "Diferencia",
    }
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-3" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new ArcaRechazoError("Error"))

    await emitirNotaCDDirecta(nd, "op1", "key-1")

    expect(mockTx.notaCreditoDebito.delete).toHaveBeenCalledWith({ where: { id: "nota-3" } })
    // No debe tocar viajes
    expect(mockTx.viaje.updateMany).not.toHaveBeenCalled()
  })
})

describe("emitirNotaCDDirecta — NC_RECIBIDA no va a ARCA", () => {
  it("crea sin intentar ARCA", async () => {
    const ncRecibida = {
      tipo: "NC_RECIBIDA",
      subtipo: "CORRECCION_ADMINISTRATIVA",
      montoNeto: 1000,
      ivaPct: 21,
      descripcion: "Corrección administrativa",
      nroComprobanteExterno: "001",
      fechaComprobanteExterno: "2026-01-15",
    }
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-4" } })

    const r = await emitirNotaCDDirecta(ncRecibida, "op1", "key-1")

    expect(r.ok).toBe(true)
    expect(mockAutorizarNotaCDArca).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Invariantes
// ═══════════════════════════════════════════════════════════════════════════════

describe("invariantes de emisión directa", () => {
  it("idempotencyKey se pasa correctamente a ARCA", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "f1" } })
    mockAutorizarFacturaArca.mockResolvedValue(ARCA_RESULT)

    await emitirFacturaDirecta(
      { empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21 },
      "op1",
      "uuid-idempotent-123"
    )

    expect(mockAutorizarFacturaArca).toHaveBeenCalledWith("f1", "uuid-idempotent-123")
  })

  it("Error genérico (no ARCA) → revierte comprobante, no reintentable", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "f1" } })
    mockAutorizarFacturaArca.mockRejectedValue(new Error("DB connection lost"))

    const r = await emitirFacturaDirecta(
      { empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21 },
      "op1",
      "key-1"
    )

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reintentable).toBe(false)
    expect(r.code).toBe("ERROR_INTERNO")
    expect(r.error).toContain("DB connection lost")
  })
})

// ══════════════════════════════════��════════════════════════════════════════════
// Rollback / compensación completa
// ═══════════════════════════════════════════════════════════════════════════════

describe("rollback ARCA FAIL — limpieza completa de efectos", () => {
  it("factura: borra asientos IIBB antes de borrar ViajeEnFactura", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockRejectedValue(new ArcaRechazoError("ARCA error"))
    mockTx.viajeEnFactura.findMany.mockResolvedValue([{ id: "vef-1" }, { id: "vef-2" }])

    await emitirFacturaDirecta(
      { empresaId: "e1", viajeIds: ["v1", "v2"], tipoCbte: 1, ivaPct: 21 },
      "op1", "key-1"
    )

    // IIBB borrados usando IDs de ViajeEnFactura
    expect(mockTx.asientoIibb.deleteMany).toHaveBeenCalledWith({
      where: { viajeEnFactId: { in: ["vef-1", "vef-2"] } },
    })
    // IVA borrado
    expect(mockTx.asientoIva.deleteMany).toHaveBeenCalledWith({
      where: { facturaEmitidaId: "fact-1" },
    })
    // Factura borrada (cascade → ViajeEnFactura)
    expect(mockTx.facturaEmitida.delete).toHaveBeenCalledWith({
      where: { id: "fact-1" },
    })
    // Viajes revertidos
    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1", "v2"] } },
      data: { estadoFactura: "PENDIENTE_FACTURAR" },
    })
  })

  it("liquidación: borra asientos IIBB y IVA antes de borrar LP", async () => {
    mockEjecutarCrearLiquidacion.mockResolvedValue({ ok: true, liquidacion: { id: "liq-1" } })
    mockAutorizarLiquidacionArca.mockRejectedValue(new ArcaRechazoError("ARCA error"))
    mockTx.viajeEnLiquidacion.findMany.mockResolvedValue([{ id: "vel-1" }])

    await emitirLiquidacionDirecta(
      { fleteroId: "f1", comisionPct: 5, ivaPct: 21, viajes: [{ viajeId: "v1", fechaViaje: "2026-01-01", kilos: 30000, tarifaFletero: 40 }] },
      "op1", "key-1"
    )

    expect(mockTx.asientoIibb.deleteMany).toHaveBeenCalledWith({
      where: { viajeEnLiqId: { in: ["vel-1"] } },
    })
    expect(mockTx.asientoIva.deleteMany).toHaveBeenCalledWith({
      where: { liquidacionId: "liq-1" },
    })
    expect(mockTx.liquidacion.delete).toHaveBeenCalledWith({
      where: { id: "liq-1" },
    })
    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1"] } },
      data: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
    })
  })

  it("NC total: borra nota y revierte viajes a FACTURADO", async () => {
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-1" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new ArcaRechazoError("ARCA error"))
    mockTx.viajeEnFactura.findMany.mockResolvedValue([{ viajeId: "v1" }, { viajeId: "v2" }])

    await emitirNotaCDDirecta({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1", montoNeto: 1000, ivaPct: 21, descripcion: "test",
    }, "op1", "key-1")

    expect(mockTx.notaCreditoDebito.delete).toHaveBeenCalledWith({ where: { id: "nota-1" } })
    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1", "v2"] } },
      data: { estadoFactura: "FACTURADO" },
    })
  })

  it("NC total sobre LP: borra nota y revierte viajes a LIQUIDADO", async () => {
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-lp" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new ArcaRechazoError("ARCA error"))
    mockTx.viajeEnLiquidacion.findMany.mockResolvedValue([{ viajeId: "v1" }, { viajeId: "v2" }])

    await emitirNotaCDDirecta({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL",
      liquidacionId: "liq-1", montoNeto: 1000, ivaPct: 21, descripcion: "test",
    }, "op1", "key-1")

    expect(mockTx.notaCreditoDebito.delete).toHaveBeenCalledWith({ where: { id: "nota-lp" } })
    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1", "v2"] } },
      data: { estadoLiquidacion: "LIQUIDADO" },
    })
  })

  it("NC parcial sobre LP: revierte viajes seleccionados a LIQUIDADO", async () => {
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-lp2" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new ArcaRechazoError("ARCA error"))

    await emitirNotaCDDirecta({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_PARCIAL",
      liquidacionId: "liq-1", montoNeto: 500, ivaPct: 21, descripcion: "test",
      viajesIds: ["v1"],
    }, "op1", "key-1")

    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1"] } },
      data: { estadoLiquidacion: "LIQUIDADO" },
    })
  })

  it("ND emitida: borra nota sin tocar viajes", async () => {
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-2" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new ArcaRechazoError("ARCA error"))

    await emitirNotaCDDirecta({
      tipo: "ND_EMITIDA", subtipo: "DIFERENCIA_TARIFA",
      facturaId: "fact-1", montoNeto: 200, ivaPct: 21, descripcion: "test",
    }, "op1", "key-1")

    expect(mockTx.notaCreditoDebito.delete).toHaveBeenCalledWith({ where: { id: "nota-2" } })
    expect(mockTx.viaje.updateMany).not.toHaveBeenCalled()
  })

  it("compensación ejecuta todo dentro de una transacción", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockRejectedValue(new ArcaRechazoError("error"))

    await emitirFacturaDirecta(
      { empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21 },
      "op1", "key-1"
    )

    // La compensación usa $transaction
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Post-CAE read failures
// ═══════════════════════════════════════════════════════════════════════════════

describe("post-CAE read failures", () => {
  it("factura: ARCA OK pero falla relectura → POST_CAE_READ_ERROR con documentoId", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockResolvedValue(ARCA_RESULT)
    // Re-lectura falla
    mockTx.facturaEmitida.findUnique.mockRejectedValueOnce(new Error("DB connection lost"))

    const r = await emitirFacturaDirecta(
      { empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21 },
      "op1", "key-1"
    )

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.status).toBe(500)
    expect(r.code).toBe("POST_CAE_READ_ERROR")
    expect(r.documentoId).toBe("fact-1")
    expect(r.error).toContain("autorizado por ARCA")
    expect(r.error).toContain(ARCA_RESULT.cae)
    // NO debe haber revertido (CAE ya otorgado)
    expect(mockTx.facturaEmitida.delete).not.toHaveBeenCalled()
  })

  it("liquidación: ARCA OK pero falla relectura → POST_CAE_READ_ERROR con documentoId", async () => {
    mockEjecutarCrearLiquidacion.mockResolvedValue({ ok: true, liquidacion: { id: "liq-1" } })
    mockAutorizarLiquidacionArca.mockResolvedValue(ARCA_RESULT)
    mockTx.liquidacion.findUnique.mockRejectedValueOnce(new Error("DB timeout"))

    const r = await emitirLiquidacionDirecta(
      { fleteroId: "f1", comisionPct: 5, ivaPct: 21, viajes: [{ viajeId: "v1", fechaViaje: "2026-01-01", kilos: 30000, tarifaFletero: 40 }] },
      "op1", "key-1"
    )

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.status).toBe(500)
    expect(r.code).toBe("POST_CAE_READ_ERROR")
    expect(r.documentoId).toBe("liq-1")
    expect(r.error).toContain(ARCA_RESULT.cae)
    expect(mockTx.liquidacion.delete).not.toHaveBeenCalled()
  })

  it("nota emitida: ARCA OK pero falla relectura → POST_CAE_READ_ERROR", async () => {
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-1" } })
    mockAutorizarNotaCDArca.mockResolvedValue(ARCA_RESULT)
    mockTx.notaCreditoDebito.findUnique.mockRejectedValueOnce(new Error("DB error"))

    const r = await emitirNotaCDDirecta({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1", montoNeto: 1000, ivaPct: 21, descripcion: "test",
    }, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe("POST_CAE_READ_ERROR")
    expect(r.documentoId).toBe("nota-1")
    expect(r.error).toContain(ARCA_RESULT.cae)
    expect(mockTx.notaCreditoDebito.delete).not.toHaveBeenCalled()
  })

  it("nota empresa: ARCA OK pero falla relectura → POST_CAE_READ_ERROR", async () => {
    mockCrearNotaEmpresaEmitida.mockResolvedValue({ ok: true, nota: { id: "nota-emp-1" } })
    mockAutorizarNotaCDArca.mockResolvedValue(ARCA_RESULT)
    mockTx.notaCreditoDebito.findUnique.mockRejectedValueOnce(new Error("DB error"))

    const r = await emitirNotaEmpresaDirecta({
      facturaId: "f-1", tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }],
    }, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe("POST_CAE_READ_ERROR")
    expect(r.documentoId).toBe("nota-emp-1")
    expect(r.error).toContain(ARCA_RESULT.cae)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Post-CAE success: documento re-leído
// ═══════════════════════════════════════════════════════════════════════════════

describe("success post-CAE devuelve documento re-leído", () => {
  const NOTA_RELEIDA = {
    id: "nota-1",
    estado: "EMITIDA",
    cae: "74120000000001",
    arcaEstado: "AUTORIZADA",
    qrData: "https://qr.example.com",
  }

  it("factura: documento es el re-leído (no el original del command)", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockResolvedValue(ARCA_RESULT)
    const FACTURA_RELEIDA = { id: "fact-1", estado: "EMITIDA", cae: "74120000000001", nroComprobante: "42" }
    mockTx.facturaEmitida.findUnique.mockResolvedValueOnce(FACTURA_RELEIDA)

    const r = await emitirFacturaDirecta(
      { empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21 },
      "op1", "key-1"
    )

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.documento).toBe(FACTURA_RELEIDA)
    expect((r.documento as { cae: string }).cae).toBe("74120000000001")
  })

  it("liquidación: documento es el re-leído", async () => {
    mockEjecutarCrearLiquidacion.mockResolvedValue({ ok: true, liquidacion: { id: "liq-1" } })
    mockAutorizarLiquidacionArca.mockResolvedValue(ARCA_RESULT)
    const LIQ_RELEIDA = { id: "liq-1", cae: "74120000000001", arcaEstado: "AUTORIZADA" }
    mockTx.liquidacion.findUnique.mockResolvedValueOnce(LIQ_RELEIDA)

    const r = await emitirLiquidacionDirecta(
      { fleteroId: "f1", comisionPct: 5, ivaPct: 21, viajes: [{ viajeId: "v1", fechaViaje: "2026-01-01", kilos: 30000, tarifaFletero: 40 }] },
      "op1", "key-1"
    )

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.documento).toBe(LIQ_RELEIDA)
  })

  it("nota emitida: documento es el re-leído (no el { id } original)", async () => {
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-1" } })
    mockAutorizarNotaCDArca.mockResolvedValue(ARCA_RESULT)
    mockTx.notaCreditoDebito.findUnique.mockResolvedValueOnce(NOTA_RELEIDA)

    const r = await emitirNotaCDDirecta({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1", montoNeto: 1000, ivaPct: 21, descripcion: "test",
    }, "op1", "key-1")

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.documento).toBe(NOTA_RELEIDA)
    // Debe tener campos post-ARCA, no solo { id }
    expect((r.documento as { cae: string }).cae).toBe("74120000000001")
  })

  it("nota empresa: documento es el re-leído", async () => {
    mockCrearNotaEmpresaEmitida.mockResolvedValue({ ok: true, nota: { id: "nota-emp-1" } })
    mockAutorizarNotaCDArca.mockResolvedValue(ARCA_RESULT)
    const NOTA_EMP_RELEIDA = { ...NOTA_RELEIDA, id: "nota-emp-1" }
    mockTx.notaCreditoDebito.findUnique.mockResolvedValueOnce(NOTA_EMP_RELEIDA)

    const r = await emitirNotaEmpresaDirecta({
      facturaId: "f-1", tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }],
    }, "op1", "key-1")

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.documento).toBe(NOTA_EMP_RELEIDA)
    expect((r.documento as { cae: string }).cae).toBe("74120000000001")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Nota empresa: flujos adicionales
// ═══════════════════════════════════════════════════════════════════════════════

describe("emitirNotaEmpresaDirecta", () => {
  it("creación falla → error sin intentar ARCA", async () => {
    mockCrearNotaEmpresaEmitida.mockResolvedValue({ ok: false, status: 422, error: "saldo insuficiente" })

    const r = await emitirNotaEmpresaDirecta({
      facturaId: "f-1", tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }],
    }, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe("ERROR_CREAR_COMPROBANTE")
    expect(mockAutorizarNotaCDArca).not.toHaveBeenCalled()
  })

  it("ARCA FAIL permanente → revierte nota", async () => {
    mockCrearNotaEmpresaEmitida.mockResolvedValue({ ok: true, nota: { id: "nota-emp-1" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new ArcaRechazoError("Error ARCA"))

    const r = await emitirNotaEmpresaDirecta({
      facturaId: "f-1", tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }],
    }, "op1", "key-1")

    expect(r.ok).toBe(false)
    // Nota debe haberse borrado
    expect(mockPrisma.notaCreditoDebito.delete).toHaveBeenCalledWith({ where: { id: "nota-emp-1" } })
  })

  it("ARCA FAIL transitorio → conserva nota para reintento", async () => {
    mockCrearNotaEmpresaEmitida.mockResolvedValue({ ok: true, nota: { id: "nota-emp-1" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new WsaaError("ECONNREFUSED"))

    const r = await emitirNotaEmpresaDirecta({
      facturaId: "f-1", tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }],
    }, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reintentable).toBe(true)
    expect(r.documentoId).toBe("nota-emp-1")
    expect(mockPrisma.notaCreditoDebito.delete).not.toHaveBeenCalled()
  })

  it("CAE ya persistido pero error posterior → POST_CAE_PDF_ERROR sin revertir", async () => {
    mockCrearNotaEmpresaEmitida.mockResolvedValue({ ok: true, nota: { id: "nota-emp-1" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new Error("PDF generation failed"))
    // Simular que el CAE ya se persistió
    mockTx.notaCreditoDebito.findUnique.mockResolvedValueOnce({
      cae: "74120000000001",
      arcaEstado: "AUTORIZADA",
    })

    const r = await emitirNotaEmpresaDirecta({
      facturaId: "f-1", tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }],
    }, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe("POST_CAE_PDF_ERROR")
    expect(r.documentoId).toBe("nota-emp-1")
    expect(r.error).toContain("74120000000001")
    expect(mockPrisma.notaCreditoDebito.delete).not.toHaveBeenCalled()
  })
})
