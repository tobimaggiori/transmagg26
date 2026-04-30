/**
 * Tests de validaciones del Portal IVA.
 * Funciones puras, sin Prisma — usamos DTOs sintéticos.
 */

import { validarPeriodo, validarCuit } from "@/lib/iva-portal/validaciones"
import type { ComprobanteIva, AlicuotaIva, DatosIvaPeriodo } from "@/lib/iva-portal/types"

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

function datosVacios(): DatosIvaPeriodo {
  return {
    mesAnio: "2026-04",
    ventas: { comprobantes: [], alicuotas: [] },
    compras: { comprobantes: [], alicuotas: [] },
  }
}

describe("validarCuit", () => {
  it("CUIT válido real (Trans-Magg)", () => {
    expect(validarCuit("30709381683")).toBe(true)
  })
  it("CUIT con guiones", () => {
    expect(validarCuit("30-70938168-3")).toBe(true)
  })
  it("CUIT con dígito verificador incorrecto", () => {
    expect(validarCuit("30709381682")).toBe(false)
  })
  it("largo incorrecto", () => {
    expect(validarCuit("123")).toBe(false)
    expect(validarCuit("303030303030")).toBe(false)
  })
  it("vacío o null", () => {
    expect(validarCuit("")).toBe(false)
    expect(validarCuit(null)).toBe(false)
    expect(validarCuit(undefined)).toBe(false)
  })
})

describe("validarPeriodo: errores bloqueantes", () => {
  it("período vacío no genera errores", () => {
    const r = validarPeriodo(datosVacios())
    expect(r.errores).toEqual([])
    expect(r.advertencias).toEqual([])
  })

  it("CUIT inválido genera error bloqueante", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte({ cuitContraparte: "11111111111" }))
    datos.ventas.alicuotas.push(alic())
    const r = validarPeriodo(datos)
    expect(r.errores.some((e) => e.codigo === "CUIT_INVALIDO")).toBe(true)
  })

  it("tipoCbte fuera de matriz genera error", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte({ tipoComprobanteArca: 99 }))
    datos.ventas.alicuotas.push(alic({ tipoComprobanteArca: 99 }))
    const r = validarPeriodo(datos)
    expect(r.errores.some((e) => e.codigo === "TIPO_COMPROBANTE_NO_SOPORTADO")).toBe(true)
  })

  it("alícuota no soportada genera error", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte())
    datos.ventas.alicuotas.push(alic({ alicuotaPorcentaje: 12 }))
    const r = validarPeriodo(datos)
    expect(r.errores.some((e) => e.codigo === "ALICUOTA_NO_SOPORTADA")).toBe(true)
  })

  it("falta punto de venta", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte({ puntoVenta: 0 }))
    datos.ventas.alicuotas.push(alic({ puntoVenta: 0 }))
    const r = validarPeriodo(datos)
    expect(r.errores.some((e) => e.codigo === "PUNTO_VENTA_FALTANTE")).toBe(true)
  })

  it("falta número comprobante", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte({ numeroDesde: 0 }))
    datos.ventas.alicuotas.push(alic({ numeroComprobante: 0 }))
    const r = validarPeriodo(datos)
    expect(r.errores.some((e) => e.codigo === "NUMERO_COMPROBANTE_FALTANTE")).toBe(true)
  })

  it("alícuotas inconsistentes con cantidad declarada", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte({ cantidadAlicuotas: 2 }))
    datos.ventas.alicuotas.push(alic())  // solo 1
    const r = validarPeriodo(datos)
    expect(r.errores.some((e) => e.codigo === "CANTIDAD_ALICUOTAS_INCONSISTENTE")).toBe(true)
  })

  it("comprobante sin alícuotas", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte())
    // No agregamos alic
    const r = validarPeriodo(datos)
    expect(r.errores.some((e) => e.codigo === "ALICUOTAS_FALTANTES")).toBe(true)
  })

  it("comprobante duplicado", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte())
    datos.ventas.comprobantes.push(cbte())  // mismo (tipoCbte, ptoVenta, num)
    datos.ventas.alicuotas.push(alic())
    datos.ventas.alicuotas.push(alic())
    const r = validarPeriodo(datos)
    expect(r.errores.some((e) => e.codigo === "COMPROBANTE_DUPLICADO")).toBe(true)
  })
})

describe("validarPeriodo: advertencias", () => {
  it("suma bases ≠ neto cabecera → advertencia", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte({ netoGravado: 1000 }))
    datos.ventas.alicuotas.push(alic({ netoGravado: 500 })) // suma 500, no 1000
    const r = validarPeriodo(datos)
    expect(r.advertencias.some((a) => a.codigo === "SUMA_BASES_INCONSISTENTE")).toBe(true)
    // Es advertencia, no error
    expect(r.errores.some((e) => e.codigo === "SUMA_BASES_INCONSISTENTE")).toBe(false)
  })
})

describe("validarPeriodo: caso completo válido", () => {
  it("factura A simple sin advertencias", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte())
    datos.ventas.alicuotas.push(alic())
    const r = validarPeriodo(datos)
    expect(r.errores).toEqual([])
  })

  it("factura A multi-alícuota válida", () => {
    const datos = datosVacios()
    datos.ventas.comprobantes.push(cbte({ netoGravado: 1500, cantidadAlicuotas: 2 }))
    datos.ventas.alicuotas.push(alic({ alicuotaPorcentaje: 21, netoGravado: 1000, montoIva: 210 }))
    datos.ventas.alicuotas.push(alic({ alicuotaPorcentaje: 10.5, netoGravado: 500, montoIva: 52.5 }))
    const r = validarPeriodo(datos)
    expect(r.errores).toEqual([])
  })

  it("CVLP en compras válido", () => {
    const datos = datosVacios()
    datos.compras.comprobantes.push(cbte({
      tipoLibro: "COMPRAS",
      tipoReferencia: "LIQUIDACION",
      tipoComprobanteArca: 60,
      cuitContraparte: "30709381683",
    }))
    datos.compras.alicuotas.push(alic({
      tipoLibro: "COMPRAS",
      tipoComprobanteArca: 60,
      cuitProveedor: "30709381683",
    }))
    const r = validarPeriodo(datos)
    expect(r.errores).toEqual([])
  })
})
