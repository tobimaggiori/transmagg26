/**
 * Tests del helper pdf-merge.
 * Genera PDFs in-memory con pdf-lib para no depender de fixtures externos.
 * Para mergePDFsDesdeR2 / mergePDFsMixto / mergeYSubirAR2 se mockea storage.
 */

import { PDFDocument, StandardFonts } from "pdf-lib"

jest.mock("@/lib/storage", () => ({
  obtenerArchivo: jest.fn(),
  subirPDF: jest.fn(),
}))

import { mergePDFs, mergePDFsDesdeR2, mergePDFsMixto, mergeYSubirAR2 } from "@/lib/pdf-merge"
import * as storage from "@/lib/storage"

async function pdfConPaginas(n: number, etiqueta: string): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < n; i++) {
    const page = doc.addPage([300, 200])
    page.drawText(`${etiqueta} pag ${i + 1}`, { x: 20, y: 100, size: 14, font })
  }
  return Buffer.from(await doc.save())
}

async function contarPaginas(buffer: Buffer): Promise<number> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  return doc.getPageCount()
}

describe("mergePDFs", () => {
  it("merges two single-page PDFs into one with two pages", async () => {
    const a = await pdfConPaginas(1, "A")
    const b = await pdfConPaginas(1, "B")
    const merged = await mergePDFs([a, b])
    expect(await contarPaginas(merged)).toBe(2)
  })

  it("preserves the total page count across multiple multi-page PDFs", async () => {
    const a = await pdfConPaginas(2, "A")
    const b = await pdfConPaginas(3, "B")
    const c = await pdfConPaginas(1, "C")
    const merged = await mergePDFs([a, b, c])
    expect(await contarPaginas(merged)).toBe(6)
  })

  it("returns an equivalent PDF when called with a single buffer", async () => {
    const a = await pdfConPaginas(2, "A")
    const merged = await mergePDFs([a])
    expect(await contarPaginas(merged)).toBe(2)
  })

  it("throws when called with an empty array", async () => {
    await expect(mergePDFs([])).rejects.toThrow(/al menos un PDF/)
  })

  it("throws with index context when one buffer is not a valid PDF", async () => {
    const a = await pdfConPaginas(1, "A")
    const noPdf = Buffer.from("esto no es un pdf")
    await expect(mergePDFs([a, noPdf])).rejects.toThrow(/índice 1.*no es un PDF válido/)
  })
})

describe("mergePDFsDesdeR2", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it("downloads keys in order and merges them", async () => {
    const a = await pdfConPaginas(2, "A")
    const b = await pdfConPaginas(3, "B")
    ;(storage.obtenerArchivo as jest.Mock)
      .mockResolvedValueOnce(a)
      .mockResolvedValueOnce(b)

    const merged = await mergePDFsDesdeR2(["x/a.pdf", "x/b.pdf"])
    expect(await contarPaginas(merged)).toBe(5)
    expect(storage.obtenerArchivo).toHaveBeenNthCalledWith(1, "x/a.pdf")
    expect(storage.obtenerArchivo).toHaveBeenNthCalledWith(2, "x/b.pdf")
  })

  it("throws naming the failing key when R2 download fails", async () => {
    ;(storage.obtenerArchivo as jest.Mock).mockRejectedValueOnce(new Error("NoSuchKey"))
    await expect(mergePDFsDesdeR2(["x/missing.pdf"]))
      .rejects.toThrow(/no se pudo descargar la key "x\/missing\.pdf"/)
  })

  it("throws when keys array is empty", async () => {
    await expect(mergePDFsDesdeR2([])).rejects.toThrow(/al menos una key/)
  })
})

describe("mergePDFsMixto", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it("merges in-memory buffers first, then R2 keys, in given order", async () => {
    const inMem = await pdfConPaginas(1, "MEM")
    const r2A = await pdfConPaginas(2, "R2A")
    const r2B = await pdfConPaginas(1, "R2B")
    ;(storage.obtenerArchivo as jest.Mock)
      .mockResolvedValueOnce(r2A)
      .mockResolvedValueOnce(r2B)

    const merged = await mergePDFsMixto({
      buffers: [inMem],
      keys: ["x/a.pdf", "x/b.pdf"],
    })
    expect(await contarPaginas(merged)).toBe(4)
  })

  it("throws when both buffers and keys are empty", async () => {
    await expect(mergePDFsMixto({})).rejects.toThrow(/al menos un PDF/)
  })

  it("works with only buffers (no R2 keys)", async () => {
    const a = await pdfConPaginas(2, "A")
    const merged = await mergePDFsMixto({ buffers: [a] })
    expect(await contarPaginas(merged)).toBe(2)
  })

  it("works with only R2 keys (no in-memory buffers)", async () => {
    const a = await pdfConPaginas(1, "A")
    ;(storage.obtenerArchivo as jest.Mock).mockResolvedValueOnce(a)
    const merged = await mergePDFsMixto({ keys: ["x/a.pdf"] })
    expect(await contarPaginas(merged)).toBe(1)
  })
})

describe("mergeYSubirAR2", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it("merges and uploads the result, returning the new key", async () => {
    const inMem = await pdfConPaginas(1, "OP")
    const adj = await pdfConPaginas(1, "ADJ")
    ;(storage.obtenerArchivo as jest.Mock).mockResolvedValueOnce(adj)
    ;(storage.subirPDF as jest.Mock).mockResolvedValueOnce("comprobantes-pago-fletero/2026/04/uuid.pdf")

    const key = await mergeYSubirAR2({
      buffers: [inMem],
      keys: ["x/adj.pdf"],
      prefijo: "comprobantes-pago-fletero",
      nombreArchivo: "OP-1-2026.pdf",
    })

    expect(key).toBe("comprobantes-pago-fletero/2026/04/uuid.pdf")
    expect(storage.subirPDF).toHaveBeenCalledTimes(1)
    const [bufferArg, prefijoArg, nombreArg] = (storage.subirPDF as jest.Mock).mock.calls[0]
    expect(prefijoArg).toBe("comprobantes-pago-fletero")
    expect(nombreArg).toBe("OP-1-2026.pdf")
    expect(await contarPaginas(bufferArg as Buffer)).toBe(2)
  })
})
