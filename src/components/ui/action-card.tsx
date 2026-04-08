/**
 * ActionCard: { title, subtitle, href, icon?, description? } -> JSX.Element
 *
 * Tarjeta de acción que navega a una ruta al hacer click.
 * Usada en las páginas hub de Empresas, Fleteros, etc.
 *
 * Ejemplos:
 * <ActionCard title="EMITIR" subtitle="LÍQUIDO PRODUCTO" href="/fleteros/liquidar" />
 * <ActionCard title="CONSULTAR" subtitle="GASTOS" href="/fleteros/gastos" icon={Search} />
 */

import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface ActionCardProps {
  title: string
  subtitle: string
  href: string
  icon?: LucideIcon
  description?: string
}

export function ActionCard({ title, subtitle, href, icon: Icon, description }: ActionCardProps) {
  return (
    <Link href={href}>
      <div className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer p-8 gap-3 min-h-[180px] text-center">
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent group-hover:bg-primary/10 transition-colors">
            <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        )}
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">
            {title}
          </p>
          <p className="text-lg font-bold tracking-tight mt-0.5 text-foreground group-hover:text-primary transition-colors">
            {subtitle}
          </p>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </Link>
  )
}
