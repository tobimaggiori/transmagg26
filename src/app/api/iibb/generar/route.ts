import { NextResponse } from "next/server"
import { z } from "zod"
import { requireFinancialAccess, serverErrorResponse, invalidDataResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import { generarPDFLibroIIBB } from "@/lib/pdf-libro-iibb"
import { subirPDF, storageConfigurado } from "@/lib/storage"
import { prisma } from "@/lib/prisma"

const bodySchema = z.object({
  mesAnio: z.string().regex(/^\d{4}-\d{2}$/, "Formato esperado: YYYY-MM"),
})

export async function POST(req: Request) {
  try {
    const acceso = await requireFinancialAccess()
    if (!acceso.ok) return acceso.response

    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const { mesAnio } = parsed.data

    if (!storageConfigurado()) {
      return NextResponse.json(
        { error: "Storage no configurado (faltan variables R2)" },
        { status: 503 },
      )
    }

    const pdfBuffer = await generarPDFLibroIIBB(mesAnio)

    const pdfS3Key = await subirPDF(
      pdfBuffer,
      "libros-iibb",
      `IIBB-${mesAnio}.pdf`,
    )

    const operadorId = await resolverOperadorId(acceso.session.user!)

    await prisma.libroIIBB.upsert({
      where: { mesAnio },
      create: {
        mesAnio,
        pdfS3Key,
        operadorId,
      },
      update: {
        pdfS3Key,
        generadoEn: new Date(),
        operadorId,
      },
    })

    return NextResponse.json({ ok: true, pdfS3Key, mesAnio })
  } catch (error) {
    return serverErrorResponse("POST /api/iibb/generar", error)
  }
}
