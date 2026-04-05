/**
 * factura-commands.ts
 *
 * Lógica de negocio transaccional para creación de facturas emitidas.
 * Valida precondiciones, calcula totales y ejecuta la transacción
 * que crea la factura, snapshots de viajes, asientos IVA/IIBB.
 */

import { prisma } from "@/lib/prisma"
import { calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import { EstadoFacturaDocumento, EstadoFacturaViaje } from "@/lib/viaje-workflow"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type DatosCrearFactura = {
  empresaId: string
  viajeIds: string[]
  tipoCbte: number
  modalidadMiPymes?: string
  ivaPct: number
  ediciones?: Record<string, { kilos?: number; tarifaEmpresa?: number }>
}

type ResultadoFactura =
  | { ok: true; factura: unknown }
  | { ok: false; status: number; error: string }

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarCrearFactura: DatosCrearFactura string -> Promise<ResultadoFactura>
 *
 * Dado [los datos validados de la factura y el operadorId],
 * devuelve [la factura creada o un error con status HTTP].
 *
 * Valida:
 * - Empresa existe y está activa
 * - tipoCbte compatible con condición IVA de la empresa
 * - modalidadMiPymes obligatoria para tipoCbte 201
 * - Todos los viajes existen, pertenecen a la empresa y están pendientes
 *
 * Ejecuta en transacción:
 * - Crea factura con totales calculados
 * - Crea asiento IVA VENTA
 * - Crea snapshots ViajeEnFactura por cada viaje
 * - Crea asientos IIBB por provincia
 * - Marca viajes como FACTURADO
 *
 * Ejemplos:
 * ejecutarCrearFactura({ empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21 }, "op1")
 *   // => { ok: true, factura: { id, estado: "EMITIDA", ... } }
 * ejecutarCrearFactura({ empresaId: "noexiste", ... }, "op1")
 *   // => { ok: false, status: 404, error: "Empresa no encontrada" }
 */
export async function ejecutarCrearFactura(
  data: DatosCrearFactura,
  operadorId: string
): Promise<ResultadoFactura> {
  const { empresaId, viajeIds, tipoCbte, modalidadMiPymes, ivaPct, ediciones } = data

  // Validar empresa
  const empresa = await prisma.empresa.findFirst({ where: { id: empresaId, activa: true } })
  if (!empresa) return { ok: false, status: 404, error: "Empresa no encontrada" }

  // Validar tipoCbte según condición IVA
  if (empresa.condicionIva === "RESPONSABLE_INSCRIPTO") {
    if (![1, 201].includes(tipoCbte)) {
      return { ok: false, status: 422, error: "Para empresas RI solo se puede emitir Factura A (1) o Factura A MiPyme (201)" }
    }
  } else {
    if (tipoCbte !== 6) {
      return { ok: false, status: 422, error: "Para empresas no RI solo se puede emitir Factura B (6)" }
    }
  }

  if (tipoCbte === 201 && !modalidadMiPymes) {
    return { ok: false, status: 422, error: "Para Factura A MiPyme se debe especificar la modalidad (SCA o ADC)" }
  }

  // Buscar y validar viajes
  const viajes = await prisma.viaje.findMany({
    where: { id: { in: viajeIds } },
    select: {
      id: true, empresaId: true, kilos: true, tarifaEmpresa: true,
      fechaViaje: true, remito: true, cupo: true, mercaderia: true,
      procedencia: true, provinciaOrigen: true, destino: true,
      provinciaDestino: true, fleteroId: true, camionId: true,
      choferId: true, estadoFactura: true,
    },
  })

  if (viajes.length !== viajeIds.length) {
    const encontrados = new Set(viajes.map((v) => v.id))
    const faltantes = viajeIds.filter((id) => !encontrados.has(id))
    return { ok: false, status: 404, error: `Viaje(s) no encontrado(s): ${faltantes.join(", ")}` }
  }

  const viajesNoPertenecen = viajes.filter((v) => v.empresaId !== empresaId)
  if (viajesNoPertenecen.length > 0) {
    return { ok: false, status: 400, error: "Uno o más viajes no pertenecen a la empresa seleccionada" }
  }

  const viajesNoFacturables = viajes.filter((v) => v.estadoFactura !== "PENDIENTE_FACTURAR")
  if (viajesNoFacturables.length > 0) {
    return { ok: false, status: 400, error: "Uno o más viajes no están pendientes de facturar" }
  }

  // Aplicar ediciones y calcular totales
  const viajesConEdiciones = viajes.map((v) => {
    const edit = ediciones?.[v.id]
    return {
      ...v,
      kilosEfectivos: edit?.kilos ?? v.kilos ?? 0,
      tarifaEmpresaEfectiva: edit?.tarifaEmpresa ?? v.tarifaEmpresa,
    }
  })

  const viajesParaCalc = viajesConEdiciones.map((v) => ({
    kilos: v.kilosEfectivos,
    tarifaEmpresa: v.tarifaEmpresaEfectiva,
  }))
  const { neto, ivaMonto, total } = calcularFactura(viajesParaCalc, ivaPct)
  const periodo = viajes[0].fechaViaje.toISOString().slice(0, 7)

  // Transacción
  const factura = await prisma.$transaction(async (tx) => {
    const fact = await tx.facturaEmitida.create({
      data: {
        empresaId,
        operadorId,
        tipoCbte,
        modalidadMiPymes: modalidadMiPymes ?? null,
        ivaPct,
        neto,
        ivaMonto,
        total,
        estadoArca: "PENDIENTE",
        estado: EstadoFacturaDocumento.EMITIDA,
      },
    })

    await tx.asientoIva.create({
      data: {
        facturaEmitidaId: fact.id,
        tipoReferencia: "FACTURA_EMITIDA",
        tipo: "VENTA",
        baseImponible: neto,
        alicuota: ivaPct,
        montoIva: ivaMonto,
        periodo,
      },
    })

    for (const viaje of viajesConEdiciones) {
      const kilos = viaje.kilosEfectivos
      const tarifaEmpresa = viaje.tarifaEmpresaEfectiva
      const subtotalViaje = calcularTotalViaje(kilos, tarifaEmpresa)

      const enFact = await tx.viajeEnFactura.create({
        data: {
          viajeId: viaje.id,
          facturaId: fact.id,
          fechaViaje: viaje.fechaViaje,
          remito: viaje.remito ?? null,
          cupo: viaje.cupo ?? null,
          mercaderia: viaje.mercaderia ?? null,
          procedencia: viaje.procedencia ?? null,
          provinciaOrigen: viaje.provinciaOrigen ?? null,
          destino: viaje.destino ?? null,
          provinciaDestino: viaje.provinciaDestino ?? null,
          kilos,
          tarifaEmpresa,
          subtotal: subtotalViaje,
        },
      })

      const provincia = viaje.provinciaOrigen
      if (provincia) {
        await tx.asientoIibb.create({
          data: {
            viajeEnFactId: enFact.id,
            tablaOrigen: "viajes_en_factura",
            provincia,
            montoIngreso: subtotalViaje,
            periodo: viaje.fechaViaje.toISOString().slice(0, 7),
          },
        })
      }
    }

    await tx.viaje.updateMany({
      where: { id: { in: viajeIds } },
      data: { estadoFactura: EstadoFacturaViaje.FACTURADO },
    })

    return fact
  })

  return { ok: true, factura }
}
