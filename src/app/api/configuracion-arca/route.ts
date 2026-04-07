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
import { CODIGOS_CATALOGO } from "@/lib/arca/catalogo"
import { z } from "zod"
import type { Rol } from "@/types"

const patchSchema = z.object({
  cuit: z.string().min(1).optional(),
  razonSocial: z.string().min(1).optional(),
  certificadoB64: z.string().optional(),
  certificadoPass: z.string().optional(),
  modo: z.enum(["homologacion", "produccion", "simulacion"]).optional(),
  puntosVenta: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  comprobantesHabilitados: z.array(z.number().int()).optional(),
  cbuMiPymes: z.string().nullable().optional(),
  activa: z.boolean().optional(),
  logoComprobanteB64: z.string().nullable().optional(),
  logoArcaB64: z.string().nullable().optional(),
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

/**
 * parsearComprobantesHabilitados: string -> number[]
 *
 * Parsea el JSON array de comprobantes habilitados.
 * Solo incluye códigos que pertenecen al catálogo cerrado ARCA.
 */
function parsearComprobantesHabilitados(json: string): number[] {
  try {
    const raw = JSON.parse(json) as unknown[]
    return raw
      .map((v) => typeof v === "number" ? v : parseInt(String(v), 10))
      .filter((n) => !isNaN(n) && CODIGOS_CATALOGO.has(n))
  } catch {
    return []
  }
}

// Campos base que siempre existen en la tabla
const CONFIG_SELECT = {
  id: true, cuit: true, razonSocial: true,
  certificadoB64: true, certificadoPass: true,
  modo: true, puntosVenta: true, comprobantesHabilitados: true,
  cbuMiPymes: true, activa: true,
  actualizadoEn: true, actualizadoPor: true,
} as const

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  if (!esAdmin(session.user.rol as Rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  let config
  try {
    config = await prisma.configuracionArca.findFirst({
      select: { ...CONFIG_SELECT, logoComprobanteR2Key: true, logoArcaR2Key: true, logoComprobanteB64: true, logoArcaB64: true },
    })
  } catch {
    config = await prisma.configuracionArca.findFirst({ select: CONFIG_SELECT })
  }

  if (!config) {
    return NextResponse.json(null)
  }

  return NextResponse.json(serializarConfig(config))
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  if (!esAdmin(session.user.rol as Rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
  const { puntosVenta, comprobantesHabilitados, certificadoB64, certificadoPass, logoComprobanteB64, logoArcaB64, ...rest } = parsed.data

  // Cifrar certificado y password si están presentes
  const datosSensibles: Record<string, string> = {}
  if (certificadoB64 !== undefined) datosSensibles.certificadoB64 = cifrarValor(certificadoB64)
  if (certificadoPass !== undefined) datosSensibles.certificadoPass = cifrarValor(certificadoPass)

  const pvJson = puntosVenta !== undefined ? normalizarPuntosVentaInput(puntosVenta) : undefined

  // Filtrar comprobantesHabilitados: solo códigos del catálogo cerrado
  const chJson = comprobantesHabilitados !== undefined
    ? JSON.stringify(comprobantesHabilitados.filter((c) => CODIGOS_CATALOGO.has(c)))
    : undefined

  // Logos: solo incluir si las columnas existen (migración aplicada)
  const logosData: Record<string, string | null> = {}
  if (logoComprobanteB64 !== undefined) logosData.logoComprobanteB64 = logoComprobanteB64
  if (logoArcaB64 !== undefined) logosData.logoArcaB64 = logoArcaB64

  // Intentar upsert con logos, fallback sin logos
  let updated
  try {
    updated = await prisma.configuracionArca.upsert({
      where: { id: "unico" },
      update: {
        ...rest,
        ...datosSensibles,
        ...logosData,
        ...(pvJson !== undefined ? { puntosVenta: pvJson } : {}),
        ...(chJson !== undefined ? { comprobantesHabilitados: chJson } : {}),
        actualizadoPor: session.user.email ?? undefined,
      },
      create: {
        id: "unico",
        cuit: "30709381683",
        razonSocial: "",
        ...rest,
        ...datosSensibles,
        ...logosData,
        ...(pvJson !== undefined ? { puntosVenta: pvJson } : {}),
        ...(chJson !== undefined ? { comprobantesHabilitados: chJson } : {}),
        actualizadoPor: session.user.email ?? undefined,
      },
    })
  } catch (err) {
    // Si falla por columnas de logo que no existen, reintentar sin logos
    if (Object.keys(logosData).length > 0) {
      console.warn("[configuracion-arca] Reintentando sin logos (migración no aplicada?):", err)
      updated = await prisma.configuracionArca.upsert({
        where: { id: "unico" },
        update: {
          ...rest,
          ...datosSensibles,
          ...(pvJson !== undefined ? { puntosVenta: pvJson } : {}),
          ...(chJson !== undefined ? { comprobantesHabilitados: chJson } : {}),
          actualizadoPor: session.user.email ?? undefined,
        },
        create: {
          id: "unico",
          cuit: "30709381683",
          razonSocial: "",
          ...rest,
          ...datosSensibles,
          ...(pvJson !== undefined ? { puntosVenta: pvJson } : {}),
          ...(chJson !== undefined ? { comprobantesHabilitados: chJson } : {}),
          actualizadoPor: session.user.email ?? undefined,
        },
      })
    } else {
      throw err
    }
  }

  return NextResponse.json(serializarConfig(updated))
  } catch (err) {
    console.error("[PATCH /api/configuracion-arca] Error:", err)
    const mensaje = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error al guardar configuración: ${mensaje}` }, { status: 500 })
  }
}

/** Serializa ConfiguracionArca de Prisma a JSON seguro para el cliente */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializarConfig(row: Record<string, any>) {
  return {
    id: row.id,
    cuit: row.cuit,
    razonSocial: row.razonSocial,
    tieneCertificado: !!row.certificadoB64,
    modo: row.modo,
    puntosVenta: (() => {
      const pv = parsearPuntosVenta(row.puntosVenta)
      const result: Record<string, string> = {}
      for (const [k, v] of Object.entries(pv)) result[k] = String(v)
      return result
    })(),
    comprobantesHabilitados: parsearComprobantesHabilitados(row.comprobantesHabilitados),
    cbuMiPymes: row.cbuMiPymes,
    activa: row.activa,
    tieneLogoComprobante: !!(row.logoComprobanteR2Key || row.logoComprobanteB64),
    tieneLogoArca: !!(row.logoArcaR2Key || row.logoArcaB64),
    actualizadoEn: row.actualizadoEn instanceof Date ? row.actualizadoEn.toISOString() : row.actualizadoEn,
    actualizadoPor: row.actualizadoPor,
  }
}
