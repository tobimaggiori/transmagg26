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
    puntosVenta: (() => {
      try {
        return JSON.parse(safe.puntosVenta) as Record<string, string>
      } catch {
        return {}
      }
    })(),
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

  const updated = await prisma.configuracionArca.upsert({
    where: { id: "unico" },
    update: {
      ...rest,
      ...datosSensibles,
      ...(puntosVenta !== undefined ? { puntosVenta: JSON.stringify(
        Object.fromEntries(Object.entries(puntosVenta).map(([k, v]) => [k, Number(v)]))
      ) } : {}),
      actualizadoPor: session.user.email ?? undefined,
    },
    create: {
      id: "unico",
      cuit: "30709381683",
      razonSocial: "",
      ...rest,
      ...datosSensibles,
      ...(puntosVenta !== undefined ? { puntosVenta: JSON.stringify(
        Object.fromEntries(Object.entries(puntosVenta).map(([k, v]) => [k, Number(v)]))
      ) } : {}),
      actualizadoPor: session.user.email ?? undefined,
    },
  })

  const { certificadoB64: _b64patch, certificadoPass: _passpatch, ...safe } = updated
  void _passpatch
  return NextResponse.json({
    ...safe,
    tieneCertificado: !!_b64patch,
    puntosVenta: (() => {
      try {
        return JSON.parse(safe.puntosVenta) as Record<string, string>
      } catch {
        return {}
      }
    })(),
  })
}
