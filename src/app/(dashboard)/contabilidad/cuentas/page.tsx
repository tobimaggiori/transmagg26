/**
 * Propósito: Página de índice de cuentas — navega a BANCOS, BROKERS y BILLETERAS.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { Building2, TrendingUp, Wallet } from "lucide-react"
import type { Rol } from "@/types"

export default async function CuentasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/dashboard")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cuentas y Tarjetas</h1>
        <p className="text-muted-foreground">Gestioná cuentas bancarias, brokers, billeteras y tarjetas.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard
          title="CUENTAS"
          subtitle="BANCOS"
          href="/contabilidad/cuentas/bancos"
          icon={Building2}
          description="Cuentas corrientes y sub-cuentas por moneda"
        />
        <ActionCard
          title="CUENTAS"
          subtitle="BROKERS"
          href="/contabilidad/cuentas/brokers"
          icon={TrendingUp}
          description="Cuentas comitentes y fondos de inversión (FCI)"
        />
        <ActionCard
          title="CUENTAS"
          subtitle="BILLETERAS"
          href="/contabilidad/cuentas/billeteras"
          icon={Wallet}
          description="Billeteras virtuales y cuentas de pago"
        />
        <ActionCard
          title="RESÚMENES"
          subtitle="TARJETAS"
          href="/contabilidad/tarjetas"
          description="Carga y gestión de resúmenes de tarjeta"
        />
      </div>
    </div>
  )
}
