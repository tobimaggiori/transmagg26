/**
 * pdf-merge.ts
 *
 * Helper único para fusionar PDFs en Trans-Magg.
 * REGLA: nunca importar `pdf-lib` directamente desde otros archivos —
 * toda fusión de PDFs debe pasar por estas funciones.
 *
 * Casos cubiertos:
 *   - mergePDFs              → fusiona buffers en memoria.
 *   - mergePDFsDesdeR2       → descarga keys de R2, las fusiona.
 *   - mergePDFsMixto         → fusiona buffers in-memory + keys de R2 (en orden).
 *   - mergeYSubirAR2         → fusiona y sube a R2 devolviendo la nueva key.
 *
 * Política de errores: falla rápido. Si una key no existe, no es PDF válido,
 * o el array de entrada es vacío, se lanza Error con el contexto del problema.
 * El orden del PDF resultante respeta el orden de los inputs.
 */

import { PDFDocument } from "pdf-lib"
import { obtenerArchivo, subirPDF, type StoragePrefijo } from "@/lib/storage"

/**
 * mergePDFs: Buffer[] -> Promise<Buffer>
 *
 * Dado un array de buffers PDF, devuelve un Buffer con todas las páginas
 * concatenadas en el mismo orden.
 *
 * Ejemplos:
 * mergePDFs([pdfA, pdfB]) === Buffer (páginas de A seguidas por las de B)
 * mergePDFs([únicoPdf]) === Buffer (copia equivalente del único PDF)
 * mergePDFs([]) === throws Error("mergePDFs: se requiere al menos un PDF")
 */
export async function mergePDFs(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length === 0) {
    throw new Error("mergePDFs: se requiere al menos un PDF")
  }

  const destino = await PDFDocument.create()

  for (let i = 0; i < buffers.length; i++) {
    const buf = buffers[i]
    let origen: PDFDocument
    try {
      origen = await PDFDocument.load(buf, { ignoreEncryption: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`mergePDFs: el buffer en índice ${i} no es un PDF válido (${msg})`)
    }
    const paginas = await destino.copyPages(origen, origen.getPageIndices())
    for (const pagina of paginas) destino.addPage(pagina)
  }

  const bytes = await destino.save()
  return Buffer.from(bytes)
}

/**
 * mergePDFsDesdeR2: string[] -> Promise<Buffer>
 *
 * Dado un array de keys de R2, descarga todas y devuelve el Buffer fusionado
 * en el mismo orden. Si una key no existe en R2 o lo descargado no es PDF,
 * lanza Error indicando qué key falló.
 *
 * Ejemplos:
 * mergePDFsDesdeR2(["a/x.pdf", "a/y.pdf"]) === Buffer (x luego y)
 * mergePDFsDesdeR2(["a/inexistente.pdf"]) === throws Error con la key
 * mergePDFsDesdeR2([]) === throws Error("mergePDFsDesdeR2: se requiere al menos una key")
 */
export async function mergePDFsDesdeR2(keys: string[]): Promise<Buffer> {
  if (keys.length === 0) {
    throw new Error("mergePDFsDesdeR2: se requiere al menos una key")
  }

  const buffers: Buffer[] = []
  for (const key of keys) {
    try {
      buffers.push(await obtenerArchivo(key))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`mergePDFsDesdeR2: no se pudo descargar la key "${key}" (${msg})`)
    }
  }

  return mergePDFs(buffers)
}

/**
 * mergePDFsMixto: { buffers, keys } -> Promise<Buffer>
 *
 * Fusiona PDFs proveniencia mixta. Acepta `buffers` (PDFs ya en memoria) y
 * `keys` (PDFs en R2). El orden final es: primero buffers, después keys, ambos
 * en el orden recibido. Útil para anexar adjuntos guardados en R2 a un PDF
 * recién generado.
 *
 * Ejemplos:
 * mergePDFsMixto({ buffers: [pdfRecienGenerado], keys: ["adj1.pdf", "adj2.pdf"] })
 *   === Buffer (recien-generado + adj1 + adj2)
 * mergePDFsMixto({ buffers: [], keys: [] })
 *   === throws Error("mergePDFsMixto: se requiere al menos un PDF")
 */
export async function mergePDFsMixto({
  buffers = [],
  keys = [],
}: {
  buffers?: Buffer[]
  keys?: string[]
}): Promise<Buffer> {
  if (buffers.length === 0 && keys.length === 0) {
    throw new Error("mergePDFsMixto: se requiere al menos un PDF (buffers o keys)")
  }

  const desdeKeys: Buffer[] = []
  for (const key of keys) {
    try {
      desdeKeys.push(await obtenerArchivo(key))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`mergePDFsMixto: no se pudo descargar la key "${key}" (${msg})`)
    }
  }

  return mergePDFs([...buffers, ...desdeKeys])
}

/**
 * mergeYSubirAR2: { buffers?, keys?, prefijo, nombreArchivo? } -> Promise<string>
 *
 * Fusiona los PDFs (in-memory + R2) y sube el resultado a R2 bajo el prefijo
 * indicado. Devuelve la key del PDF resultante.
 *
 * Ejemplos:
 * mergeYSubirAR2({ buffers: [pdfOP], keys: ["adj/x.pdf"], prefijo: "comprobantes-pago-fletero" })
 *   === "comprobantes-pago-fletero/2026/04/uuid.pdf"
 */
export async function mergeYSubirAR2({
  buffers,
  keys,
  prefijo,
  nombreArchivo,
}: {
  buffers?: Buffer[]
  keys?: string[]
  prefijo: StoragePrefijo
  nombreArchivo?: string
}): Promise<string> {
  const merged = await mergePDFsMixto({ buffers, keys })
  return subirPDF(merged, prefijo, nombreArchivo)
}
