/**
 * Propósito: Generación del HTML imprimible del Recibo por Cobranza a Empresa.
 * Replica el layout de un recibo oficial de Trans-Magg S.R.L.
 * El HTML generado se convierte a PDF con Puppeteer (A4).
 */

import { prisma } from "@/lib/prisma"
import puppeteer from "puppeteer"

function fmt(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n)
}

function fmtFecha(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

function fmtNroRecibo(pto: number, nro: number): string {
  return `${String(pto).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

function fmtCuit(cuit: string): string {
  const c = cuit.replace(/\D/g, "")
  if (c.length !== 11) return cuit
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`
}

function tipoCbteLabel(t: number): string {
  if (t === 1) return "Factura A"
  if (t === 6) return "Factura B"
  if (t === 201) return "Factura A MiPyme"
  return `Cbte ${t}`
}

function condicionIvaLabel(c: string): string {
  const map: Record<string, string> = {
    RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
    MONOTRIBUTISTA: "Monotributista",
    EXENTO: "Exento",
    CONSUMIDOR_FINAL: "Consumidor Final",
  }
  return map[c] ?? c
}

function tipoMedioLabel(t: string): string {
  if (t === "TRANSFERENCIA") return "Transferencia"
  if (t === "ECHEQ") return "ECheq"
  if (t === "CHEQUE_FISICO") return "Cheque Físico"
  return t
}

// ─── Número a letras (español, pesos argentinos) ─────────────────────────────

const UNIDADES = [
  "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE",
  "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS",
  "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE",
]

const DECENAS = [
  "", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA",
  "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
]

const CENTENAS = [
  "", "CIEN", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
]

function centenas(n: number): string {
  if (n === 0) return ""
  if (n < 30) return UNIDADES[n]
  if (n < 100) {
    const d = Math.floor(n / 10)
    const u = n % 10
    return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`
  }
  if (n === 100) return "CIEN"
  const c = Math.floor(n / 100)
  const resto = n % 100
  return resto === 0 ? CENTENAS[c] : `${CENTENAS[c]} ${centenas(resto)}`
}

function miles(n: number): string {
  if (n === 0) return ""
  if (n === 1) return "MIL"
  return `${centenas(n)} MIL`
}

/**
 * numeroALetras: number -> string
 *
 * Convierte un número entero positivo a su representación en palabras en español.
 * Solo parte entera — el uso en el recibo es para los pesos (sin centavos en texto).
 *
 * Ejemplos:
 * numeroALetras(1000)    === "MIL"
 * numeroALetras(1270000) === "UN MILLÓN DOSCIENTOS SETENTA MIL"
 * numeroALetras(2500000) === "DOS MILLONES QUINIENTOS MIL"
 */
export function numeroALetras(n: number): string {
  const entero = Math.floor(Math.abs(n))
  if (entero === 0) return "CERO"

  const millones = Math.floor(entero / 1_000_000)
  const resto = entero % 1_000_000
  const milesPart = Math.floor(resto / 1000)
  const centenasPart = resto % 1000

  const partes: string[] = []

  if (millones > 0) {
    if (millones === 1) partes.push("UN MILLÓN")
    else partes.push(`${centenas(millones)} MILLONES`)
  }
  if (milesPart > 0) partes.push(miles(milesPart))
  if (centenasPart > 0) partes.push(centenas(centenasPart))

  return partes.join(" ")
}

// ─── Generación HTML ──────────────────────────────────────────────────────────

function generarHTMLRecibo(
  recibo: {
    nro: number
    ptoVenta: number
    fecha: Date
    totalCobrado: number
    totalRetenciones: number
    totalComprobantes: number
    retencionGanancias: number
    retencionIIBB: number
    retencionSUSS: number
    empresa: { razonSocial: string; cuit: string; condicionIva: string; direccion: string | null }
    operador: { nombre: string; apellido: string }
    facturas: { nroComprobante: string | null; tipoCbte: number; total: number; emitidaEn: Date }[]
    mediosPago: {
      tipo: string
      monto: number
      cuentaId: string | null
      fechaTransferencia: Date | null
      referencia: string | null
      nroCheque: string | null
      bancoEmisor: string | null
      fechaEmision: Date | null
      fechaPago: Date | null
    }[]
  },
  cuentaMap: Record<string, { nombre: string; bancoOEntidad: string }>
): string {
  const nroTexto = fmtNroRecibo(recibo.ptoVenta, recibo.nro)

  const filasFacturas = recibo.facturas
    .map(
      (f) => `
    <tr>
      <td>${fmtFecha(f.emitidaEn)}</td>
      <td>${tipoCbteLabel(f.tipoCbte)}</td>
      <td>${f.nroComprobante ?? "—"}</td>
      <td class="right">${fmt(f.total)}</td>
    </tr>`
    )
    .join("")

  const filasMedios = recibo.mediosPago
    .map((m) => {
      let detalle = ""
      if (m.tipo === "TRANSFERENCIA") {
        const cuenta = m.cuentaId ? cuentaMap[m.cuentaId] : null
        const cuentaStr = cuenta ? `${cuenta.nombre} (${cuenta.bancoOEntidad})` : ""
        const fechaStr = m.fechaTransferencia ? fmtFecha(m.fechaTransferencia) : ""
        const refStr = m.referencia ? ` Ref: ${m.referencia}` : ""
        detalle = [cuentaStr, fechaStr, refStr].filter(Boolean).join(" — ")
      } else if (m.tipo === "ECHEQ" || m.tipo === "CHEQUE_FISICO") {
        const nroStr = m.nroCheque ? `Nro ${m.nroCheque}` : ""
        const bancoStr = m.bancoEmisor ?? ""
        const vencStr = m.fechaPago ? `Vto ${fmtFecha(m.fechaPago)}` : ""
        detalle = [nroStr, bancoStr, vencStr].filter(Boolean).join(" — ")
      }
      return `
    <tr>
      <td>${tipoMedioLabel(m.tipo)}</td>
      <td>${detalle}</td>
      <td class="right">${fmt(m.monto)}</td>
    </tr>`
    })
    .join("")

  const filasRetenciones: string[] = []
  if (recibo.retencionGanancias > 0) {
    filasRetenciones.push(`<tr><td>Ret. Ganancias</td><td class="right">${fmt(recibo.retencionGanancias)}</td></tr>`)
  }
  if (recibo.retencionIIBB > 0) {
    filasRetenciones.push(`<tr><td>Ret. IIBB</td><td class="right">${fmt(recibo.retencionIIBB)}</td></tr>`)
  }
  if (recibo.retencionSUSS > 0) {
    filasRetenciones.push(`<tr><td>Ret. SUSS</td><td class="right">${fmt(recibo.retencionSUSS)}</td></tr>`)
  }

  const importeLetras = numeroALetras(Math.floor(recibo.totalCobrado))
  const centavos = Math.round((recibo.totalCobrado % 1) * 100)
  const totalLetras = `${importeLetras} PESOS${centavos > 0 ? ` CON ${centavos}/100` : " CON 00/100"}`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Recibo de Cobranza Nro ${nroTexto} — Trans-Magg S.R.L.</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 15mm 18mm; }

    .encabezado { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .encabezado-empresa .nombre { font-size: 16px; font-weight: bold; }
    .encabezado-empresa .datos { font-size: 10px; color: #333; margin-top: 2px; }
    .encabezado-doc { text-align: right; }
    .encabezado-doc .tipo { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .encabezado-doc .label { font-size: 10px; color: #555; text-transform: uppercase; margin-top: 4px; }
    .encabezado-doc .nro { font-size: 20px; font-weight: bold; font-family: monospace; }
    .encabezado-doc .fecha { font-size: 11px; margin-top: 2px; }

    .receptor-box { border: 1px solid #ccc; padding: 8px 12px; margin-bottom: 12px; display: grid; grid-template-columns: 120px 1fr 120px 1fr; gap: 4px 8px; align-items: baseline; }
    .receptor-box .lbl { color: #555; font-size: 10px; text-transform: uppercase; }
    .receptor-box .val { font-weight: bold; }

    .seccion { margin-bottom: 12px; }
    .seccion-titulo { font-size: 10px; font-weight: bold; text-transform: uppercase; background: #f0f0f0; padding: 4px 8px; border: 1px solid #ccc; border-bottom: none; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #e8e8e8; padding: 4px 8px; text-align: left; font-size: 10px; border: 1px solid #ccc; }
    td { padding: 4px 8px; border: 1px solid #ddd; }
    tr.subtotal { background: #f9f9f9; font-weight: bold; }
    .right { text-align: right; }
    .center { text-align: center; }
    .muted { color: #999; font-style: italic; font-size: 10px; }

    .importe-letras { border: 1px solid #ccc; padding: 8px 12px; margin-bottom: 12px; }
    .importe-letras .lbl { font-size: 10px; color: #555; text-transform: uppercase; margin-bottom: 3px; }
    .importe-letras .val { font-size: 12px; font-weight: bold; text-transform: uppercase; }

    .totales-box { border: 2px solid #000; margin-top: 12px; }
    .totales-box thead th { background: #1a1a1a; color: #fff; font-size: 10px; padding: 5px 8px; }
    .totales-box tbody td { padding: 6px 8px; font-weight: bold; font-size: 12px; }

    .firma { margin-top: 40px; display: flex; justify-content: space-between; }
    .firma-linea { text-align: center; }
    .firma-linea .linea { border-top: 1px solid #000; width: 180px; margin: 0 auto 4px; }
    .firma-linea .texto { font-size: 10px; color: #555; }

    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #aaa; border-top: 1px solid #eee; padding-top: 8px; }

    @media print {
      body { padding: 10mm 14mm; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>

  <!-- Encabezado -->
  <div class="encabezado">
    <div class="encabezado-empresa">
      <div class="nombre">TRANS-MAGG S.R.L.</div>
      <div class="datos">C.U.I.T. 30-70938168-3</div>
      <div class="datos">Belgrano 184 — 2109 Acebal (S.F.)</div>
      <div class="datos">Responsable Inscripto</div>
    </div>
    <div class="encabezado-doc">
      <div class="tipo">Recibo de Cobranza</div>
      <div class="label">Nro:</div>
      <div class="nro">${nroTexto}</div>
      <div class="fecha">Fecha: ${fmtFecha(recibo.fecha)}</div>
    </div>
  </div>

  <!-- Datos de la empresa receptora -->
  <div class="receptor-box">
    <div class="lbl">Empresa</div>
    <div class="val">${recibo.empresa.razonSocial}</div>
    <div class="lbl">CUIT</div>
    <div class="val">${fmtCuit(recibo.empresa.cuit)}</div>
    <div class="lbl">Dirección</div>
    <div class="val">${recibo.empresa.direccion ?? "—"}</div>
    <div class="lbl">Cond. IVA</div>
    <div class="val">${condicionIvaLabel(recibo.empresa.condicionIva)}</div>
  </div>

  <!-- Comprobantes cobrados -->
  <div class="seccion">
    <div class="seccion-titulo">Comprobantes Cobrados</div>
    <table>
      <thead><tr>
        <th>Fecha</th>
        <th>Tipo</th>
        <th>Nro. Comprobante</th>
        <th class="right">Importe</th>
      </tr></thead>
      <tbody>
        ${filasFacturas}
        <tr class="subtotal">
          <td colspan="3">Total Comprobantes</td>
          <td class="right">${fmt(recibo.totalComprobantes)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${recibo.totalRetenciones > 0 ? `
  <!-- Retenciones -->
  <div class="seccion">
    <div class="seccion-titulo">Retenciones Aplicadas</div>
    <table>
      <thead><tr>
        <th>Concepto</th>
        <th class="right">Importe</th>
      </tr></thead>
      <tbody>
        ${filasRetenciones.join("")}
        <tr class="subtotal">
          <td>Total Retenciones</td>
          <td class="right">${fmt(recibo.totalRetenciones)}</td>
        </tr>
      </tbody>
    </table>
  </div>` : ""}

  <!-- Medios de pago -->
  <div class="seccion">
    <div class="seccion-titulo">Detalle de Medios de Pago</div>
    <table>
      <thead><tr>
        <th>Tipo</th>
        <th>Detalle</th>
        <th class="right">Importe</th>
      </tr></thead>
      <tbody>
        ${filasMedios}
        <tr class="subtotal">
          <td colspan="2">Total Cobrado</td>
          <td class="right">${fmt(recibo.totalCobrado)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Importe en letras -->
  <div class="importe-letras">
    <div class="lbl">Son:</div>
    <div class="val">${totalLetras}</div>
  </div>

  <!-- Totales finales -->
  <div class="seccion">
    <table class="totales-box">
      <thead><tr>
        <th class="right">Total Comprobantes</th>
        <th class="right">Total Retenciones</th>
        <th class="right">Total Cobrado</th>
      </tr></thead>
      <tbody><tr>
        <td class="right">${fmt(recibo.totalComprobantes)}</td>
        <td class="right">${fmt(recibo.totalRetenciones)}</td>
        <td class="right">${fmt(recibo.totalCobrado)}</td>
      </tr></tbody>
    </table>
  </div>

  <!-- Firmas -->
  <div class="firma">
    <div class="firma-linea">
      <div class="linea"></div>
      <div class="texto">Firma autorizada Trans-Magg S.R.L.</div>
    </div>
    <div class="firma-linea">
      <div class="linea"></div>
      <div class="texto">Conformidad del receptor</div>
    </div>
  </div>

  <div class="footer">
    Trans-Magg S.R.L. — Recibo generado el ${fmtFecha(new Date())} — Operador: ${recibo.operador.nombre} ${recibo.operador.apellido}
  </div>

</body>
</html>`
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * generarPDFReciboCobranza: (reciboId: string) -> Promise<Buffer>
 *
 * Dado el id de un Recibo de Cobranza, carga todos sus datos desde la DB,
 * genera el HTML y lo convierte a PDF usando Puppeteer (formato A4).
 * Existe para generar el comprobante que se entrega a la empresa cliente.
 *
 * Ejemplos:
 * const buf = await generarPDFReciboCobranza("uuid-del-recibo")
 * // => Buffer con el PDF del Recibo listo para subir a R2
 */
export async function generarPDFReciboCobranza(reciboId: string): Promise<Buffer> {
  const recibo = await prisma.reciboCobranza.findUnique({
    where: { id: reciboId },
    include: {
      empresa: { select: { razonSocial: true, cuit: true, condicionIva: true, direccion: true } },
      operador: { select: { nombre: true, apellido: true } },
      facturas: { select: { nroComprobante: true, tipoCbte: true, total: true, emitidaEn: true } },
      mediosPago: {
        select: {
          tipo: true,
          monto: true,
          cuentaId: true,
          fechaTransferencia: true,
          referencia: true,
          nroCheque: true,
          bancoEmisor: true,
          fechaEmision: true,
          fechaPago: true,
        },
      },
    },
  })

  if (!recibo) throw new Error(`Recibo ${reciboId} no encontrado`)

  // Cargar cuentas para transferencias
  const cuentaIds = recibo.mediosPago.filter((m) => m.cuentaId).map((m) => m.cuentaId!)
  const cuentas =
    cuentaIds.length > 0
      ? await prisma.cuenta.findMany({
          where: { id: { in: cuentaIds } },
          select: { id: true, nombre: true, bancoOEntidad: true },
        })
      : []
  const cuentaMap = Object.fromEntries(cuentas.map((c) => [c.id, c]))

  const html = generarHTMLRecibo(recibo, cuentaMap)

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "14mm", right: "14mm" },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
