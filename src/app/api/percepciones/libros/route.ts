import { NextResponse } from "next/server"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const acceso = await requireFinancialAccess()
    if (!acceso.ok) return acceso.response

    const libros = await prisma.libroPercepciones.findMany({
      orderBy: { mesAnio: "desc" },
      select: {
        id: true,
        mesAnio: true,
        pdfS3Key: true,
        generadoEn: true,
        operador: { select: { nombre: true } },
      },
    })

    return NextResponse.json(libros)
  } catch (error) {
    return serverErrorResponse("GET /api/percepciones/libros", error)
  }
}
