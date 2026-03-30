/**
 * Propósito: Página ABM (Alta, Baja, Modificación) de Transmagg.
 * Exclusiva para ADMIN_TRANSMAGG. Permite gestionar Empresas, Fleteros,
 * Choferes, Usuarios y Proveedores mediante tabs con URL params.
 * Es la única sección donde se pueden crear, modificar y eliminar entidades.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { EmpresasAbm } from "@/components/abm/empresas-abm"
import { FleterosAbm } from "@/components/abm/fleteros-abm"
import { ChoforesAbm } from "@/components/abm/choferes-abm"
import { UsuariosAbm } from "@/components/abm/usuarios-abm"
import { ProveedoresAbm } from "@/components/abm/proveedores-abm"
import type { Rol } from "@/types"

type Tab = "empresas" | "fleteros" | "choferes" | "usuarios" | "proveedores"

const TABS: { id: Tab; label: string }[] = [
  { id: "empresas", label: "Empresas" },
  { id: "fleteros", label: "Fleteros" },
  { id: "choferes", label: "Choferes" },
  { id: "usuarios", label: "Usuarios" },
  { id: "proveedores", label: "Proveedores" },
]

/**
 * AbmPage: ({ searchParams: { tab? } }) -> Promise<JSX.Element>
 *
 * Dado el tab activo (por URL param ?tab=), muestra la subsección ABM correspondiente.
 * Solo accesible para ADMIN_TRANSMAGG; redirige a /dashboard si no tiene permiso.
 * Existe para centralizar el alta, baja y modificación de todas las entidades
 * del sistema en un único punto de acceso exclusivo del administrador.
 *
 * Ejemplos:
 * // GET /abm (sesión ADMIN_TRANSMAGG) → tab "empresas" por defecto
 * <AbmPage searchParams={{}} />
 * // GET /abm?tab=fleteros → muestra gestión de fleteros con subsección camiones
 * <AbmPage searchParams={{ tab: "fleteros" }} />
 * // GET /abm (sesión OPERADOR_TRANSMAGG) → redirect /dashboard
 * <AbmPage searchParams={{}} />
 */
export default async function AbmPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) redirect("/dashboard")

  const tab = (searchParams.tab as Tab) ?? "empresas"
  const tabValido = TABS.some((t) => t.id === tab) ? tab : "empresas"

  // Fetch data según tab activo para no cargar todo innecesariamente
  const [empresas, fleteros, choferes, usuarios, proveedores] = await Promise.all([
    tabValido === "empresas"
      ? prisma.empresa.findMany({
          select: { id: true, razonSocial: true, cuit: true, condicionIva: true, direccion: true },
          orderBy: { razonSocial: "asc" },
        })
      : [],
    tabValido === "fleteros"
      ? prisma.fletero.findMany({
          where: { activo: true },
          include: {
            usuario: { select: { nombre: true, apellido: true, email: true } },
            camiones: {
              where: { activo: true },
              select: { id: true, patenteChasis: true, patenteAcoplado: true, tipoCamion: true },
              orderBy: { patenteChasis: "asc" },
            },
          },
          orderBy: { razonSocial: "asc" },
        })
      : [],
    tabValido === "choferes"
      ? prisma.usuario.findMany({
          where: { rol: "CHOFER" },
          select: { id: true, nombre: true, apellido: true, email: true, telefono: true, activo: true },
          orderBy: [{ activo: "desc" }, { apellido: "asc" }],
        })
      : [],
    tabValido === "usuarios"
      ? prisma.usuario.findMany({
          orderBy: [{ activo: "desc" }, { apellido: "asc" }],
          select: {
            id: true, nombre: true, apellido: true, email: true, telefono: true, rol: true, activo: true,
            empresaUsuarios: { select: { empresa: { select: { razonSocial: true } }, nivelAcceso: true } },
          },
        })
      : [],
    tabValido === "proveedores"
      ? prisma.proveedor.findMany({
          orderBy: [{ activo: "desc" }, { razonSocial: "asc" }],
          select: { id: true, razonSocial: true, cuit: true, condicionIva: true, rubro: true, activo: true },
        })
      : [],
  ])

  // Para el tab usuarios necesitamos la lista de empresas para asignar
  const empresasParaUsuarios = tabValido === "usuarios"
    ? await prisma.empresa.findMany({
        where: { activa: true },
        select: { id: true, razonSocial: true },
        orderBy: { razonSocial: "asc" },
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ABM</h2>
        <p className="text-muted-foreground">
          Alta, baja y modificación de entidades del sistema. Solo accesible para administradores.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`/abm?tab=${t.id}`}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tabValido === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Contenido del tab activo */}
      <div>
        {tabValido === "empresas" && <EmpresasAbm empresas={empresas} />}
        {tabValido === "fleteros" && <FleterosAbm fleteros={fleteros} />}
        {tabValido === "choferes" && <ChoforesAbm choferes={choferes} />}
        {tabValido === "usuarios" && <UsuariosAbm usuarios={usuarios} empresas={empresasParaUsuarios} />}
        {tabValido === "proveedores" && <ProveedoresAbm proveedores={proveedores} />}
      </div>
    </div>
  )
}
