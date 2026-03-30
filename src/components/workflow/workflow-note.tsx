"use client"

/**
 * Propósito: Bloque visual reutilizable para notas de negocio del workflow.
 * Permite explicar reglas operativas del sistema sin repetir estructura visual
 * entre pantallas.
 */

/**
 * WorkflowNote: props -> JSX.Element
 *
 * Dados [un título y un texto explicativo], devuelve [una tarjeta informativa
 * para contextualizar la pantalla].
 * Existe para hacer explícitas reglas como datos guardados en comprobantes, edición previa o
 * independencia entre circuitos.
 *
 * Ejemplos:
 * <WorkflowNote titulo="Datos guardados" descripcion="La liquidación guarda esos datos." />
 * <WorkflowNote titulo="Edición previa" descripcion="Podés corregir antes de facturar." />
 */
export function WorkflowNote({
  titulo,
  descripcion,
}: {
  titulo: string
  descripcion: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{titulo}</p>
      <p className="mt-2 text-sm text-slate-700">{descripcion}</p>
    </div>
  )
}
