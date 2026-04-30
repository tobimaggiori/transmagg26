/**
 * Tests de la helper pura compararCamposLockeados.
 * El cargarViajeFuenteCupo se testea de forma indirecta por las rutas
 * (no merece test propio porque es una sola query Prisma).
 */

import {
  agruparViajesPorCupo,
  compararCamposLockeados,
  formatearRemitosCupo,
  CAMPOS_LOCKEADOS_CUPO,
  type ViajeAgrupable,
  type ViajeFuenteCupo,
} from "@/lib/viaje-cupo"

const fuente: ViajeFuenteCupo = {
  id: "v1",
  empresaId: "emp1",
  cupo: "C-100",
  mercaderia: "Soja",
  procedencia: "Rosario",
  provinciaOrigen: "Santa Fe",
  destino: "Buenos Aires",
  provinciaDestino: "Buenos Aires",
  tarifa: 5000,
  comisionPct: 10,
  fleteroId: "flet1",
  camionId: "cam1",
  choferId: "ch1",
  esCamionPropio: false,
  tieneCtg: true,
}

describe("compararCamposLockeados", () => {
  it("sin diferencias devuelve []", () => {
    const propuesto = {
      mercaderia: "Soja",
      tarifa: 5000,
      fleteroId: "flet1",
    }
    expect(compararCamposLockeados(fuente, propuesto)).toEqual([])
  })

  it("una diferencia devuelve el campo", () => {
    expect(compararCamposLockeados(fuente, { mercaderia: "Maíz" })).toEqual(["mercaderia"])
  })

  it("varias diferencias devuelve todas en orden de CAMPOS_LOCKEADOS_CUPO", () => {
    const dif = compararCamposLockeados(fuente, {
      mercaderia: "Maíz",
      tarifa: 6000,
      camionId: "cam2",
    })
    expect(dif).toEqual(["mercaderia", "tarifa", "camionId"])
  })

  it("campos no enviados (undefined) no cuentan como diferencia", () => {
    expect(compararCamposLockeados(fuente, { mercaderia: "Soja" })).toEqual([])
  })

  it("null === null cuenta como coincidencia", () => {
    const fuenteNull: ViajeFuenteCupo = { ...fuente, comisionPct: null }
    expect(compararCamposLockeados(fuenteNull, { comisionPct: null })).toEqual([])
  })

  it("null vs valor cuenta como diferencia", () => {
    const fuenteNull: ViajeFuenteCupo = { ...fuente, comisionPct: null }
    expect(compararCamposLockeados(fuenteNull, { comisionPct: 10 })).toEqual(["comisionPct"])
  })

  it("CAMPOS_LOCKEADOS_CUPO incluye los críticos", () => {
    expect(CAMPOS_LOCKEADOS_CUPO).toEqual(expect.arrayContaining([
      "mercaderia", "procedencia", "provinciaOrigen", "destino", "provinciaDestino",
      "tarifa", "comisionPct", "fleteroId", "camionId", "choferId",
    ]))
  })
})

describe("formatearRemitosCupo", () => {
  it("vacío → string vacío", () => {
    expect(formatearRemitosCupo([])).toBe("")
  })

  it("uno → ese remito", () => {
    expect(formatearRemitosCupo(["12345"])).toBe("12345")
  })

  it("dos consecutivos → 12345/46", () => {
    expect(formatearRemitosCupo(["12345", "12346"])).toBe("12345/46")
  })

  it("cuatro consecutivos → 12345/46/47/48", () => {
    expect(formatearRemitosCupo(["12345", "12346", "12347", "12348"])).toBe("12345/46/47/48")
  })

  it("sufijo mínimo de 2 chars (no 12345/6/7/8)", () => {
    expect(formatearRemitosCupo(["100200", "100201", "100202"])).toBe("100200/01/02")
  })

  it("sin prefijo común → coma + espacio", () => {
    expect(formatearRemitosCupo(["12345", "99999"])).toBe("12345, 99999")
  })

  it("largos distintos → coma + espacio", () => {
    expect(formatearRemitosCupo(["12345", "1234567"])).toBe("12345, 1234567")
  })

  it("LCP de 3 chars con sufijos largos → 12345/99", () => {
    expect(formatearRemitosCupo(["12345", "12399"])).toBe("12345/99")
  })
})

describe("agruparViajesPorCupo", () => {
  function viaje(over: Partial<ViajeAgrupable> = {}): ViajeAgrupable {
    return {
      fechaViaje: new Date("2026-04-01"),
      remito: null,
      cupo: null,
      mercaderia: "Soja",
      procedencia: "Rosario",
      provinciaOrigen: "Santa Fe",
      destino: "Buenos Aires",
      provinciaDestino: "Buenos Aires",
      kilos: 1000,
      tarifa: 5000,
      subtotal: 5000,
      nroCtg: null,
      ...over,
    }
  }

  it("sin cupo → un grupo por viaje", () => {
    const grupos = agruparViajesPorCupo([viaje(), viaje()])
    expect(grupos).toHaveLength(2)
  })

  it("dos hermanos del mismo cupo → un grupo con kilos y subtotal sumados", () => {
    const grupos = agruparViajesPorCupo([
      viaje({ cupo: "C-100", remito: "1001", kilos: 1000, subtotal: 5000 }),
      viaje({ cupo: "C-100", remito: "1002", kilos: 2000, subtotal: 10000 }),
    ])
    expect(grupos).toHaveLength(1)
    expect(grupos[0].kilos).toBe(3000)
    expect(grupos[0].subtotal).toBe(15000)
    expect(grupos[0].remitos).toEqual(["1001", "1002"])
  })

  it("cupos distintos → grupos separados", () => {
    const grupos = agruparViajesPorCupo([
      viaje({ cupo: "C-100" }),
      viaje({ cupo: "C-200" }),
    ])
    expect(grupos).toHaveLength(2)
    expect(grupos[0].cupo).toBe("C-100")
    expect(grupos[1].cupo).toBe("C-200")
  })

  it("preserva orden de aparición", () => {
    const grupos = agruparViajesPorCupo([
      viaje({ cupo: "C-100", remito: "1" }),
      viaje({ cupo: null, remito: "2" }),
      viaje({ cupo: "C-100", remito: "3" }),
      viaje({ cupo: null, remito: "4" }),
    ])
    expect(grupos).toHaveLength(3)
    expect(grupos[0].cupo).toBe("C-100")
    expect(grupos[0].remitos).toEqual(["1", "3"])
    expect(grupos[1].cupo).toBeNull()
    expect(grupos[1].remitos).toEqual(["2"])
    expect(grupos[2].cupo).toBeNull()
    expect(grupos[2].remitos).toEqual(["4"])
  })

  it("kilos null cuentan como 0 en la suma", () => {
    const grupos = agruparViajesPorCupo([
      viaje({ cupo: "C", kilos: 1000 }),
      viaje({ cupo: "C", kilos: null }),
    ])
    expect(grupos[0].kilos).toBe(1000)
  })

  it("CTGs se acumulan también", () => {
    const grupos = agruparViajesPorCupo([
      viaje({ cupo: "C", nroCtg: "CTG-1" }),
      viaje({ cupo: "C", nroCtg: "CTG-2" }),
      viaje({ cupo: "C", nroCtg: null }),
    ])
    expect(grupos[0].ctgs).toEqual(["CTG-1", "CTG-2"])
  })

  it("CPEs se acumulan también", () => {
    const grupos = agruparViajesPorCupo([
      viaje({ cupo: "C", cpe: "CPE-1" }),
      viaje({ cupo: "C", cpe: "CPE-2" }),
      viaje({ cupo: "C", cpe: null }),
    ])
    expect(grupos[0].cpes).toEqual(["CPE-1", "CPE-2"])
  })

  it("array vacío → []", () => {
    expect(agruparViajesPorCupo([])).toEqual([])
  })
})
