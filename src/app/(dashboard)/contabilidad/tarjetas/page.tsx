/**
 * Propósito: Página de gestión de tarjetas (ruta /contabilidad/tarjetas).
 * Muestra dos tabs: Corporativas (CREDITO/DEBITO empresa) y Prepagas choferes.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { TarjetasClient } from "./tarjetas-client"
import type { Rol } from "@/types"

/**
 * TarjetasPage: () -> Promise<JSX.Element>
 *
 * Carga tarjetas activas y renderiza TarjetasClient.
 * Solo accesible para roles internos con acceso a "cuentas".
 *
 * Ejemplos:
 * // ADMIN_TRANSMAGG → página con tabs Corporativas y Prepagas
 * // Sin sesión → redirect /login
 */
export default async function TarjetasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = (session.user.rol ?? "") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/")

  const tarjetas = await prisma.tarjeta.findMany({
    where: { activa: true },
    include: {
      cuenta: { select: { id: true, nombre: true } },
      chofer: { select: { id: true, nombre: true, apellido: true } },
      _count: { select: { gastos: true, resumenes: true } },
    },
    orderBy: { creadoEn: "desc" },
  })

  const cuentas = await prisma.cuenta.findMany({
    where: { activa: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  })

  const choferes = await prisma.usuario.findMany({
    where: { rol: "CHOFER", activo: true },
    select: { id: true, nombre: true, apellido: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  })

  return (
    <TarjetasClient
      tarjetasIniciales={tarjetas}
      cuentas={cuentas}
      choferes={choferes}
    />
  )
}
