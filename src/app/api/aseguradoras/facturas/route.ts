/**
 * API Route: GET/POST /api/aseguradoras/facturas
 * Gestiona facturas de seguro con pólizas, cuotas de tarjeta y asientos IVA.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse, badRequestResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const aseguradoraId = searchParams.get("aseguradoraId")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  const estado = searchParams.get("estado")

  try {
    const where: Record<string, unknown> = {}
    if (aseguradoraId) where.aseguradoraId = aseguradoraId
    if (estado) where.estadoPago = estado
    if (desde || hasta) {
      const fechaWhere: Record<string, Date> = {}
      if (desde) fechaWhere.gte = new Date(desde)
      if (hasta) fechaWhere.lte = new Date(hasta)
      where.fecha = fechaWhere
    }

    const facturas = await prisma.facturaSeguro.findMany({
      where,
      include: {
        aseguradora: { select: { id: true, razonSocial: true, cuit: true } },
        polizas: { select: { id: true, nroPoliza: true, tipoBien: true, vigenciaDesde: true, vigenciaHasta: true } },
        cuotas: { select: { id: true, nroCuota: true, totalCuotas: true, monto: true, mesAnio: true, estado: true } },
        operador: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    })

    return NextResponse.json({ facturas, total: facturas.length })
  } catch (error) {
    return serverErrorResponse("GET /api/aseguradoras/facturas", error)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequestResponse("JSON inválido")
  }

  const data = body as {
    aseguradoraId: string
    nroComprobante: string
    tipoComprobante: string
    fecha: string
    periodoDesde: string
    periodoHasta: string
    neto: number
    iva: number
    total: number
    formaPago: string
    medioPagoContado?: string
    cuentaId?: string
    tarjetaId?: string
    cantCuotas?: number
    primerMesAnio?: string
    polizas: Array<{
      tipoBien: string
      camionId?: string
      descripcionBien?: string
      nroPoliza: string
      cobertura?: string
      vigenciaDesde: string
      vigenciaHasta: string
    }>
  }

  if (
    !data.aseguradoraId ||
    !data.nroComprobante ||
    !data.fecha ||
    !data.periodoDesde ||
    !data.periodoHasta ||
    data.neto === undefined ||
    data.iva === undefined ||
    data.total === undefined ||
    !data.formaPago ||
    !Array.isArray(data.polizas) ||
    data.polizas.length === 0
  ) {
    return badRequestResponse("Campos requeridos faltantes")
  }

  try {
    const operadorId = await resolverOperadorId({
      id: acceso.session.user.id,
      email: acceso.session.user.email,
    })

    const aseguradora = await prisma.proveedor.findUnique({ where: { id: data.aseguradoraId } })
    if (!aseguradora) return badRequestResponse("Aseguradora no encontrada")

    const factura = await prisma.$transaction(async (tx) => {
      // 1. Crear FacturaSeguro
      const nuevaFactura = await tx.facturaSeguro.create({
        data: {
          aseguradoraId: data.aseguradoraId,
          nroComprobante: data.nroComprobante,
          tipoComprobante: data.tipoComprobante ?? "A",
          fecha: new Date(data.fecha),
          periodoDesde: new Date(data.periodoDesde),
          periodoHasta: new Date(data.periodoHasta),
          neto: data.neto,
          iva: data.iva,
          total: data.total,
          formaPago: data.formaPago,
          medioPagoContado: data.medioPagoContado ?? null,
          cuentaId: data.cuentaId ?? null,
          tarjetaId: data.tarjetaId ?? null,
          cantCuotas: data.cantCuotas ?? null,
          estadoPago: "PENDIENTE",
          operadorId,
        },
      })

      // 2. Vincular/crear pólizas
      for (const polizaData of data.polizas) {
        const existente = await tx.polizaSeguro.findFirst({
          where: { nroPoliza: polizaData.nroPoliza },
        })

        if (existente) {
          await tx.polizaSeguro.update({
            where: { id: existente.id },
            data: {
              facturaSeguroId: nuevaFactura.id,
              proveedorId: data.aseguradoraId,
              aseguradora: aseguradora.razonSocial,
              tipoBien: polizaData.tipoBien,
              camionId: polizaData.camionId ?? null,
              descripcionBien: polizaData.descripcionBien ?? null,
              cobertura: polizaData.cobertura ?? null,
              vigenciaDesde: new Date(polizaData.vigenciaDesde),
              vigenciaHasta: new Date(polizaData.vigenciaHasta),
            },
          })
        } else {
          await tx.polizaSeguro.create({
            data: {
              nroPoliza: polizaData.nroPoliza,
              aseguradora: aseguradora.razonSocial,
              proveedorId: data.aseguradoraId,
              facturaSeguroId: nuevaFactura.id,
              tipoBien: polizaData.tipoBien,
              camionId: polizaData.camionId ?? null,
              descripcionBien: polizaData.descripcionBien ?? null,
              cobertura: polizaData.cobertura ?? null,
              vigenciaDesde: new Date(polizaData.vigenciaDesde),
              vigenciaHasta: new Date(polizaData.vigenciaHasta),
              activa: true,
            },
          })
        }
      }

      // 3. Crear AsientoIva
      await tx.asientoIva.create({
        data: {
          tipo: "COMPRA",
          tipoReferencia: "FACTURA_SEGURO",
          baseImponible: data.neto,
          alicuota: 21,
          montoIva: data.iva,
          periodo: new Date(data.fecha).toISOString().slice(0, 7),
          facturaSeguroId: nuevaFactura.id,
        },
      })

      // 4. Si CONTADO y tiene cuenta: crear MovimientoSinFactura
      if (data.formaPago === "CONTADO" && data.cuentaId) {
        await tx.movimientoSinFactura.create({
          data: {
            cuentaId: data.cuentaId,
            tipo: "EGRESO",
            categoria: "PAGO_SERVICIO",
            monto: data.total,
            fecha: new Date(data.fecha),
            descripcion: `Seguro — ${aseguradora.razonSocial} ${data.nroComprobante}`,
            operadorId,
          },
        })

        await tx.facturaSeguro.update({
          where: { id: nuevaFactura.id },
          data: { estadoPago: "PAGADO" },
        })
      }

      // 5. Si TARJETA: crear cuotas
      if (data.formaPago === "TARJETA" && data.tarjetaId && data.cantCuotas && data.primerMesAnio) {
        const montoCuota = Math.round((data.total / data.cantCuotas) * 100) / 100
        const cuotas = []

        for (let i = 0; i < data.cantCuotas; i++) {
          const [anio, mes] = data.primerMesAnio.split("-").map(Number)
          const fecha = new Date(anio, mes - 1 + i, 1)
          const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`

          cuotas.push({
            facturaSeguroId: nuevaFactura.id,
            tarjetaId: data.tarjetaId,
            nroCuota: i + 1,
            totalCuotas: data.cantCuotas,
            monto: montoCuota,
            mesAnio,
            estado: "PENDIENTE",
          })
        }

        await tx.cuotaFacturaSeguro.createMany({ data: cuotas })
        await tx.facturaSeguro.update({
          where: { id: nuevaFactura.id },
          data: { montoCuota },
        })
      }

      return tx.facturaSeguro.findUnique({
        where: { id: nuevaFactura.id },
        include: {
          aseguradora: { select: { id: true, razonSocial: true } },
          polizas: true,
          cuotas: true,
        },
      })
    })

    return NextResponse.json({ factura }, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/aseguradoras/facturas", error)
  }
}
