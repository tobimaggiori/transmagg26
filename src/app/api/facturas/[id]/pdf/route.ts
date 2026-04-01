/**
 * API Route: GET /api/facturas/[id]/pdf
 * Genera una vista HTML imprimible de la factura emitida para descargar como PDF.
 * Solo accesible para roles con permiso sobre facturas.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
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
 * Dado el id de la factura, devuelve un documento HTML con estilos de impresión
 * que representa la factura emitida a la empresa cliente.
 * Existe para generar el comprobante de factura que se envía a la empresa
 * para su registro contable y como respaldo del crédito otorgado.
 *
 * Ejemplos:
 * GET /api/facturas/fact1/pdf (sesión ADMIN_TRANSMAGG)
 * // => 200 (text/html) Documento HTML imprimible con datos de la factura
 * GET /api/facturas/noexiste/pdf
 * // => 404 { error: "Factura no encontrada" }
 * GET /api/facturas/fact1/pdf (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol

  if (!esRolInterno(rol) && !esRolEmpresa(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const factura = await prisma.facturaEmitida.findUnique({
    where: { id: params.id },
    include: {
      empresa: { select: { razonSocial: true, cuit: true } },
      operador: { select: { nombre: true, apellido: true } },
      viajes: {
        include: {
          viaje: {
            include: {
              camion: { select: { patenteChasis: true } },
              chofer: { select: { nombre: true, apellido: true } },
              fletero: { select: { razonSocial: true } },
            },
          },
        },
      },
    },
  })

  if (!factura) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
  }

  if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email }, empresaId: factura.empresaId },
    })
    if (!empUsr) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const filasViajes = factura.viajes.map((v) => `
    <tr>
      <td>${fmtFecha(v.viaje.fechaViaje)}</td>
      <td>${v.viaje.fletero?.razonSocial ?? "Propio"}</td>
      <td>${v.viaje.camion.patenteChasis}</td>
      <td>${v.viaje.chofer.nombre} ${v.viaje.chofer.apellido}</td>
      <td class="right">${fmt(v.tarifaEmpresa)}</td>
      <td class="right">${fmt(v.subtotal)}</td>
    </tr>
  `).join("")

  const alicuota = factura.ivaMonto > 0 ? Math.round((factura.ivaMonto / factura.neto) * 100) : 0

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${factura.tipoCbte}${factura.nroComprobante ? " " + factura.nroComprobante : ""} — ${factura.empresa.razonSocial}</title>
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
    .badge-pendiente { background: #fef9c3; color: #854d0e; }
    .badge-emitida { background: #dbeafe; color: #1e40af; }
    .badge-cobrada { background: #dcfce7; color: #166534; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Factura Tipo ${factura.tipoCbte}${factura.nroComprobante ? " — " + factura.nroComprobante : " (sin número)"}</h1>
  <p class="subtitle">Transmagg — Servicio de Transporte de Cargas</p>

  <div class="info-grid">
    <div class="info-item">
      <span class="info-label">Cliente</span>
      <span class="info-value">${factura.empresa.razonSocial}</span>
    </div>
    <div class="info-item">
      <span class="info-label">CUIT</span>
      <span class="info-value">${factura.empresa.cuit}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Fecha emisión</span>
      <span class="info-value">${fmtFecha(factura.emitidaEn)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Estado</span>
      <span class="badge badge-${factura.estado.toLowerCase()}">${factura.estado}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Operador</span>
      <span class="info-value">${factura.operador.nombre} ${factura.operador.apellido}</span>
    </div>
    <div class="info-item">
      <span class="info-label">IVA</span>
      <span class="info-value">${alicuota}%</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha viaje</th>
        <th>Fletero</th>
        <th>Patente</th>
        <th>Chofer</th>
        <th class="right">Tarifa</th>
        <th class="right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${filasViajes}</tbody>
  </table>

  <table class="totales">
    <tr><td>Neto:</td><td class="right">${fmt(factura.neto)}</td></tr>
    <tr><td>IVA (${alicuota}%):</td><td class="right">${fmt(factura.ivaMonto)}</td></tr>
    <tr class="total-final"><td><strong>Total:</strong></td><td class="right"><strong>${fmt(factura.total)}</strong></td></tr>
  </table>

  <div class="footer">Transmagg — Documento generado el ${fmtFecha(new Date())} — ID: ${factura.id}</div>
  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
