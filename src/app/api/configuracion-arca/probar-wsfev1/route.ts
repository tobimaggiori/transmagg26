/**
 * POST /api/configuracion-arca/probar-wsfev1
 *
 * Intenta consultar FECompUltimoAutorizado con el primer punto de venta configurado.
 * Sirve para verificar que la conexión a WSFEv1 funciona end-to-end.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esAdmin } from "@/lib/permissions"
import { cargarConfigArca, resolverUrls } from "@/lib/arca/config"
import { obtenerTicketWsaa } from "@/lib/arca/wsaa"
import { feCompUltimoAutorizado } from "@/lib/arca/wsfev1"
import { ArcaError } from "@/lib/arca/errors"
import type { Rol } from "@/types"

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const inicio = Date.now()

  try {
    const config = await cargarConfigArca()
    const ticket = await obtenerTicketWsaa(config)
    const urls = resolverUrls(config)

    // Usar primer punto de venta configurado con tipo factura A (1)
    const primerPV = config.puntosVenta["FACTURA_A"] ?? Object.values(config.puntosVenta)[0] ?? 1
    const authWsfe = { Token: ticket.token, Sign: ticket.sign, Cuit: config.cuit }

    const resultado = await feCompUltimoAutorizado(urls.wsfev1Url, authWsfe, primerPV, 1)

    return NextResponse.json({
      ok: true,
      mensaje: `Conexión WSFEv1 exitosa. Último comprobante tipo 1 en PV ${primerPV}: Nro ${resultado.CbteNro}`,
      resultado: {
        ptoVenta: resultado.PtoVta,
        tipoCbte: resultado.CbteTipo,
        ultimoNro: resultado.CbteNro,
      },
      tiempoMs: Date.now() - inicio,
    })
  } catch (err) {
    const mensaje = err instanceof ArcaError
      ? err.message
      : "Error desconocido al probar WSFEv1"
    const retryable = err instanceof ArcaError ? err.retryable : false

    return NextResponse.json({
      ok: false,
      mensaje,
      retryable,
      tiempoMs: Date.now() - inicio,
    }, { status: err instanceof ArcaError ? err.statusCode : 500 })
  }
}
