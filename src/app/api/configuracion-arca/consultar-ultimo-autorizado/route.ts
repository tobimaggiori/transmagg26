/**
 * POST /api/configuracion-arca/consultar-ultimo-autorizado
 *
 * Herramienta de diagnóstico: consulta FECompUltimoAutorizado en WSFEv1
 * para un punto de venta y tipo de comprobante elegidos por el admin.
 * Solo lectura — no emite ni altera numeración.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { esAdmin } from "@/lib/permissions"
import { cargarConfigArca, resolverUrls } from "@/lib/arca/config"
import { obtenerTicketWsaa } from "@/lib/arca/wsaa"
import { feCompUltimoAutorizado } from "@/lib/arca/wsfev1"
import { ArcaError } from "@/lib/arca/errors"
import type { Rol } from "@/types"

const schema = z.object({
  ptoVenta: z.number().int().positive("Punto de venta debe ser un entero positivo"),
  tipoCbte: z.number().int().positive("Tipo de comprobante debe ser un entero positivo"),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const inicio = Date.now()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, mensaje: "JSON inválido", tiempoMs: Date.now() - inicio }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((i) => i.message).join("; ")
    return NextResponse.json({ ok: false, mensaje: msgs, tiempoMs: Date.now() - inicio }, { status: 400 })
  }

  const { ptoVenta, tipoCbte } = parsed.data

  try {
    const config = await cargarConfigArca()

    if (config.modo === "simulacion") {
      return NextResponse.json({
        ok: false,
        mensaje: "Esta herramienta requiere modo homologación o producción. En modo simulación no se consulta ARCA real.",
        tiempoMs: Date.now() - inicio,
      }, { status: 422 })
    }

    const ticket = await obtenerTicketWsaa(config)
    const urls = resolverUrls(config)
    const authWsfe = { Token: ticket.token, Sign: ticket.sign, Cuit: config.cuit }

    console.info(`[DIAG] Admin ${session.user.email} consultó último autorizado: PV=${ptoVenta} TipoCbte=${tipoCbte} — ${new Date().toISOString()}`)

    const resultado = await feCompUltimoAutorizado(urls.wsfev1Url, authWsfe, ptoVenta, tipoCbte)

    return NextResponse.json({
      ok: true,
      mensaje: `Último comprobante tipo ${tipoCbte} en PV ${ptoVenta}: Nro ${resultado.CbteNro}`,
      resultado: {
        ptoVenta: resultado.PtoVta,
        tipoCbte: resultado.CbteTipo,
        ultimoNro: resultado.CbteNro,
      },
      tiempoMs: Date.now() - inicio,
    })
  } catch (err) {
    const mensaje = err instanceof ArcaError ? err.message : "Error desconocido al consultar WSFEv1"
    const retryable = err instanceof ArcaError ? err.retryable : false
    const statusCode = err instanceof ArcaError ? err.statusCode : 500

    return NextResponse.json({
      ok: false,
      mensaje,
      retryable,
      tiempoMs: Date.now() - inicio,
    }, { status: statusCode })
  }
}
