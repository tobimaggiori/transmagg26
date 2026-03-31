import { normalizarBusqueda, coincideConBusqueda } from "@/lib/search-utils"

describe("normalizarBusqueda", () => {
  it('normalizarBusqueda("García") === "garcia"', () => {
    expect(normalizarBusqueda("García")).toBe("garcia")
  })
  it('normalizarBusqueda("CUIT: 20-1") === "cuit: 20-1"', () => {
    expect(normalizarBusqueda("CUIT: 20-1")).toBe("cuit: 20-1")
  })
  it('normalizarBusqueda("  Rodríguez  ") === "  rodriguez  "', () => {
    expect(normalizarBusqueda("  Rodríguez  ")).toBe("  rodriguez  ")
  })
})

describe("coincideConBusqueda", () => {
  it('coincideConBusqueda({ label: "García SRL", sublabel: "20-12345678-9" }, "garcia") === true', () => {
    expect(coincideConBusqueda({ label: "García SRL", sublabel: "20-12345678-9" }, "garcia")).toBe(true)
  })
  it('coincideConBusqueda({ label: "García SRL", sublabel: "20-12345678-9" }, "12345") === true', () => {
    expect(coincideConBusqueda({ label: "García SRL", sublabel: "20-12345678-9" }, "12345")).toBe(true)
  })
  it('coincideConBusqueda({ label: "García SRL", sublabel: "20-12345678-9" }, "xyz") === false', () => {
    expect(coincideConBusqueda({ label: "García SRL", sublabel: "20-12345678-9" }, "xyz")).toBe(false)
  })
})
