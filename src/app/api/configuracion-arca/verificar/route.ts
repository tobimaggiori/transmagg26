/**
 * Propósito: POST /api/configuracion-arca/verificar
 * Verifica que la configuración ARCA sea válida (formato, no llama a ARCA real).
 * Chequea: CUIT 11 dígitos, razonSocial no vacía, certificado presente, puntosVenta no vacío.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  if (!esAdmin(session.user.rol as Rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const config = await prisma.configuracionArca.findFirst()
  if (!config) {
    return NextResponse.json({
      ok: false,
      errores: ["No existe configuración ARCA. Guardá los datos primero."],
    })
  }

  const errores: string[] = []

  // CUIT: exactamente 11 dígitos numéricos
  if (!/^\d{11}$/.test(config.cuit)) {
    errores.push("CUIT inválido (debe tener exactamente 11 dígitos numéricos).")
  }

  if (!config.razonSocial.trim()) {
    errores.push("Razón social vacía.")
  }

  if (!config.certificadoB64) {
    errores.push("Certificado digital no cargado.")
  }

  if (!config.certificadoPass) {
    errores.push("Contraseña del certificado no configurada.")
  }

  let puntosVenta: Record<string, string> = {}
  try {
    puntosVenta = JSON.parse(config.puntosVenta) as Record<string, string>
  } catch {
    errores.push("Puntos de venta con formato inválido.")
  }

  if (Object.keys(puntosVenta).length === 0) {
    errores.push("Debe configurar al menos un punto de venta.")
  }

  if (errores.length > 0) {
    return NextResponse.json({ ok: false, errores })
  }

  return NextResponse.json({
    ok: true,
    mensaje: "Configuración verificada correctamente. Formato válido.",
  })
}
