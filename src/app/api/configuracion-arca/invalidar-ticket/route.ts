/**
 * POST /api/configuracion-arca/invalidar-ticket
 *
 * Invalida el ticket WSAA cacheado para forzar renovación.
 * Útil después de cambiar certificado.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { Rol } from "@/types"

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  try {
    await prisma.ticketWsaa.deleteMany({})
    console.info(`[ARCA] Admin ${session.user.email} invalidó ticket WSAA — ${new Date().toISOString()}`)
    return NextResponse.json({ ok: true, mensaje: "Ticket WSAA invalidado. La próxima operación solicitará uno nuevo." })
  } catch {
    return NextResponse.json({ ok: false, mensaje: "Error al invalidar ticket" }, { status: 500 })
  }
}
