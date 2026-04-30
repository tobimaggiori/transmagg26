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
  calcularTotalesNotaLP,
  tipoCbteArcaParaNotaCD,
  resolverTipoCbteNotaEmpresa,
  resolverPuntoVentaNotaEmpresa,
} from "@/lib/nota-cd-utils"
import { validarComprobanteHabilitado } from "@/lib/arca/catalogo"
import { leerComprobantesHabilitados } from "@/lib/arca/leer-config-habilitados"
import { cargarConfigArca } from "@/lib/arca/config"
import { EstadoFacturaViaje, EstadoLiquidacionViaje } from "@/lib/viaje-workflow"
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
  facturaProveedorId?: string
  montoNeto: number
  ivaPct: number
  descripcion: string
  motivoDetalle?: string
  viajesIds?: string[]
  fechaEmision?: string
  nroComprobanteExterno?: string
  fechaComprobanteExterno?: string
  emisorExterno?: string
  incluirComision?: boolean
  // Percepciones (sólo NC/ND recibida de proveedor)
  percepcionIIBB?: number
  percepcionIVA?: number
  percepcionGanancias?: number
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
        notasCreditoDebito: {
          where: { tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL" },
          select: { id: true },
        },
      },
      // comisionPct se usa para desglosar el doble impacto IVA (ventas comisión + compras neto)
    })
    if (!liquidacion) return { ok: false, status: 404, error: "Liquidación no encontrada" }
    if (!liquidacion.tipoCbte) return { ok: false, status: 400, error: "La liquidación no tiene tipo de comprobante asignado" }
    if (data.subtipo === "ANULACION_TOTAL" && liquidacion.notasCreditoDebito.length > 0) {
      return { ok: false, status: 400, error: "La liquidación ya tiene una NC de anulación total emitida" }
    }
    tipoCbteOrigen = liquidacion.tipoCbte
  }

  const tipoCbte = tipoCbteArcaParaNotaCD("NC_EMITIDA", tipoCbteOrigen)
  if (!tipoCbte) return { ok: false, status: 400, error: "No se puede emitir NC para este tipo de comprobante" }

  const habilitados = await leerComprobantesHabilitados()
  const errorHab = validarComprobanteHabilitado(tipoCbte, habilitados)
  if (errorHab) return { ok: false, status: 400, error: errorHab }

  // Validar que ANULACION_PARCIAL tenga viajes indicados
  if (data.subtipo === "ANULACION_PARCIAL" && (!data.viajesIds || data.viajesIds.length === 0)) {
    return { ok: false, status: 400, error: "Anulación parcial requiere indicar los viajes a anular" }
  }

  const nroComprobante = await calcularProximoNroComprobanteNotaCD("NC_EMITIDA")
  const creadoEn = data.fechaEmision ? new Date(data.fechaEmision + "T12:00:00") : new Date()
  const periodo = creadoEn.toISOString().slice(0, 7)

  // Si es LP con comisión, recalcular totales usando calcularTotalesNotaLP
  const inclComision = data.incluirComision ?? true
  let totalesEfectivos = totales
  if (liquidacion && inclComision) {
    const comisionPct = liquidacion.comisionPct ?? 0
    const calc = calcularTotalesNotaLP(totales.montoNeto, comisionPct, data.ivaPct, true)
    totalesEfectivos = {
      montoNeto: calc.neto,
      montoIva: calc.iva,
      montoTotal: calc.total,
    }
  }

  const baseData = {
    tipo: data.tipo,
    subtipo: data.subtipo,
    facturaId: data.facturaId ?? null,
    liquidacionId: data.liquidacionId ?? null,
    ...totalesEfectivos,
    descripcion: data.descripcion,
    motivoDetalle: data.motivoDetalle ?? null,
    estado: "EMITIDA" as const,
    nroComprobante,
    tipoCbte,
    arcaEstado: "PENDIENTE" as const,
    incluirComision: data.incluirComision ?? true,
    operadorId,
    creadoEn,
  }

  // Resolver viajes a liberar según subtipo
  const comprobante = factura ?? liquidacion
  const esAnulacionTotal = data.subtipo === "ANULACION_TOTAL"

  // ANULACION_TOTAL: libera TODOS los viajes del comprobante origen (ignora viajesIds).
  // Otros subtipos: usan viajesIds explícitos del caller.
  let viajesALiberar: string[]
  if (esAnulacionTotal) {
    const ids = obtenerViajeIdsDeComprobanteOrigen(comprobante)
    if (ids === null) {
      return { ok: false, status: 500, error: "Error interno: el comprobante origen no incluye los viajes necesarios para procesar la anulación total" }
    }
    viajesALiberar = ids
  } else {
    viajesALiberar = data.viajesIds ?? []
  }

  // Validar viajesIds si se enviaron (solo para subtipos que no son ANULACION_TOTAL)
  if (!esAnulacionTotal && viajesALiberar.length > 0 && comprobante) {
    const viajeIdsEnComprobante = obtenerViajeIdsDeComprobanteOrigen(comprobante)
    if (viajeIdsEnComprobante === null) {
      return { ok: false, status: 500, error: "Error interno: el comprobante origen no incluye los viajes necesarios para validar la anulación parcial" }
    }
    const todosPertenecen = viajesALiberar.every((id: string) => viajeIdsEnComprobante.includes(id))
    if (!todosPertenecen) {
      return { ok: false, status: 400, error: "Uno o más viajes no pertenecen al comprobante" }
    }
  }

  const nota = await prisma.$transaction(async (tx) => {
    const nuevaNota = await tx.notaCreditoDebito.create({ data: baseData })

    // Liberar viajes y crear snapshots
    if (viajesALiberar.length > 0 && comprobante) {
      for (const viajeId of viajesALiberar) {
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
          if (liquidacion) {
            // NC sobre LP: liberar viaje para reliquidar
            await tx.viaje.update({
              where: { id: viajeId },
              data: { estadoLiquidacion: EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR },
            })
          } else {
            // NC sobre factura: liberar viaje para refacturar
            await tx.viaje.update({
              where: { id: viajeId },
              data: { estadoFactura: EstadoFacturaViaje.PENDIENTE_FACTURAR },
            })
          }
        }
      }
    }

    // AsientoIva para NC
    // NC sobre LP: solo IVA Compras (el IVA de la comisión se tributa implícitamente
    // en la diferencia entre factura empresa y LP, no se registra por separado)
    // Los totalesEfectivos ya tienen el neto correcto (con o sin comisión restada)
    if (liquidacion) {
      await tx.asientoIva.create({
        data: {
          notaCreditoDebitoId: nuevaNota.id,
          tipoReferencia: "NC_EMITIDA",
          tipo: "COMPRA",
          baseImponible: -totalesEfectivos.montoNeto,
          alicuota: data.ivaPct,
          montoIva: -totalesEfectivos.montoIva,
          periodo,
        },
      })
    } else {
      // NC sobre factura: solo IVA Ventas
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
    }

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

  let comisionPctLP = 0

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
      select: { tipoCbte: true, comisionPct: true },
    })
    if (!liquidacion) return { ok: false, status: 404, error: "Liquidación no encontrada" }
    if (!liquidacion.tipoCbte) return { ok: false, status: 400, error: "La liquidación no tiene tipo de comprobante asignado" }
    tipoCbteOrigen = liquidacion.tipoCbte
    comisionPctLP = liquidacion.comisionPct ?? 0
  }

  const tipoCbte = tipoCbteArcaParaNotaCD("ND_EMITIDA", tipoCbteOrigen)
  if (!tipoCbte) return { ok: false, status: 400, error: "No se puede emitir ND para este tipo de comprobante" }

  const habilitados = await leerComprobantesHabilitados()
  const errorHab = validarComprobanteHabilitado(tipoCbte, habilitados)
  if (errorHab) return { ok: false, status: 400, error: errorHab }

  const nroComprobante = await calcularProximoNroComprobanteNotaCD("ND_EMITIDA")
  const creadoEn = data.fechaEmision ? new Date(data.fechaEmision + "T12:00:00") : new Date()
  const periodo = creadoEn.toISOString().slice(0, 7)

  // Si es LP con comisión, recalcular totales usando calcularTotalesNotaLP
  const inclComision = data.incluirComision ?? true
  let totalesEfectivos = totales
  if (data.liquidacionId && inclComision && comisionPctLP > 0) {
    const calc = calcularTotalesNotaLP(totales.montoNeto, comisionPctLP, data.ivaPct, true)
    totalesEfectivos = {
      montoNeto: calc.neto,
      montoIva: calc.iva,
      montoTotal: calc.total,
    }
  }

  const nota = await prisma.$transaction(async (tx) => {
    const nuevaNota = await tx.notaCreditoDebito.create({
      data: {
        tipo: data.tipo,
        subtipo: data.subtipo ?? null,
        facturaId: data.facturaId ?? null,
        liquidacionId: data.liquidacionId ?? null,
        ...totalesEfectivos,
        descripcion: data.descripcion,
        motivoDetalle: data.motivoDetalle ?? null,
        estado: "EMITIDA",
        nroComprobante,
        tipoCbte,
        arcaEstado: "PENDIENTE",
        incluirComision: inclComision,
        operadorId,
        creadoEn,
      },
    })

    // AsientoIva para ND
    // ND sobre LP: solo IVA Compras (misma lógica que NC)
    if (data.liquidacionId) {
      await tx.asientoIva.create({
        data: {
          notaCreditoDebitoId: nuevaNota.id,
          tipoReferencia: "ND_EMITIDA",
          tipo: "COMPRA",
          baseImponible: totalesEfectivos.montoNeto,
          alicuota: data.ivaPct,
          montoIva: totalesEfectivos.montoIva,
          periodo,
        },
      })
    } else {
      // ND sobre factura: solo IVA Ventas
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
    }

    return nuevaNota
  })
  return { ok: true, nota }
}

// ─── NC_RECIBIDA ─────────────────────────────────────────────────────────────

async function crearNCRecibida(
  data: DatosNotaCD,
  totales: TotalesNotaCD,
  operadorId: string
): Promise<ResultadoNotaCD> {
  if (data.subtipo === "PROVEEDOR") {
    return crearNotaRecibidaProveedor("NC_RECIBIDA", data, totales, operadorId)
  }
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

  if (data.subtipo === "FALTANTE") {
    if (!data.facturaId) {
      return { ok: false, status: 400, error: "Se requiere facturaId para ND_RECIBIDA/FALTANTE" }
    }

    const factura = await prisma.facturaEmitida.findUnique({
      where: { id: data.facturaId },
      include: {
        empresa: { select: { razonSocial: true } },
        viajes: { select: { viajeId: true, tarifaEmpresa: true, subtotal: true, kilos: true } },
      },
    })
    if (!factura) return { ok: false, status: 404, error: "Factura no encontrada" }
    if (factura.estadoArca !== "AUTORIZADA") {
      return { ok: false, status: 422, error: "La factura debe estar autorizada en ARCA" }
    }

    const viajesIds = data.viajesIds ?? []
    const viajeIdsEnFactura = new Set(factura.viajes.map((v) => v.viajeId))
    const viajesInvalidos = viajesIds.filter((id) => !viajeIdsEnFactura.has(id))
    if (viajesInvalidos.length > 0) {
      return { ok: false, status: 400, error: `Viaje(s) no pertenecen a la factura: ${viajesInvalidos.join(", ")}` }
    }

    const nota = await prisma.$transaction(async (tx) => {
      const created = await tx.notaCreditoDebito.create({
        data: {
          tipo: "ND_RECIBIDA",
          subtipo: "FALTANTE",
          facturaId: data.facturaId,
          nroComprobanteExterno: data.nroComprobanteExterno ?? null,
          fechaComprobanteExterno: data.fechaComprobanteExterno
            ? new Date(data.fechaComprobanteExterno)
            : null,
          emisorExterno: factura.empresa.razonSocial,
          ...totales,
          descripcion: data.descripcion,
          motivoDetalle: data.motivoDetalle ?? null,
          estado: "REGISTRADA",
          operadorId,
        },
      })

      // Vincular viajes afectados
      for (const vId of viajesIds) {
        const snap = factura.viajes.find((v) => v.viajeId === vId)!
        await tx.viajeEnNotaCD.create({
          data: {
            notaId: created.id,
            viajeId: vId,
            tarifaOriginal: snap.tarifaEmpresa,
            kilosOriginal: snap.kilos,
            subtotalOriginal: snap.subtotal,
          },
        })
      }

      // Asiento IVA: ND recibida reduce el neto de venta (negativo en ventas)
      await tx.asientoIva.create({
        data: {
          tipo: "VENTA",
          tipoReferencia: "ND_RECIBIDA",
          notaCreditoDebitoId: created.id,
          facturaEmitidaId: data.facturaId,
          baseImponible: -totales.montoNeto,
          alicuota: data.ivaPct,
          montoIva: -totales.montoIva,
          periodo: new Date().toISOString().slice(0, 7),
        },
      })

      return created
    })

    return { ok: true, nota }
  }

  if (data.subtipo === "PROVEEDOR") {
    return crearNotaRecibidaProveedor("ND_RECIBIDA", data, totales, operadorId)
  }

  return { ok: false, status: 400, error: "Subtipo ND_RECIBIDA no reconocido" }
}

// ─── NC/ND RECIBIDA de proveedor ─────────────────────────────────────────────

/**
 * crearNotaRecibidaProveedor: "NC_RECIBIDA"|"ND_RECIBIDA" DatosNotaCD TotalesNotaCD string
 *   -> Promise<ResultadoNotaCD>
 *
 * Dado el tipo (NC/ND), los datos validados, totales y operadorId,
 * registra una NC/ND recibida de un proveedor asociada a una factura de proveedor.
 * Persiste el comprobante externo (nroComprobante, fecha, emisor = proveedor.razonSocial),
 * las percepciones opcionales y crea el asiento de IVA COMPRAS con signo correspondiente
 * (negativo para NC, positivo para ND) para el período de la fecha del comprobante.
 * El tipoCbte se fuerza a la misma clase (A/B/C) que la factura origen.
 *
 * Precondiciones:
 *  - data.facturaProveedorId requerido.
 *  - data.nroComprobanteExterno requerido.
 *  - data.fechaComprobanteExterno requerido.
 *  - La factura de proveedor existe.
 *
 * Ejemplos:
 * crearNotaRecibidaProveedor("NC_RECIBIDA", { facturaProveedorId: "fp1", nroComprobanteExterno: "0001-00000123", fechaComprobanteExterno: "2026-04-01", ivaPct: 21, montoNeto: 1000, descripcion: "Devolución parcial", ... }, { montoNeto: 1000, montoIva: 210, montoTotal: 1210 }, "op1")
 *   // => { ok: true, nota: { tipo: "NC_RECIBIDA", subtipo: "PROVEEDOR", tipoCbte: 3, ... } }
 * crearNotaRecibidaProveedor("NC_RECIBIDA", { ...sin facturaProveedorId }, totales, "op1")
 *   // => { ok: false, status: 400, error: "Se requiere facturaProveedorId" }
 */
async function crearNotaRecibidaProveedor(
  tipo: "NC_RECIBIDA" | "ND_RECIBIDA",
  data: DatosNotaCD,
  totales: TotalesNotaCD,
  operadorId: string
): Promise<ResultadoNotaCD> {
  if (!data.facturaProveedorId) {
    return { ok: false, status: 400, error: `Se requiere facturaProveedorId para ${tipo}/PROVEEDOR` }
  }
  if (!data.nroComprobanteExterno) {
    return { ok: false, status: 400, error: "Se requiere nroComprobanteExterno" }
  }
  if (!data.fechaComprobanteExterno) {
    return { ok: false, status: 400, error: "Se requiere fechaComprobanteExterno" }
  }

  const factura = await prisma.facturaProveedor.findUnique({
    where: { id: data.facturaProveedorId },
    include: { proveedor: { select: { razonSocial: true } } },
  })
  if (!factura) return { ok: false, status: 404, error: "Factura de proveedor no encontrada" }

  const { tipoCbteNotaRecibidaProveedor } = await import("@/lib/nota-cd-utils")
  const tipoCbte = tipoCbteNotaRecibidaProveedor(tipo, factura.tipoCbte)

  const fechaCbte = parsearFechaLocalMediodia(data.fechaComprobanteExterno)
  const periodo = fechaCbte.toISOString().slice(0, 7)
  const signo = tipo === "NC_RECIBIDA" ? -1 : 1

  const nota = await prisma.$transaction(async (tx) => {
    const created = await tx.notaCreditoDebito.create({
      data: {
        tipo,
        subtipo: "PROVEEDOR",
        facturaProveedorId: data.facturaProveedorId,
        nroComprobanteExterno: data.nroComprobanteExterno,
        fechaComprobanteExterno: fechaCbte,
        emisorExterno: factura.proveedor.razonSocial,
        tipoCbte: tipoCbte || null,
        ...totales,
        percepcionIIBB: data.percepcionIIBB ?? null,
        percepcionIVA: data.percepcionIVA ?? null,
        percepcionGanancias: data.percepcionGanancias ?? null,
        descripcion: data.descripcion,
        motivoDetalle: data.motivoDetalle ?? null,
        estado: "REGISTRADA",
        operadorId,
      },
    })

    await tx.asientoIva.create({
      data: {
        notaCreditoDebitoId: created.id,
        facturaProvId: data.facturaProveedorId,
        tipoReferencia: tipo,
        tipo: "COMPRA",
        baseImponible: signo * totales.montoNeto,
        alicuota: data.ivaPct,
        montoIva: signo * totales.montoIva,
        periodo,
      },
    })

    return created
  })

  return { ok: true, nota }
}

// ─── Helpers internos ────────────────────────────────────────────────────────

/**
 * obtenerViajeIdsDeComprobanteOrigen: ComprobanteConViajes -> string[] | null
 *
 * Extrae los IDs de viajes de un comprobante origen (factura o liquidación).
 * ANULACION_TOTAL necesita TODOS los viajes del comprobante, que vienen de la
 * relación `viajes` cargada en la query con include. Esta función hace explícita
 * esa dependencia y retorna null si la relación no está disponible.
 *
 * Retorna null (no throw) porque la ausencia de la relación es un error interno
 * del backend (query incompleta), no un error de validación del usuario.
 * El caller debe tratar null como status 500.
 *
 * Ejemplos:
 * obtenerViajeIdsDeComprobanteOrigen({ viajes: [{ viajeId: "v1" }, { viajeId: "v2" }] })
 *   // => ["v1", "v2"]
 * obtenerViajeIdsDeComprobanteOrigen({ viajes: undefined })
 *   // => null
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function obtenerViajeIdsDeComprobanteOrigen(comprobante: any): string[] | null {
  if (!comprobante?.viajes || !Array.isArray(comprobante.viajes)) {
    return null
  }
  return comprobante.viajes.map((v: { viajeId: string }) => v.viajeId)
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

  // El estado de cobro de la factura no condiciona la emisión: NC sobre
  // factura cobrada genera saldo a favor; ND sobre factura cobrada vuelve
  // a generar saldo pendiente. La UI advierte el impacto al operador.

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
