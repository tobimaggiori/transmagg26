/**
 * Tests de aplicar-ajustes — función pura, sin Prisma.
 */

import { aplicarAjustes } from "@/lib/iva-portal/aplicar-ajustes"
import type { ComprobanteIva, AlicuotaIva, DatosIvaPeriodo, AjusteAplicable } from "@/lib/iva-portal/types"

function cbte(overrides: Partial<ComprobanteIva> = {}): ComprobanteIva {
  return {
    tipoLibro: "VENTAS",
    tipoReferencia: "FACTURA_EMITIDA",
    referenciaId: "f1",
    fecha: new Date(2026, 3, 15),
    tipoComprobanteArca: 1,
    puntoVenta: 1,
    numeroDesde: 100,
    numeroHasta: 100,
    cuitContraparte: "30709381683",
    razonSocialContraparte: "ACME SA",
    totalOperacion: 1210,
    netoGravado: 1000,
    noGravado: 0,
    noCategorizados: 0,
    exento: 0,
    pagosACuenta: 0,
    percepcionIibb: 0,
    impuestosMunicipales: 0,
    impuestosInternos: 0,
    otrosTributos: 0,
    percepcionIva: 0,
    percepcionGanancias: 0,
    codigoMoneda: "PES",
    tipoCambio: 1,
    cantidadAlicuotas: 1,
    codigoOperacion: "0",
    fechaPago: null,
    ...overrides,
  }
}

function alic(overrides: Partial<AlicuotaIva> = {}): AlicuotaIva {
  return {
    tipoLibro: "VENTAS",
    tipoComprobanteArca: 1,
    puntoVenta: 1,
    numeroComprobante: 100,
    netoGravado: 1000,
    alicuotaPorcentaje: 21,
    montoIva: 210,
    ...overrides,
  }
}

function datos(): DatosIvaPeriodo {
  return {
    mesAnio: "2026-04",
    ventas: { comprobantes: [cbte()], alicuotas: [alic()] },
    compras: { comprobantes: [], alicuotas: [] },
  }
}

describe("aplicarAjustes — EXCLUIR", () => {
  it("excluye comprobante por referencia", () => {
    const aj: AjusteAplicable = {
      id: "a1",
      tipoLibro: "VENTAS",
      tipoAjuste: "EXCLUIR",
      referenciaTipo: "FACTURA_EMITIDA",
      referenciaId: "f1",
      motivo: "Duplicado",
    }
    const r = aplicarAjustes(datos(), [aj])
    expect(r.ventas.comprobantes).toHaveLength(0)
    expect(r.ventas.alicuotas).toHaveLength(0)
  })

  it("excluye por (tipoCbte, ptoVenta, numero)", () => {
    const aj: AjusteAplicable = {
      id: "a1",
      tipoLibro: "VENTAS",
      tipoAjuste: "EXCLUIR",
      tipoComprobanteArca: 1,
      puntoVenta: 1,
      numeroDesde: 100,
      referenciaTipo: null,
      referenciaId: null,
      motivo: "Anulado por ARCA",
    }
    const r = aplicarAjustes(datos(), [aj])
    expect(r.ventas.comprobantes).toHaveLength(0)
  })

  it("no afecta otros comprobantes", () => {
    const d = datos()
    d.ventas.comprobantes.push(cbte({ numeroDesde: 200, numeroHasta: 200, referenciaId: "f2" }))
    d.ventas.alicuotas.push(alic({ numeroComprobante: 200 }))
    const aj: AjusteAplicable = {
      id: "a1",
      tipoLibro: "VENTAS",
      tipoAjuste: "EXCLUIR",
      referenciaTipo: "FACTURA_EMITIDA",
      referenciaId: "f1",
      motivo: "x",
    }
    const r = aplicarAjustes(d, [aj])
    expect(r.ventas.comprobantes).toHaveLength(1)
    expect(r.ventas.comprobantes[0].numeroDesde).toBe(200)
  })
})

describe("aplicarAjustes — AGREGAR", () => {
  it("agrega un comprobante nuevo", () => {
    const aj: AjusteAplicable = {
      id: "a1",
      tipoLibro: "VENTAS",
      tipoAjuste: "AGREGAR",
      referenciaTipo: null,
      referenciaId: null,
      tipoComprobanteArca: 1,
      puntoVenta: 1,
      numeroDesde: 999,
      fechaComprobante: new Date(2026, 3, 20),
      cuitContraparte: "30000000007",
      razonSocialContraparte: "NUEVA SA",
      netoGravado: 500,
      iva: 105,
      total: 605,
      alicuota: 21,
      motivo: "Factura olvidada en sistema",
    }
    const r = aplicarAjustes(datos(), [aj])
    expect(r.ventas.comprobantes).toHaveLength(2)
    const nuevo = r.ventas.comprobantes.find((c) => c.numeroDesde === 999)
    expect(nuevo).toBeDefined()
    expect(nuevo?.tipoReferencia).toBe("MANUAL")
    expect(nuevo?.netoGravado).toBe(500)
  })

  it("agrega alícuota cuando se especifica", () => {
    const aj: AjusteAplicable = {
      id: "a1",
      tipoLibro: "VENTAS",
      tipoAjuste: "AGREGAR",
      referenciaTipo: null,
      referenciaId: null,
      tipoComprobanteArca: 1,
      puntoVenta: 1,
      numeroDesde: 999,
      fechaComprobante: new Date(2026, 3, 20),
      cuitContraparte: "30000000007",
      razonSocialContraparte: "NUEVA SA",
      netoGravado: 500,
      iva: 105,
      total: 605,
      alicuota: 21,
      motivo: "x",
    }
    const r = aplicarAjustes(datos(), [aj])
    expect(r.ventas.alicuotas).toHaveLength(2)
  })

  it("ignora ajuste con campos faltantes", () => {
    const aj: AjusteAplicable = {
      id: "a1",
      tipoLibro: "VENTAS",
      tipoAjuste: "AGREGAR",
      referenciaTipo: null,
      referenciaId: null,
      // Faltan campos críticos
      motivo: "Incompleto",
    }
    const r = aplicarAjustes(datos(), [aj])
    expect(r.ventas.comprobantes).toHaveLength(1)
  })
})

describe("aplicarAjustes — MODIFICAR / REDONDEO", () => {
  it("MODIFICAR cambia campos sin tocar otros", () => {
    const aj: AjusteAplicable = {
      id: "a1",
      tipoLibro: "VENTAS",
      tipoAjuste: "MODIFICAR",
      referenciaTipo: "FACTURA_EMITIDA",
      referenciaId: "f1",
      total: 1500,
      motivo: "Corrección manual",
    }
    const r = aplicarAjustes(datos(), [aj])
    expect(r.ventas.comprobantes[0].totalOperacion).toBe(1500)
    expect(r.ventas.comprobantes[0].netoGravado).toBe(1000) // sin cambio
  })

  it("REDONDEO equivale a MODIFICAR", () => {
    const aj: AjusteAplicable = {
      id: "a1",
      tipoLibro: "VENTAS",
      tipoAjuste: "REDONDEO",
      referenciaTipo: "FACTURA_EMITIDA",
      referenciaId: "f1",
      iva: 209.99,
      alicuota: 21,
      motivo: "Diferencia de 1 centavo con ARCA",
    }
    const r = aplicarAjustes(datos(), [aj])
    expect(r.ventas.alicuotas[0].montoIva).toBe(209.99)
  })
})

describe("aplicarAjustes — ajuste anulado no aplica", () => {
  it("solo se pasan los activos al aplicador (verificado en repo, no acá)", () => {
    // Si el array está vacío, no se aplica nada
    const r = aplicarAjustes(datos(), [])
    expect(r.ventas.comprobantes).toEqual(datos().ventas.comprobantes)
  })
})

describe("aplicarAjustes — RECLASIFICAR", () => {
  it("mueve comprobante de COMPRAS a VENTAS", () => {
    const d: DatosIvaPeriodo = {
      mesAnio: "2026-04",
      ventas: { comprobantes: [], alicuotas: [] },
      compras: { comprobantes: [cbte({ tipoLibro: "COMPRAS" })], alicuotas: [alic({ tipoLibro: "COMPRAS" })] },
    }
    const aj: AjusteAplicable = {
      id: "a1",
      tipoLibro: "VENTAS",  // libro destino
      tipoAjuste: "RECLASIFICAR",
      referenciaTipo: "FACTURA_EMITIDA",
      referenciaId: "f1",
      motivo: "Mal clasificada",
    }
    const r = aplicarAjustes(d, [aj])
    expect(r.compras.comprobantes).toHaveLength(0)
    expect(r.ventas.comprobantes).toHaveLength(1)
    expect(r.ventas.comprobantes[0].tipoLibro).toBe("VENTAS")
  })
})

describe("aplicarAjustes — orden de aplicación", () => {
  it("EXCLUIR se aplica antes de MODIFICAR (no modifica filas excluidas)", () => {
    const ajExcluir: AjusteAplicable = {
      id: "a1",
      tipoLibro: "VENTAS",
      tipoAjuste: "EXCLUIR",
      referenciaTipo: "FACTURA_EMITIDA",
      referenciaId: "f1",
      motivo: "x",
    }
    const ajModificar: AjusteAplicable = {
      id: "a2",
      tipoLibro: "VENTAS",
      tipoAjuste: "MODIFICAR",
      referenciaTipo: "FACTURA_EMITIDA",
      referenciaId: "f1",
      total: 9999,
      motivo: "y",
    }
    // Pasamos en orden contrario para verificar que aplicarAjustes los ordena
    const r = aplicarAjustes(datos(), [ajModificar, ajExcluir])
    // Excluir gana — la fila no existe
    expect(r.ventas.comprobantes).toHaveLength(0)
  })
})
