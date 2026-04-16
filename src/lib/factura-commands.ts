/**
 * factura-commands.ts
 *
 * Lógica de negocio transaccional para creación de facturas emitidas.
 * Valida precondiciones, calcula totales y ejecuta la transacción
 * que crea la factura, snapshots de viajes, asientos IVA/IIBB.
 *
 * La validación de estado de viajes se ejecuta DENTRO de la transacción
 * para evitar race conditions en requests concurrentes.
 */

import { prisma } from "@/lib/prisma"
import { calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import { EstadoFacturaDocumento, EstadoFacturaViaje } from "@/lib/viaje-workflow"
import { resolverPuntoVentaFacturaEmpresa } from "@/lib/arca/catalogo"
import { cargarConfigArca } from "@/lib/arca/config"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type DatosCrearFactura = {
  empresaId: string
  viajeIds: string[]
  tipoCbte: number
  modalidadMiPymes?: string
  ivaPct: number
  metodoPago?: string
  fechaEmision?: string
  ediciones?: Record<string, { kilos?: number; tarifaEmpresa?: number }>
}

type ResultadoFactura =
  | { ok: true; factura: unknown }
  | { ok: false; status: number; error: string }

/** Error de validación interno para usar dentro de transacciones. */
class _ValidationError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

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
 * - Todos los viajes existen, pertenecen a la empresa y están pendientes (dentro de tx)
 *
 * Ejecuta en transacción atómica:
 * - Lee y valida viajes (protección contra race condition)
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
  const { empresaId, viajeIds, tipoCbte, modalidadMiPymes, ivaPct, metodoPago, ediciones } = data

  // ── Validaciones fuera de tx (no dependen de estado mutable) ──

  // Invariante: al menos 1 viaje
  if (!viajeIds || viajeIds.length === 0) {
    return { ok: false, status: 400, error: "Se requiere al menos un viaje para crear la factura" }
  }

  // Validar empresa — fuera de tx porque verifica configuración estática (condicionIva, activa)
  // que no participa en la carrera crítica de viajes. La invariante de estado de viajes
  // (PENDIENTE_FACTURAR → FACTURADO) se protege dentro de la tx.
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

  // Cargar config ARCA (no mutable, seguro fuera de tx)
  const config = await cargarConfigArca()

  // ── Transacción atómica: lectura + validación + creación ──

  try {
    const factura = await prisma.$transaction(async (tx) => {
      // Leer viajes DENTRO de tx para evitar race condition
      const viajes = await tx.viaje.findMany({
        where: { id: { in: viajeIds } },
        select: {
          id: true, empresaId: true, kilos: true, tarifaEmpresa: true,
          fechaViaje: true, remito: true, cupo: true, mercaderia: true,
          procedencia: true, provinciaOrigen: true, destino: true,
          provinciaDestino: true, fleteroId: true, camionId: true,
          choferId: true, estadoFactura: true, esCamionPropio: true,
        },
      })

      if (viajes.length !== viajeIds.length) {
        const encontrados = new Set(viajes.map((v) => v.id))
        const faltantes = viajeIds.filter((id) => !encontrados.has(id))
        throw new _ValidationError(404, `Viaje(s) no encontrado(s): ${faltantes.join(", ")}`)
      }

      const viajesNoPertenecen = viajes.filter((v) => v.empresaId !== empresaId)
      if (viajesNoPertenecen.length > 0) {
        throw new _ValidationError(400, "Uno o más viajes no pertenecen a la empresa seleccionada")
      }

      const viajesNoFacturables = viajes.filter((v) => v.estadoFactura !== "PENDIENTE_FACTURAR")
      if (viajesNoFacturables.length > 0) {
        throw new _ValidationError(400, "Uno o más viajes no están pendientes de facturar")
      }

      // Validar que no se mezclen viajes de camión propio con viajes de fletero
      const tienePropios = viajes.some((v) => v.esCamionPropio)
      const tieneAjenos = viajes.some((v) => !v.esCamionPropio)
      if (tienePropios && tieneAjenos) {
        throw new _ValidationError(422, "No se puede mezclar viajes de camión propio y viajes de fletero en la misma factura")
      }

      // Resolver punto de venta
      const esCamionPropio = tienePropios
      const ptoVenta = resolverPuntoVentaFacturaEmpresa({
        tipoCbte,
        esCamionPropio,
        puntosVentaConfig: config.puntosVenta,
      })

      // Aplicar ediciones y calcular totales
      const viajesConEdiciones = viajes.map((v) => {
        const edit = ediciones?.[v.id]
        return {
          ...v,
          kilosEfectivos: edit?.kilos ?? v.kilos ?? 0,
          tarifaEmpresaEfectiva: edit?.tarifaEmpresa ?? v.tarifaEmpresa,
        }
      })

      // Validar que viajes hermanos del mismo cupo tengan misma tarifa
      // efectiva. Los hermanos siempre se facturan juntos en la misma
      // factura, y deben acordar la tarifa para no introducir diferencias
      // imposibles de auditar.
      const tarifaPorCupo = new Map<string, number>()
      for (const v of viajesConEdiciones) {
        const cupoKey = v.cupo?.trim()
        if (!cupoKey) continue
        const previa = tarifaPorCupo.get(cupoKey)
        if (previa === undefined) {
          tarifaPorCupo.set(cupoKey, Number(v.tarifaEmpresaEfectiva))
        } else if (Number(v.tarifaEmpresaEfectiva) !== previa) {
          throw new _ValidationError(
            409,
            `Los viajes con cupo "${cupoKey}" tienen tarifas distintas (${previa} vs ${Number(v.tarifaEmpresaEfectiva)}). Unificá la tarifa antes de facturar.`,
          )
        }
      }

      const viajesParaCalc = viajesConEdiciones.map((v) => ({
        kilos: v.kilosEfectivos,
        tarifaEmpresa: v.tarifaEmpresaEfectiva,
      }))
      const { neto, ivaMonto, total } = calcularFactura(viajesParaCalc, ivaPct)
      const periodo = viajes[0].fechaViaje.toISOString().slice(0, 7)

      // Crear factura
      const fact = await tx.facturaEmitida.create({
        data: {
          empresaId,
          operadorId,
          tipoCbte,
          ptoVenta,
          modalidadMiPymes: modalidadMiPymes ?? null,
          ivaPct,
          metodoPago: metodoPago ?? "Transferencia Bancaria",
          emitidaEn: data.fechaEmision ? new Date(data.fechaEmision + "T12:00:00") : new Date(),
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
  } catch (err) {
    if (err instanceof _ValidationError) {
      return { ok: false, status: err.status, error: err.message }
    }
    throw err
  }
}
