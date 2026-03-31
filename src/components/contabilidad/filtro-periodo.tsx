/**
 * Propósito: Componente de filtro de período para páginas de contabilidad.
 * Renderiza dos formularios GET: uno para mes+año y otro para rango de fechas.
 * Se usa en todas las páginas del módulo de contabilidad.
 */

const MESES = [
  { num: 1, nombre: "Enero" }, { num: 2, nombre: "Febrero" }, { num: 3, nombre: "Marzo" },
  { num: 4, nombre: "Abril" }, { num: 5, nombre: "Mayo" }, { num: 6, nombre: "Junio" },
  { num: 7, nombre: "Julio" }, { num: 8, nombre: "Agosto" }, { num: 9, nombre: "Septiembre" },
  { num: 10, nombre: "Octubre" }, { num: 11, nombre: "Noviembre" }, { num: 12, nombre: "Diciembre" },
]

type FiltroPeriodoProps = {
  /** URL del form action, ej: "/contabilidad/iva" */
  action: string
  /** Query params adicionales a preservar como hidden inputs, ej: { tab: "compras" } */
  extraParams?: Record<string, string>
  mes?: string
  anio?: string
  desde?: string
  hasta?: string
}

/**
 * FiltroPeriodo: FiltroPeriodoProps -> JSX.Element
 *
 * Dado la ruta de destino y los valores actuales de filtro, renderiza el bloque
 * de filtro de período con selector mes/año y rango de fechas.
 * Existe para centralizar el UI de filtro y evitar duplicación en las páginas
 * de contabilidad.
 *
 * Ejemplos:
 * <FiltroPeriodo action="/contabilidad/iva" mes="3" anio="2026" />
 * <FiltroPeriodo action="/contabilidad/iva" extraParams={{ tab: "compras" }} />
 */
export function FiltroPeriodo({ action, extraParams, mes, anio, desde, hasta }: FiltroPeriodoProps) {
  const anioActual = new Date().getFullYear()
  const anios = [anioActual - 1, anioActual, anioActual + 1]

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/40">
      <p className="text-sm font-medium">Filtrar por período</p>
      <div className="flex flex-wrap gap-4">
        {/* Filtro por mes y año */}
        <form method="GET" action={action} className="flex items-end gap-2">
          {extraParams && Object.entries(extraParams).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Mes</label>
            <select
              name="mes"
              defaultValue={mes ?? ""}
              className="h-9 rounded-md border bg-background px-2 text-sm min-w-[120px]"
            >
              <option value="">—</option>
              {MESES.map((m) => (
                <option key={m.num} value={String(m.num)}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Año</label>
            <select
              name="anio"
              defaultValue={anio ?? String(anioActual)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {anios.map((a) => (
                <option key={a} value={String(a)}>{a}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Ver mes
          </button>
        </form>

        <div className="text-sm text-muted-foreground flex items-center">o</div>

        {/* Filtro por rango de fechas */}
        <form method="GET" action={action} className="flex items-end gap-2">
          {extraParams && Object.entries(extraParams).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <input
              type="date"
              name="desde"
              defaultValue={desde ?? ""}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <input
              type="date"
              name="hasta"
              defaultValue={hasta ?? ""}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Ver rango
          </button>
        </form>

        <a
          href={action}
          className="h-9 px-3 rounded-md border text-sm font-medium inline-flex items-center self-end hover:bg-accent"
        >
          Limpiar
        </a>
      </div>
    </div>
  )
}
