/**
 * GET  /api/polizas  — lista pólizas con filtros opcionales
 * POST /api/polizas  — crea una póliza nueva
 * Acceso: roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const crearSchema = z.object({
  aseguradora:     z.string().min(1),
  nroPoliza:       z.string().min(1),
  tipoBien:        z.enum(["CAMION", "VEHICULO", "INMUEBLE", "EQUIPO", "CARGA_GENERAL"]),
  camionId:        z.string().uuid().optional(),
  proveedorId:     z.string().uuid().nullable().optional(),
  descripcionBien: z.string().nullable().optional(),
  cobertura:       z.string().nullable().optional(),
  vigenciaDesde:   z.string().min(1),
  vigenciaHasta:   z.string().min(1),
  montoMensual:    z.number().nullable().optional(),
  pdfS3Key:        z.string().nullable().optional(),
  activa:          z.boolean().optional(),
})

function polizaConEstado(p: { vigenciaHasta: Date | string; activa: boolean }) {
  const now = new Date()
  const vh = new Date(p.vigenciaHasta)
  if (!p.activa || vh < now) return "VENCIDA"
  if (vh <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) return "POR_VENCER"
  return "VIGENTE"
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const tipoBien = searchParams.get("tipoBien")
  const estado   = searchParams.get("estado")   // VIGENTE | POR_VENCER | VENCIDA
  const camionId = searchParams.get("camionId")

  const polizas = await prisma.polizaSeguro.findMany({
    where: {
      ...(tipoBien  ? { tipoBien }  : {}),
      ...(camionId  ? { camionId }  : {}),
    },
    include: {
      camion:    { select: { patenteChasis: true, patenteAcoplado: true } },
      proveedor: { select: { razonSocial: true, cuit: true } },
    },
    orderBy: { vigenciaHasta: "desc" },
  })

  const enriquecidas = polizas.map((p) => ({
    ...p,
    vigenciaDesde: p.vigenciaDesde.toISOString(),
    vigenciaHasta: p.vigenciaHasta.toISOString(),
    creadoEn:      p.creadoEn.toISOString(),
    estadoPoliza:  polizaConEstado(p),
  }))

  const filtradas = estado
    ? enriquecidas.filter((p) => p.estadoPoliza === estado)
    : enriquecidas

  return NextResponse.json(filtradas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await req.json()
    const parsed = crearSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const d = parsed.data

    if (d.tipoBien === "CAMION" && !d.camionId) {
      return NextResponse.json({ error: "Se requiere camionId para el tipo CAMION" }, { status: 400 })
    }

    const poliza = await prisma.polizaSeguro.create({
      data: {
        aseguradora:     d.aseguradora,
        nroPoliza:       d.nroPoliza,
        tipoBien:        d.tipoBien,
        camionId:        d.camionId ?? null,
        proveedorId:     d.proveedorId ?? null,
        descripcionBien: d.descripcionBien ?? null,
        cobertura:       d.cobertura ?? null,
        vigenciaDesde:   new Date(d.vigenciaDesde),
        vigenciaHasta:   new Date(d.vigenciaHasta),
        montoMensual:    d.montoMensual ?? null,
        pdfS3Key:        d.pdfS3Key ?? null,
        activa:          d.activa ?? true,
      },
      include: {
        camion:    { select: { patenteChasis: true } },
        proveedor: { select: { razonSocial: true, cuit: true } },
      },
    })

    return NextResponse.json({
      ...poliza,
      vigenciaDesde: poliza.vigenciaDesde.toISOString(),
      vigenciaHasta: poliza.vigenciaHasta.toISOString(),
      creadoEn:      poliza.creadoEn.toISOString(),
      estadoPoliza:  polizaConEstado(poliza),
    }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/polizas]", error)
    return NextResponse.json({ error: "Error al crear póliza" }, { status: 500 })
  }
}
