import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  calcularCapitalNetoBroker,
  calcularRendimientoBroker,
  calcularSaldoContableCuenta,
  calcularSaldoDisponibleCuenta,
  calcularSaldoEnFciPropiosCuenta,
} from "@/lib/financial"
import {
  conflictResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarCuentaSchema } from "@/lib/financial-schemas"
import { sumarImportes } from "@/lib/money"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una cuenta], devuelve [el detalle completo de la cuenta con relaciones y métricas calculadas].
 * Esta función existe para la vista individual y paneles de conciliación del módulo financiero.
 *
 * Ejemplos:
 * GET(request, { params: { id: "c1" } }) === NextResponse.json({ id: "c1", saldoContable, saldoDisponible })
 * GET(request, { params: { id: "broker1" } }) === NextResponse.json({ id: "broker1", capitalNetoEnBroker, rendimiento })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cuenta no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: params.id },
      include: {
        banco: { select: { id: true, nombre: true, activo: true } },
        billetera: { select: { id: true, nombre: true, activa: true } },
        broker: { select: { id: true, nombre: true, cuit: true, activo: true } },
        movimientos: { orderBy: { fecha: "desc" } },
        fci: {
          include: {
            saldos: {
              orderBy: { fechaActualizacion: "desc" },
            },
            movimientos: {
              orderBy: { fecha: "desc" },
            },
          },
          orderBy: { nombre: "asc" },
        },
      },
    })

    if (!cuenta) return notFoundResponse("Cuenta")

    const detalleFci = cuenta.fci.map((fci) => ({
      id: fci.id,
      nombre: fci.nombre,
      saldoInformadoActual: fci.saldos[0]?.saldoInformado ?? 0,
    }))
    const saldoContable = calcularSaldoContableCuenta(
      cuenta.saldoInicial,
      cuenta.movimientos.map((m) => m.tipo === "INGRESO" ? m.monto : -m.monto)
    )
    const saldoEnFciPropios = calcularSaldoEnFciPropiosCuenta(detalleFci)
    const saldoDisponible = calcularSaldoDisponibleCuenta(saldoContable, saldoEnFciPropios)
    const capitalEnviado = sumarImportes(
      cuenta.movimientos
        .filter((m) => m.categoria === "SUSCRIPCION_FCI")
        .map((m) => m.monto)
    )
    const capitalRescatado = sumarImportes(
      cuenta.movimientos
        .filter((m) => m.categoria === "RESCATE_FCI")
        .map((m) => m.monto)
    )

    return NextResponse.json({
      ...cuenta,
      detalleFci,
      saldoContable,
      saldoEnFciPropios,
      saldoDisponible,
      capitalEnviado,
      capitalRescatado,
      capitalNetoEnBroker: calcularCapitalNetoBroker(capitalEnviado, capitalRescatado),
      rendimiento: calcularRendimientoBroker({
        capitalEnviado,
        capitalRescatado,
        saldoFcis: sumarImportes(detalleFci.map((fci) => fci.saldoInformadoActual)),
      }),
    })
  } catch (error) {
    return serverErrorResponse("GET /api/cuentas/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una cuenta y un body parcial], devuelve [la cuenta actualizada si existe y pasa validación].
 * Esta función existe para editar parámetros operativos y flags configurables desde ABM.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "c1" } }) === NextResponse.json({ id: "c1", nombre, activa })
 * PATCH(request, { params: { id: "c1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cuenta no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarCuentaSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.cuenta.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Cuenta")

    if (parsed.data.nombre && parsed.data.nombre !== existente.nombre) {
      const duplicada = await prisma.cuenta.findUnique({ where: { nombre: parsed.data.nombre } })
      if (duplicada) return conflictResponse("Ya existe una cuenta con ese nombre")
    }

    const tipoFinal = parsed.data.tipo ?? existente.tipo
    const bancoIdFinal =
      parsed.data.bancoId !== undefined ? parsed.data.bancoId : existente.bancoId
    const billeteraIdFinal =
      parsed.data.billeteraId !== undefined ? parsed.data.billeteraId : existente.billeteraId
    const brokerIdFinal =
      parsed.data.brokerId !== undefined ? parsed.data.brokerId : existente.brokerId

    const exigido = {
      BANCO: { banco: true, billetera: false, broker: false } as const,
      BILLETERA_VIRTUAL: { banco: false, billetera: true, broker: false } as const,
      BROKER: { banco: false, billetera: false, broker: true } as const,
    }[tipoFinal as "BANCO" | "BILLETERA_VIRTUAL" | "BROKER"]

    if (!exigido) {
      return invalidDataResponse({ fieldErrors: { tipo: ["Tipo inválido"] } })
    }
    if (exigido.banco !== !!bancoIdFinal) {
      return invalidDataResponse({
        fieldErrors: { bancoId: [exigido.banco ? "Requerido para tipo BANCO" : "No se permite para este tipo"] },
      })
    }
    if (exigido.billetera !== !!billeteraIdFinal) {
      return invalidDataResponse({
        fieldErrors: {
          billeteraId: [exigido.billetera ? "Requerido para tipo BILLETERA_VIRTUAL" : "No se permite para este tipo"],
        },
      })
    }
    if (exigido.broker !== !!brokerIdFinal) {
      return invalidDataResponse({
        fieldErrors: { brokerId: [exigido.broker ? "Requerido para tipo BROKER" : "No se permite para este tipo"] },
      })
    }

    if (bancoIdFinal) {
      const banco = await prisma.banco.findUnique({ where: { id: bancoIdFinal } })
      if (!banco || !banco.activo) return conflictResponse("El banco seleccionado no existe o está inactivo")
    }
    if (billeteraIdFinal) {
      const billetera = await prisma.billeteraVirtual.findUnique({ where: { id: billeteraIdFinal } })
      if (!billetera || !billetera.activa)
        return conflictResponse("La billetera seleccionada no existe o está inactiva")
    }
    if (brokerIdFinal) {
      const broker = await prisma.broker.findUnique({ where: { id: brokerIdFinal } })
      if (!broker || !broker.activo) return conflictResponse("El broker seleccionado no existe o está inactivo")
    }

    const cuenta = await prisma.cuenta.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        banco: { select: { id: true, nombre: true } },
        billetera: { select: { id: true, nombre: true } },
        broker: { select: { id: true, nombre: true, cuit: true } },
      },
    })

    return NextResponse.json(cuenta)
  } catch (error) {
    return serverErrorResponse("PATCH /api/cuentas/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una cuenta]:
 *  - Si NO tiene ninguna referencia (movimientos, pagos, cheques, tarjetas, FCI,
 *    conciliaciones, cierres, facturas de seguro, infracciones), la borra físicamente.
 *  - Si tiene al menos una referencia, hace baja lógica (activa=false + cerradaEn).
 *
 * Esta función existe para permitir eliminar definitivamente cuentas recién creadas
 * que nunca se usaron, conservando historial contable cuando ya hubo movimientos.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.cuenta.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Cuenta")

    // Chequear si tiene alguna referencia
    const [
      movs, movsDestino, chequesEm, chequesRecDep, chequesRecEnd,
      cierres, concil, facSeg, fcis, infracs, pagosFle,
      pagosEmp, pagosImp, pagosProv, tarjetas, tarjetasPrep,
      movsFciCuentaDestino,
    ] = await Promise.all([
      prisma.movimientoCuenta.count({ where: { cuentaId: params.id } }),
      prisma.movimientoCuenta.count({ where: { cuentaDestinoId: params.id } }),
      prisma.chequeEmitido.count({ where: { cuentaId: params.id } }),
      prisma.chequeRecibido.count({ where: { cuentaDepositoId: params.id } }),
      prisma.chequeRecibido.count({ where: { endosadoABrokerId: params.id } }),
      prisma.cierreMesCuenta.count({ where: { cuentaId: params.id } }),
      prisma.conciliacionDia.count({ where: { cuentaId: params.id } }),
      prisma.facturaSeguro.count({ where: { cuentaId: params.id } }),
      prisma.fci.count({ where: { cuentaId: params.id } }),
      prisma.infraccion.count({ where: { cuentaId: params.id } }),
      prisma.pagoAFletero.count({ where: { cuentaId: params.id } }),
      prisma.pagoDeEmpresa.count({ where: { cuentaId: params.id } }),
      prisma.pagoImpuesto.count({ where: { cuentaId: params.id } }),
      prisma.pagoProveedor.count({ where: { cuentaId: params.id } }),
      prisma.tarjeta.count({ where: { cuentaId: params.id } }),
      prisma.tarjetaPrepaga.count({ where: { cuentaId: params.id } }),
      prisma.movimientoFci.count({ where: { cuentaOrigenDestinoId: params.id } }),
    ])

    const totalRefs =
      movs + movsDestino + chequesEm + chequesRecDep + chequesRecEnd +
      cierres + concil + facSeg + fcis + infracs + pagosFle +
      pagosEmp + pagosImp + pagosProv + tarjetas + tarjetasPrep + movsFciCuentaDestino

    if (totalRefs === 0) {
      await prisma.cuenta.delete({ where: { id: params.id } })
      return NextResponse.json({ message: "Cuenta eliminada definitivamente", hardDelete: true })
    }

    await prisma.cuenta.update({
      where: { id: params.id },
      data: {
        activa: false,
        cerradaEn: existente.cerradaEn ?? new Date(),
      },
    })
    return NextResponse.json({ message: "Cuenta desactivada (tiene historial asociado)", hardDelete: false })
  } catch (error) {
    return serverErrorResponse("DELETE /api/cuentas/[id]", error)
  }
}
