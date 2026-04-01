import { NextRequest, NextResponse } from "next/server"
import { requireFinancialAccess, notFoundResponse, serverErrorResponse } from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"
import { generarHTMLOrdenPago } from "@/lib/pdf-orden-pago"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id } = await params

  const existe = await prisma.ordenPago.findUnique({ where: { id }, select: { id: true } })
  if (!existe) return notFoundResponse("Orden de Pago")

  try {
    const print = req.nextUrl.searchParams.get("print") === "true"
    let html = await generarHTMLOrdenPago(id)

    if (print) {
      html = html.replace("</body>", "<script>window.onload=function(){window.print()}</script></body>")
    }

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/ordenes-pago/[id]/pdf", error)
  }
}
