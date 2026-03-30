/**
 * API Route: GET /api/liquidaciones/[id]/pdf
 * Genera una vista HTML imprimible del líquido producto (liquidación) para descargar como PDF.
 * Solo accesible para roles que pueden ver liquidaciones.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

function fmt(monto: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
}

function fmtFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(fecha)
}

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la liquidación, devuelve un documento HTML con estilos de impresión
 * que representa el Líquido Producto ARCA para el fletero.
 * Existe para generar el comprobante de liquidación que se envía al fletero
 * como respaldo del pago acordado.
 *
 * Ejemplos:
 * GET /api/liquidaciones/liq1/pdf (sesión ADMIN_TRANSMAGG)
 * // => 200 (text/html) Documento HTML imprimible con datos de la liquidación
 * GET /api/liquidaciones/noexiste/pdf
 * // => 404 { error: "Liquidación no encontrada" }
 * GET /api/liquidaciones/liq1/pdf (sesión ADMIN_EMPRESA)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol

  const esInterno = esRolInterno(rol)
  const esFletero = rol === "FLETERO"

  if (!esInterno && !esFletero) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const liquidacion = await prisma.liquidacion.findUnique({
    where: { id: params.id },
    include: {
      fletero: { select: { razonSocial: true, cuit: true } },
      operador: { select: { nombre: true, apellido: true } },
      viajes: {
        include: {
          viaje: {
            include: {
              empresa: { select: { razonSocial: true } },
              camion: { select: { patenteChasis: true } },
              chofer: { select: { nombre: true, apellido: true } },
            },
          },
        },
      },
    },
  })

  if (!liquidacion) {
    return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 })
  }

  if (esFletero) {
    const fleteroPropio = await prisma.fletero.findFirst({
      where: { id: liquidacion.fleteroId, usuario: { email: session.user.email } },
    })
    if (!fleteroPropio) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const filasViajes = liquidacion.viajes.map((v) => `
    <tr>
      <td>${fmtFecha(v.viaje.fechaViaje)}</td>
      <td>${v.viaje.empresa.razonSocial}</td>
      <td>${v.viaje.camion.patenteChasis}</td>
      <td>${v.viaje.chofer.nombre} ${v.viaje.chofer.apellido}</td>
      <td class="right">${fmt(v.tarifaFletero)}</td>
      <td class="right">${fmt(v.subtotal)}</td>
    </tr>
  `).join("")

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Líquido Producto ARCA — ${liquidacion.fletero.razonSocial}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20mm; }
    h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #555; margin-bottom: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; border: 1px solid #ccc; padding: 12px; border-radius: 4px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; color: #777; text-transform: uppercase; }
    .info-value { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f0f0f0; padding: 6px 8px; text-align: left; font-size: 11px; border-bottom: 2px solid #ccc; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; }
    .right { text-align: right; }
    .totales { width: 280px; margin-left: auto; border: 1px solid #ccc; padding: 12px; border-radius: 4px; }
    .totales tr td { border: none; padding: 4px 0; }
    .totales .total-final { font-size: 15px; font-weight: bold; border-top: 2px solid #000; padding-top: 6px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .badge-emitida { background: #dbeafe; color: #1e40af; }
    .badge-pagada { background: #dcfce7; color: #166534; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Líquido Producto ARCA</h1>
  <p class="subtitle">Liquidación por cuenta y orden del fletero</p>

  <div class="info-grid">
    <div class="info-item">
      <span class="info-label">Fletero</span>
      <span class="info-value">${liquidacion.fletero.razonSocial}</span>
    </div>
    <div class="info-item">
      <span class="info-label">CUIT</span>
      <span class="info-value">${liquidacion.fletero.cuit}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Fecha</span>
      <span class="info-value">${fmtFecha(liquidacion.grabadaEn)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Estado</span>
      <span class="badge badge-${liquidacion.estado.toLowerCase()}">${liquidacion.estado}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Operador</span>
      <span class="info-value">${liquidacion.operador.nombre} ${liquidacion.operador.apellido}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Comisión</span>
      <span class="info-value">${liquidacion.comisionPct}%</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha viaje</th>
        <th>Empresa</th>
        <th>Patente</th>
        <th>Chofer</th>
        <th class="right">Tarifa</th>
        <th class="right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${filasViajes}</tbody>
  </table>

  <table class="totales">
    <tr><td>Subtotal bruto:</td><td class="right">${fmt(liquidacion.subtotalBruto)}</td></tr>
    <tr><td>Comisión (${liquidacion.comisionPct}%):</td><td class="right">- ${fmt(liquidacion.comisionMonto)}</td></tr>
    <tr><td>IVA sobre comisión (21%):</td><td class="right">${fmt(liquidacion.ivaMonto)}</td></tr>
    <tr class="total-final"><td><strong>Total líquido:</strong></td><td class="right"><strong>${fmt(liquidacion.total)}</strong></td></tr>
  </table>

  <div class="footer">Transmagg — Documento generado el ${fmtFecha(new Date())} — ID: ${liquidacion.id}</div>
  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
