/**
 * Página /configuracion/permisos.
 *
 * Solo ADMIN_TRANSMAGG. Permite configurar qué secciones puede usar cada
 * OPERADOR_TRANSMAGG (modelo blacklist: por defecto todos los toggles
 * están activos; el admin destilda lo que no quiere que el operador acceda).
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { SECCIONES } from "@/lib/secciones"
import { PermisosOperadoresClient } from "./permisos-operadores-client"
import type { Rol } from "@/types"

export default async function PermisosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) redirect("/dashboard")

  const operadores = await prisma.usuario.findMany({
    where: { rol: "OPERADOR_TRANSMAGG", activo: true },
    select: {
      id: true, nombre: true, apellido: true, email: true,
      permisos: { where: { habilitado: true }, select: { seccion: true } },
    },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  })

  const operadoresData = operadores.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    permisos: u.permisos.map((p) => p.seccion),
  }))

  const todasLasSecciones = Object.values(SECCIONES)

  return <PermisosOperadoresClient operadores={operadoresData} secciones={todasLasSecciones} />
}
