import { labelCondicionIva, formatearNroComprobante } from "@/lib/liquidacion-utils"

describe("labelCondicionIva", () => {
  it('labelCondicionIva("RESPONSABLE_INSCRIPTO") === "Responsable Inscripto"', () => {
    expect(labelCondicionIva("RESPONSABLE_INSCRIPTO")).toBe("Responsable Inscripto")
  })
  it('labelCondicionIva("MONOTRIBUTISTA") === "Monotributista"', () => {
    expect(labelCondicionIva("MONOTRIBUTISTA")).toBe("Monotributista")
  })
  it('labelCondicionIva("EXENTO") === "Exento"', () => {
    expect(labelCondicionIva("EXENTO")).toBe("Exento")
  })
  it('labelCondicionIva("CONSUMIDOR_FINAL") === "Consumidor Final"', () => {
    expect(labelCondicionIva("CONSUMIDOR_FINAL")).toBe("Consumidor Final")
  })
  it('labelCondicionIva("OTRO") === "OTRO"', () => {
    expect(labelCondicionIva("OTRO")).toBe("OTRO")
  })
})

describe("formatearNroComprobante", () => {
  it('formatearNroComprobante(1) === "00000001"', () => {
    expect(formatearNroComprobante(1)).toBe("00000001")
  })
  it('formatearNroComprobante(42) === "00000042"', () => {
    expect(formatearNroComprobante(42)).toBe("00000042")
  })
  it('formatearNroComprobante(12345678) === "12345678"', () => {
    expect(formatearNroComprobante(12345678)).toBe("12345678")
  })
})
