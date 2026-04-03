import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { UsuariosAbm } from "@/components/abm/usuarios-abm"
import type { Rol } from "@/types"

export default async function UsuariosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) redirect("/dashboard")

  const [usuarios, empresas, fleteros] = await Promise.all([
    prisma.usuario.findMany({
      orderBy: [{ activo: "desc" }, { apellido: "asc" }],
      select: {
        id: true, nombre: true, apellido: true, email: true, telefono: true, rol: true, activo: true,
        fleteroId: true,
        smtpHost: true, smtpPuerto: true, smtpUsuario: true, smtpPassword: true, smtpSsl: true, smtpActivo: true,
        empresaUsuarios: { select: { empresaId: true, empresa: { select: { razonSocial: true } }, nivelAcceso: true } },
        fletero: { select: { id: true } },
      },
    }),
    prisma.empresa.findMany({
      where: { activa: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.fletero.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usuarios</h2>
        <p className="text-muted-foreground">Gestión de usuarios del sistema.</p>
      </div>
      <UsuariosAbm
        usuarios={usuarios.map((u) => ({
          ...u,
          smtpTienePassword: !!u.smtpPassword,
          smtpPassword: undefined,
          fleteroPropio: u.fletero ?? null,
        }))}
        empresas={empresas}
        fleteros={fleteros}
        rolActual={rol}
      />
    </div>
  )
}
