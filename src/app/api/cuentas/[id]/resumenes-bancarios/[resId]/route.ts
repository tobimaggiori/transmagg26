/**
 * PATCH /api/cuentas/[id]/resumenes-bancarios/[resId] — Actualiza pdfS3Key y/o estado de un resumen bancario.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"

const patchResumenSchema = z.object({
  pdfS3Key: z.string().nullable().optional(),
  estado: z.enum(["PENDIENTE", "CARGADO"]).optional(),
})

/**
 * PATCH: NextRequest, { params: { id, resId } } -> Promise<NextResponse>
 *
 * Dado el id de la cuenta y el id del resumen, actualiza pdfS3Key y/o estado.
 * Solo opera sobre resúmenes que pertenezcan a la cuenta indicada en la URL.
 *
 * Ejemplos:
 * PATCH({ pdfS3Key: "resumenes-bancarios/abc.pdf", estado: "CARGADO" }) => 200 { id, estado: "CARGADO", ... }
 * PATCH({ pdfS3Key: null, estado: "PENDIENTE" }) => 200 { id, estado: "PENDIENTE", pdfS3Key: null, ... }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resId: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id: cuentaId, resId } = await params

    const resumen = await prisma.resumenBancario.findUnique({
      where: { id: resId },
      select: { id: true, cuentaId: true },
    })
    if (!resumen || resumen.cuentaId !== cuentaId) return notFoundResponse("Resumen bancario")

    const body = await request.json()
    const parsed = patchResumenSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const updated = await prisma.resumenBancario.update({
      where: { id: resId },
      data: {
        ...(parsed.data.pdfS3Key !== undefined ? { pdfS3Key: parsed.data.pdfS3Key } : {}),
        ...(parsed.data.estado !== undefined ? { estado: parsed.data.estado } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return serverErrorResponse("PATCH /api/cuentas/[id]/resumenes-bancarios/[resId]", error)
  }
}
