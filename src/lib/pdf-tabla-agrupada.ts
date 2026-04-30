/**
 * pdf-tabla-agrupada.ts — Helper genérico para PDFs con estructura
 * "header + N grupos cada uno con (título, columnas, filas, subtotal) +
 * total general + footer".
 *
 * Lo usan los reportes de Detalle de Gastos, IIBB y LP-vs-Facturas. Si te
 * encontrás duplicando este patrón en otro PDF, importalo desde acá en
 * lugar de copiar/pegar.
 *
 * Estilo y márgenes vienen de `src/lib/pdf-style.ts` per CLAUDE.md regla 8.
 */

import PDFDocument from "pdfkit"
import { PDF_FONT, PDF_COLOR, PDF_MARGIN } from "@/lib/pdf-style"

export type Orientacion = "portrait" | "landscape"

export type ColumnDef = {
  label: string
  width: number
  align?: "left" | "right"
}

export type GrupoDef = {
  /** Encabezado del grupo (ej: "PROVINCIA: BUENOS AIRES" o "RUBRO: COMBUSTIBLES"). */
  titulo: string
  /** Filas del grupo. Cada fila debe tener tantas celdas como columnas. */
  filas: string[][]
  /** Valores de la fila de subtotal. Las que sean null/undefined van vacías. */
  subtotal: (string | null | undefined)[]
}

export type TotalGeneralDef = {
  label: string
  valores: (string | null | undefined)[]
}

export type ReporteAgrupado = {
  titulo: string
  subtitulo: string
  orientacion?: Orientacion
  columnas: ColumnDef[]
  grupos: GrupoDef[]
  totalGeneral?: TotalGeneralDef
  /** Mensaje cuando no hay datos. Default: "Sin datos para el período seleccionado." */
  mensajeVacio?: string
}

const FECHA_GENERACION_FOOTER = "Trans-Magg S.R.L."

function fmtFecha(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
}

function pageDims(orientacion: Orientacion): { width: number; height: number; content: number; pageBreakY: number } {
  const portrait = { width: 595, height: 842 }
  const landscape = { width: 842, height: 595 }
  const dims = orientacion === "landscape" ? landscape : portrait
  return {
    width: dims.width,
    height: dims.height,
    content: dims.width - PDF_MARGIN * 2,
    pageBreakY: dims.height - PDF_MARGIN - 30,
  }
}

const ROW_HEIGHT = 14
const HEADER_ROW_HEIGHT = 16
const TOTAL_ROW_HEIGHT = 18

/**
 * generarPDFReporteAgrupado: ReporteAgrupado -> Promise<Buffer>
 *
 * Devuelve el buffer del PDF listo para servir.
 */
export function generarPDFReporteAgrupado(reporte: ReporteAgrupado): Promise<Buffer> {
  const orientacion = reporte.orientacion ?? "portrait"
  const dims = pageDims(orientacion)
  const colX: number[] = []
  let acc = PDF_MARGIN
  for (const c of reporte.columnas) {
    colX.push(acc)
    acc += c.width
  }
  // ColumnDef widths deben sumar dims.content. Si no, lo dejo pasar — el
  // que diseña el reporte es responsable.

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: PDF_MARGIN,
      size: "A4",
      layout: orientacion,
    })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    // Header
    doc.font("Helvetica-Bold").fontSize(PDF_FONT.TITLE).fillColor(PDF_COLOR.TEXT)
      .text("Trans-Magg S.R.L.", PDF_MARGIN, PDF_MARGIN)
    doc.font("Helvetica").fontSize(PDF_FONT.SUBTITLE).fillColor(PDF_COLOR.TEXT_MUTED)
      .text("CUIT 30-70938168-3")
    doc.moveDown(0.5)
    doc.font("Helvetica-Bold").fontSize(PDF_FONT.SECTION).fillColor(PDF_COLOR.TEXT).text(reporte.titulo)
    doc.font("Helvetica").fontSize(PDF_FONT.CAPTION).fillColor(PDF_COLOR.TEXT_MUTED).text(reporte.subtitulo)
    doc.moveDown(0.4)
    doc.moveTo(PDF_MARGIN, doc.y).lineTo(dims.width - PDF_MARGIN, doc.y)
      .strokeColor(PDF_COLOR.NAVY).lineWidth(1).stroke()
    doc.moveDown(0.5)
    doc.fillColor(PDF_COLOR.TEXT)

    // Body
    if (reporte.grupos.length === 0) {
      doc.font("Helvetica").fontSize(PDF_FONT.CAPTION).fillColor(PDF_COLOR.TEXT_DIM)
        .text(reporte.mensajeVacio ?? "Sin datos para el período seleccionado.", PDF_MARGIN, doc.y)
      doc.fillColor(PDF_COLOR.TEXT)
    } else {
      for (const grupo of reporte.grupos) {
        if (doc.y > dims.pageBreakY - 80) doc.addPage()

        // Título del grupo
        doc.font("Helvetica-Bold").fontSize(PDF_FONT.SECTION).fillColor(PDF_COLOR.TEXT)
          .text(grupo.titulo, PDF_MARGIN, doc.y)
        doc.moveDown(0.3)

        // Header de tabla
        if (doc.y > dims.pageBreakY) doc.addPage()
        let y = doc.y
        doc.rect(PDF_MARGIN, y, dims.content, HEADER_ROW_HEIGHT).fill(PDF_COLOR.HEADER_BG)
        doc.fillColor(PDF_COLOR.TEXT).font("Helvetica-Bold").fontSize(PDF_FONT.TABLE_HEAD)
        for (let i = 0; i < reporte.columnas.length; i++) {
          const col = reporte.columnas[i]
          doc.text(col.label, colX[i], y + 4, {
            width: col.width, align: col.align ?? "left", lineBreak: false,
          })
        }
        doc.font("Helvetica").fontSize(PDF_FONT.TABLE_BODY)
        doc.y = y + HEADER_ROW_HEIGHT + 2

        // Filas
        for (const fila of grupo.filas) {
          if (doc.y > dims.pageBreakY) doc.addPage()
          y = doc.y
          doc.font("Helvetica").fontSize(PDF_FONT.TABLE_BODY).fillColor(PDF_COLOR.TEXT)
          for (let i = 0; i < reporte.columnas.length; i++) {
            const col = reporte.columnas[i]
            doc.text(fila[i] ?? "", colX[i], y + 2, {
              width: col.width, align: col.align ?? "left", lineBreak: false, ellipsis: true,
            })
          }
          doc.y = y + ROW_HEIGHT
        }

        // Subtotal
        if (doc.y > dims.pageBreakY) doc.addPage()
        y = doc.y
        doc.rect(PDF_MARGIN, y, dims.content, TOTAL_ROW_HEIGHT).fill(PDF_COLOR.TOTALS_BG)
        doc.fillColor(PDF_COLOR.TEXT).font("Helvetica-Bold").fontSize(PDF_FONT.TABLE_TOTAL)
        for (let i = 0; i < reporte.columnas.length; i++) {
          const col = reporte.columnas[i]
          const valor = grupo.subtotal[i]
          if (valor != null) {
            doc.text(valor, colX[i], y + 5, {
              width: col.width, align: col.align ?? "left", lineBreak: false,
            })
          }
        }
        doc.font("Helvetica").fontSize(PDF_FONT.TABLE_BODY)
        doc.y = y + TOTAL_ROW_HEIGHT + 6
      }

      // Total general
      if (reporte.totalGeneral) {
        if (doc.y > dims.pageBreakY) doc.addPage()
        const y = doc.y
        doc.rect(PDF_MARGIN, y, dims.content, TOTAL_ROW_HEIGHT + 2).fill(PDF_COLOR.NAVY)
        doc.fillColor("#fff").font("Helvetica-Bold").fontSize(PDF_FONT.TABLE_TOTAL)
        // Label en columna 0 si no hay valor en esa columna; si hay, lo respeta.
        if (!reporte.totalGeneral.valores[0]) {
          doc.text(reporte.totalGeneral.label, colX[0] + 6, y + 5, {
            width: dims.content, lineBreak: false,
          })
        } else {
          doc.text(reporte.totalGeneral.label, colX[0] + 6, y + 5, {
            width: reporte.columnas[0].width, lineBreak: false,
          })
        }
        for (let i = 0; i < reporte.columnas.length; i++) {
          const col = reporte.columnas[i]
          const valor = reporte.totalGeneral.valores[i]
          if (valor != null) {
            doc.text(valor, colX[i], y + 5, {
              width: col.width, align: col.align ?? "left", lineBreak: false,
            })
          }
        }
        doc.fillColor(PDF_COLOR.TEXT).font("Helvetica").fontSize(PDF_FONT.TABLE_BODY)
        doc.y = y + TOTAL_ROW_HEIGHT + 6
      }
    }

    // Footer
    doc.moveDown(0.8)
    doc.font("Helvetica").fontSize(PDF_FONT.FOOTER).fillColor(PDF_COLOR.TEXT_DIM)
      .text(`Generado el ${fmtFecha(new Date())} · ${FECHA_GENERACION_FOOTER}`, PDF_MARGIN, doc.y, {
        align: "center", width: dims.content,
      })

    doc.end()
  })
}
