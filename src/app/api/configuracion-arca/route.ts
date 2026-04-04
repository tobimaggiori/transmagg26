/**
 * Propósito: API de configuración ARCA (singleton id="unico").
 * GET  → devuelve config sin certificadoB64 ni certificadoPass
 * PATCH → actualiza campos permitidos; actualiza actualizadoPor con email del operador
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { cifrarValor } from "@/lib/arca/crypto"
import { z } from "zod"
import type { Rol } from "@/types"

const patchSchema = z.object({
  cuit: z.string().min(1).optional(),
  razonSocial: z.string().min(1).optional(),
  certificadoB64: z.string().optional(),
  certificadoPass: z.string().optional(),
  modo: z.enum(["homologacion", "produccion"]).optional(),
  puntosVenta: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  cbuMiPymes: z.string().nullable().optional(),
  activa: z.boolean().optional(),
})

/**
 * parsearPuntosVenta: string -> Record<string, number>
 *
 * Parsea el JSON de puntosVenta de la DB y normaliza a numbers.
 * Filtra valores inválidos (NaN, 0, negativos). Backward compatible con strings legacy.
 */
function parsearPuntosVenta(json: string): Record<string, number> {
  try {
    const raw = JSON.parse(json) as Record<string, unknown>
    const result: Record<string, number> = {}
    for (const [k, v] of Object.entries(raw)) {
      const n = typeof v === "number" ? v : parseInt(String(v), 10)
      if (!isNaN(n) && n > 0) result[k] = n
    }
    return result
  } catch {
    return {}
  }
}

/**
 * normalizarPuntosVentaInput: Record<string, string | number> -> string
 *
 * Convierte el input del frontend a JSON para DB.
 * Solo persiste números válidos > 0. Descarta NaN, 0, negativos.
 */
function normalizarPuntosVentaInput(input: Record<string, string | number>): string {
  const result: Record<string, number> = {}
  for (const [k, v] of Object.entries(input)) {
    const n = typeof v === "number" ? v : parseInt(String(v), 10)
    if (!isNaN(n) && n > 0) result[k] = n
  }
  return JSON.stringify(result)
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  if (!esAdmin(session.user.rol as Rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const config = await prisma.configuracionArca.findFirst()
  if (!config) {
    return NextResponse.json(null)
  }

  // Never return certificadoB64 or certificadoPass
  const { certificadoB64: _b64, certificadoPass: _cert_pass, ...safe } = config
  void _cert_pass
  return NextResponse.json({
    ...safe,
    tieneCertificado: !!_b64,
    puntosVenta: parsearPuntosVenta(safe.puntosVenta),
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  if (!esAdmin(session.user.rol as Rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { puntosVenta, certificadoB64, certificadoPass, ...rest } = parsed.data

  // Cifrar certificado y password si están presentes
  const datosSensibles: Record<string, string> = {}
  if (certificadoB64 !== undefined) datosSensibles.certificadoB64 = cifrarValor(certificadoB64)
  if (certificadoPass !== undefined) datosSensibles.certificadoPass = cifrarValor(certificadoPass)

  const pvJson = puntosVenta !== undefined ? normalizarPuntosVentaInput(puntosVenta) : undefined

  const updated = await prisma.configuracionArca.upsert({
    where: { id: "unico" },
    update: {
      ...rest,
      ...datosSensibles,
      ...(pvJson !== undefined ? { puntosVenta: pvJson } : {}),
      actualizadoPor: session.user.email ?? undefined,
    },
    create: {
      id: "unico",
      cuit: "30709381683",
      razonSocial: "",
      ...rest,
      ...datosSensibles,
      ...(pvJson !== undefined ? { puntosVenta: pvJson } : {}),
      actualizadoPor: session.user.email ?? undefined,
    },
  })

  const { certificadoB64: _b64patch, certificadoPass: _passpatch, ...safe } = updated
  void _passpatch
  return NextResponse.json({
    ...safe,
    tieneCertificado: !!_b64patch,
    puntosVenta: parsearPuntosVenta(safe.puntosVenta),
  })
}
