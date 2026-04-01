/**
 * ActionCard: { title, subtitle, href, icon?, description? } -> JSX.Element
 *
 * Tarjeta de acción estética que navega a una ruta al hacer click.
 * Usada en las páginas de sección de Fleteros.
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
      <div className="group flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer p-10 gap-3 min-h-[200px] text-center">
        {Icon && (
          <Icon className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground group-hover:text-primary transition-colors">
            {title}
          </p>
          <p className="text-xl font-bold tracking-tight mt-1 group-hover:text-primary transition-colors">
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
