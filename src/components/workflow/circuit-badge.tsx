"use client"

/**
 * Propósito: Badge reutilizable para mostrar el estado de cada circuito.
 * Distingue visualmente el lado fletero y el lado empresa sin mezclar ambos
 * estados dentro de un único rótulo ambiguo.
 */

/**
 * CircuitBadge: props -> JSX.Element
 *
 * Dados [una etiqueta y un estado del circuito], devuelve [un badge visual
 * con la leyenda "Pendiente" o "Resuelto"].
 * Existe para representar de forma consistente el avance del workflow dual
 * de cada viaje en la UI.
 *
 * Ejemplos:
 * <CircuitBadge etiqueta="Fletero" estado="PENDIENTE_LIQUIDAR" />
 * <CircuitBadge etiqueta="Empresa" estado="FACTURADO" />
 */
export function CircuitBadge({
  etiqueta,
  estado,
}: {
  etiqueta: string
  estado: string
}) {
  const esPendiente = estado.startsWith("PENDIENTE")
  const esAjustado = estado.includes("AJUSTADO_PARCIAL")

  const color = esPendiente
    ? "bg-amber-100 text-amber-900"
    : esAjustado
      ? "bg-sky-100 text-sky-900"
      : "bg-emerald-100 text-emerald-900"

  const label = esPendiente ? "Pendiente" : esAjustado ? "Ajustado" : "Resuelto"

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${color}`}
    >
      {etiqueta}: {label}
    </span>
  )
}
