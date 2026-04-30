/**
 * Propósito: Tests de dominio para nota-cd-commands.ts.
 * Verifica que NC/ND preservan historial documental, que NC total
 * libera viajes pero no anula factura, que NC parcial deja viajes
 * a PENDIENTE, y que NC recibida no anula liquidación.
 */

const mockTx = {
  facturaEmitida: { findUnique: jest.fn(), update: jest.fn() },
  facturaProveedor: { findUnique: jest.fn() },
  liquidacion: { findUnique: jest.fn(), update: jest.fn() },
  chequeRecibido: { findUnique: jest.fn(), update: jest.fn() },
  notaCreditoDebito: { create: jest.fn(), findFirst: jest.fn() },
  notaCreditoDebitoItem: { create: jest.fn() },
  viajeEnNotaCD: { create: jest.fn() },
  viaje: { update: jest.fn(), updateMany: jest.fn() },
  asientoIva: { create: jest.fn() },
}
const mockPrisma = {
  ...mockTx,
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
// nota-cd-utils NO se mockea: calcularTotalesNotaCD, calcularTotalesNotaLP y
// tipoCbteArcaParaNotaCD son funciones puras que deben ejecutarse reales.
jest.mock("@/lib/arca/leer-config-habilitados", () => ({
  leerComprobantesHabilitados: jest.fn().mockResolvedValue([1, 2, 3, 6, 7, 8, 60, 61, 201, 202, 203]),
}))

import { ejecutarCrearNotaCD } from "@/lib/nota-cd-commands"
import { leerComprobantesHabilitados } from "@/lib/arca/leer-config-habilitados"

const mockLeerHabilitados = leerComprobantesHabilitados as jest.MockedFunction<typeof leerComprobantesHabilitados>

beforeEach(() => {
  jest.clearAllMocks()
  mockTx.notaCreditoDebito.create.mockResolvedValue({ id: "nota-1" })
  mockTx.notaCreditoDebito.findFirst.mockResolvedValue(null) // no hay notas previas → nro = 1
  mockTx.viajeEnNotaCD.create.mockResolvedValue({})
  mockTx.viaje.update.mockResolvedValue({})
  mockTx.viaje.updateMany.mockResolvedValue({ count: 1 })
  mockTx.asientoIva.create.mockResolvedValue({ id: "aiva-1" })
})

const FACTURA_MOCK = {
  id: "fact-1",
  tipoCbte: 1, // Factura A (RI) — tipoCbteArcaParaNotaCD("NC_EMITIDA", 1) → 3, ("ND_EMITIDA", 1) → 2
  estado: "EMITIDA",
  empresa: { condicionIva: "RESPONSABLE_INSCRIPTO" },
  viajes: [
    { viajeId: "v1", tarifaEmpresa: 50, kilos: 30000, subtotal: 1500, viaje: { id: "v1" } },
    { viajeId: "v2", tarifaEmpresa: 40, kilos: 25000, subtotal: 1000, viaje: { id: "v2" } },
  ],
  notasCreditoDebito: [],
}

// ─── NC_EMITIDA / ANULACION_TOTAL ───────────────────────────────────────────

describe("NC_EMITIDA / ANULACION_TOTAL", () => {
  // ANULACION_TOTAL libera automáticamente TODOS los viajes del comprobante origen.
  // No depende de viajesIds — los obtiene de la relación viajes del comprobante.

  it("libera TODOS los viajes del comprobante automáticamente (sin viajesIds)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total",
      // viajesIds NO enviado — debe liberar todos igualmente
    }, "op1")

    expect(r.ok).toBe(true)

    // Ambos viajes deben pasar a PENDIENTE_FACTURAR
    expect(mockTx.viaje.update).toHaveBeenCalledTimes(2)
    expect(mockTx.viaje.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v1" },
        data: { estadoFactura: "PENDIENTE_FACTURAR" },
      })
    )
    expect(mockTx.viaje.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v2" },
        data: { estadoFactura: "PENDIENTE_FACTURAR" },
      })
    )
  })

  it("NO pone la factura en ANULADA (preserva historial)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total",
    }, "op1")

    expect(mockPrisma.facturaEmitida.update).not.toHaveBeenCalled()
  })

  it("crea snapshots ViajeEnNotaCD para TODOS los viajes del comprobante", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total",
    }, "op1")

    // 2 viajes en FACTURA_MOCK → 2 snapshots
    expect(mockPrisma.viajeEnNotaCD.create).toHaveBeenCalledTimes(2)
  })

  it("ignora viajesIds parciales — siempre libera todos", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total con viajesIds parcial",
      viajesIds: ["v1"], // solo v1, pero ANULACION_TOTAL debe liberar ambos
    }, "op1")

    expect(r.ok).toBe(true)
    // Ambos viajes liberados, no solo v1
    expect(mockTx.viaje.update).toHaveBeenCalledTimes(2)
    expect(mockTx.viajeEnNotaCD.create).toHaveBeenCalledTimes(2)
  })
})

// ─── NC_EMITIDA / ANULACION_PARCIAL ─────────────────────────────────────────

describe("NC_EMITIDA / ANULACION_PARCIAL", () => {
  it("pone viajes seleccionados en PENDIENTE_FACTURAR (revertidos totalmente)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_PARCIAL",
      facturaId: "fact-1",
      montoNeto: 1500,
      ivaPct: 21,
      descripcion: "Anulación parcial v1",
      viajesIds: ["v1"],
    }, "op1")

    expect(r.ok).toBe(true)

    // v1 queda totalmente revertido → PENDIENTE_FACTURAR
    expect(mockTx.viaje.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v1" },
        data: { estadoFactura: "PENDIENTE_FACTURAR" },
      })
    )

    // v2 NO debe haber sido tocado
    expect(mockTx.viaje.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "v2" } })
    )
  })

  it("solo crea snapshots para viajes seleccionados", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_PARCIAL",
      facturaId: "fact-1",
      montoNeto: 1500,
      ivaPct: 21,
      descripcion: "Ajuste parcial v1",
      viajesIds: ["v1"],
    }, "op1")

    expect(mockPrisma.viajeEnNotaCD.create).toHaveBeenCalledTimes(1)
  })
})

// ─── NC_EMITIDA sobre factura — totales con IVA real ────────────────────────

describe("NC_EMITIDA sobre factura — totales reales (calcularTotalesNotaCD)", () => {
  it("nota y asiento IVA usan totales calculados por money.ts", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "CORRECCION_IMPORTE",
      facturaId: "fact-1",
      montoNeto: 1000,
      ivaPct: 21,
      descripcion: "Corrección",
    }, "op1")

    // Nota creada con totales de calcularTotalesNotaCD(1000, 21)
    const notaData = mockTx.notaCreditoDebito.create.mock.calls[0][0].data
    expect(notaData.montoNeto).toBe(1000)
    expect(notaData.montoIva).toBe(210)
    expect(notaData.montoTotal).toBe(1210)

    // Asiento IVA Ventas negativo (NC reduce ventas)
    expect(mockTx.asientoIva.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "VENTA",
          tipoReferencia: "NC_EMITIDA",
          baseImponible: -1000,
          montoIva: -210,
        }),
      })
    )
  })
})

// ─── NC_EMITIDA / CORRECCION_IMPORTE ────────────────────────────────────────

describe("NC_EMITIDA / CORRECCION_IMPORTE", () => {
  it("no modifica estado de viajes", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "CORRECCION_IMPORTE",
      facturaId: "fact-1",
      montoNeto: 200,
      ivaPct: 21,
      descripcion: "Corrección menor",
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.viaje.update).not.toHaveBeenCalled()
    expect(mockTx.viaje.updateMany).not.toHaveBeenCalled()
  })
})

// ─── ND_EMITIDA ─────────────────────────────────────────────────────────────

describe("ND_EMITIDA", () => {
  it("no modifica estado de viajes ni factura", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      empresa: { condicionIva: "RESPONSABLE_INSCRIPTO" },
    })

    const r = await ejecutarCrearNotaCD({
      tipo: "ND_EMITIDA",
      subtipo: "DIFERENCIA_TARIFA",
      facturaId: "fact-1",
      montoNeto: 500,
      ivaPct: 21,
      descripcion: "Diferencia de tarifa",
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.viaje.update).not.toHaveBeenCalled()
    expect(mockPrisma.facturaEmitida.update).not.toHaveBeenCalled()
  })
})

// ─── NC/ND sobre LP ────────────────────────────────────────────────────────

const LIQUIDACION_MOCK = {
  id: "liq-1",
  tipoCbte: 60,
  comisionPct: 10,
  ivaPct: 21,
  fletero: { condicionIva: "RESPONSABLE_INSCRIPTO" },
  viajes: [
    { viajeId: "v1", tarifaFletero: 50, kilos: 30000, subtotal: 1500, viaje: { id: "v1" } },
  ],
  notasCreditoDebito: [],
}

describe("NC/ND emitidas sobre LP", () => {
  // LIQUIDACION_MOCK tiene comisionPct=10. calcularTotalesNotaLP aplica la comisión real.
  // NC bruto=1200, comision=120, neto=1080, iva=226.8, total=1306.8
  // ND bruto=500, comision=50, neto=450, iva=94.5, total=544.5

  it("NC_EMITIDA sobre LP: totales con comisión real y asiento IVA Compras", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQUIDACION_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      liquidacionId: "liq-1",
      montoNeto: 1200,
      ivaPct: 21,
      descripcion: "Anulación LP",
      viajesIds: ["v1"],
    }, "op1")

    expect(r.ok).toBe(true)

    // Nota creada con totales ajustados por comisión (calcularTotalesNotaLP real)
    const notaData = mockTx.notaCreditoDebito.create.mock.calls[0][0].data
    expect(notaData.montoNeto).toBe(1080)   // 1200 - 10% comisión
    expect(notaData.montoIva).toBe(226.8)   // 1080 * 21%
    expect(notaData.montoTotal).toBe(1306.8) // 1080 + 226.8

    // Asiento IVA Compras con base negativa (NC reduce)
    expect(mockTx.asientoIva.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "COMPRA",
          tipoReferencia: "NC_EMITIDA",
          baseImponible: -1080,
          montoIva: -226.8,
        }),
      })
    )

    // Viaje liberado a PENDIENTE_LIQUIDAR
    expect(mockTx.viaje.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v1" },
        data: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
      })
    )
  })

  it("ND_EMITIDA sobre LP: totales con comisión real y asiento IVA Compras positivo", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQUIDACION_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "ND_EMITIDA",
      subtipo: "DIFERENCIA_TARIFA",
      liquidacionId: "liq-1",
      montoNeto: 500,
      ivaPct: 21,
      descripcion: "Ajuste LP",
    }, "op1")

    expect(r.ok).toBe(true)

    // Nota creada con totales ajustados por comisión
    const notaData = mockTx.notaCreditoDebito.create.mock.calls[0][0].data
    expect(notaData.montoNeto).toBe(450)   // 500 - 10% comisión
    expect(notaData.montoIva).toBe(94.5)   // 450 * 21%
    expect(notaData.montoTotal).toBe(544.5) // 450 + 94.5

    // Asiento IVA Compras positivo (ND aumenta)
    expect(mockTx.asientoIva.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "COMPRA",
          tipoReferencia: "ND_EMITIDA",
          baseImponible: 450,
          montoIva: 94.5,
        }),
      })
    )

    // ND NO libera viajes
    expect(mockTx.viaje.update).not.toHaveBeenCalled()
  })

  it("NC_EMITIDA sobre LP sin comisión: neto = bruto original", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue({
      ...LIQUIDACION_MOCK,
      comisionPct: 0,
    })

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "CORRECCION_IMPORTE",
      liquidacionId: "liq-1",
      montoNeto: 800,
      ivaPct: 21,
      descripcion: "Corrección sin comisión",
    }, "op1")

    expect(r.ok).toBe(true)

    // Sin comisión, neto queda igual al bruto original
    const notaData = mockTx.notaCreditoDebito.create.mock.calls[0][0].data
    expect(notaData.montoNeto).toBe(800)
    expect(notaData.montoIva).toBe(168)   // 800 * 21%
    expect(notaData.montoTotal).toBe(968)  // 800 + 168
  })
})

describe("NC/ND recibidas sobre LP — no soportadas", () => {
  it("NC_RECIBIDA → rechazada (subtipo no reconocido)", async () => {
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "ANULACION_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 1200,
      ivaPct: 21,
      descripcion: "Anulación LP",
      nroComprobanteExterno: "001",
      fechaComprobanteExterno: "2026-01-15",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("NC_RECIBIDA no reconocido")
  })

  it("ND_RECIBIDA con subtipo no soportado → rechazada", async () => {
    const r = await ejecutarCrearNotaCD({
      tipo: "ND_RECIBIDA",
      subtipo: "AJUSTE_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 300,
      ivaPct: 21,
      descripcion: "Ajuste LP",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("ND_RECIBIDA no reconocido")
  })
})

// ─── Validaciones ───────────────────────────────────────────────────────────

describe("validaciones NC/ND", () => {
  it("NC_EMITIDA sin facturaId → error", async () => {
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      montoNeto: 100,
      ivaPct: 21,
      descripcion: "test",
    }, "op1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })

  it("NC_EMITIDA ANULACION_TOTAL sobre factura que ya tiene NC total → error", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      notasCreditoDebito: [{ id: "nc-existente" }],
    })
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 100,
      ivaPct: 21,
      descripcion: "test",
    }, "op1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })

  it("ANULACION_PARCIAL sin viajesIds → error", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_PARCIAL",
      facturaId: "fact-1",
      montoNeto: 100,
      ivaPct: 21,
      descripcion: "test",
    }, "op1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })
})

// (NC/ND emitidas sobre LP soportadas — NC/ND recibidas no soportadas)

// ═══════════════════════════════════════════════════════════════════════════════
// CONGELADO: semántica NC parcial — reversión por viaje vs corrección de importe
// ═══════════════════════════════════════════════════════════════════════════════

describe("CONGELADO: NC parcial empresa — reversión por viaje", () => {
  it("viaje seleccionado queda PENDIENTE_FACTURAR (totalmente revertido)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_PARCIAL", facturaId: "fact-1",
      montoNeto: 1500, ivaPct: 21, descripcion: "Reverso v1", viajesIds: ["v1"],
    }, "op1")

    expect(mockTx.viaje.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "v1" }, data: { estadoFactura: "PENDIENTE_FACTURAR" } })
    )
  })

  it("viaje NO seleccionado permanece sin cambios", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_PARCIAL", facturaId: "fact-1",
      montoNeto: 1500, ivaPct: 21, descripcion: "Reverso v1", viajesIds: ["v1"],
    }, "op1")

    // Solo v1 fue tocado, v2 NO
    const calls = mockTx.viaje.update.mock.calls.map((c: unknown[]) => (c[0] as { where: { id: string } }).where.id)
    expect(calls).toContain("v1")
    expect(calls).not.toContain("v2")
  })

  it("se crean snapshots ViajeEnNotaCD solo para viajes seleccionados", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_PARCIAL", facturaId: "fact-1",
      montoNeto: 1500, ivaPct: 21, descripcion: "Reverso v1", viajesIds: ["v1"],
    }, "op1")

    expect(mockTx.viajeEnNotaCD.create).toHaveBeenCalledTimes(1)
  })
})

describe("CONGELADO: NC parcial empresa — corrección de importe", () => {
  it("CORRECCION_IMPORTE no cambia estadoFactura de ningún viaje", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "CORRECCION_IMPORTE", facturaId: "fact-1",
      montoNeto: 200, ivaPct: 21, descripcion: "Corrección económica",
    }, "op1")

    expect(mockTx.viaje.update).not.toHaveBeenCalled()
    expect(mockTx.viaje.updateMany).not.toHaveBeenCalled()
  })

  it("CORRECCION_IMPORTE no crea snapshots ViajeEnNotaCD", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "CORRECCION_IMPORTE", facturaId: "fact-1",
      montoNeto: 200, ivaPct: 21, descripcion: "Corrección económica",
    }, "op1")

    expect(mockTx.viajeEnNotaCD.create).not.toHaveBeenCalled()
  })
})

// (NC/ND sobre LP: tests de operación en describe "NC/ND emitidas sobre LP" arriba)

describe("CONGELADO: ND no libera viajes", () => {
  it("ND_EMITIDA sobre factura no cambia estados de viaje", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK, empresa: { condicionIva: "RESPONSABLE_INSCRIPTO" },
    })
    await ejecutarCrearNotaCD({
      tipo: "ND_EMITIDA", subtipo: "DIFERENCIA_TARIFA", facturaId: "fact-1",
      montoNeto: 500, ivaPct: 21, descripcion: "Diferencia",
    }, "op1")

    expect(mockTx.viaje.update).not.toHaveBeenCalled()
  })
})

describe("CONGELADO: preservación de historial documental", () => {
  it("NC total emitida NO pone factura en ANULADA", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "fact-1",
      montoNeto: 2500, ivaPct: 21, descripcion: "Anulación total",
    }, "op1")

    expect(mockPrisma.facturaEmitida.update).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ANULACION_TOTAL — auto-liberación de viajes (invariante del sistema)
// ANULACION_TOTAL siempre libera TODOS los viajes del comprobante origen,
// independientemente de si el caller pasa viajesIds o no.
// ═══════════════════════════════════════════════════════════════════════════════

describe("ANULACION_TOTAL — auto-liberación completa", () => {
  it("sin viajesIds: libera todos los viajes del comprobante", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total sin viajesIds",
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledTimes(1)
    expect(mockTx.viaje.update).toHaveBeenCalledTimes(2)
    expect(mockTx.viajeEnNotaCD.create).toHaveBeenCalledTimes(2)
    expect(mockTx.asientoIva.create).toHaveBeenCalledTimes(1)
  })

  it("con viajesIds vacío: igual libera todos los viajes", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total viajesIds vacío",
      viajesIds: [],
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.viaje.update).toHaveBeenCalledTimes(2)
    expect(mockTx.viajeEnNotaCD.create).toHaveBeenCalledTimes(2)
  })

  it("con viajesIds parcial: igual libera todos (ignora viajesIds)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total con viajesIds parcial",
      viajesIds: ["v1"],
    }, "op1")

    expect(r.ok).toBe(true)
    // Ambos viajes liberados, no solo v1
    expect(mockTx.viaje.update).toHaveBeenCalledTimes(2)
    expect(mockTx.viajeEnNotaCD.create).toHaveBeenCalledTimes(2)
  })
})

// ─── Validación comprobantesHabilitados antes de crear en DB ────────────────

describe("validación comprobantesHabilitados pre-DB", () => {
  it("NC_EMITIDA rechazada si tipoCbte no está en comprobantesHabilitados", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    mockLeerHabilitados.mockResolvedValueOnce([1, 6])

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "fact-1",
      montoNeto: 2500, ivaPct: 21, descripcion: "Anulación total",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toContain("no está habilitado")
    }
    expect(mockTx.notaCreditoDebito.create).not.toHaveBeenCalled()
  })

  it("ND_EMITIDA rechazada si tipoCbte no está en comprobantesHabilitados", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    mockLeerHabilitados.mockResolvedValueOnce([1, 6])

    const r = await ejecutarCrearNotaCD({
      tipo: "ND_EMITIDA", subtipo: "DIFERENCIA_TARIFA", facturaId: "fact-1",
      montoNeto: 500, ivaPct: 21, descripcion: "Diferencia",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toContain("no está habilitado")
    }
    expect(mockTx.notaCreditoDebito.create).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Invariantes de dominio
// ═══════════════════════════════════════════════════════════════════════════════

describe("invariantes: NC ANULACION_TOTAL duplicada", () => {
  it("rechaza NC ANULACION_TOTAL si la factura ya tiene una NC total emitida", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      notasCreditoDebito: [{ id: "nc-previa" }],
    })

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Segundo intento de anulación total",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toContain("ya tiene una NC de anulación total")
    }
    expect(mockTx.notaCreditoDebito.create).not.toHaveBeenCalled()
  })

  it("rechaza NC ANULACION_TOTAL si la liquidación ya tiene una NC total emitida", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue({
      ...LIQUIDACION_MOCK,
      notasCreditoDebito: [{ id: "nc-previa-lp" }],
    })

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      liquidacionId: "liq-1",
      montoNeto: 1200,
      ivaPct: 21,
      descripcion: "Segundo intento de anulación total LP",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toContain("ya tiene una NC de anulación total")
    }
    expect(mockTx.notaCreditoDebito.create).not.toHaveBeenCalled()
  })

  it("permite NC ANULACION_PARCIAL aunque ya exista NC total (son independientes)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      notasCreditoDebito: [{ id: "nc-total-previa" }],
    })

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_PARCIAL",
      facturaId: "fact-1",
      montoNeto: 500,
      ivaPct: 21,
      descripcion: "Parcial después de total",
      viajesIds: ["v1"],
    }, "op1")

    // La validación de ANULACION_TOTAL solo aplica a ANULACION_TOTAL
    expect(r.ok).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ANULACION_TOTAL — robustez: falla explícita si relación viajes no cargada
// ═══════════════════════════════════════════════════════════════════════════════

describe("ANULACION_TOTAL — error interno si relación viajes no cargada", () => {
  it("retorna status 500 si comprobante no tiene relación viajes (error interno, no del usuario)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      viajes: undefined, // relación no cargada — bug del backend, no del usuario
    })

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(500)
      expect(r.error).toContain("Error interno")
      expect(r.error).toContain("anulación total")
    }
  })

  it("retorna status 500 si viajes es null en vez de array", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      viajes: null,
    })

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(500)
      expect(r.error).toContain("Error interno")
    }
  })

  it("funciona con array vacío (comprobante sin viajes — caso borde)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      viajes: [], // relación cargada pero sin viajes
    })

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total sin viajes",
    }, "op1")

    // No falla, simplemente no libera ningún viaje
    expect(r.ok).toBe(true)
    expect(mockTx.viaje.update).not.toHaveBeenCalled()
  })
})

// ─── NC/ND RECIBIDA / PROVEEDOR ─────────────────────────────────────────────

const FACTURA_PROVEEDOR_MOCK_A = {
  id: "fp-1",
  tipoCbte: "1", // Fact A → NC/ND A (3/2)
  total: 1210,
  proveedor: { razonSocial: "Repuestos SRL" },
}

const FACTURA_PROVEEDOR_MOCK_B = {
  id: "fp-2",
  tipoCbte: "6", // Fact B → NC/ND B (8/7)
  total: 5000,
  proveedor: { razonSocial: "Papelería X" },
}

describe("NC_RECIBIDA / PROVEEDOR", () => {
  it("crea una NC recibida asociada a la factura proveedor con tipoCbte clase A", async () => {
    mockPrisma.facturaProveedor.findUnique.mockResolvedValue(FACTURA_PROVEEDOR_MOCK_A)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "PROVEEDOR",
      facturaProveedorId: "fp-1",
      nroComprobanteExterno: "0001-00000123",
      fechaComprobanteExterno: "2026-04-15",
      montoNeto: 1000,
      ivaPct: 21,
      descripcion: "Devolución parcial",
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "NC_RECIBIDA",
          subtipo: "PROVEEDOR",
          facturaProveedorId: "fp-1",
          tipoCbte: 3, // NC clase A
          emisorExterno: "Repuestos SRL",
          nroComprobanteExterno: "0001-00000123",
          estado: "REGISTRADA",
        }),
      })
    )
    // Asiento IVA COMPRA negativo (reduce crédito)
    expect(mockTx.asientoIva.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "COMPRA",
          tipoReferencia: "NC_RECIBIDA",
          baseImponible: -1000,
          montoIva: -210,
          facturaProvId: "fp-1",
        }),
      })
    )
  })

  it("crea una ND recibida clase B sobre una factura B con asiento COMPRA positivo", async () => {
    mockPrisma.facturaProveedor.findUnique.mockResolvedValue(FACTURA_PROVEEDOR_MOCK_B)

    const r = await ejecutarCrearNotaCD({
      tipo: "ND_RECIBIDA",
      subtipo: "PROVEEDOR",
      facturaProveedorId: "fp-2",
      nroComprobanteExterno: "0001-00000999",
      fechaComprobanteExterno: "2026-04-20",
      montoNeto: 500,
      ivaPct: 21,
      descripcion: "Costo adicional",
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "ND_RECIBIDA",
          tipoCbte: 7, // ND clase B
        }),
      })
    )
    expect(mockTx.asientoIva.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "COMPRA",
          tipoReferencia: "ND_RECIBIDA",
          baseImponible: 500,
          montoIva: 105,
        }),
      })
    )
  })

  it("persiste las percepciones cuando se ingresan", async () => {
    mockPrisma.facturaProveedor.findUnique.mockResolvedValue(FACTURA_PROVEEDOR_MOCK_A)

    await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "PROVEEDOR",
      facturaProveedorId: "fp-1",
      nroComprobanteExterno: "0001-0001",
      fechaComprobanteExterno: "2026-04-15",
      montoNeto: 1000,
      ivaPct: 21,
      descripcion: "Con percepciones",
      percepcionIIBB: 30,
      percepcionIVA: 50,
      percepcionGanancias: 20,
    }, "op1")

    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          percepcionIIBB: 30,
          percepcionIVA: 50,
          percepcionGanancias: 20,
        }),
      })
    )
  })

  it("rechaza si falta facturaProveedorId", async () => {
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "PROVEEDOR",
      nroComprobanteExterno: "0001-0001",
      fechaComprobanteExterno: "2026-04-15",
      montoNeto: 1000,
      ivaPct: 21,
      descripcion: "Sin factura",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toMatch(/facturaProveedorId/)
    }
  })

  it("rechaza si falta nroComprobanteExterno", async () => {
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "PROVEEDOR",
      facturaProveedorId: "fp-1",
      fechaComprobanteExterno: "2026-04-15",
      montoNeto: 1000,
      ivaPct: 21,
      descripcion: "Sin nro",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toMatch(/nroComprobanteExterno/)
    }
  })

  it("rechaza si la factura proveedor no existe", async () => {
    mockPrisma.facturaProveedor.findUnique.mockResolvedValue(null)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "PROVEEDOR",
      facturaProveedorId: "inexistente",
      nroComprobanteExterno: "0001-0001",
      fechaComprobanteExterno: "2026-04-15",
      montoNeto: 1000,
      ivaPct: 21,
      descripcion: "Factura inexistente",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(404)
    }
  })

  it("rechaza subtipos de NC_RECIBIDA no reconocidos", async () => {
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "DESCONOCIDO",
      facturaProveedorId: "fp-1",
      montoNeto: 1000,
      ivaPct: 21,
      descripcion: "x",
    }, "op1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })
})
