/**
 * nota-cd-commands.ts
 *
 * Lógica de negocio transaccional para creación de Notas de Crédito y Débito.
 * Cada función ejecuta las precondiciones, la transacción y los efectos
 * secundarios de un tipo/subtipo específico de NC/ND.
 *
 * La route delega aquí toda la lógica de negocio después de auth y validación.
 */

import { prisma } from "@/lib/prisma"
import {
  calcularTotalesNotaCD,
  tipoCbteArcaParaNotaCD,
} from "@/lib/nota-cd-utils"
import { EstadoFacturaViaje, EstadoLiquidacionViaje } from "@/lib/viaje-workflow"

// ─── Próximo nro comprobante (server-only, usa prisma) ──────────────────────

async function calcularProximoNroComprobanteNotaCD(tipo: string): Promise<number> {
  const ultima = await prisma.notaCreditoDebito.findFirst({
    where: { tipo },
    orderBy: { nroComprobante: "desc" },
    select: { nroComprobante: true },
  })
  return (ultima?.nroComprobante ?? 0) + 1
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TotalesNotaCD = { montoNeto: number; montoIva: number; montoTotal: number }

type ResultadoNotaCD =
  | { ok: true; nota: unknown }
  | { ok: false; status: number; error: string }

/** Datos comunes a todos los tipos de NC/ND (ya validados por Zod). */
export type DatosNotaCD = {
  tipo: string
  subtipo: string
  facturaId?: string
  liquidacionId?: string
  chequeRecibidoId?: string
  montoNeto: number
  ivaPct: number
  descripcion: string
  motivoDetalle?: string
  viajesIds?: string[]
  nroComprobanteExterno?: string
  fechaComprobanteExterno?: string
  emisorExterno?: string
}

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarCrearNotaCD: DatosNotaCD string -> Promise<ResultadoNotaCD>
 *
 * Dado [los datos validados de la nota y el operadorId],
 * devuelve [la nota creada o un error con status HTTP].
 * Despacha al handler de cada tipo/subtipo y ejecuta la transacción completa.
 *
 * Ejemplos:
 * ejecutarCrearNotaCD({ tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "f1", ... }, "op1")
 *   // => { ok: true, nota: { id, tipo, estado: "EMITIDA", ... } }
 * ejecutarCrearNotaCD({ tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "anulada", ... }, "op1")
 *   // => { ok: false, status: 400, error: "La factura ya está anulada" }
 */
export async function ejecutarCrearNotaCD(
  data: DatosNotaCD,
  operadorId: string
): Promise<ResultadoNotaCD> {
  const totales = calcularTotalesNotaCD(data.montoNeto, data.ivaPct)

  switch (data.tipo) {
    case "NC_EMITIDA":
      return crearNCEmitida(data, totales, operadorId)
    case "ND_EMITIDA":
      return crearNDEmitida(data, totales, operadorId)
    case "NC_RECIBIDA":
      return crearNCRecibida(data, totales, operadorId)
    case "ND_RECIBIDA":
      return crearNDRecibida(data, totales, operadorId)
    default:
      return { ok: false, status: 400, error: "Tipo de nota no reconocido" }
  }
}

// ─── NC_EMITIDA ──────────────────────────────────────────────────────────────

async function crearNCEmitida(
  data: DatosNotaCD,
  totales: TotalesNotaCD,
  operadorId: string
): Promise<ResultadoNotaCD> {
  // NC/ND sobre LP bloqueada en esta etapa (arca-matriz-comprobantes.md)
  if (data.liquidacionId) {
    return { ok: false, status: 400, error: "La emisión de NC/ND sobre liquidaciones no está habilitada en esta etapa" }
  }
  if (!data.facturaId) {
    return { ok: false, status: 400, error: "Se requiere facturaId para NC_EMITIDA" }
  }

  const factura = await prisma.facturaEmitida.findUnique({
    where: { id: data.facturaId },
    include: {
      empresa: { select: { condicionIva: true } },
      viajes: { include: { viaje: { select: { id: true } } } },
      notasCreditoDebito: {
        where: { tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL" },
        select: { id: true },
      },
    },
  })
  if (!factura) return { ok: false, status: 404, error: "Factura no encontrada" }
  if (data.subtipo === "ANULACION_TOTAL" && factura.notasCreditoDebito.length > 0) {
    return { ok: false, status: 400, error: "La factura ya tiene una NC de anulación total emitida" }
  }

  const tipoCbte = tipoCbteArcaParaNotaCD("NC_EMITIDA", factura.tipoCbte)
  if (!tipoCbte) return { ok: false, status: 400, error: "No se puede emitir NC para este tipo de comprobante" }
  const nroComprobante = await calcularProximoNroComprobanteNotaCD("NC_EMITIDA")

  const baseData = {
    tipo: data.tipo,
    subtipo: data.subtipo,
    facturaId: data.facturaId,
    ...totales,
    descripcion: data.descripcion,
    motivoDetalle: data.motivoDetalle ?? null,
    estado: "EMITIDA" as const,
    nroComprobante,
    tipoCbte,
    arcaEstado: "PENDIENTE" as const,
    operadorId,
  }

  if (data.subtipo === "ANULACION_TOTAL") {
    const nota = await prisma.$transaction(async (tx) => {
      const nuevaNota = await tx.notaCreditoDebito.create({ data: baseData })

      for (const vef of factura.viajes) {
        await tx.viajeEnNotaCD.create({
          data: {
            notaId: nuevaNota.id,
            viajeId: vef.viajeId,
            tarifaOriginal: vef.tarifaEmpresa,
            kilosOriginal: vef.kilos ?? null,
            subtotalOriginal: vef.subtotal,
          },
        })
        // Viajes totalmente revertidos → habilitados para refacturación
        await tx.viaje.update({
          where: { id: vef.viajeId },
          data: { estadoFactura: EstadoFacturaViaje.PENDIENTE_FACTURAR },
        })
      }

      // La factura original es inmutable — el efecto económico se revierte por NC.

      return nuevaNota
    })
    return { ok: true, nota }
  }

  if (data.subtipo === "ANULACION_PARCIAL") {
    if (!data.viajesIds || data.viajesIds.length === 0) {
      return { ok: false, status: 400, error: "Se requieren viajesIds para ANULACION_PARCIAL" }
    }

    const viajeIdsEnFactura = factura.viajes.map((v) => v.viajeId)
    const todosPertenecen = data.viajesIds.every((id) => viajeIdsEnFactura.includes(id))
    if (!todosPertenecen) {
      return { ok: false, status: 400, error: "Uno o más viajes no pertenecen a la factura" }
    }

    const nota = await prisma.$transaction(async (tx) => {
      const nuevaNota = await tx.notaCreditoDebito.create({ data: baseData })

      for (const viajeId of data.viajesIds!) {
        const vef = factura.viajes.find((v) => v.viajeId === viajeId)!
        await tx.viajeEnNotaCD.create({
          data: {
            notaId: nuevaNota.id,
            viajeId,
            tarifaOriginal: vef.tarifaEmpresa,
            kilosOriginal: vef.kilos ?? null,
            subtotalOriginal: vef.subtotal,
          },
        })
        // NC parcial por viaje: el viaje seleccionado queda totalmente revertido
        // de esta factura → habilitado para refacturación.
        await tx.viaje.update({
          where: { id: viajeId },
          data: { estadoFactura: EstadoFacturaViaje.PENDIENTE_FACTURAR },
        })
      }

      return nuevaNota
    })
    return { ok: true, nota }
  }

  if (data.subtipo === "CORRECCION_IMPORTE") {
    const nota = await prisma.$transaction(async (tx) => {
      return await tx.notaCreditoDebito.create({ data: baseData })
    })
    return { ok: true, nota }
  }

  return { ok: false, status: 400, error: "Subtipo NC_EMITIDA no reconocido" }
}

// ─── NC_EMITIDA sobre Liquidación ───────────────────────────────────────────

// ─── ND_EMITIDA ──────────────────────────────────────────────────────────────

async function crearNDEmitida(
  data: DatosNotaCD,
  totales: TotalesNotaCD,
  operadorId: string
): Promise<ResultadoNotaCD> {
  // ND sobre LP no operativa en esta etapa (arca-matriz-comprobantes.md)
  if (data.liquidacionId) {
    return { ok: false, status: 400, error: "La emisión de NC/ND sobre liquidaciones no está habilitada en esta etapa" }
  }
  if (!data.facturaId) {
    return { ok: false, status: 400, error: "Se requiere facturaId para ND_EMITIDA" }
  }

  const factura = await prisma.facturaEmitida.findUnique({
    where: { id: data.facturaId },
    include: { empresa: { select: { condicionIva: true } } },
  })
  if (!factura) return { ok: false, status: 404, error: "Factura no encontrada" }

  const tipoCbte = tipoCbteArcaParaNotaCD("ND_EMITIDA", factura.tipoCbte)
  if (!tipoCbte) return { ok: false, status: 400, error: "No se puede emitir ND para este tipo de comprobante" }
  const nroComprobante = await calcularProximoNroComprobanteNotaCD("ND_EMITIDA")

  const nota = await prisma.$transaction(async (tx) => {
    return await tx.notaCreditoDebito.create({
      data: {
        tipo: data.tipo,
        subtipo: data.subtipo ?? null,
        facturaId: data.facturaId ?? null,
        liquidacionId: data.liquidacionId ?? null,
        ...totales,
        descripcion: data.descripcion,
        motivoDetalle: data.motivoDetalle ?? null,
        estado: "EMITIDA",
        nroComprobante,
        tipoCbte,
        arcaEstado: "PENDIENTE",
        operadorId,
      },
    })
  })
  return { ok: true, nota }
}

// ─── NC_RECIBIDA ─────────────────────────────────────────────────────────────

async function crearNCRecibida(
  data: DatosNotaCD,
  totales: TotalesNotaCD,
  operadorId: string
): Promise<ResultadoNotaCD> {
  // NC/ND recibidas sobre LP bloqueadas en esta etapa (arca-matriz-comprobantes.md)
  if (data.liquidacionId) {
    return { ok: false, status: 400, error: "La emisión de NC/ND sobre liquidaciones no está habilitada en esta etapa" }
  }

  if (data.subtipo === "ANULACION_LIQUIDACION") {
    if (!data.nroComprobanteExterno || !data.fechaComprobanteExterno) {
      return { ok: false, status: 400, error: "Se requieren nroComprobanteExterno y fechaComprobanteExterno para NC_RECIBIDA" }
    }
    if (!data.liquidacionId) {
      return { ok: false, status: 400, error: "Se requiere liquidacionId para NC_RECIBIDA/ANULACION_LIQUIDACION" }
    }

    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: data.liquidacionId },
      include: {
        viajes: { select: { viajeId: true } },
        notasCreditoDebito: {
          where: { tipo: "NC_RECIBIDA", subtipo: "ANULACION_LIQUIDACION" },
          select: { id: true },
        },
      },
    })
    if (!liquidacion) return { ok: false, status: 404, error: "Liquidación no encontrada" }
    if (liquidacion.notasCreditoDebito.length > 0) {
      return { ok: false, status: 400, error: "La liquidación ya tiene una NC de anulación total recibida" }
    }

    const nota = await prisma.$transaction(async (tx) => {
      const nuevaNota = await tx.notaCreditoDebito.create({
        data: {
          tipo: data.tipo,
          subtipo: data.subtipo ?? null,
          liquidacionId: data.liquidacionId,
          nroComprobanteExterno: data.nroComprobanteExterno ?? null,
          fechaComprobanteExterno: data.fechaComprobanteExterno ? new Date(data.fechaComprobanteExterno) : null,
          emisorExterno: data.emisorExterno ?? null,
          ...totales,
          descripcion: data.descripcion,
          motivoDetalle: data.motivoDetalle ?? null,
          estado: "REGISTRADA",
          operadorId,
        },
      })

      // La liquidación original es inmutable — el efecto económico se revierte por NC.

      const viajeIds = liquidacion.viajes.map((v) => v.viajeId)
      if (viajeIds.length > 0) {
        // Viajes totalmente revertidos → habilitados para reliquidación
        await tx.viaje.updateMany({
          where: { id: { in: viajeIds } },
          data: { estadoLiquidacion: EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR },
        })
      }

      return nuevaNota
    })
    return { ok: true, nota }
  }

  if (data.subtipo === "ANULACION_PARCIAL_LIQUIDACION") {
    if (!data.liquidacionId) {
      return { ok: false, status: 400, error: "Se requiere liquidacionId para NC_RECIBIDA/ANULACION_PARCIAL_LIQUIDACION" }
    }
    if (!data.viajesIds || data.viajesIds.length === 0) {
      return { ok: false, status: 400, error: "Se requieren viajesIds para ANULACION_PARCIAL_LIQUIDACION" }
    }

    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: data.liquidacionId },
      include: {
        viajes: { select: { viajeId: true, tarifaFletero: true, kilos: true, subtotal: true } },
      },
    })
    if (!liquidacion) return { ok: false, status: 404, error: "Liquidación no encontrada" }

    const viajeIdsEnLiq = liquidacion.viajes.map((v) => v.viajeId)
    const todosPertenecen = data.viajesIds.every((id) => viajeIdsEnLiq.includes(id))
    if (!todosPertenecen) {
      return { ok: false, status: 400, error: "Uno o más viajes no pertenecen a la liquidación" }
    }

    const nota = await prisma.$transaction(async (tx) => {
      const nuevaNota = await tx.notaCreditoDebito.create({
        data: {
          tipo: data.tipo,
          subtipo: data.subtipo ?? null,
          liquidacionId: data.liquidacionId,
          nroComprobanteExterno: data.nroComprobanteExterno ?? null,
          fechaComprobanteExterno: data.fechaComprobanteExterno ? new Date(data.fechaComprobanteExterno) : null,
          emisorExterno: data.emisorExterno ?? null,
          ...totales,
          descripcion: data.descripcion,
          motivoDetalle: data.motivoDetalle ?? null,
          estado: "REGISTRADA",
          operadorId,
        },
      })

      for (const viajeId of data.viajesIds!) {
        const vel = liquidacion.viajes.find((v) => v.viajeId === viajeId)!
        await tx.viajeEnNotaCD.create({
          data: {
            notaId: nuevaNota.id,
            viajeId,
            tarifaOriginal: vel.tarifaFletero,
            kilosOriginal: vel.kilos ?? null,
            subtotalOriginal: vel.subtotal,
          },
        })
        // NC parcial por viaje: el viaje seleccionado queda totalmente revertido
        // de esta liquidación → habilitado para reliquidación.
        await tx.viaje.update({
          where: { id: viajeId },
          data: { estadoLiquidacion: EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR },
        })
      }

      return nuevaNota
    })
    return { ok: true, nota }
  }

  if (data.subtipo === "CORRECCION_IMPORTE_LIQUIDACION") {
    if (!data.liquidacionId) {
      return { ok: false, status: 400, error: "Se requiere liquidacionId para NC_RECIBIDA/CORRECCION_IMPORTE_LIQUIDACION" }
    }

    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: data.liquidacionId },
    })
    if (!liquidacion) return { ok: false, status: 404, error: "Liquidación no encontrada" }

    const nota = await prisma.$transaction(async (tx) => {
      return await tx.notaCreditoDebito.create({
        data: {
          tipo: data.tipo,
          subtipo: data.subtipo ?? null,
          liquidacionId: data.liquidacionId,
          nroComprobanteExterno: data.nroComprobanteExterno ?? null,
          fechaComprobanteExterno: data.fechaComprobanteExterno ? new Date(data.fechaComprobanteExterno) : null,
          emisorExterno: data.emisorExterno ?? null,
          ...totales,
          descripcion: data.descripcion,
          motivoDetalle: data.motivoDetalle ?? null,
          estado: "REGISTRADA",
          operadorId,
        },
      })
    })
    return { ok: true, nota }
  }

  return { ok: false, status: 400, error: "Subtipo NC_RECIBIDA no reconocido" }
}

// ─── ND_RECIBIDA ─────────────────────────────────────────────────────────────

async function crearNDRecibida(
  data: DatosNotaCD,
  totales: TotalesNotaCD,
  operadorId: string
): Promise<ResultadoNotaCD> {
  // ND recibidas sobre LP bloqueadas en esta etapa (arca-matriz-comprobantes.md)
  if (data.liquidacionId) {
    return { ok: false, status: 400, error: "La emisión de NC/ND sobre liquidaciones no está habilitada en esta etapa" }
  }

  if (data.subtipo === "CHEQUE_RECHAZADO") {
    if (!data.chequeRecibidoId) {
      return { ok: false, status: 400, error: "Se requiere chequeRecibidoId para ND_RECIBIDA/CHEQUE_RECHAZADO" }
    }

    const cheque = await prisma.chequeRecibido.findUnique({
      where: { id: data.chequeRecibidoId },
    })
    if (!cheque) return { ok: false, status: 404, error: "Cheque no encontrado" }

    const nota = await prisma.$transaction(async (tx) => {
      await tx.chequeRecibido.update({
        where: { id: data.chequeRecibidoId },
        data: { estado: "RECHAZADO" },
      })

      return await tx.notaCreditoDebito.create({
        data: {
          tipo: data.tipo,
          subtipo: data.subtipo ?? null,
          chequeRecibidoId: data.chequeRecibidoId,
          nroComprobanteExterno: data.nroComprobanteExterno ?? null,
          fechaComprobanteExterno: data.fechaComprobanteExterno ? new Date(data.fechaComprobanteExterno) : null,
          emisorExterno: data.emisorExterno ?? null,
          ...totales,
          descripcion: data.descripcion,
          motivoDetalle: data.motivoDetalle ?? null,
          estado: "REGISTRADA",
          operadorId,
        },
      })
    })
    return { ok: true, nota }
  }

  if (data.subtipo === "AJUSTE_LIQUIDACION") {
    if (!data.liquidacionId) {
      return { ok: false, status: 400, error: "Se requiere liquidacionId para ND_RECIBIDA/AJUSTE_LIQUIDACION" }
    }

    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: data.liquidacionId },
    })
    if (!liquidacion) return { ok: false, status: 404, error: "Liquidación no encontrada" }

    const nota = await prisma.$transaction(async (tx) => {
      return await tx.notaCreditoDebito.create({
        data: {
          tipo: data.tipo,
          subtipo: data.subtipo ?? null,
          liquidacionId: data.liquidacionId,
          nroComprobanteExterno: data.nroComprobanteExterno ?? null,
          fechaComprobanteExterno: data.fechaComprobanteExterno ? new Date(data.fechaComprobanteExterno) : null,
          emisorExterno: data.emisorExterno ?? null,
          ...totales,
          descripcion: data.descripcion,
          motivoDetalle: data.motivoDetalle ?? null,
          estado: "REGISTRADA",
          operadorId,
        },
      })
    })
    return { ok: true, nota }
  }

  return { ok: false, status: 400, error: "Subtipo ND_RECIBIDA no reconocido" }
}
