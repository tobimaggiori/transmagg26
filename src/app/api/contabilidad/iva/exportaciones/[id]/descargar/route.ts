/**
 * GET /api/contabilidad/iva/exportaciones/[id]/descargar
 *   Devuelve URL firmada del ZIP de la exportación. Marca estado DESCARGADA
 *   si estaba en GENERADA.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { obtenerUrlFirmadaArchivo } from "@/lib/iva-portal/storage-iva"
import type { Rol } from "@/types"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.iva.descargar_exportacion"))) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const exportacion = await prisma.exportacionIvaArca.findUnique({ where: { id: params.id } })
  if (!exportacion) return NextResponse.json({ error: "Exportación no encontrada" }, { status: 404 })
  if (!exportacion.zipS3Key) return NextResponse.json({ error: "ZIP no disponible" }, { status: 422 })

  const url = await obtenerUrlFirmadaArchivo(exportacion.zipS3Key, 900)

  // Si está en GENERADA, pasarla a DESCARGADA (primera descarga)
  if (exportacion.estado === "GENERADA") {
    await prisma.exportacionIvaArca.update({
      where: { id: params.id },
      data: { estado: "DESCARGADA" },
    })
  }

  return NextResponse.json({ url, hashZip: exportacion.hashZip })
}
