import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { CuentasAbm } from "@/components/abm/cuentas-abm"
import type { Rol } from "@/types"

export default async function CuentasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "abm.cuentas"))) redirect("/dashboard")

  const [cuentas, bancos, billeteras, brokers] = await Promise.all([
    prisma.cuenta.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        moneda: true,
        activa: true,
        tieneChequera: true,
        tieneCuentaRemunerada: true,
        tieneTarjetasPrepagasChoferes: true,
        tieneImpuestoDebcred: true,
        alicuotaImpuesto: true,
        tieneIibbSircrebTucuman: true,
        alicuotaIibbSircrebTucuman: true,
        esCuentaComitenteBroker: true,
        nroCuenta: true,
        cbu: true,
        alias: true,
        bancoId: true,
        billeteraId: true,
        brokerId: true,
        banco: { select: { id: true, nombre: true, activo: true } },
        billetera: { select: { id: true, nombre: true, activa: true } },
        broker: { select: { id: true, nombre: true, cuit: true, activo: true } },
        _count: { select: { movimientos: true } },
      },
    }),
    prisma.banco.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { cuentas: true } } },
    }),
    prisma.billeteraVirtual.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { cuentas: true } } },
    }),
    prisma.broker.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { cuentas: true } } },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuentas</h2>
        <p className="text-muted-foreground">
          Gestión de bancos, billeteras virtuales, brokers y sus cuentas operativas.
        </p>
      </div>
      <CuentasAbm
        cuentas={cuentas}
        bancos={bancos.map((b) => ({
          id: b.id,
          nombre: b.nombre,
          activo: b.activo,
          cuentasCount: b._count.cuentas,
        }))}
        billeteras={billeteras.map((b) => ({
          id: b.id,
          nombre: b.nombre,
          activa: b.activa,
          cuentasCount: b._count.cuentas,
        }))}
        brokers={brokers.map((b) => ({
          id: b.id,
          nombre: b.nombre,
          cuit: b.cuit,
          activo: b.activo,
          cuentasCount: b._count.cuentas,
        }))}
      />
    </div>
  )
}
