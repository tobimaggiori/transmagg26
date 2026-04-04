/**
 * Tests unitarios para src/lib/arca/qr.ts
 * Cubre: generación del QR fiscal según RG 4291 y obtención de URL.
 */

import { generarQRFiscal, obtenerUrlQRFiscal } from "@/lib/arca/qr"

describe("generarQRFiscal", () => {
  const params = {
    cuitEmisor: "30709381683",
    ptoVenta: 1,
    tipoCbte: 186,
    nroComprobante: 43,
    total: 121000,
    cuitReceptor: "20123456789",
    cae: "74123456789012",
    fechaEmision: new Date(2026, 3, 3),
  }

  it("genera base64 válido", () => {
    const qr = generarQRFiscal(params)
    expect(qr).toBeTruthy()
    // Debe poder decodificarse como JSON
    const decoded = JSON.parse(Buffer.from(qr, "base64").toString("utf8"))
    expect(decoded).toBeDefined()
  })

  it("contiene todos los campos requeridos por RG 4291", () => {
    const qr = generarQRFiscal(params)
    const data = JSON.parse(Buffer.from(qr, "base64").toString("utf8"))

    expect(data.ver).toBe(1)
    expect(data.fecha).toBe("2026-04-03")
    expect(data.cuit).toBe(30709381683)
    expect(data.ptoVta).toBe(1)
    expect(data.tipoCmp).toBe(186)
    expect(data.nroCmp).toBe(43)
    expect(data.importe).toBe(121000)
    expect(data.moneda).toBe("PES")
    expect(data.ctz).toBe(1)
    expect(data.tipoDocRec).toBe(80)
    expect(data.nroDocRec).toBe(20123456789)
    expect(data.tipoCodAut).toBe("E")
    expect(data.codAut).toBe(74123456789012)
  })

  it("redondea importe a 2 decimales", () => {
    const qr = generarQRFiscal({ ...params, total: 100.456 })
    const data = JSON.parse(Buffer.from(qr, "base64").toString("utf8"))
    expect(data.importe).toBe(100.46)
  })
})

describe("obtenerUrlQRFiscal", () => {
  it("genera URL de AFIP con el parámetro p", () => {
    const qrData = "eyJ2ZXIiOjF9"
    const url = obtenerUrlQRFiscal(qrData)
    expect(url).toBe("https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjF9")
  })
})
