/**
 * Propósito: Página ABM (Alta, Baja, Modificación) de Transmagg.
 * Exclusiva para ADMIN_TRANSMAGG. Permite gestionar Empresas, Fleteros,
 * Choferes, Usuarios, Proveedores, Cuentas, FCI, Brokers y Empleados.
 * Es la única sección donde se pueden crear, modificar y eliminar entidades.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { EmpresasAbm } from "@/components/abm/empresas-abm"
import { FleterosAbm } from "@/components/abm/fleteros-abm"
import { UsuariosAbm } from "@/components/abm/usuarios-abm"
import { ProveedoresAbm } from "@/components/abm/proveedores-abm"
import { CuentasAbm } from "@/components/abm/cuentas-abm"
import { FciAbm } from "@/components/abm/fci-abm"
import { EmpleadosAbm } from "@/components/abm/empleados-abm"
import { ConfiguracionArcaAbm } from "@/components/abm/configuracion-arca-abm"
import { ConfiguracionOtpAbm } from "@/components/abm/configuracion-otp-abm"
import type { Rol } from "@/types"

type Tab = "empresas" | "fleteros" | "usuarios" | "proveedores" | "cuentas" | "fci" | "empleados" | "arca" | "otp"

const TABS: { id: Tab; label: string }[] = [
  { id: "empresas", label: "Empresas" },
  { id: "fleteros", label: "Fleteros" },
  { id: "usuarios", label: "Usuarios" },
  { id: "proveedores", label: "Proveedores" },
  { id: "cuentas", label: "Cuentas" },
  { id: "fci", label: "FCI" },
  { id: "empleados", label: "Empleados" },
  { id: "arca", label: "ARCA" },
  { id: "otp", label: "OTP" },
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
 * // GET /abm?tab=cuentas → muestra gestión de cuentas bancarias
 * <AbmPage searchParams={{ tab: "cuentas" }} />
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
  const [empresas, fleteros, , usuarios, proveedores, cuentas, fcis, empleados] = await Promise.all([
    tabValido === "empresas"
      ? prisma.empresa.findMany({
          select: {
            id: true, razonSocial: true, cuit: true, condicionIva: true, direccion: true,
            contactosEmail: {
              where: { activo: true },
              select: { id: true, email: true, nombre: true },
              orderBy: { creadoEn: "asc" },
            },
          },
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
              select: {
                id: true,
                patenteChasis: true,
                patenteAcoplado: true,
                tipoCamion: true,
                choferHistorial: {
                  where: { hasta: null },
                  select: { chofer: { select: { id: true, nombre: true, apellido: true, email: true } } },
                  take: 1,
                },
              },
              orderBy: { patenteChasis: "asc" },
            },
            choferes: {
              where: { rol: "CHOFER", activo: true },
              select: { id: true, nombre: true, apellido: true, email: true },
              orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
            },
            contactosEmail: {
              where: { activo: true },
              select: { id: true, email: true, nombre: true },
              orderBy: { creadoEn: "asc" },
            },
          },
          orderBy: { razonSocial: "asc" },
        })
      : [],
    [] as never[],
    tabValido === "usuarios"
      ? prisma.usuario.findMany({
          orderBy: [{ activo: "desc" }, { apellido: "asc" }],
          select: {
            id: true, nombre: true, apellido: true, email: true, telefono: true, rol: true, activo: true,
            fleteroId: true,
            smtpHost: true, smtpPuerto: true, smtpUsuario: true, smtpPassword: true, smtpSsl: true, smtpActivo: true,
            empresaUsuarios: { select: { empresaId: true, empresa: { select: { razonSocial: true } }, nivelAcceso: true } },
            fletero: { select: { id: true } },
          },
        })
      : [],
    tabValido === "proveedores"
      ? prisma.proveedor.findMany({
          orderBy: [{ activo: "desc" }, { razonSocial: "asc" }],
          select: { id: true, razonSocial: true, cuit: true, condicionIva: true, rubro: true, activo: true },
        })
      : [],
    (tabValido === "cuentas" || tabValido === "fci")
      ? prisma.cuenta.findMany({
          orderBy: { nombre: "asc" },
          select: { id: true, nombre: true, tipo: true, bancoOEntidad: true, moneda: true, activa: true, tieneChequera: true, tienePlanillaEmisionMasiva: true, tieneCuentaRemunerada: true, tieneTarjetasPrepagasChoferes: true, tieneImpuestoDebcred: true, alicuotaImpuesto: true },
        })
      : [],
    tabValido === "fci"
      ? prisma.fci.findMany({
          orderBy: { nombre: "asc" },
          include: { cuenta: { select: { nombre: true } } },
        })
      : [],
    tabValido === "empleados"
      ? prisma.empleado.findMany({
          orderBy: [{ activo: "desc" }, { apellido: "asc" }],
          select: { id: true, nombre: true, apellido: true, cuit: true, cargo: true, fechaIngreso: true, activo: true },
        })
      : [],
  ])

  // Para el tab usuarios necesitamos la lista de empresas y fleteros para asignar
  const [empresasParaUsuarios, fleterosParaUsuarios] = tabValido === "usuarios"
    ? await Promise.all([
        prisma.empresa.findMany({
          where: { activa: true },
          select: { id: true, razonSocial: true },
          orderBy: { razonSocial: "asc" },
        }),
        prisma.fletero.findMany({
          where: { activo: true },
          select: { id: true, razonSocial: true },
          orderBy: { razonSocial: "asc" },
        }),
      ])
    : [[], []]

  // Config ARCA (tab arca)
  const arcaConfigRaw = tabValido === "arca"
    ? await prisma.configuracionArca.findFirst()
    : null

  // Config OTP (tab otp)
  const otpConfigRaw = tabValido === "otp"
    ? await prisma.configuracionOtp.findUnique({ where: { id: "singleton" } })
    : null

  const otpConfig = otpConfigRaw
    ? {
        host: otpConfigRaw.host,
        puerto: otpConfigRaw.puerto,
        usuario: otpConfigRaw.usuario,
        tienePassword: !!otpConfigRaw.passwordHash,
        usarSsl: otpConfigRaw.usarSsl,
        emailRemitente: otpConfigRaw.emailRemitente,
        nombreRemitente: otpConfigRaw.nombreRemitente,
        activo: otpConfigRaw.activo,
      }
    : null

  const arcaConfig = arcaConfigRaw
    ? (() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { certificadoB64, certificadoPass, ...safe } = arcaConfigRaw
        return {
          ...safe,
          tieneCertificado: !!certificadoB64,
          actualizadoEn: safe.actualizadoEn.toISOString(),
          puntosVenta: (() => {
            try { return JSON.parse(safe.puntosVenta) as Record<string, string> }
            catch { return {} }
          })(),
        }
      })()
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ABM</h2>
        <p className="text-muted-foreground">
          Alta, baja y modificación de entidades del sistema. Solo accesible para administradores.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`/abm?tab=${t.id}`}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
        {tabValido === "usuarios" && (
          <UsuariosAbm
            usuarios={usuarios.map((u) => ({
              ...u,
              smtpTienePassword: !!u.smtpPassword,
              smtpPassword: undefined,
              fleteroPropio: u.fletero ?? null,
            }))}
            empresas={empresasParaUsuarios}
            fleteros={fleterosParaUsuarios}
            rolActual={rol}
          />
        )}
        {tabValido === "proveedores" && <ProveedoresAbm proveedores={proveedores} />}
        {tabValido === "cuentas" && <CuentasAbm cuentas={cuentas} />}
        {tabValido === "fci" && <FciAbm fcis={fcis} cuentas={cuentas.map(c => ({ id: c.id, nombre: c.nombre }))} />}
        {tabValido === "empleados" && <EmpleadosAbm empleados={empleados.map(e => ({ ...e, fechaIngreso: e.fechaIngreso.toISOString() }))} />}
        {tabValido === "arca" && <ConfiguracionArcaAbm config={arcaConfig} />}
        {tabValido === "otp" && <ConfiguracionOtpAbm config={otpConfig} />}
      </div>
    </div>
  )
}
