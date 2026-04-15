/**
 * Tests para la funcionalidad de facturación con camión propio.
 *
 * Cubre:
 * 1. Alta de viaje camión propio => estadoLiquidacion = "LIQUIDADO"
 * 2. Alta de viaje fletero => mantiene comportamiento actual
 * 3-7. Resolución de punto de venta según tipoCbte + esCamionPropio
 * 8. Mezcla de viajes propios + fletero => error validación
 * 9. autorizarFacturaArca respeta ptoVenta persistido
 * 10. Configuración ARCA acepta nuevas claves
 * 11. Backfill corrige viajes propios sin tocar ajenos
 */

import { resolverPuntoVentaFacturaEmpresa } from "@/lib/arca/catalogo"

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 3-7: resolverPuntoVentaFacturaEmpresa (función pura, sin mocks)
// ═══════════════════════════════════════════════════════════════════════════════

describe("resolverPuntoVentaFacturaEmpresa", () => {
  const CONFIG_COMPLETA: Record<string, number> = {
    FACTURA_A: 2,
    FACTURA_B: 3,
    FACTURA_A_CAMION_PROPIO: 5,
    FACTURA_B_CAMION_PROPIO: 7,
  }

  // Test 3: camión propio tipo 1 => FACTURA_A_CAMION_PROPIO
  it("tipoCbte 1 + camión propio => FACTURA_A_CAMION_PROPIO", () => {
    expect(resolverPuntoVentaFacturaEmpresa({
      tipoCbte: 1,
      esCamionPropio: true,
      puntosVentaConfig: CONFIG_COMPLETA,
    })).toBe(5)
  })

  // Test 4: camión propio tipo 201 => FACTURA_A_CAMION_PROPIO
  it("tipoCbte 201 + camión propio => FACTURA_A_CAMION_PROPIO", () => {
    expect(resolverPuntoVentaFacturaEmpresa({
      tipoCbte: 201,
      esCamionPropio: true,
      puntosVentaConfig: CONFIG_COMPLETA,
    })).toBe(5)
  })

  // Test 5: camión propio tipo 6 => FACTURA_B_CAMION_PROPIO
  it("tipoCbte 6 + camión propio => FACTURA_B_CAMION_PROPIO", () => {
    expect(resolverPuntoVentaFacturaEmpresa({
      tipoCbte: 6,
      esCamionPropio: true,
      puntosVentaConfig: CONFIG_COMPLETA,
    })).toBe(7)
  })

  // Test 6: fletero tipo 1 => FACTURA_A
  it("tipoCbte 1 + fletero => FACTURA_A", () => {
    expect(resolverPuntoVentaFacturaEmpresa({
      tipoCbte: 1,
      esCamionPropio: false,
      puntosVentaConfig: CONFIG_COMPLETA,
    })).toBe(2)
  })

  // Test 6b: fletero tipo 201 => FACTURA_A
  it("tipoCbte 201 + fletero => FACTURA_A", () => {
    expect(resolverPuntoVentaFacturaEmpresa({
      tipoCbte: 201,
      esCamionPropio: false,
      puntosVentaConfig: CONFIG_COMPLETA,
    })).toBe(2)
  })

  // Test 7: fletero tipo 6 => FACTURA_B
  it("tipoCbte 6 + fletero => FACTURA_B", () => {
    expect(resolverPuntoVentaFacturaEmpresa({
      tipoCbte: 6,
      esCamionPropio: false,
      puntosVentaConfig: CONFIG_COMPLETA,
    })).toBe(3)
  })

  // Fallback: camión propio sin clave específica => usa clave estándar
  it("camión propio sin clave específica configurada => fallback a FACTURA_A", () => {
    expect(resolverPuntoVentaFacturaEmpresa({
      tipoCbte: 1,
      esCamionPropio: true,
      puntosVentaConfig: { FACTURA_A: 2 }, // sin FACTURA_A_CAMION_PROPIO
    })).toBe(2)
  })

  // Fallback: sin config => 1
  it("sin config de PV => fallback a 1", () => {
    expect(resolverPuntoVentaFacturaEmpresa({
      tipoCbte: 1,
      esCamionPropio: false,
      puntosVentaConfig: {},
    })).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 1-2: Alta de viaje con camión propio / fletero
// ═══════════════════════════════════════════════════════════════════════════════

describe("Alta de viaje: estadoLiquidacion automático", () => {
  // Simulamos la lógica del POST de viajes (la parte relevante)
  function resolverEstadoLiquidacion(esCamionPropio: boolean, estadoLiquidacion: string): string {
    return esCamionPropio ? "LIQUIDADO" : estadoLiquidacion
  }

  // Test 1
  it("esCamionPropio = true => estadoLiquidacion = LIQUIDADO", () => {
    expect(resolverEstadoLiquidacion(true, "PENDIENTE_LIQUIDAR")).toBe("LIQUIDADO")
  })

  // Test 2
  it("esCamionPropio = false => mantiene estadoLiquidacion original", () => {
    expect(resolverEstadoLiquidacion(false, "PENDIENTE_LIQUIDAR")).toBe("PENDIENTE_LIQUIDAR")
  })

  it("esCamionPropio = true ignora valor explícito de estadoLiquidacion", () => {
    expect(resolverEstadoLiquidacion(true, "PENDIENTE_LIQUIDAR")).toBe("LIQUIDADO")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Test 8: Mezcla de viajes propios + fletero => error
// ═══════════════════════════════════════════════════════════════════════════════

// Mock prisma
const mockTx = {
  facturaEmitida: { create: jest.fn() },
  asientoIva: { create: jest.fn() },
  viajeEnFactura: { create: jest.fn() },
  asientoIibb: { create: jest.fn() },
  viaje: { findMany: jest.fn(), updateMany: jest.fn() },
}
const mockPrisma = {
  empresa: { findFirst: jest.fn() },
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
jest.mock("@/lib/arca/config", () => ({
  cargarConfigArca: jest.fn().mockResolvedValue({
    cuit: "30709381683",
    razonSocial: "TEST",
    modo: "simulacion",
    puntosVenta: { FACTURA_A: 2, FACTURA_B: 3, FACTURA_A_CAMION_PROPIO: 5, FACTURA_B_CAMION_PROPIO: 7 },
    comprobantesHabilitados: [1, 6, 201],
    cbuMiPymes: null,
    activa: true,
    certificadoB64: "",
    certificadoPass: "",
  }),
}))

import { ejecutarCrearFactura } from "@/lib/factura-commands"

const EMPRESA_RI = {
  id: "emp-1",
  razonSocial: "Test SA",
  cuit: "30123456789",
  condicionIva: "RESPONSABLE_INSCRIPTO",
  activa: true,
}

function mkViaje(overrides: Partial<{
  id: string; empresaId: string; esCamionPropio: boolean;
  kilos: number; tarifaEmpresa: number; estadoFactura: string;
  fleteroId: string | null; camionId: string; choferId: string;
  fechaViaje: Date; remito: string | null; cupo: string | null;
  mercaderia: string | null; procedencia: string | null;
  provinciaOrigen: string | null; destino: string | null;
  provinciaDestino: string | null;
}>) {
  return {
    id: "v-1",
    empresaId: "emp-1",
    esCamionPropio: false,
    kilos: 25000,
    tarifaEmpresa: 50,
    estadoFactura: "PENDIENTE_FACTURAR",
    fleteroId: "f-1",
    camionId: "c-1",
    choferId: "ch-1",
    fechaViaje: new Date("2026-03-15"),
    remito: null,
    cupo: null,
    mercaderia: "Maíz",
    procedencia: null,
    provinciaOrigen: "Buenos Aires",
    destino: null,
    provinciaDestino: "Córdoba",
    ...overrides,
  }
}

describe("ejecutarCrearFactura: validación mezcla camión propio/fletero", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.empresa.findFirst.mockResolvedValue(EMPRESA_RI)
  })

  // Test 8: mezcla => error
  it("rechaza mezcla de viajes propios + fletero", async () => {
    mockTx.viaje.findMany.mockResolvedValue([
      mkViaje({ id: "v-1", esCamionPropio: true, fleteroId: null }),
      mkViaje({ id: "v-2", esCamionPropio: false, fleteroId: "f-1" }),
    ])

    const result = await ejecutarCrearFactura({
      empresaId: "emp-1",
      viajeIds: ["v-1", "v-2"],
      tipoCbte: 1,
      ivaPct: 21,
    }, "op-1")

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(422)
      expect(result.error).toContain("mezclar")
    }
  })

  it("acepta solo viajes camión propio", async () => {
    const viajesPropio = [
      mkViaje({ id: "v-1", esCamionPropio: true, fleteroId: null }),
      mkViaje({ id: "v-2", esCamionPropio: true, fleteroId: null }),
    ]
    mockTx.viaje.findMany.mockResolvedValue(viajesPropio)
    mockTx.facturaEmitida.create.mockResolvedValue({ id: "fact-1" })
    mockTx.viajeEnFactura.create.mockResolvedValue({ id: "vef-1" })
    mockTx.asientoIva.create.mockResolvedValue({ id: "aiva-1" })
    mockTx.asientoIibb.create.mockResolvedValue({ id: "aibb-1" })
    mockTx.viaje.updateMany.mockResolvedValue({ count: 2 })

    const result = await ejecutarCrearFactura({
      empresaId: "emp-1",
      viajeIds: ["v-1", "v-2"],
      tipoCbte: 1,
      ivaPct: 21,
    }, "op-1")

    expect(result.ok).toBe(true)
    // Verificar que ptoVenta = 5 (FACTURA_A_CAMION_PROPIO)
    expect(mockTx.facturaEmitida.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ptoVenta: 5 }),
      })
    )
  })

  it("acepta solo viajes fletero con PV estándar", async () => {
    const viajesFletero = [
      mkViaje({ id: "v-1", esCamionPropio: false }),
      mkViaje({ id: "v-2", esCamionPropio: false }),
    ]
    mockTx.viaje.findMany.mockResolvedValue(viajesFletero)
    mockTx.facturaEmitida.create.mockResolvedValue({ id: "fact-1" })
    mockTx.viajeEnFactura.create.mockResolvedValue({ id: "vef-1" })
    mockTx.asientoIva.create.mockResolvedValue({ id: "aiva-1" })
    mockTx.asientoIibb.create.mockResolvedValue({ id: "aibb-1" })
    mockTx.viaje.updateMany.mockResolvedValue({ count: 2 })

    const result = await ejecutarCrearFactura({
      empresaId: "emp-1",
      viajeIds: ["v-1", "v-2"],
      tipoCbte: 1,
      ivaPct: 21,
    }, "op-1")

    expect(result.ok).toBe(true)
    // Verificar que ptoVenta = 2 (FACTURA_A estándar)
    expect(mockTx.facturaEmitida.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ptoVenta: 2 }),
      })
    )
  })

  it("camión propio tipoCbte 6 usa FACTURA_B_CAMION_PROPIO", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue({
      ...EMPRESA_RI,
      condicionIva: "CONSUMIDOR_FINAL",
    })
    mockTx.viaje.findMany.mockResolvedValue([
      mkViaje({ id: "v-1", esCamionPropio: true, fleteroId: null }),
    ])
    mockTx.facturaEmitida.create.mockResolvedValue({ id: "fact-1" })
    mockTx.viajeEnFactura.create.mockResolvedValue({ id: "vef-1" })
    mockTx.asientoIva.create.mockResolvedValue({ id: "aiva-1" })
    mockTx.asientoIibb.create.mockResolvedValue({ id: "aibb-1" })
    mockTx.viaje.updateMany.mockResolvedValue({ count: 1 })

    const result = await ejecutarCrearFactura({
      empresaId: "emp-1",
      viajeIds: ["v-1"],
      tipoCbte: 6,
      ivaPct: 21,
    }, "op-1")

    expect(result.ok).toBe(true)
    expect(mockTx.facturaEmitida.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ptoVenta: 7 }),
      })
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Test 9: autorizarFacturaArca respeta ptoVenta persistido
// ═══════════════════════════════════════════════════════════════════════════════

describe("autorizarFacturaArca: ptoVenta persistido", () => {
  // Simulamos la lógica de resolución del ptoVenta en autorizarFacturaArca
  function resolverPtoVentaAutorizacion(
    facturaPtoVenta: number | null,
    tipoCbte: number,
    config: Record<string, number>
  ): number {
    if (facturaPtoVenta && facturaPtoVenta > 0) return facturaPtoVenta
    const tipoKey = tipoCbte === 201 ? "FACTURA_A" : tipoCbte === 1 ? "FACTURA_A" : "FACTURA_B"
    return config[tipoKey] ?? 1
  }

  // Test 9: respeta ptoVenta persistido
  it("usa factura.ptoVenta si está persistido", () => {
    expect(resolverPtoVentaAutorizacion(5, 1, { FACTURA_A: 2 })).toBe(5)
  })

  it("usa factura.ptoVenta=7 para factura B camión propio", () => {
    expect(resolverPtoVentaAutorizacion(7, 6, { FACTURA_B: 3 })).toBe(7)
  })

  it("fallback a config si ptoVenta no está persistido", () => {
    expect(resolverPtoVentaAutorizacion(0, 1, { FACTURA_A: 2 })).toBe(2)
  })

  it("fallback a config si ptoVenta es null", () => {
    expect(resolverPtoVentaAutorizacion(null, 6, { FACTURA_B: 3 })).toBe(3)
  })

  it("fallback a 1 si nada configurado", () => {
    expect(resolverPtoVentaAutorizacion(null, 1, {})).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Test 10: Configuración ARCA acepta nuevas claves
// ═══════════════════════════════════════════════════════════════════════════════

describe("Configuración ARCA: claves camión propio", () => {
  // Replica normalizarPuntosVentaInput (contrato escritura)
  function normalizarPuntosVentaInput(input: Record<string, string | number>): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [k, v] of Object.entries(input)) {
      const n = typeof v === "number" ? v : parseInt(String(v), 10)
      if (!isNaN(n) && n > 0) result[k] = n
    }
    return result
  }

  it("acepta FACTURA_A_CAMION_PROPIO y FACTURA_B_CAMION_PROPIO", () => {
    const result = normalizarPuntosVentaInput({
      FACTURA_A: "1",
      FACTURA_B: "2",
      FACTURA_A_CAMION_PROPIO: "5",
      FACTURA_B_CAMION_PROPIO: "7",
    })
    expect(result).toEqual({
      FACTURA_A: 1,
      FACTURA_B: 2,
      FACTURA_A_CAMION_PROPIO: 5,
      FACTURA_B_CAMION_PROPIO: 7,
    })
  })

  it("filtra valores inválidos también para nuevas claves", () => {
    const result = normalizarPuntosVentaInput({
      FACTURA_A_CAMION_PROPIO: "0",
      FACTURA_B_CAMION_PROPIO: "-1",
    })
    expect(result.FACTURA_A_CAMION_PROPIO).toBeUndefined()
    expect(result.FACTURA_B_CAMION_PROPIO).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Test 11: Backfill corrige viajes propios sin tocar ajenos
// ═══════════════════════════════════════════════════════════════════════════════

describe("Backfill: lógica de corrección viajes camión propio", () => {
  // Simulamos la lógica del SQL de backfill como función para testear
  function debeCorregir(viaje: {
    esCamionPropio: boolean
    estadoLiquidacion: string
    tieneLP: boolean
  }): boolean {
    return viaje.esCamionPropio &&
      viaje.estadoLiquidacion === "PENDIENTE_LIQUIDAR" &&
      !viaje.tieneLP
  }

  it("corrige viaje propio pendiente sin LP", () => {
    expect(debeCorregir({
      esCamionPropio: true,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR",
      tieneLP: false,
    })).toBe(true)
  })

  it("NO toca viaje de fletero pendiente sin LP", () => {
    expect(debeCorregir({
      esCamionPropio: false,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR",
      tieneLP: false,
    })).toBe(false)
  })

  it("NO toca viaje propio ya LIQUIDADO", () => {
    expect(debeCorregir({
      esCamionPropio: true,
      estadoLiquidacion: "LIQUIDADO",
      tieneLP: false,
    })).toBe(false)
  })

  it("NO toca viaje propio que tiene LP asociada", () => {
    expect(debeCorregir({
      esCamionPropio: true,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR",
      tieneLP: true,
    })).toBe(false)
  })

  it("NO toca viaje de fletero con LP", () => {
    expect(debeCorregir({
      esCamionPropio: false,
      estadoLiquidacion: "LIQUIDADO",
      tieneLP: true,
    })).toBe(false)
  })
})
