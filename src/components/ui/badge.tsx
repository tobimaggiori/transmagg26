import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-error-soft text-error",
        outline: "border border-border text-foreground",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        info: "bg-info-soft text-info",
        // Estados de negocio
        pendiente: "bg-warning-soft text-warning",
        emitida: "bg-info-soft text-info",
        autorizada: "bg-success-soft text-success",
        rechazada: "bg-error-soft text-error",
        pagada: "bg-success-soft text-success",
        parcial: "bg-warning-soft text-warning",
        anulada: "bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
