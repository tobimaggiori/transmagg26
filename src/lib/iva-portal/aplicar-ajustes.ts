/**
 * aplicar-ajustes.ts — Aplica ajustes manuales sobre los datos recolectados
 * antes de generar el TXT.
 *
 * Tipos de ajuste:
 * - AGREGAR:    suma una fila nueva al libro (no había antes)
 * - MODIFICAR:  cambia campos de una fila existente (encontrada por
 *               referenciaTipo + referenciaId, o por tipoCbte + ptoVenta + nro)
 * - EXCLUIR:    quita una fila del export (no la borra de la fuente)
 * - REDONDEO:   ajuste de centavos para igualar contra ARCA (igual a MODIFICAR
 *               pero con motivo "redondeo")
 * - RECLASIFICAR: cambia el libro (VENTAS ↔ COMPRAS) o el tipoCbte
 *
 * Función pura: input DatosIvaPeriodo + AjusteAplicable[] → output DatosIvaPeriodo.
 */

import type {
  DatosIvaPeriodo,
  AjusteAplicable,
  ComprobanteIva,
  AlicuotaIva,
} from "./types"
import { codigoAlicuotaArca } from "./codigos-arca"

/**
 * matchComprobante: ComprobanteIva AjusteAplicable -> boolean
 *
 * Determina si un comprobante coincide con el ajuste. Busca primero por
 * (referenciaTipo, referenciaId); si el ajuste no tiene ref, busca por
 * (tipoCbte, ptoVenta, numeroDesde).
 */
function matchComprobante(c: ComprobanteIva, aj: AjusteAplicable): boolean {
  if (aj.referenciaTipo && aj.referenciaId) {
    return c.tipoReferencia === aj.referenciaTipo && c.referenciaId === aj.referenciaId
  }
  if (aj.tipoComprobanteArca != null && aj.puntoVenta != null && aj.numeroDesde != null) {
    return (
      c.tipoComprobanteArca === aj.tipoComprobanteArca &&
      c.puntoVenta === aj.puntoVenta &&
      c.numeroDesde === aj.numeroDesde
    )
  }
  return false
}

/**
 * matchAlicuotaPorTripleta: AlicuotaIva tripleta -> boolean
 */
function matchAlicuotaPorTripleta(
  a: AlicuotaIva,
  trip: { tipoComprobanteArca: number; puntoVenta: number; numeroDesde: number },
): boolean {
  return (
    a.tipoComprobanteArca === trip.tipoComprobanteArca &&
    a.puntoVenta === trip.puntoVenta &&
    a.numeroComprobante === trip.numeroDesde
  )
}

/**
 * resolverTripleta: AjusteAplicable ComprobanteIva[] -> tripleta | null
 *
 * Las alícuotas no llevan `referenciaId` — solo la terna (tipoCbte, ptoVenta,
 * numero). Cuando el ajuste vino con referencia (no con terna explícita),
 * buscamos primero el comprobante padre y leemos su terna.
 */
function resolverTripleta(
  aj: AjusteAplicable,
  comprobantes: ComprobanteIva[],
): { tipoComprobanteArca: number; puntoVenta: number; numeroDesde: number } | null {
  if (aj.tipoComprobanteArca != null && aj.puntoVenta != null && aj.numeroDesde != null) {
    return {
      tipoComprobanteArca: aj.tipoComprobanteArca,
      puntoVenta: aj.puntoVenta,
      numeroDesde: aj.numeroDesde,
    }
  }
  if (aj.referenciaTipo && aj.referenciaId) {
    const c = comprobantes.find(
      (x) => x.tipoReferencia === aj.referenciaTipo && x.referenciaId === aj.referenciaId,
    )
    if (c) {
      return {
        tipoComprobanteArca: c.tipoComprobanteArca,
        puntoVenta: c.puntoVenta,
        numeroDesde: c.numeroDesde,
      }
    }
  }
  return null
}

/**
 * crearComprobanteDesdeAjuste: AjusteAplicable -> ComprobanteIva | null
 *
 * Construye un nuevo comprobante a partir de un ajuste tipo AGREGAR.
 * Devuelve null si faltan campos esenciales.
 */
function crearComprobanteDesdeAjuste(aj: AjusteAplicable): ComprobanteIva | null {
  if (
    aj.tipoComprobanteArca == null ||
    aj.puntoVenta == null ||
    aj.numeroDesde == null ||
    !aj.fechaComprobante
  ) {
    return null
  }
  return {
    tipoLibro: aj.tipoLibro,
    tipoReferencia: aj.referenciaTipo ?? "MANUAL",
    referenciaId: aj.referenciaId,
    fecha: aj.fechaComprobante,
    tipoComprobanteArca: aj.tipoComprobanteArca,
    puntoVenta: aj.puntoVenta,
    numeroDesde: aj.numeroDesde,
    numeroHasta: aj.numeroHasta ?? aj.numeroDesde,
    cuitContraparte: aj.cuitContraparte ?? "",
    razonSocialContraparte: aj.razonSocialContraparte ?? "",
    totalOperacion: aj.total ?? 0,
    netoGravado: aj.netoGravado ?? 0,
    noGravado: aj.noGravado ?? 0,
    noCategorizados: 0,
    exento: aj.exento ?? 0,
    pagosACuenta: 0,
    percepcionIibb: aj.percepcionIibb ?? 0,
    impuestosMunicipales: 0,
    impuestosInternos: 0,
    otrosTributos: 0,
    percepcionIva: aj.percepcionIva ?? 0,
    percepcionGanancias: aj.percepcionGanancias ?? 0,
    codigoMoneda: "PES",
    tipoCambio: 1,
    cantidadAlicuotas: 1,
    codigoOperacion: "0",
    fechaPago: null,
  }
}

function crearAlicuotaDesdeAjuste(aj: AjusteAplicable): AlicuotaIva | null {
  if (
    aj.tipoComprobanteArca == null ||
    aj.puntoVenta == null ||
    aj.numeroDesde == null ||
    aj.alicuota == null
  ) {
    return null
  }
  // Validar que la alícuota sea reconocida por ARCA
  if (codigoAlicuotaArca(aj.alicuota) === null) return null

  return {
    tipoLibro: aj.tipoLibro,
    tipoComprobanteArca: aj.tipoComprobanteArca,
    puntoVenta: aj.puntoVenta,
    numeroComprobante: aj.numeroDesde,
    netoGravado: aj.netoGravado ?? 0,
    alicuotaPorcentaje: aj.alicuota,
    montoIva: aj.iva ?? 0,
    cuitProveedor: aj.tipoLibro === "COMPRAS" ? aj.cuitContraparte : undefined,
  }
}

/**
 * aplicarAjustes: DatosIvaPeriodo AjusteAplicable[] -> DatosIvaPeriodo
 *
 * Dado los datos recolectados y la lista de ajustes activos (no anulados),
 * devuelve los datos finales para exportar a TXT.
 *
 * Orden de aplicación:
 *  1. EXCLUIR primero (para que MODIFICAR no actúe sobre filas excluidas)
 *  2. RECLASIFICAR (cambian de libro)
 *  3. MODIFICAR / REDONDEO
 *  4. AGREGAR (al final, para que no se confunda con MODIFICAR)
 *
 * No muta los datos de entrada — devuelve nuevo DatosIvaPeriodo.
 */
export function aplicarAjustes(
  datos: DatosIvaPeriodo,
  ajustes: AjusteAplicable[],
): DatosIvaPeriodo {
  // Copia profunda mínima
  const resultado: DatosIvaPeriodo = {
    mesAnio: datos.mesAnio,
    ventas: {
      comprobantes: datos.ventas.comprobantes.map((c) => ({ ...c })),
      alicuotas: datos.ventas.alicuotas.map((a) => ({ ...a })),
    },
    compras: {
      comprobantes: datos.compras.comprobantes.map((c) => ({ ...c })),
      alicuotas: datos.compras.alicuotas.map((a) => ({ ...a })),
    },
  }

  // 1) EXCLUIR
  const ajustesExcluir = ajustes.filter((a) => a.tipoAjuste === "EXCLUIR")
  for (const aj of ajustesExcluir) {
    const libro = aj.tipoLibro === "VENTAS" ? "ventas" : "compras"
    // Resolver tripleta antes de filtrar comprobantes (porque después
    // los comprobantes se eliminan y no podemos buscarla)
    const trip = resolverTripleta(aj, resultado[libro].comprobantes)
    resultado[libro].comprobantes = resultado[libro].comprobantes.filter(
      (c) => !matchComprobante(c, aj),
    )
    if (trip) {
      resultado[libro].alicuotas = resultado[libro].alicuotas.filter(
        (a) => !matchAlicuotaPorTripleta(a, trip),
      )
    }
  }

  // 2) RECLASIFICAR (mover entre libros si el ajuste cambió tipoLibro)
  const ajustesReclasificar = ajustes.filter((a) => a.tipoAjuste === "RECLASIFICAR")
  for (const aj of ajustesReclasificar) {
    // Buscar en el libro contrario
    const libroOrigen = aj.tipoLibro === "VENTAS" ? "compras" : "ventas"
    const libroDestino = aj.tipoLibro === "VENTAS" ? "ventas" : "compras"

    const trip = resolverTripleta(aj, resultado[libroOrigen].comprobantes)
    const cbteAMoverIdx = resultado[libroOrigen].comprobantes.findIndex(
      (c) => matchComprobante(c, aj),
    )
    if (cbteAMoverIdx >= 0) {
      const [cbte] = resultado[libroOrigen].comprobantes.splice(cbteAMoverIdx, 1)
      cbte.tipoLibro = aj.tipoLibro
      Object.assign(cbte, aj.netoGravado != null ? { netoGravado: aj.netoGravado } : {})
      resultado[libroDestino].comprobantes.push(cbte)

      // Mover alícuotas usando la tripleta
      if (trip) {
        const alicAMover = resultado[libroOrigen].alicuotas.filter((a) => matchAlicuotaPorTripleta(a, trip))
        resultado[libroOrigen].alicuotas = resultado[libroOrigen].alicuotas.filter(
          (a) => !matchAlicuotaPorTripleta(a, trip),
        )
        for (const a of alicAMover) {
          a.tipoLibro = aj.tipoLibro
          if (aj.tipoLibro === "COMPRAS" && !a.cuitProveedor && aj.cuitContraparte) {
            a.cuitProveedor = aj.cuitContraparte
          }
          resultado[libroDestino].alicuotas.push(a)
        }
      }
    }
  }

  // 3) MODIFICAR / REDONDEO
  const ajustesModificar = ajustes.filter(
    (a) => a.tipoAjuste === "MODIFICAR" || a.tipoAjuste === "REDONDEO",
  )
  for (const aj of ajustesModificar) {
    const libro = aj.tipoLibro === "VENTAS" ? "ventas" : "compras"
    const trip = resolverTripleta(aj, resultado[libro].comprobantes)
    resultado[libro].comprobantes = resultado[libro].comprobantes.map((c) => {
      if (!matchComprobante(c, aj)) return c
      return {
        ...c,
        ...(aj.netoGravado != null ? { netoGravado: aj.netoGravado } : {}),
        ...(aj.exento != null ? { exento: aj.exento } : {}),
        ...(aj.noGravado != null ? { noGravado: aj.noGravado } : {}),
        ...(aj.percepcionIibb != null ? { percepcionIibb: aj.percepcionIibb } : {}),
        ...(aj.percepcionIva != null ? { percepcionIva: aj.percepcionIva } : {}),
        ...(aj.percepcionGanancias != null ? { percepcionGanancias: aj.percepcionGanancias } : {}),
        ...(aj.total != null ? { totalOperacion: aj.total } : {}),
        ...(aj.cuitContraparte ? { cuitContraparte: aj.cuitContraparte } : {}),
        ...(aj.razonSocialContraparte ? { razonSocialContraparte: aj.razonSocialContraparte } : {}),
        ...(aj.fechaComprobante ? { fecha: aj.fechaComprobante } : {}),
      }
    })

    // Para alícuotas: si el ajuste trae alicuota + iva, modifica la fila correspondiente
    if (aj.alicuota != null && trip) {
      resultado[libro].alicuotas = resultado[libro].alicuotas.map((a) => {
        if (!matchAlicuotaPorTripleta(a, trip)) return a
        if (Math.abs(a.alicuotaPorcentaje - aj.alicuota!) > 0.01) return a
        return {
          ...a,
          ...(aj.netoGravado != null ? { netoGravado: aj.netoGravado } : {}),
          ...(aj.iva != null ? { montoIva: aj.iva } : {}),
        }
      })
    }
  }

  // 4) AGREGAR
  const ajustesAgregar = ajustes.filter((a) => a.tipoAjuste === "AGREGAR")
  for (const aj of ajustesAgregar) {
    const cbte = crearComprobanteDesdeAjuste(aj)
    if (!cbte) continue
    const libro = aj.tipoLibro === "VENTAS" ? "ventas" : "compras"
    resultado[libro].comprobantes.push(cbte)

    const alic = crearAlicuotaDesdeAjuste(aj)
    if (alic) resultado[libro].alicuotas.push(alic)
  }

  return resultado
}
