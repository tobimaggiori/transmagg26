/**
 * ajustes.ts — Repositorio de AjusteIvaPeriodo (lecturas + transformaciones).
 *
 * Convierte filas de Prisma → AjusteAplicable (DTO neutro) para que
 * aplicar-ajustes.ts funcione con datos limpios.
 */

import { prisma } from "@/lib/prisma"
import type { AjusteAplicable, TipoReferencia } from "./types"

/**
 * obtenerAjustesActivos: periodoIvaId -> Promise<AjusteAplicable[]>
 *
 * Devuelve los ajustes NO anulados del período, ordenados por creación.
 */
export async function obtenerAjustesActivos(
  periodoIvaId: string,
): Promise<AjusteAplicable[]> {
  const filas = await prisma.ajusteIvaPeriodo.findMany({
    where: { periodoIvaId, anulado: false },
    orderBy: { creadoEn: "asc" },
  })
  return filas.map((f) => ({
    id: f.id,
    tipoLibro: f.tipoLibro as "VENTAS" | "COMPRAS",
    tipoAjuste: f.tipoAjuste as AjusteAplicable["tipoAjuste"],
    referenciaTipo: (f.referenciaTipo as TipoReferencia | null) ?? null,
    referenciaId: f.referenciaId,
    tipoComprobanteArca: f.tipoComprobanteArca ?? undefined,
    puntoVenta: f.puntoVenta ?? undefined,
    numeroDesde: f.numeroDesde != null ? Number(f.numeroDesde) : undefined,
    numeroHasta: f.numeroHasta != null ? Number(f.numeroHasta) : undefined,
    fechaComprobante: f.fechaComprobante ?? undefined,
    cuitContraparte: f.cuitContraparte ?? undefined,
    razonSocialContraparte: f.razonSocialContraparte ?? undefined,
    netoGravado: f.netoGravado != null ? Number(f.netoGravado) : undefined,
    iva: f.iva != null ? Number(f.iva) : undefined,
    exento: f.exento != null ? Number(f.exento) : undefined,
    noGravado: f.noGravado != null ? Number(f.noGravado) : undefined,
    percepcionIva: f.percepcionIva != null ? Number(f.percepcionIva) : undefined,
    percepcionIibb: f.percepcionIibb != null ? Number(f.percepcionIibb) : undefined,
    percepcionGanancias:
      f.percepcionGanancias != null ? Number(f.percepcionGanancias) : undefined,
    total: f.total != null ? Number(f.total) : undefined,
    alicuota: f.alicuota ?? undefined,
    motivo: f.motivo,
  }))
}

/**
 * obtenerAjustesTodosDelPeriodo: lista todos (incluye anulados) para UI.
 */
export async function obtenerAjustesTodosDelPeriodo(periodoIvaId: string) {
  return prisma.ajusteIvaPeriodo.findMany({
    where: { periodoIvaId },
    include: {
      creadoPor: { select: { nombre: true, apellido: true, email: true } },
      anuladoPor: { select: { nombre: true, apellido: true, email: true } },
    },
    orderBy: { creadoEn: "desc" },
  })
}
