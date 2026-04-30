/**
 * Comprobantes JM. Vista resumen de PDFs en R2 (links visibles).
 * Versión simple: cuenta cuántos comprobantes hay por entidad.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ComprobantesJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const [facturas, recibos, notas, polizas, facSeg] = await Promise.all([
    prismaJm.facturaEmitida.count({ where: { pdfS3Key: { not: null } } }),
    prismaJm.reciboCobranza.count({ where: { pdfS3Key: { not: null } } }),
    prismaJm.notaCreditoDebito.count({ where: { pdfS3Key: { not: null } } }),
    prismaJm.polizaSeguro.count({ where: { pdfS3Key: { not: null } } }),
    prismaJm.facturaSeguro.count(),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Comprobantes (R2)</h1>
      <p className="text-sm text-muted-foreground">
        Resumen de comprobantes con archivo PDF almacenado en Cloudflare R2.
        La generación de PDFs en JM está pendiente — los comprobantes
        existentes se ven aquí cuando se vayan generando.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Facturas Empresas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{facturas}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Recibos Cobranza</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{recibos}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">NC/ND</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{notas}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Pólizas Seguro</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{polizas}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Facturas Seguro</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{facSeg}</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
