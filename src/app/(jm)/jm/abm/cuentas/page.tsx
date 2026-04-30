import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import {
  CuentasAbmJm,
  type CuentaJmAbm,
  type BancoJmAbm,
  type BilleteraJmAbm,
  type BrokerJmAbm,
} from "@/jm/components/cuentas-abm"

export default async function CuentasAbmJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const [cuentasRaw, bancos, billeteras, brokers] = await Promise.all([
    prismaJm.cuenta.findMany({
      include: { banco: true, billetera: true, broker: true },
      orderBy: [{ activa: "desc" }, { nombre: "asc" }],
    }),
    prismaJm.banco.findMany({ orderBy: { nombre: "asc" } }),
    prismaJm.billeteraVirtual.findMany({ orderBy: { nombre: "asc" } }),
    prismaJm.broker.findMany({ orderBy: { nombre: "asc" } }),
  ])

  const cuentas: CuentaJmAbm[] = cuentasRaw.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    moneda: c.moneda,
    saldoInicial: c.saldoInicial.toString(),
    banco: c.banco ? { id: c.banco.id, nombre: c.banco.nombre } : null,
    billetera: c.billetera ? { id: c.billetera.id, nombre: c.billetera.nombre } : null,
    broker: c.broker ? { id: c.broker.id, nombre: c.broker.nombre } : null,
    nroCuenta: c.nroCuenta,
    cbu: c.cbu,
    alias: c.alias,
    activa: c.activa,
  }))

  const bancosAbm: BancoJmAbm[] = bancos.map((b) => ({ id: b.id, nombre: b.nombre }))
  const billeterasAbm: BilleteraJmAbm[] = billeteras.map((b) => ({ id: b.id, nombre: b.nombre }))
  const brokersAbm: BrokerJmAbm[] = brokers.map((b) => ({ id: b.id, nombre: b.nombre, cuit: b.cuit }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuentas</h2>
        <p className="text-muted-foreground">
          Gestión de bancos, billeteras virtuales, brokers y sus cuentas operativas.
        </p>
      </div>
      <CuentasAbmJm cuentas={cuentas} bancos={bancosAbm} billeteras={billeterasAbm} brokers={brokersAbm} />
    </div>
  )
}
