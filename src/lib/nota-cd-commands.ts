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
  calcularTotalesDesdeItems,
  tipoCbteArcaParaNotaCD,
  resolverTipoCbteNotaEmpresa,
  resolverPuntoVentaNotaEmpresa,
} from "@/lib/nota-cd-utils"
import { validarComprobanteHabilitado } from "@/lib/arca/catalogo"
import { leerComprobantesHabilitados } from "@/lib/arca/leer-config-habilitados"
import { cargarConfigArca } from "@/lib/arca/config"
import { calcularSaldoPendienteFactura } from "@/lib/cuenta-corriente"
import { EstadoFacturaViaje } from "@/lib/viaje-workflow"
import { parsearFechaLocalMediodia } from "@/lib/date-local"

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
  fechaEmision?: string
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
      return crearNCRecibida(data)
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
  if (!data.facturaId && !data.liquidacionId) {
    return { ok: false, status: 400, error: "Se requiere facturaId o liquidacionId para NC_EMITIDA" }
  }

  // Resolver comprobante origen (factura o liquidación)
  let tipoCbteOrigen: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let factura: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let liquidacion: any = null

  if (data.facturaId) {
    factura = await prisma.facturaEmitida.findUnique({
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
    tipoCbteOrigen = factura.tipoCbte
  } else {
    liquidacion = await prisma.liquidacion.findUnique({
      where: { id: data.liquidacionId },
      include: {
        fletero: { select: { condicionIva: true } },
        viajes: { include: { viaje: { select: { id: true } } } },
      },
    })
    if (!liquidacion) return { ok: false, status: 404, error: "Liquidación no encontrada" }
    if (!liquidacion.tipoCbte) return { ok: false, status: 400, error: "La liquidación no tiene tipo de comprobante asignado" }
    tipoCbteOrigen = liquidacion.tipoCbte
  }

  const tipoCbte = tipoCbteArcaParaNotaCD("NC_EMITIDA", tipoCbteOrigen)
  if (!tipoCbte) return { ok: false, status: 400, error: "No se puede emitir NC para este tipo de comprobante" }

  const habilitados = await leerComprobantesHabilitados()
  const errorHab = validarComprobanteHabilitado(tipoCbte, habilitados)
  if (errorHab) return { ok: false, status: 400, error: errorHab }

  const nroComprobante = await calcularProximoNroComprobanteNotaCD("NC_EMITIDA")
  const creadoEn = data.fechaEmision ? new Date(data.fechaEmision + "T12:00:00") : new Date()
  const periodo = creadoEn.toISOString().slice(0, 7)

  const baseData = {
    tipo: data.tipo,
    subtipo: data.subtipo,
    facturaId: data.facturaId ?? null,
    liquidacionId: data.liquidacionId ?? null,
    ...totales,
    descripcion: data.descripcion,
    motivoDetalle: data.motivoDetalle ?? null,
    estado: "EMITIDA" as const,
    nroComprobante,
    tipoCbte,
    arcaEstado: "PENDIENTE" as const,
    operadorId,
    creadoEn,
  }

  // Validar viajesIds si se enviaron
  const comprobante = factura ?? liquidacion
  if (data.viajesIds && data.viajesIds.length > 0 && comprobante) {
    const viajeIdsEnComprobante = comprobante.viajes.map((v: { viajeId: string }) => v.viajeId)
    const todosPertenecen = data.viajesIds.every((id: string) => viajeIdsEnComprobante.includes(id))
    if (!todosPertenecen) {
      return { ok: false, status: 400, error: "Uno o más viajes no pertenecen al comprobante" }
    }
  }

  const nota = await prisma.$transaction(async (tx) => {
    const nuevaNota = await tx.notaCreditoDebito.create({ data: baseData })

    // Liberar viajes seleccionados por el usuario (opcional)
    if (data.viajesIds && data.viajesIds.length > 0 && comprobante) {
      for (const viajeId of data.viajesIds) {
        const vef = comprobante.viajes.find((v: { viajeId: string }) => v.viajeId === viajeId)
        if (vef) {
          await tx.viajeEnNotaCD.create({
            data: {
              notaId: nuevaNota.id,
              viajeId,
              tarifaOriginal: vef.tarifaEmpresa ?? vef.tarifaFletero ?? 0,
              kilosOriginal: vef.kilos ?? null,
              subtotalOriginal: vef.subtotal,
            },
          })
          await tx.viaje.update({
            where: { id: viajeId },
            data: { estadoFactura: EstadoFacturaViaje.PENDIENTE_FACTURAR },
          })
        }
      }
    }

    // AsientoIva: NC resta del IVA ventas (base e IVA negativos)
    await tx.asientoIva.create({
      data: {
        notaCreditoDebitoId: nuevaNota.id,
        tipoReferencia: "NC_EMITIDA",
        tipo: "VENTA",
        baseImponible: -totales.montoNeto,
        alicuota: data.ivaPct,
        montoIva: -totales.montoIva,
        periodo,
      },
    })

    return nuevaNota
  })
  return { ok: true, nota }
}

// ─── ND_EMITIDA ──────────────────────────────────────────────────────────────

async function crearNDEmitida(
  data: DatosNotaCD,
  totales: TotalesNotaCD,
  operadorId: string
): Promise<ResultadoNotaCD> {
  if (!data.facturaId && !data.liquidacionId) {
    return { ok: false, status: 400, error: "Se requiere facturaId o liquidacionId para ND_EMITIDA" }
  }

  let tipoCbteOrigen: number

  if (data.facturaId) {
    const factura = await prisma.facturaEmitida.findUnique({
      where: { id: data.facturaId },
      select: { tipoCbte: true },
    })
    if (!factura) return { ok: false, status: 404, error: "Factura no encontrada" }
    tipoCbteOrigen = factura.tipoCbte
  } else {
    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: data.liquidacionId },
      select: { tipoCbte: true },
    })
    if (!liquidacion) return { ok: false, status: 404, error: "Liquidación no encontrada" }
    if (!liquidacion.tipoCbte) return { ok: false, status: 400, error: "La liquidación no tiene tipo de comprobante asignado" }
    tipoCbteOrigen = liquidacion.tipoCbte
  }

  const tipoCbte = tipoCbteArcaParaNotaCD("ND_EMITIDA", tipoCbteOrigen)
  if (!tipoCbte) return { ok: false, status: 400, error: "No se puede emitir ND para este tipo de comprobante" }

  const habilitados = await leerComprobantesHabilitados()
  const errorHab = validarComprobanteHabilitado(tipoCbte, habilitados)
  if (errorHab) return { ok: false, status: 400, error: errorHab }

  const nroComprobante = await calcularProximoNroComprobanteNotaCD("ND_EMITIDA")
  const creadoEn = data.fechaEmision ? new Date(data.fechaEmision + "T12:00:00") : new Date()
  const periodo = creadoEn.toISOString().slice(0, 7)

  const nota = await prisma.$transaction(async (tx) => {
    const nuevaNota = await tx.notaCreditoDebito.create({
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
        creadoEn,
      },
    })

    // AsientoIva: ND suma al IVA ventas (base e IVA positivos)
    await tx.asientoIva.create({
      data: {
        notaCreditoDebitoId: nuevaNota.id,
        tipoReferencia: "ND_EMITIDA",
        tipo: "VENTA",
        baseImponible: totales.montoNeto,
        alicuota: data.ivaPct,
        montoIva: totales.montoIva,
        periodo,
      },
    })

    return nuevaNota
  })
  return { ok: true, nota }
}

// ─── NC_RECIBIDA ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function crearNCRecibida(data: DatosNotaCD): Promise<ResultadoNotaCD> {
  return { ok: false, status: 400, error: "Subtipo NC_RECIBIDA no reconocido" }
}

// ─── ND_RECIBIDA ─────────────────────────────────────────────────────────────

async function crearNDRecibida(
  data: DatosNotaCD,
  totales: TotalesNotaCD,
  operadorId: string
): Promise<ResultadoNotaCD> {
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

  return { ok: false, status: 400, error: "Subtipo ND_RECIBIDA no reconocido" }
}

// ─── Flujo items-based para NC/ND sobre facturas empresa ────────────────────

export type DatosNotaEmpresaEmitida = {
  facturaId: string
  tipoNota: "NC" | "ND"
  fechaEmision?: string
  items: Array<{ concepto: string; subtotal: number }>
  viajesIds?: string[]
}

/**
 * crearNotaEmpresaEmitida: DatosNotaEmpresaEmitida string -> Promise<ResultadoNotaCD>
 *
 * Dado [los datos de la nota con ítems y el operadorId],
 * devuelve [la nota creada con ítems o un error].
 *
 * Valida regla de saldo: saldo > 0 → NC, saldo ≤ 0 → ND.
 * Resuelve tipoCbte y PV automáticamente desde la factura origen.
 * Persiste cbteAsoc para ARCA.
 * NO toca estados de viajes.
 */
export async function crearNotaEmpresaEmitida(
  data: DatosNotaEmpresaEmitida,
  operadorId: string
): Promise<ResultadoNotaCD> {
  const { facturaId, tipoNota, items } = data

  // 1. Cargar factura con viajes
  const factura = await prisma.facturaEmitida.findUnique({
    where: { id: facturaId },
    select: {
      id: true, tipoCbte: true, ptoVenta: true, nroComprobante: true,
      ivaPct: true, total: true, estadoArca: true, emitidaEn: true,
      empresa: { select: { id: true, cuit: true, condicionIva: true } },
      viajes: { select: { viajeId: true, tarifaEmpresa: true, kilos: true, subtotal: true } },
    },
  })
  if (!factura) return { ok: false, status: 404, error: "Factura no encontrada" }

  // 2. Validar autorizada ARCA
  if (factura.estadoArca !== "AUTORIZADA") {
    return { ok: false, status: 422, error: "La factura debe estar autorizada en ARCA para emitir NC/ND" }
  }

  // 3. Regla de saldo
  const saldo = await calcularSaldoPendienteFactura(facturaId)
  if (tipoNota === "NC" && saldo <= 0) {
    return { ok: false, status: 422, error: "No se puede emitir NC: la factura está completamente cobrada" }
  }
  if (tipoNota === "ND" && saldo > 0) {
    return { ok: false, status: 422, error: "No se puede emitir ND: la factura aún tiene saldo pendiente de cobro" }
  }

  // 4. Resolver tipoCbte
  const tipoCbteNota = resolverTipoCbteNotaEmpresa({ tipoNota, tipoCbteOrigen: factura.tipoCbte })
  if (tipoCbteNota === 0) {
    return { ok: false, status: 422, error: "Tipo de comprobante origen no compatible con NC/ND" }
  }

  // 5. Validar habilitado en ARCA
  const habilitados = await leerComprobantesHabilitados()
  const errorHab = validarComprobanteHabilitado(tipoCbteNota, habilitados)
  if (errorHab) return { ok: false, status: 422, error: errorHab }

  // 6. Resolver PV
  const config = await cargarConfigArca()
  const ptoVenta = resolverPuntoVentaNotaEmpresa({
    tipoCbteNota,
    puntosVentaConfig: config.puntosVenta,
  })

  // 7. Validar items
  if (items.length === 0) {
    return { ok: false, status: 400, error: "Se requiere al menos un ítem" }
  }
  for (const item of items) {
    if (!item.concepto || item.concepto.trim().length === 0) {
      return { ok: false, status: 400, error: "El concepto de cada ítem es obligatorio" }
    }
    if (item.subtotal <= 0) {
      return { ok: false, status: 400, error: "El subtotal de cada ítem debe ser mayor a 0" }
    }
  }

  // 8. Calcular totales
  const totales = calcularTotalesDesdeItems(items, factura.ivaPct)

  // 9. Armar descripción auto
  const descripcion = items.map((i) => i.concepto).join("; ")

  // 10. Nro comprobante
  const tipo = tipoNota === "NC" ? "NC_EMITIDA" : "ND_EMITIDA"
  const nroComprobante = await calcularProximoNroComprobanteNotaCD(tipo)

  // 11. Fecha
  const creadoEn = data.fechaEmision
    ? parsearFechaLocalMediodia(data.fechaEmision)
    : new Date()

  // 12. Transacción
  const nota = await prisma.$transaction(async (tx) => {
    const n = await tx.notaCreditoDebito.create({
      data: {
        tipo,
        subtipo: null,
        facturaId,
        montoNeto: totales.montoNeto,
        montoIva: totales.montoIva,
        montoTotal: totales.montoTotal,
        descripcion,
        estado: "EMITIDA",
        nroComprobante,
        ptoVenta,
        tipoCbte: tipoCbteNota,
        arcaEstado: "PENDIENTE",
        cbteAsocTipo: factura.tipoCbte,
        cbteAsocPtoVta: factura.ptoVenta ?? 1,
        cbteAsocNro: parseInt(factura.nroComprobante ?? "0"),
        operadorId,
        creadoEn,
      },
    })

    for (let i = 0; i < items.length; i++) {
      await tx.notaCreditoDebitoItem.create({
        data: {
          notaId: n.id,
          orden: i + 1,
          concepto: items[i].concepto.trim(),
          subtotal: items[i].subtotal,
        },
      })
    }

    // Liberar viajes seleccionados por el usuario (opcional)
    if (data.viajesIds && data.viajesIds.length > 0) {
      for (const viajeId of data.viajesIds) {
        const vef = factura.viajes.find((v) => v.viajeId === viajeId)
        if (vef) {
          await tx.viajeEnNotaCD.create({
            data: {
              notaId: n.id,
              viajeId,
              tarifaOriginal: vef.tarifaEmpresa,
              kilosOriginal: vef.kilos ?? null,
              subtotalOriginal: vef.subtotal,
            },
          })
          await tx.viaje.update({
            where: { id: viajeId },
            data: { estadoFactura: EstadoFacturaViaje.PENDIENTE_FACTURAR },
          })
        }
      }
    }

    // AsientoIva: NC negativo, ND positivo
    const esNC = tipoNota === "NC"
    await tx.asientoIva.create({
      data: {
        notaCreditoDebitoId: n.id,
        tipoReferencia: tipo,
        tipo: "VENTA",
        baseImponible: esNC ? -totales.montoNeto : totales.montoNeto,
        alicuota: factura.ivaPct,
        montoIva: esNC ? -totales.montoIva : totales.montoIva,
        periodo: creadoEn.toISOString().slice(0, 7),
      },
    })

    return n
  })

  return { ok: true, nota }
}
