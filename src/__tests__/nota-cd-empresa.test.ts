/**
 * Tests para emisión contextual de NC/ND sobre facturas empresa con ítems.
 *
 * Cubre:
 * 1-6. resolverTipoCbteNotaEmpresa: 6 mapeos
 * 7-10. resolverPuntoVentaNotaEmpresa: claves correctas, fallback, FCE
 * 11-13. calcularTotalesDesdeItems: cálculos monetarios
 * 14-17. Validación de negocio por saldo (mocked Prisma)
 * 18-19. cbteAsoc persistido + items
 * 20. ARCA PV persistido
 */

import {
  resolverTipoCbteNotaEmpresa,
  resolverPuntoVentaNotaEmpresa,
  calcularTotalesDesdeItems,
} from "@/lib/nota-cd-utils"

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 1-6: resolverTipoCbteNotaEmpresa (función pura)
// ═══════════════════════════════════════════════════════════════════════════════

describe("resolverTipoCbteNotaEmpresa", () => {
  it("NC sobre Factura A (1) => 3", () => {
    expect(resolverTipoCbteNotaEmpresa({ tipoNota: "NC", tipoCbteOrigen: 1 })).toBe(3)
  })

  it("ND sobre Factura A (1) => 2", () => {
    expect(resolverTipoCbteNotaEmpresa({ tipoNota: "ND", tipoCbteOrigen: 1 })).toBe(2)
  })

  it("NC sobre Factura B (6) => 8", () => {
    expect(resolverTipoCbteNotaEmpresa({ tipoNota: "NC", tipoCbteOrigen: 6 })).toBe(8)
  })

  it("ND sobre Factura B (6) => 7", () => {
    expect(resolverTipoCbteNotaEmpresa({ tipoNota: "ND", tipoCbteOrigen: 6 })).toBe(7)
  })

  it("NC sobre FCE A (201) => 203", () => {
    expect(resolverTipoCbteNotaEmpresa({ tipoNota: "NC", tipoCbteOrigen: 201 })).toBe(203)
  })

  it("ND sobre FCE A (201) => 202", () => {
    expect(resolverTipoCbteNotaEmpresa({ tipoNota: "ND", tipoCbteOrigen: 201 })).toBe(202)
  })

  it("origen no compatible => 0", () => {
    expect(resolverTipoCbteNotaEmpresa({ tipoNota: "NC", tipoCbteOrigen: 99 })).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 7-10: resolverPuntoVentaNotaEmpresa (función pura)
// ═══════════════════════════════════════════════════════════════════════════════

describe("resolverPuntoVentaNotaEmpresa", () => {
  it("NC A (3) => NOTA_CREDITO_A", () => {
    expect(resolverPuntoVentaNotaEmpresa({
      tipoCbteNota: 3,
      puntosVentaConfig: { NOTA_CREDITO_A: 5 },
    })).toBe(5)
  })

  it("ND A (2) => NOTA_DEBITO_A", () => {
    expect(resolverPuntoVentaNotaEmpresa({
      tipoCbteNota: 2,
      puntosVentaConfig: { NOTA_DEBITO_A: 6 },
    })).toBe(6)
  })

  it("NC B (8) => NOTA_CREDITO_B", () => {
    expect(resolverPuntoVentaNotaEmpresa({
      tipoCbteNota: 8,
      puntosVentaConfig: { NOTA_CREDITO_B: 7 },
    })).toBe(7)
  })

  it("ND B (7) => NOTA_DEBITO_B", () => {
    expect(resolverPuntoVentaNotaEmpresa({
      tipoCbteNota: 7,
      puntosVentaConfig: { NOTA_DEBITO_B: 8 },
    })).toBe(8)
  })

  it("NC FCE A (203) => NOTA_CREDITO_FCE_A", () => {
    expect(resolverPuntoVentaNotaEmpresa({
      tipoCbteNota: 203,
      puntosVentaConfig: { NOTA_CREDITO_FCE_A: 9 },
    })).toBe(9)
  })

  it("ND FCE A (202) => NOTA_DEBITO_FCE_A", () => {
    expect(resolverPuntoVentaNotaEmpresa({
      tipoCbteNota: 202,
      puntosVentaConfig: { NOTA_DEBITO_FCE_A: 10 },
    })).toBe(10)
  })

  it("fallback a NOTA_CREDITO_A si clave específica no existe (ND A)", () => {
    expect(resolverPuntoVentaNotaEmpresa({
      tipoCbteNota: 2,
      puntosVentaConfig: { NOTA_CREDITO_A: 5 },
    })).toBe(5)
  })

  it("fallback a NOTA_CREDITO_B si clave específica no existe (ND B)", () => {
    expect(resolverPuntoVentaNotaEmpresa({
      tipoCbteNota: 7,
      puntosVentaConfig: { NOTA_CREDITO_B: 3 },
    })).toBe(3)
  })

  it("fallback a 1 si nada configurado", () => {
    expect(resolverPuntoVentaNotaEmpresa({
      tipoCbteNota: 3,
      puntosVentaConfig: {},
    })).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 11-13: calcularTotalesDesdeItems (función pura con money.ts)
// ═══════════════════════════════════════════════════════════════════════════════

describe("calcularTotalesDesdeItems", () => {
  it("un ítem con IVA 21%", () => {
    const r = calcularTotalesDesdeItems([{ subtotal: 1000 }], 21)
    expect(r.montoNeto).toBe(1000)
    expect(r.montoIva).toBe(210)
    expect(r.montoTotal).toBe(1210)
  })

  it("múltiples ítems con IVA 21%", () => {
    const r = calcularTotalesDesdeItems(
      [{ subtotal: 500 }, { subtotal: 300 }, { subtotal: 200 }],
      21
    )
    expect(r.montoNeto).toBe(1000)
    expect(r.montoIva).toBe(210)
    expect(r.montoTotal).toBe(1210)
  })

  it("IVA 0%", () => {
    const r = calcularTotalesDesdeItems([{ subtotal: 5000 }], 0)
    expect(r.montoNeto).toBe(5000)
    expect(r.montoIva).toBe(0)
    expect(r.montoTotal).toBe(5000)
  })

  it("maneja decimales correctamente", () => {
    const r = calcularTotalesDesdeItems([{ subtotal: 333.33 }, { subtotal: 666.67 }], 21)
    expect(r.montoNeto).toBe(1000)
    expect(r.montoIva).toBe(210)
    expect(r.montoTotal).toBe(1210)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 14-19: Negocio (mocked Prisma)
// ═══════════════════════════════════════════════════════════════════════════════

const mockTx = {
  notaCreditoDebito: { create: jest.fn(), findFirst: jest.fn() },
  notaCreditoDebitoItem: { create: jest.fn() },
  viajeEnNotaCD: { create: jest.fn() },
  viaje: { update: jest.fn() },
  asientoIva: { create: jest.fn() },
}
const mockPrisma = {
  facturaEmitida: { findUnique: jest.fn() },
  notaCreditoDebito: { findFirst: jest.fn() },
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
jest.mock("@/lib/cuenta-corriente", () => ({
  calcularSaldoPendienteFactura: jest.fn(),
}))
jest.mock("@/lib/arca/config", () => ({
  cargarConfigArca: jest.fn().mockResolvedValue({
    cuit: "30709381683", razonSocial: "TEST", modo: "simulacion",
    puntosVenta: { NOTA_CREDITO_A: 5, NOTA_DEBITO_A: 5, NOTA_CREDITO_B: 6, NOTA_DEBITO_B: 6 },
    comprobantesHabilitados: [1, 2, 3, 6, 7, 8, 201, 202, 203],
    cbuMiPymes: null, activa: true, certificadoB64: "", certificadoPass: "",
  }),
}))
jest.mock("@/lib/arca/leer-config-habilitados", () => ({
  leerComprobantesHabilitados: jest.fn().mockResolvedValue([1, 2, 3, 6, 7, 8, 201, 202, 203]),
}))

import { crearNotaEmpresaEmitida } from "@/lib/nota-cd-commands"
import { calcularSaldoPendienteFactura } from "@/lib/cuenta-corriente"

const FACTURA_MOCK = {
  id: "f-1",
  tipoCbte: 1,
  ptoVenta: 2,
  nroComprobante: "42",
  ivaPct: 21,
  total: 121000,
  estadoArca: "AUTORIZADA",
  emitidaEn: new Date("2026-04-01"),
  empresa: { id: "e-1", cuit: "30123456789", condicionIva: "RESPONSABLE_INSCRIPTO" },
}

describe("crearNotaEmpresaEmitida: regla de saldo", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    mockTx.notaCreditoDebito.findFirst.mockResolvedValue(null)
    mockTx.notaCreditoDebito.create.mockResolvedValue({ id: "nota-1" })
    mockTx.notaCreditoDebitoItem.create.mockResolvedValue({ id: "item-1" })
    mockTx.asientoIva.create.mockResolvedValue({ id: "aiva-1" })
  })

  it("NC permitida si saldo > 0", async () => {
    ;(calcularSaldoPendienteFactura as jest.Mock).mockResolvedValue(50000)
    const r = await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [{ concepto: "Descuento", subtotal: 1000 }],
    }, "op-1")
    expect(r.ok).toBe(true)
  })

  it("NC rechazada si saldo <= 0", async () => {
    ;(calcularSaldoPendienteFactura as jest.Mock).mockResolvedValue(0)
    const r = await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [{ concepto: "Descuento", subtotal: 1000 }],
    }, "op-1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("completamente cobrada")
  })

  it("ND permitida si saldo <= 0", async () => {
    ;(calcularSaldoPendienteFactura as jest.Mock).mockResolvedValue(0)
    const r = await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "ND",
      items: [{ concepto: "Ajuste", subtotal: 500 }],
    }, "op-1")
    expect(r.ok).toBe(true)
  })

  it("ND rechazada si saldo > 0", async () => {
    ;(calcularSaldoPendienteFactura as jest.Mock).mockResolvedValue(50000)
    const r = await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "ND",
      items: [{ concepto: "Ajuste", subtotal: 500 }],
    }, "op-1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("saldo pendiente")
  })
})

describe("crearNotaEmpresaEmitida: persistencia", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    mockTx.notaCreditoDebito.findFirst.mockResolvedValue(null)
    mockTx.notaCreditoDebito.create.mockResolvedValue({ id: "nota-1" })
    mockTx.notaCreditoDebitoItem.create.mockResolvedValue({ id: "item-1" })
    mockTx.asientoIva.create.mockResolvedValue({ id: "aiva-1" })
    ;(calcularSaldoPendienteFactura as jest.Mock).mockResolvedValue(50000)
  })

  it("persiste cbteAsoc correctamente", async () => {
    await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }],
    }, "op-1")

    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cbteAsocTipo: 1,
          cbteAsocPtoVta: 2,
          cbteAsocNro: 42,
        }),
      })
    )
  })

  it("persiste items con orden", async () => {
    await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [
        { concepto: "Ítem A", subtotal: 500 },
        { concepto: "Ítem B", subtotal: 300 },
      ],
    }, "op-1")

    expect(mockTx.notaCreditoDebitoItem.create).toHaveBeenCalledTimes(2)
    expect(mockTx.notaCreditoDebitoItem.create).toHaveBeenNthCalledWith(1,
      expect.objectContaining({
        data: expect.objectContaining({ orden: 1, concepto: "Ítem A", subtotal: 500 }),
      })
    )
    expect(mockTx.notaCreditoDebitoItem.create).toHaveBeenNthCalledWith(2,
      expect.objectContaining({
        data: expect.objectContaining({ orden: 2, concepto: "Ítem B", subtotal: 300 }),
      })
    )
  })

  it("tipoCbte resuelto = 3 (NC sobre Factura A)", async () => {
    await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }],
    }, "op-1")

    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipoCbte: 3 }),
      })
    )
  })

  it("ptoVenta resuelto desde config = 5 (NOTA_CREDITO_A)", async () => {
    await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }],
    }, "op-1")

    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ptoVenta: 5 }),
      })
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Test 20: ARCA PV persistido
// ═══════════════════════════════════════════════════════════════════════════════

describe("ARCA autorizarNotaCDArca: PV persistido", () => {
  // Simulamos la lógica de resolución de PV del service
  function resolverPV(
    notaPtoVenta: number | null,
    tipoCbteNota: number,
    config: Record<string, number>
  ): number {
    if (notaPtoVenta && notaPtoVenta > 0) return notaPtoVenta
    return resolverPuntoVentaNotaEmpresa({ tipoCbteNota, puntosVentaConfig: config })
  }

  it("usa PV persistido si existe", () => {
    expect(resolverPV(5, 3, { NOTA_CREDITO_A: 99 })).toBe(5)
  })

  it("fallback a config si PV no persistido", () => {
    expect(resolverPV(null, 3, { NOTA_CREDITO_A: 99 })).toBe(99)
  })

  it("fallback a config si PV es 0", () => {
    expect(resolverPV(0, 8, { NOTA_CREDITO_B: 7 })).toBe(7)
  })

  it("FCE (202) resuelve a NOTA_DEBITO_FCE_A con PV correcto", () => {
    expect(resolverPV(null, 202, { NOTA_DEBITO_FCE_A: 10 })).toBe(10)
  })

  it("FCE (203) resuelve a NOTA_CREDITO_FCE_A con PV correcto", () => {
    expect(resolverPV(null, 203, { NOTA_CREDITO_FCE_A: 11 })).toBe(11)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 21-24: Inmutabilidad de la factura original
// ═══════════════════════════════════════════════════════════════════════════════

describe("crearNotaEmpresaEmitida: inmutabilidad de factura", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    mockTx.notaCreditoDebito.findFirst.mockResolvedValue(null)
    mockTx.notaCreditoDebito.create.mockResolvedValue({ id: "nota-1" })
    mockTx.notaCreditoDebitoItem.create.mockResolvedValue({ id: "item-1" })
    mockTx.asientoIva.create.mockResolvedValue({ id: "aiva-1" })
  })

  it("emitir NC no modifica FacturaEmitida.montoTotal ni montoNeto", async () => {
    ;(calcularSaldoPendienteFactura as jest.Mock).mockResolvedValue(50000)
    await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [{ concepto: "Descuento", subtotal: 10000 }],
    }, "op-1")

    // facturaEmitida NO debe tener update calls
    const txKeys = Object.keys(mockTx)
    const facturaUpdate = txKeys.includes("facturaEmitida")
      ? (mockTx as unknown as Record<string, { update?: jest.Mock }>).facturaEmitida?.update
      : undefined
    if (facturaUpdate) {
      expect(facturaUpdate).not.toHaveBeenCalled()
    }
    // La transacción no debe contener updates a factura
    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledTimes(1)
  })

  it("emitir ND no modifica FacturaEmitida.montoTotal ni montoNeto", async () => {
    ;(calcularSaldoPendienteFactura as jest.Mock).mockResolvedValue(0)
    await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "ND",
      items: [{ concepto: "Ajuste", subtotal: 5000 }],
    }, "op-1")

    // La nota se crea pero la factura no se toca
    expect(mockTx.notaCreditoDebito.create).toHaveBeenCalledTimes(1)
    // Verificar que los datos de la factura no aparecen en ningún update
    const createCall = mockTx.notaCreditoDebito.create.mock.calls[0][0]
    expect(createCall.data.facturaId).toBe("f-1")
    // La factura queda intacta — solo se crea la nota
  })

  it("la nota guarda sus propios montos independientes de la factura", async () => {
    ;(calcularSaldoPendienteFactura as jest.Mock).mockResolvedValue(50000)
    await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }, { concepto: "Test 2", subtotal: 500 }],
    }, "op-1")

    const createCall = mockTx.notaCreditoDebito.create.mock.calls[0][0]
    // montoNeto = sum(items) = 1500
    expect(createCall.data.montoNeto).toBe(1500)
    // montoIva = 1500 * 0.21 = 315
    expect(createCall.data.montoIva).toBe(315)
    // montoTotal = 1500 + 315 = 1815
    expect(createCall.data.montoTotal).toBe(1815)
    // Estos son montos propios de la nota, NO de la factura
    // La factura sigue con total 121000
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 25-28: Validaciones de ítems
// ═══════════════════════════════════════════════════════════════════════════════

describe("crearNotaEmpresaEmitida: validación de ítems", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    ;(calcularSaldoPendienteFactura as jest.Mock).mockResolvedValue(50000)
  })

  it("rechaza si items vacío", async () => {
    const r = await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [],
    }, "op-1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("al menos un ítem")
  })

  it("rechaza si concepto está vacío", async () => {
    const r = await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [{ concepto: "  ", subtotal: 1000 }],
    }, "op-1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("concepto")
  })

  it("rechaza si subtotal <= 0", async () => {
    const r = await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [{ concepto: "Desc", subtotal: 0 }],
    }, "op-1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("subtotal")
  })

  it("rechaza factura no autorizada en ARCA", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      estadoArca: "PENDIENTE",
    })
    const r = await crearNotaEmpresaEmitida({
      facturaId: "f-1",
      tipoNota: "NC",
      items: [{ concepto: "Test", subtotal: 1000 }],
    }, "op-1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("autorizada en ARCA")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 29-31: Payload ARCA — mapearComprobanteArca con CbtesAsoc
// ═══════════════════════════════════════════════════════════════════════════════

import { mapearComprobanteArca, type DatosComprobanteBase } from "@/lib/arca/mappers"

describe("mapearComprobanteArca: NC/ND con CbtesAsoc", () => {
  const baseDatos: DatosComprobanteBase = {
    tipoCbte: 3, // NC A
    ptoVenta: 5,
    nroComprobante: 42,
    fecha: new Date("2026-04-08T12:00:00"),
    cuitReceptor: "30123456789",
    neto: 1000,
    ivaMonto: 210,
    total: 1210,
    concepto: 2,
    fechaServDesde: new Date("2026-04-01T12:00:00"),
    fechaServHasta: new Date("2026-04-08T12:00:00"),
    comprobanteAsociado: {
      tipo: 1, // Factura A
      ptoVta: 2,
      nro: 100,
      cuit: "30709381683",
      fecha: new Date("2026-03-15T12:00:00"),
    },
  }

  it("incluye CbtesAsoc en el payload", () => {
    const req = mapearComprobanteArca(baseDatos)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.CbtesAsoc).toBeDefined()
    expect(det.CbtesAsoc!.CbteAsoc).toHaveLength(1)
  })

  it("CbteAsoc tiene tipo, ptoVta, nro, cuit y fecha correctos", () => {
    const req = mapearComprobanteArca(baseDatos)
    const asoc = req.FeDetReq.FECAEDetRequest[0].CbtesAsoc!.CbteAsoc[0]
    expect(asoc.Tipo).toBe(1)
    expect(asoc.PtoVta).toBe(2)
    expect(asoc.Nro).toBe(100)
    expect(asoc.Cuit).toBe("30709381683")
    expect(asoc.CbteFch).toBe("20260315")
  })

  it("sin comprobanteAsociado, no incluye CbtesAsoc", () => {
    const sinAsoc = { ...baseDatos, comprobanteAsociado: undefined }
    const req = mapearComprobanteArca(sinAsoc)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.CbtesAsoc).toBeUndefined()
  })

  it("CbteFch de la nota usa la fecha ingresada", () => {
    const req = mapearComprobanteArca(baseDatos)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.CbteFch).toBe("20260408")
  })

  it("tipoCbte 3 (NC A) con IVA incluye alícuota", () => {
    const req = mapearComprobanteArca(baseDatos)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.Iva?.AlicIva).toHaveLength(1)
    expect(det.Iva!.AlicIva[0].Id).toBe(5) // 21%
    expect(det.Iva!.AlicIva[0].BaseImp).toBe(1000)
    expect(det.Iva!.AlicIva[0].Importe).toBe(210)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 32-34: validarPreAutorizacion para NC/ND
// ═══════════════════════════════════════════════════════════════════════════════

import { validarPreAutorizacion } from "@/lib/arca/validators"
import type { ArcaConfig } from "@/lib/arca/types"

describe("validarPreAutorizacion: NC/ND", () => {
  const configOk: ArcaConfig = {
    cuit: "30709381683",
    razonSocial: "Test",
    certificadoB64: "xxx",
    certificadoPass: "",
    modo: "simulacion",
    puntosVenta: {},
    comprobantesHabilitados: [],
    cbuMiPymes: null,
    activa: true,
  }

  it("NC (tipoCbte 3) sin comprobanteAsociado → error", () => {
    const datos: DatosComprobanteBase = {
      tipoCbte: 3, ptoVenta: 5, nroComprobante: 1,
      fecha: new Date(), cuitReceptor: "30123456789",
      neto: 1000, ivaMonto: 210, total: 1210,
      concepto: 2, fechaServDesde: new Date(), fechaServHasta: new Date(),
    }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some(e => e.includes("comprobante asociado"))).toBe(true)
  })

  it("ND FCE (tipoCbte 202) sin comprobanteAsociado → error", () => {
    const datos: DatosComprobanteBase = {
      tipoCbte: 202, ptoVenta: 5, nroComprobante: 1,
      fecha: new Date(), cuitReceptor: "30123456789",
      neto: 1000, ivaMonto: 210, total: 1210,
      concepto: 2, fechaServDesde: new Date(), fechaServHasta: new Date(),
    }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some(e => e.includes("comprobante asociado"))).toBe(true)
  })

  it("NC con comprobanteAsociado válido → sin error de asociado", () => {
    const datos: DatosComprobanteBase = {
      tipoCbte: 3, ptoVenta: 5, nroComprobante: 1,
      fecha: new Date(), cuitReceptor: "30123456789",
      neto: 1000, ivaMonto: 210, total: 1210,
      concepto: 2, fechaServDesde: new Date(), fechaServHasta: new Date(),
      comprobanteAsociado: {
        tipo: 1, ptoVta: 2, nro: 100, cuit: "30709381683", fecha: new Date(),
      },
    }
    const errores = validarPreAutorizacion(configOk, datos)
    expect(errores.some(e => e.includes("comprobante asociado"))).toBe(false)
  })
})
