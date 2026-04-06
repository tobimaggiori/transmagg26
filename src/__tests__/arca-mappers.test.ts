/**
 * Tests unitarios para src/lib/arca/mappers.ts
 * Cubre: formateo de fechas, redondeo, determinación de tipo de comprobante,
 * y mapeo completo a payload ARCA.
 */

import {
  formatearFechaArca,
  parsearFechaArca,
  redondearArca,
  determinarTipoCbteLiquidacion,
  determinarTipoCbteFactura,
  mapearComprobanteArca,
  condicionIvaArcaId,
  IVA_21_ID,
} from "@/lib/arca/mappers"

// ─── formatearFechaArca ──────────────────────────────────────────────────────

describe("formatearFechaArca", () => {
  it("convierte fecha a YYYYMMDD", () => {
    expect(formatearFechaArca(new Date(2026, 3, 3))).toBe("20260403")
  })

  it("padea mes y día con ceros", () => {
    expect(formatearFechaArca(new Date(2026, 0, 5))).toBe("20260105")
  })
})

// ─── parsearFechaArca ────────────────────────────────────────────────────────

describe("parsearFechaArca", () => {
  it("parsea YYYYMMDD a Date", () => {
    const d = parsearFechaArca("20260403")
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3) // abril = 3
    expect(d.getDate()).toBe(3)
  })

  it("parsea primer día del año", () => {
    const d = parsearFechaArca("20260101")
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(1)
  })
})

// ─── redondearArca ───────────────────────────────────────────────────────────

describe("redondearArca", () => {
  it("redondea a 2 decimales", () => {
    expect(redondearArca(1234.567)).toBe(1234.57)
  })

  it("no modifica enteros", () => {
    expect(redondearArca(100)).toBe(100)
  })

  it("maneja floating point", () => {
    expect(redondearArca(0.1 + 0.2)).toBe(0.3)
  })
})

// ─── determinarTipoCbteLiquidacion ───────────────────────────────────────────

describe("determinarTipoCbteLiquidacion", () => {
  it("RI → LP tipo A (60)", () => {
    expect(determinarTipoCbteLiquidacion("RESPONSABLE_INSCRIPTO")).toBe(60)
  })

  it("Monotributista → LP tipo A (60)", () => {
    expect(determinarTipoCbteLiquidacion("MONOTRIBUTISTA")).toBe(60)
  })

  it("Consumidor Final → LP tipo B (61)", () => {
    expect(determinarTipoCbteLiquidacion("CONSUMIDOR_FINAL")).toBe(61)
  })

  it("Exento → LP tipo B (61)", () => {
    expect(determinarTipoCbteLiquidacion("EXENTO")).toBe(61)
  })
})

// ─── determinarTipoCbteFactura ───────────────────────────────────────────────

describe("determinarTipoCbteFactura", () => {
  it("RI sin MiPyME → Factura A (1)", () => {
    expect(determinarTipoCbteFactura("RESPONSABLE_INSCRIPTO")).toBe(1)
  })

  it("RI con MiPyME SCA → Factura A MiPyME (201)", () => {
    expect(determinarTipoCbteFactura("RESPONSABLE_INSCRIPTO", "SCA")).toBe(201)
  })

  it("Consumidor Final → Factura B (6)", () => {
    expect(determinarTipoCbteFactura("CONSUMIDOR_FINAL")).toBe(6)
  })

  it("Exento → Factura B (6)", () => {
    expect(determinarTipoCbteFactura("EXENTO")).toBe(6)
  })
})

// ─── mapearComprobanteArca ───────────────────────────────────────────────────

describe("mapearComprobanteArca", () => {
  const datosBase = {
    tipoCbte: 60,
    ptoVenta: 1,
    nroComprobante: 43,
    fecha: new Date(2026, 3, 3),
    cuitReceptor: "20123456789",
    neto: 100000,
    ivaMonto: 21000,
    total: 121000,
    concepto: 2 as const,
    fechaServDesde: new Date(2026, 2, 1),
    fechaServHasta: new Date(2026, 2, 31),
  }

  it("genera FECAERequest con cabecera correcta", () => {
    const req = mapearComprobanteArca(datosBase)
    expect(req.FeCabReq.CantReg).toBe(1)
    expect(req.FeCabReq.PtoVta).toBe(1)
    expect(req.FeCabReq.CbteTipo).toBe(60)
  })

  it("genera detalle con montos correctos", () => {
    const req = mapearComprobanteArca(datosBase)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.ImpNeto).toBe(100000)
    expect(det.ImpIVA).toBe(21000)
    expect(det.ImpTotal).toBe(121000)
    expect(det.CbteDesde).toBe(43)
    expect(det.CbteHasta).toBe(43)
  })

  it("incluye alícuota IVA 21%", () => {
    const req = mapearComprobanteArca(datosBase)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.Iva?.AlicIva).toHaveLength(1)
    expect(det.Iva?.AlicIva[0].Id).toBe(IVA_21_ID)
    expect(det.Iva?.AlicIva[0].BaseImp).toBe(100000)
    expect(det.Iva?.AlicIva[0].Importe).toBe(21000)
  })

  it("incluye fechas de servicio para concepto 2", () => {
    const req = mapearComprobanteArca(datosBase)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.FchServDesde).toBe("20260301")
    expect(det.FchServHasta).toBe("20260331")
    expect(det.FchVtoPago).toBeDefined()
  })

  it("incluye datos de documento receptor", () => {
    const req = mapearComprobanteArca(datosBase)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.DocTipo).toBe(80) // CUIT
    expect(det.DocNro).toBe(20123456789)
  })

  it("agrega comprobante asociado para NC/ND", () => {
    const datos = {
      ...datosBase,
      tipoCbte: 3, // NC A
      comprobanteAsociado: {
        tipo: 1,
        ptoVta: 1,
        nro: 10,
        cuit: "30709381683",
        fecha: new Date(2026, 2, 15),
      },
    }
    const req = mapearComprobanteArca(datos)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.CbtesAsoc?.CbteAsoc).toHaveLength(1)
    expect(det.CbtesAsoc?.CbteAsoc[0].Tipo).toBe(1)
    expect(det.CbtesAsoc?.CbteAsoc[0].Nro).toBe(10)
  })

  it("agrega opcionales FCE MiPyME para tipoCbte 201", () => {
    const datos = {
      ...datosBase,
      tipoCbte: 201,
      cbuMiPymes: "1234567890123456789012",
      modalidadMiPymes: "SCA",
    }
    const req = mapearComprobanteArca(datos)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.Opcionales?.Opcional).toHaveLength(2)
    expect(det.Opcionales?.Opcional[0].Id).toBe("2101")
    expect(det.Opcionales?.Opcional[0].Valor).toBe("1234567890123456789012")
  })

  it("no incluye IVA si ivaMonto es 0", () => {
    const datos = { ...datosBase, ivaMonto: 0, total: 100000 }
    const req = mapearComprobanteArca(datos)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.Iva).toBeUndefined()
  })

  it("incluye CondicionIVAReceptorId cuando se pasa condicionIvaReceptor", () => {
    const datos = { ...datosBase, condicionIvaReceptor: "RESPONSABLE_INSCRIPTO" }
    const req = mapearComprobanteArca(datos)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.CondicionIVAReceptorId).toBe(1)
  })

  it("no incluye CondicionIVAReceptorId cuando no se pasa condicionIvaReceptor", () => {
    const req = mapearComprobanteArca(datosBase)
    const det = req.FeDetReq.FECAEDetRequest[0]
    expect(det.CondicionIVAReceptorId).toBeUndefined()
  })
})

// ─── condicionIvaArcaId (RG 5616) ──────────────────────────────────────────

describe("condicionIvaArcaId", () => {
  it("RESPONSABLE_INSCRIPTO → 1", () => {
    expect(condicionIvaArcaId("RESPONSABLE_INSCRIPTO")).toBe(1)
  })

  it("EXENTO → 4", () => {
    expect(condicionIvaArcaId("EXENTO")).toBe(4)
  })

  it("CONSUMIDOR_FINAL → 5", () => {
    expect(condicionIvaArcaId("CONSUMIDOR_FINAL")).toBe(5)
  })

  it("MONOTRIBUTISTA → 6", () => {
    expect(condicionIvaArcaId("MONOTRIBUTISTA")).toBe(6)
  })

  it("valor desconocido → lanza error", () => {
    expect(() => condicionIvaArcaId("INVALIDO")).toThrow("no tiene mapeo ARCA")
  })
})
