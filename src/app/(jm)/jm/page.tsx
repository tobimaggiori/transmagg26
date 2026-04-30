/**
 * Home del sistema "Javier Maggiori".
 *
 * Mientras se porta el dashboard financiero completo (TODO grande:
 * /api/jm/dashboard-financiero/* + ~1000 líneas de UI), mostramos un
 * landing con accesos rápidos a las secciones principales.
 */

import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Rol } from "@/types"

const ACCESOS = [
  { titulo: "Empresas", descripcion: "Facturación, recibos y cuentas corrientes", href: "/jm/empresas/facturas" },
  { titulo: "Proveedores", descripcion: "Facturas, pagos y cuentas corrientes", href: "/jm/proveedores/facturas" },
  { titulo: "Contabilidad", descripcion: "Cuentas, IIBB, IVA, impuestos y reportes", href: "/jm/contabilidad" },
  { titulo: "Mi Flota", descripcion: "Camiones propios, choferes y combustible", href: "/jm/mi-flota" },
  { titulo: "Viajes", descripcion: "Consultar y registrar viajes propios", href: "/jm/viajes/consultar" },
  { titulo: "ABM", descripcion: "Empresas, proveedores, empleados, cuentas, FCI", href: "/jm/abm/base-de-datos" },
  { titulo: "Configuración", descripcion: "ARCA y envío de comprobantes", href: "/jm/configuracion" },
]

export default async function JmHome() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Javier Maggiori</h1>
        <p className="text-muted-foreground">Sistema de gestión de transporte propio</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACCESOS.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{a.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{a.descripcion}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
