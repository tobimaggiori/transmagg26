import { NextRequest, NextResponse } from "next/server"
import { requireFinancialAccess, notFoundResponse, serverErrorResponse } from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"
import { generarPDFOrdenPago } from "@/lib/pdf-orden-pago"
import { obtenerArchivo, subirPDF, storageConfigurado } from "@/lib/storage"

/**
 * GET /api/ordenes-pago/[id]/pdf
 *
 * Sirve el PDF cacheado en R2 si pdfS3Key existe.
 * Si no existe (OP nueva o cache invalidado tras modificación/anulación),
 * regenera, sube a R2, guarda la key y sirve.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id } = await params

  const op = await prisma.ordenPago.findUnique({
    where: { id },
    select: { id: true, nro: true, anio: true, pdfS3Key: true },
  })
  if (!op) return notFoundResponse("Orden de Pago")

  const filename = `OP-${op.nro}-${op.anio}.pdf`

  try {
    // 1) Cache hit: servir desde R2.
    if (op.pdfS3Key) {
      try {
        const buffer = await obtenerArchivo(op.pdfS3Key)
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
          },
        })
      } catch (err) {
        // Key existe en DB pero no en R2 — caemos a regenerar abajo.
        console.warn(
          `[OP /pdf] No se pudo leer pdfS3Key ${op.pdfS3Key} de OP ${id}, regenerando: ${
            err instanceof Error ? err.message : String(err)
          }`,
        )
      }
    }

    // 2) Cache miss o lectura fallida: regenerar.
    const pdfBuffer = await generarPDFOrdenPago(id)

    // Subir a R2 y guardar la key (no fatal si storage no está configurado).
    if (storageConfigurado()) {
      try {
        const key = await subirPDF(pdfBuffer, "comprobantes-pago-fletero", filename)
        await prisma.ordenPago.update({ where: { id }, data: { pdfS3Key: key } })
      } catch {
        // No bloquear la respuesta si la subida falla.
      }
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/ordenes-pago/[id]/pdf", error)
  }
}
