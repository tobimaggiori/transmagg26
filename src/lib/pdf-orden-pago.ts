/**
 * Propósito: Generación del HTML imprimible de la Orden de Pago a Fletero.
 * Replica fielmente el layout del documento real de Transmagg.
 * El HTML generado incluye estilos de impresión para que el navegador
 * pueda exportarlo como PDF usando la función de impresión nativa.
 */

import { prisma } from "@/lib/prisma"

function fmt(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(monto)
}

function fmtFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha)
}

function fmtNro(nro: number): string {
  return new Intl.NumberFormat("es-AR").format(nro)
}

function fmtNroComprobante(ptoVenta: number | null, nro: number | null): string {
  if (ptoVenta == null || nro == null) return "s/n"
  return `${String(ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

/**
 * generarHTMLOrdenPago: (ordenPagoId: string) -> Promise<string>
 *
 * Dado el id de una Orden de Pago, carga todos los datos necesarios y genera
 * el HTML imprimible que replica el documento real de Trans-Magg S.R.L.
 * Incluye: datos del emisor, datos del fletero, facturas aplicadas,
 * cheques propios, cheques de tercero, adelantos y totales del pago.
 * Existe para generar el comprobante de pago que se entrega al fletero
 * y queda como respaldo del pago del Líquido Producto.
 *
 * Ejemplos:
 * const html = await generarHTMLOrdenPago("uuid-de-op")
 * // => string HTML completo con la Orden de Pago lista para imprimir
 */
export async function generarHTMLOrdenPago(ordenPagoId: string): Promise<string> {
  const op = await prisma.ordenPago.findUnique({
    where: { id: ordenPagoId },
    include: {
      fletero: {
        select: {
          razonSocial: true,
          cuit: true,
          condicionIva: true,
          direccion: true,
        },
      },
      operador: { select: { nombre: true, apellido: true } },
      pagos: {
        where: { anulado: false },
        include: {
          liquidacion: {
            select: {
              nroComprobante: true,
              ptoVenta: true,
              grabadaEn: true,
              total: true,
              adelantoDescuentos: {
                include: {
                  adelanto: {
                    select: { tipo: true, descripcion: true, monto: true },
                  },
                },
              },
            },
          },
          chequeEmitido: {
            select: {
              nroCheque: true,
              fechaPago: true,
              monto: true,
              cuenta: { select: { nombre: true, bancoOEntidad: true } },
            },
          },
          chequeRecibido: {
            select: {
              nroCheque: true,
              fechaCobro: true,
              monto: true,
              bancoEmisor: true,
            },
          },
        },
      },
    },
  })

  if (!op) throw new Error(`OrdenPago ${ordenPagoId} no encontrada`)

  // ── Estructurar secciones ──────────────────────────────────────────────────

  // Facturas aplicadas (una fila por liquidación única)
  const liquidacionesUnicas = new Map<string, { fecha: Date; ptoVenta: number | null; nro: number | null; total: number }>()
  for (const pago of op.pagos) {
    if (pago.liquidacion && !liquidacionesUnicas.has(pago.liquidacionId ?? "")) {
      liquidacionesUnicas.set(pago.liquidacionId ?? "", {
        fecha: pago.liquidacion.grabadaEn,
        ptoVenta: pago.liquidacion.ptoVenta,
        nro: pago.liquidacion.nroComprobante,
        total: pago.liquidacion.total,
      })
    }
  }
  const facturas = Array.from(liquidacionesUnicas.values())
  const totalFacturas = facturas.reduce((s, f) => s + f.total, 0)

  // Cheques propios
  const chequesPropios = op.pagos
    .filter((p) => p.tipoPago === "CHEQUE_PROPIO" && p.chequeEmitido)
    .map((p) => ({
      cuenta: p.chequeEmitido!.cuenta?.nombre ?? p.chequeEmitido!.cuenta?.bancoOEntidad ?? "-",
      vencimiento: p.chequeEmitido!.fechaPago,
      nro: p.chequeEmitido!.nroCheque ?? "-",
      monto: p.monto,
    }))
  const totalChequesPropios = chequesPropios.reduce((s, c) => s + c.monto, 0)

  // Cheques de tercero
  const chequesTercero = op.pagos
    .filter((p) => p.tipoPago === "CHEQUE_TERCERO" && p.chequeRecibido)
    .map((p) => ({
      banco: p.chequeRecibido!.bancoEmisor,
      vencimiento: p.chequeRecibido!.fechaCobro,
      nro: p.chequeRecibido!.nroCheque,
      monto: p.monto,
    }))
  const totalChequesTercero = chequesTercero.reduce((s, c) => s + c.monto, 0)

  // Transferencias y efectivo
  const totalTransferencia = op.pagos
    .filter((p) => p.tipoPago === "TRANSFERENCIA")
    .reduce((s, p) => s + p.monto, 0)
  const totalEfectivo = op.pagos
    .filter((p) => p.tipoPago === "EFECTIVO")
    .reduce((s, p) => s + p.monto, 0)

  // Adelantos descontados (deduplicados por liquidacion)
  type AdelantoRow = { descripcion: string; efectivo: number; gasOil: number; faltante: number }
  const adelantosMap = new Map<string, AdelantoRow>()
  for (const pago of op.pagos) {
    if (!pago.liquidacion) continue
    for (const desc of pago.liquidacion.adelantoDescuentos) {
      const key = desc.adelantoId
      if (!adelantosMap.has(key)) {
        adelantosMap.set(key, { descripcion: desc.adelanto.descripcion ?? `AD-${key.slice(0, 6)}`, efectivo: 0, gasOil: 0, faltante: 0 })
      }
      const row = adelantosMap.get(key)!
      const tipo = desc.adelanto.tipo
      const monto = desc.montoDescontado
      if (tipo === "EFECTIVO") row.efectivo += monto
      else if (tipo === "COMBUSTIBLE") row.gasOil += monto
      else row.faltante += monto
    }
  }
  const adelantos = Array.from(adelantosMap.values())
  const totalAdelantosEfectivo = adelantos.reduce((s, a) => s + a.efectivo, 0)
  const totalAdelantosGasOil = adelantos.reduce((s, a) => s + a.gasOil, 0)
  const totalAdelantosFaltante = adelantos.reduce((s, a) => s + a.faltante, 0)
  const totalAdelantosGeneral = totalAdelantosEfectivo + totalAdelantosGasOil + totalAdelantosFaltante

  // Formatear condición IVA
  const condicionIvaLabel: Record<string, string> = {
    RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
    MONOTRIBUTISTA: "Monotributista",
    EXENTO: "Exento",
    CONSUMIDOR_FINAL: "Consumidor Final",
  }
  const condicionIva = condicionIvaLabel[op.fletero.condicionIva] ?? op.fletero.condicionIva

  // Formatear CUIT con guiones: 20-12345678-9
  function fmtCuit(cuit: string): string {
    const c = cuit.replace(/\D/g, "")
    if (c.length !== 11) return cuit
    return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`
  }

  // ── Construir HTML ─────────────────────────────────────────────────────────

  const filaFacturas = facturas.map((f) => `
    <tr>
      <td>${fmtFecha(f.fecha)}</td>
      <td class="center">${f.ptoVenta ?? "-"}</td>
      <td>${fmtNroComprobante(f.ptoVenta, f.nro)}</td>
      <td class="right">${fmt(f.total)}</td>
    </tr>
  `).join("")

  const filasChequesPropios = chequesPropios.length > 0
    ? chequesPropios.map((c) => `
      <tr>
        <td>${c.cuenta}</td>
        <td class="center">${fmtFecha(c.vencimiento)}</td>
        <td>${c.nro}</td>
        <td class="right">${fmt(c.monto)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" class="center muted">— Sin cheques propios —</td></tr>`

  const filasChequesTercero = chequesTercero.length > 0
    ? chequesTercero.map((c) => `
      <tr>
        <td>${c.banco}</td>
        <td class="center">${fmtFecha(c.vencimiento)}</td>
        <td>${c.nro}</td>
        <td class="right">${fmt(c.monto)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" class="center muted">— Sin cheques de tercero —</td></tr>`

  const filasAdelantos = adelantos.length > 0
    ? adelantos.map((a) => `
      <tr>
        <td>${a.descripcion}</td>
        <td class="right">${fmt(a.efectivo)}</td>
        <td class="right">${fmt(a.gasOil)}</td>
        <td class="right">${fmt(a.faltante)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" class="center muted">— Sin adelantos descontados —</td></tr>`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Orden de Pago Nro ${fmtNro(op.nro)} — Trans-Magg S.R.L.</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 15mm 18mm; }

    .encabezado { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .encabezado-empresa { }
    .encabezado-empresa .nombre { font-size: 16px; font-weight: bold; }
    .encabezado-empresa .datos { font-size: 10px; color: #333; margin-top: 2px; }
    .encabezado-op { text-align: right; }
    .encabezado-op .label { font-size: 10px; color: #555; text-transform: uppercase; }
    .encabezado-op .nro { font-size: 20px; font-weight: bold; }
    .encabezado-op .fecha { font-size: 11px; margin-top: 2px; }

    .fletero-box { border: 1px solid #ccc; padding: 8px 12px; margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .fletero-box .fila { display: contents; }
    .fletero-box .lbl { color: #555; font-size: 10px; text-transform: uppercase; }
    .fletero-box .val { font-weight: bold; }

    .seccion { margin-bottom: 12px; }
    .seccion-titulo { font-size: 10px; font-weight: bold; text-transform: uppercase; background: #f0f0f0; padding: 4px 8px; border: 1px solid #ccc; border-bottom: none; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #e8e8e8; padding: 4px 8px; text-align: left; font-size: 10px; border: 1px solid #ccc; }
    td { padding: 4px 8px; border: 1px solid #ddd; }
    tr.subtotal { background: #f9f9f9; font-weight: bold; }
    .right { text-align: right; }
    .center { text-align: center; }
    .muted { color: #999; font-style: italic; font-size: 10px; }

    .totales-finales { border: 2px solid #000; margin-top: 12px; }
    .totales-finales thead th { background: #1a1a1a; color: #fff; font-size: 10px; padding: 5px 8px; }
    .totales-finales tbody td { padding: 6px 8px; font-weight: bold; font-size: 12px; }

    .firma { margin-top: 40px; display: flex; justify-content: flex-end; }
    .firma-linea { text-align: center; }
    .firma-linea .linea { border-top: 1px solid #000; width: 200px; margin-bottom: 4px; }
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
    </div>
    <div class="encabezado-op">
      <div class="label">Orden de Pago Nro:</div>
      <div class="nro">${fmtNro(op.nro)}</div>
      <div class="fecha">Fecha: ${fmtFecha(op.fecha)}</div>
    </div>
  </div>

  <!-- Datos del fletero -->
  <div class="fletero-box">
    <div class="lbl">Fletero</div>
    <div class="val">${op.fletero.razonSocial}</div>
    <div class="lbl">Dirección</div>
    <div class="val">${op.fletero.direccion ?? "—"}</div>
    <div class="lbl">Cond. IVA</div>
    <div class="val">${condicionIva}</div>
    <div class="lbl">CUIT</div>
    <div class="val">${fmtCuit(op.fletero.cuit)}</div>
  </div>

  <!-- Facturas aplicadas -->
  <div class="seccion">
    <div class="seccion-titulo">Facturas Aplicadas</div>
    <table>
      <thead><tr>
        <th>Fecha</th>
        <th class="center">Pto. Vta.</th>
        <th>Nro. Fact.</th>
        <th class="right">Importe</th>
      </tr></thead>
      <tbody>
        ${filaFacturas}
        <tr class="subtotal">
          <td colspan="3">Total Facturas Aplicadas</td>
          <td class="right">${fmt(totalFacturas)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Cheques propios -->
  <div class="seccion">
    <div class="seccion-titulo">Detalle de Cheques Propios</div>
    <table>
      <thead><tr>
        <th>Cuenta</th>
        <th class="center">Vencimiento</th>
        <th>Nro. Cheque</th>
        <th class="right">Importe</th>
      </tr></thead>
      <tbody>
        ${filasChequesPropios}
        <tr class="subtotal">
          <td colspan="3">Total Cheques Propios</td>
          <td class="right">${fmt(totalChequesPropios)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Cheques de tercero -->
  <div class="seccion">
    <div class="seccion-titulo">Detalle de Cheques de Tercero</div>
    <table>
      <thead><tr>
        <th>Banco</th>
        <th class="center">Vencimiento</th>
        <th>Nro. Cheque</th>
        <th class="right">Importe</th>
      </tr></thead>
      <tbody>
        ${filasChequesTercero}
        <tr class="subtotal">
          <td colspan="3">Total Cheques de Tercero</td>
          <td class="right">${fmt(totalChequesTercero)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Adelantos -->
  <div class="seccion">
    <div class="seccion-titulo">Detalle de Adelantos</div>
    <table>
      <thead><tr>
        <th>Concepto</th>
        <th class="right">Efectivo</th>
        <th class="right">Gas-Oil</th>
        <th class="right">Faltante</th>
      </tr></thead>
      <tbody>
        ${filasAdelantos}
        <tr class="subtotal">
          <td>Total Adelantos</td>
          <td class="right">${fmt(totalAdelantosEfectivo)}</td>
          <td class="right">${fmt(totalAdelantosGasOil)}</td>
          <td class="right">${fmt(totalAdelantosFaltante)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Totales del pago -->
  <div class="seccion">
    <table class="totales-finales">
      <thead><tr>
        <th class="right">Efectivo</th>
        <th class="right">Transferencias</th>
        <th class="right">Cheques Propios</th>
        <th class="right">Cheques de Terc.</th>
        <th class="right">Adelantos</th>
        <th class="right">Gas-Oil</th>
        <th class="right">Faltantes</th>
      </tr></thead>
      <tbody><tr>
        <td class="right">${fmt(totalEfectivo)}</td>
        <td class="right">${fmt(totalTransferencia)}</td>
        <td class="right">${fmt(totalChequesPropios)}</td>
        <td class="right">${fmt(totalChequesTercero)}</td>
        <td class="right">${fmt(totalAdelantosGeneral)}</td>
        <td class="right">${fmt(totalAdelantosGasOil)}</td>
        <td class="right">${fmt(totalAdelantosFaltante)}</td>
      </tr></tbody>
    </table>
  </div>

  <!-- Firma -->
  <div class="firma">
    <div class="firma-linea">
      <div class="linea"></div>
      <div class="texto">Firma y aclaración del receptor</div>
    </div>
  </div>

  <div class="footer">
    Trans-Magg S.R.L. — Orden de Pago generada el ${fmtFecha(new Date())} — Operador: ${op.operador.nombre} ${op.operador.apellido}
  </div>

</body>
</html>`

  return html
}
