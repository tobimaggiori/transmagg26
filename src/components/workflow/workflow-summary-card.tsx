"use client"

/**
 * Propósito: Tarjeta resumen reutilizable para el workflow operativo.
 * Expone una pieza visual homogénea para mostrar contadores de viajes,
 * liquidaciones o facturas en distintas pantallas del dashboard.
 */

/**
 * WorkflowSummaryCard: props -> JSX.Element
 *
 * Dados [un título, un valor numérico y un tono visual opcional], devuelve
 * [una tarjeta compacta con el resumen del indicador].
 * Existe para reutilizar la misma jerarquía visual del workflow en todas las
 * pantallas sin repetir clases ni estilos ad hoc.
 *
 * Ejemplos:
 * <WorkflowSummaryCard titulo="Total" valor={12} />
 * <WorkflowSummaryCard titulo="Pendientes" valor={4} tono="warning" />
 */
export function WorkflowSummaryCard({
  titulo,
  valor,
  tono = "neutral",
}: {
  titulo: string
  valor: number
  tono?: "neutral" | "warning" | "success"
}) {
  const estilos = {
    neutral: "border-slate-200 bg-slate-50 text-slate-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }

  return (
    <div className={`rounded-xl border p-4 ${estilos[tono]}`}>
      <p className="text-xs font-medium uppercase tracking-[0.16em] opacity-70">{titulo}</p>
      <p className="mt-2 text-3xl font-semibold">{valor}</p>
    </div>
  )
}
