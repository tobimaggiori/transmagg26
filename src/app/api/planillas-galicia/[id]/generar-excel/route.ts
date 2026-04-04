import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { badRequestResponse, notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { generarExcelPlanillaGalicia } from "@/lib/galicia-excel"
import { sumarImportes } from "@/lib/money"

/**
 * POST: NextRequest { params: { id: string } } -> Promise<Response>
 *
 * Dado [el id de una planilla Galicia], devuelve [un archivo `.xlsx` generado con hoja "Plantilla para emision" y actualiza la planilla como descargada].
 * Esta función existe para exportar lotes de cheques emitidos al formato compatible con Banco Galicia.
 *
 * Ejemplos:
 * POST(request, { params: { id: "pg1" } }) === Response con content-type de Excel
 * POST(request, { params: { id: "pg2" } }) === Response con attachment y nombre de archivo
 * POST(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Planilla Galicia no encontrado" }, { status: 404 })
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const planilla = await prisma.planillaGalicia.findUnique({
      where: { id: params.id },
      include: {
        cuenta: true,
        chequesEmitidos: {
          orderBy: { fechaPago: "asc" },
        },
      },
    })

    if (!planilla) return notFoundResponse("Planilla Galicia")
    if (!planilla.cuenta.tienePlanillaEmisionMasiva) {
      return badRequestResponse("La cuenta vinculada no admite planilla de emisión masiva")
    }
    if (planilla.chequesEmitidos.length > 250) {
      return badRequestResponse("La planilla no puede superar 250 filas de datos")
    }

    const buffer = await generarExcelPlanillaGalicia(
      planilla.chequesEmitidos.map((cheque) => ({
        tipoDocBeneficiario: cheque.tipoDocBeneficiario as "CUIT" | "CUIL" | "CDI",
        nroDocBeneficiario: cheque.nroDocBeneficiario,
        monto: cheque.monto,
        fechaPago: cheque.fechaPago,
        motivoPago: cheque.motivoPago as "VARIOS" | "FACTURA" | "ORDEN_DE_PAGO" | "ALQUILER" | "EXPENSAS" | "SERVICIOS",
        descripcion1: cheque.descripcion1,
        descripcion2: cheque.descripcion2,
        mailBeneficiario: cheque.mailBeneficiario,
        clausula: cheque.clausula as "A_LA_ORDEN" | "NO_A_LA_ORDEN",
        nroCheque: cheque.nroCheque,
      }))
    )

    const xlsxS3Key = `planillas-galicia/${planilla.id}.xlsx`
    const nombreArchivo = `${planilla.nombre.replace(/[^a-zA-Z0-9-_]+/g, "_") || "planilla_galicia"}.xlsx`

    await prisma.planillaGalicia.update({
      where: { id: planilla.id },
      data: {
        estado: "DESCARGADA",
        totalMonto: sumarImportes(planilla.chequesEmitidos.map((cheque) => cheque.monto)),
        cantidadCheques: planilla.chequesEmitidos.length,
        xlsxS3Key,
      },
    })

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
        "X-Planilla-Key": xlsxS3Key,
      },
    })
  } catch (error) {
    return serverErrorResponse("POST /api/planillas-galicia/[id]/generar-excel", error)
  }
}
