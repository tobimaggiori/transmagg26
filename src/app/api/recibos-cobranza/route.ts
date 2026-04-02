/**
 * API Routes para Recibos de Cobranza.
 * GET  /api/recibos-cobranza?empresaId=...&desde=...&hasta=...
 * POST /api/recibos-cobranza — Crea un nuevo recibo, registra medios de pago,
 *      actualiza facturas a COBRADA, crea movimientos y cheques recibidos.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, puedeAcceder } from "@/lib/permissions"
import { subirPDF } from "@/lib/storage"
import { generarPDFReciboCobranza } from "@/lib/pdf-recibo-cobranza"
import type { Rol } from "@/types"

// ─── Schema de validación ─────────────────────────────────────────────────────

const medioPagoSchema = z.object({
  tipo: z.enum(["TRANSFERENCIA", "ECHEQ", "CHEQUE_FISICO"]),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  cuentaId: z.string().uuid().optional(),
  fechaTransferencia: z.string().optional(),
  referencia: z.string().optional(),
  nroCheque: z.string().optional(),
  bancoEmisor: z.string().optional(),
  fechaEmision: z.string().optional(),
  fechaPago: z.string().optional(),
})

const crearReciboSchema = z.object({
  empresaId: z.string().uuid(),
  facturaIds: z.array(z.string().uuid()).min(1, "Debe incluir al menos una factura"),
  mediosPago: z.array(medioPagoSchema).min(1, "Debe incluir al menos un medio de pago"),
  retencionGanancias: z.number().min(0).default(0),
  retencionIIBB: z.number().min(0).default(0),
  retencionSUSS: z.number().min(0).default(0),
  fecha: z.string(),
})

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve recibos de cobranza, opcionalmente filtrados por empresa y fechas.
 * Solo roles con acceso a "facturas" pueden consultar.
 *
 * Query params: empresaId?, desde?, hasta?
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!puedeAcceder(session.user.rol as Rol, "facturas")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const params = req.nextUrl.searchParams
  const empresaId = params.get("empresaId")
  const desde = params.get("desde")
  const hasta = params.get("hasta")

  const where: Record<string, unknown> = {}
  if (empresaId) where.empresaId = empresaId
  if (desde || hasta) {
    where.fecha = {
      ...(desde ? { gte: new Date(desde) } : {}),
      ...(hasta ? { lte: new Date(hasta + "T23:59:59") } : {}),
    }
  }

  const recibos = await prisma.reciboCobranza.findMany({
    where,
    include: {
      empresa: { select: { razonSocial: true, cuit: true } },
      operador: { select: { nombre: true, apellido: true } },
      facturas: { select: { id: true, nroComprobante: true, tipoCbte: true, total: true } },
      mediosPago: true,
    },
    orderBy: { creadoEn: "desc" },
  })

  return NextResponse.json(recibos)
}

// ─── POST ─────────────────────────────────────────────────────────────────────

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Crea un nuevo Recibo de Cobranza con toda su contabilidad asociada:
 * 1. Valida facturas pendientes de la empresa
 * 2. Valida que el total de medios de pago + retenciones = total facturas
 * 3. En transacción: crea recibo, medios de pago, actualiza facturas a COBRADA,
 *    crea MovimientoSinFactura para transferencias, ChequeRecibido para cheques
 * 4. Genera PDF y sube a R2
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = crearReciboSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 })
  }

  const {
    empresaId,
    facturaIds,
    mediosPago,
    retencionGanancias,
    retencionIIBB,
    retencionSUSS,
    fecha,
  } = parsed.data

  // Obtener operadorId desde sesión
  const operadorDb = await prisma.usuario.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })
  if (!operadorDb) return NextResponse.json({ error: "Operador no encontrado" }, { status: 400 })
  const operadorId = operadorDb.id

  // Validar facturas: deben pertenecer a la empresa y estar pendientes
  const facturas = await prisma.facturaEmitida.findMany({
    where: { id: { in: facturaIds }, empresaId, estado: "EMITIDA", estadoCobro: "PENDIENTE" },
  })

  if (facturas.length !== facturaIds.length) {
    return NextResponse.json(
      { error: "Alguna factura no existe, no pertenece a la empresa o ya fue cobrada" },
      { status: 400 }
    )
  }

  const totalComprobantes = facturas.reduce((s, f) => s + f.total, 0)
  const totalMedios = mediosPago.reduce((s, m) => s + m.monto, 0)
  const totalRetenciones = retencionGanancias + retencionIIBB + retencionSUSS
  const totalCobrado = totalMedios

  // Validar que medios + retenciones ≈ total facturas
  const diferencia = Math.abs(totalComprobantes - totalMedios - totalRetenciones)
  if (diferencia > 0.01) {
    return NextResponse.json(
      {
        error: `La suma de medios de pago (${totalMedios.toFixed(2)}) + retenciones (${totalRetenciones.toFixed(2)}) no coincide con el total de facturas (${totalComprobantes.toFixed(2)})`,
      },
      { status: 400 }
    )
  }

  // ─── Transacción ──────────────────────────────────────────────────────────

  const reciboCreado = await prisma.$transaction(async (tx) => {
    // Número correlativo
    const maxNro = await tx.reciboCobranza.aggregate({ _max: { nro: true } })
    const nro = (maxNro._max.nro ?? 0) + 1

    // Crear recibo
    const recibo = await tx.reciboCobranza.create({
      data: {
        nro,
        ptoVenta: 1,
        fecha: new Date(fecha),
        empresaId,
        totalCobrado,
        totalRetenciones,
        totalComprobantes,
        retencionGanancias,
        retencionIIBB,
        retencionSUSS,
        operadorId,
      },
    })

    // Crear medios de pago
    for (const m of mediosPago) {
      await tx.medioPagoRecibo.create({
        data: {
          reciboId: recibo.id,
          tipo: m.tipo,
          monto: m.monto,
          cuentaId: m.cuentaId ?? null,
          fechaTransferencia: m.fechaTransferencia ? new Date(m.fechaTransferencia) : null,
          referencia: m.referencia ?? null,
          nroCheque: m.nroCheque ?? null,
          bancoEmisor: m.bancoEmisor ?? null,
          fechaEmision: m.fechaEmision ? new Date(m.fechaEmision) : null,
          fechaPago: m.fechaPago ? new Date(m.fechaPago) : null,
        },
      })

      // Para TRANSFERENCIA: crear MovimientoSinFactura INGRESO
      if (m.tipo === "TRANSFERENCIA" && m.cuentaId) {
        await tx.movimientoSinFactura.create({
          data: {
            cuentaId: m.cuentaId,
            tipo: "INGRESO",
            categoria: "TRANSFERENCIA_RECIBIDA",
            monto: m.monto,
            fecha: m.fechaTransferencia ? new Date(m.fechaTransferencia) : new Date(fecha),
            descripcion: `Cobro recibo ${String(1).padStart(4, "0")}-${String(nro).padStart(8, "0")} — ${facturas.length} factura(s)`,
            referencia: m.referencia ?? null,
            operadorId,
          },
        })
      }

      // Para ECHEQ o CHEQUE_FISICO: crear ChequeRecibido
      if (m.tipo === "ECHEQ" || m.tipo === "CHEQUE_FISICO") {
        await tx.chequeRecibido.create({
          data: {
            empresaId,
            nroCheque: m.nroCheque ?? "S/N",
            bancoEmisor: m.bancoEmisor ?? "Desconocido",
            monto: m.monto,
            fechaEmision: m.fechaEmision ? new Date(m.fechaEmision) : new Date(fecha),
            fechaCobro: m.fechaPago ? new Date(m.fechaPago) : new Date(fecha),
            estado: "EN_CARTERA",
            esElectronico: m.tipo === "ECHEQ",
            operadorId,
            reciboCobranzaId: recibo.id,
          },
        })
      }
    }

    // Actualizar facturas: asignar recibo y marcar como COBRADA
    await tx.facturaEmitida.updateMany({
      where: { id: { in: facturaIds } },
      data: { reciboId: recibo.id, estadoCobro: "COBRADA" },
    })

    // Crear PagoDeEmpresa por cada factura para impactar la CC de la empresa (Fix 1.7)
    // Distribuir el total cobrado (medios de pago) proporcionalmente entre facturas
    const totalFacturasLocal = facturas.reduce((s, f) => s + f.total, 0)
    for (const f of facturas) {
      const proporcion = totalFacturasLocal > 0 ? f.total / totalFacturasLocal : 1 / facturas.length
      const montoAplicado = Math.round(totalCobrado * proporcion * 100) / 100
      await tx.pagoDeEmpresa.create({
        data: {
          empresaId,
          facturaId: f.id,
          tipoPago: "RECIBO_COBRANZA",
          monto: montoAplicado,
          referencia: `Recibo ${String(recibo.ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`,
          fechaPago: new Date(fecha),
          operadorId,
        },
      })
    }

    return recibo
  })

  // ─── Generar PDF y subir a R2 ─────────────────────────────────────────────

  try {
    const pdfBuffer = await generarPDFReciboCobranza(reciboCreado.id)
    const key = await subirPDF(pdfBuffer, "recibos-cobranza", `recibo-${reciboCreado.nro}.pdf`)
    await prisma.reciboCobranza.update({
      where: { id: reciboCreado.id },
      data: { pdfS3Key: key },
    })
  } catch (e) {
    // PDF no crítico — el recibo ya fue creado
    console.error("Error generando PDF del recibo:", e)
  }

  return NextResponse.json({ id: reciboCreado.id, nro: reciboCreado.nro }, { status: 201 })
}
