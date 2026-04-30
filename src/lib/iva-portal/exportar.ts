/**
 * exportar.ts — Orquestador que arma una exportación completa de un período.
 *
 * Pasos:
 *  1. Recolectar datos desde Prisma
 *  2. Aplicar ajustes activos
 *  3. Validar
 *  4. Generar 4 TXT
 *  5. Calcular resumen
 *  6. Empaquetar en ZIP
 *  7. Calcular hashes
 *  8. Guardar en R2 y crear ExportacionIvaArca
 *
 * Reglas:
 *  - Si hay errores bloqueantes, NO genera (devuelve estructura con
 *    validaciones).
 *  - Advertencias permiten generar; quedan registradas en validacionesJson.
 *  - Cada llamada crea una NUEVA ExportacionIvaArca (no destructivo).
 */

import { prisma } from "@/lib/prisma"
import { recolectarDatosIvaPeriodo, obtenerEmisorTransmagg } from "./recolectar-datos"
import { obtenerAjustesActivos } from "./ajustes"
import { aplicarAjustes } from "./aplicar-ajustes"
import { validarPeriodo } from "./validaciones"
import {
  generarComprobantesVentasTxt,
  generarAlicuotasVentasTxt,
  generarComprobantesComprasTxt,
  generarAlicuotasComprasTxt,
} from "./generar-txt"
import { calcularResumen } from "./resumen"
import {
  generarZipExportacionIva,
  nombreComprobantesVentas,
  nombreAlicuotasVentas,
  nombreComprobantesCompras,
  nombreAlicuotasCompras,
  nombreZip,
} from "./generar-zip"
import { sha256 } from "./hashes"
import { obtenerOCrearPeriodoIva } from "./periodo"
import { subirArchivoArbitrario } from "./storage-iva"
import type { ResultadoValidacion } from "./types"

export interface ResultadoExportacion {
  ok: boolean
  exportacionId?: string
  errores?: ResultadoValidacion["errores"]
  advertencias?: ResultadoValidacion["advertencias"]
  resumen?: ReturnType<typeof calcularResumen>
}

/**
 * generarExportacionIvaArca: opciones -> Promise<ResultadoExportacion>
 *
 * Genera una exportación completa para el mesAnio y la persiste.
 * Si hay errores bloqueantes, devuelve { ok: false, errores }.
 */
export async function generarExportacionIvaArca(opciones: {
  mesAnio: string
  generadoPorId: string
  observaciones?: string
}): Promise<ResultadoExportacion> {
  const { mesAnio, generadoPorId, observaciones } = opciones

  // 1) Período
  const periodo = await obtenerOCrearPeriodoIva(mesAnio)

  // 2) Recolectar
  const datosBase = await recolectarDatosIvaPeriodo(mesAnio)

  // 3) Aplicar ajustes activos
  const ajustes = await obtenerAjustesActivos(periodo.id)
  const datosFinales = aplicarAjustes(datosBase, ajustes)

  // 4) Validar
  const validaciones = validarPeriodo(datosFinales)
  if (validaciones.errores.length > 0) {
    return {
      ok: false,
      errores: validaciones.errores,
      advertencias: validaciones.advertencias,
    }
  }

  // 5) Emisor
  const emisor = await obtenerEmisorTransmagg()

  // 6) TXT
  const ventasCbteTxt = generarComprobantesVentasTxt(datosFinales.ventas.comprobantes)
  const ventasAlicTxt = generarAlicuotasVentasTxt(datosFinales.ventas.alicuotas)
  const comprasCbteTxt = generarComprobantesComprasTxt(datosFinales.compras.comprobantes)
  const comprasAlicTxt = generarAlicuotasComprasTxt(datosFinales.compras.alicuotas)

  // 7) Resumen + ZIP
  const resumen = calcularResumen({
    datos: datosFinales,
    cantAjustesAplicados: ajustes.length,
    emisor,
  })
  const zipBuffer = await generarZipExportacionIva({
    mesAnio,
    comprobantesVentasTxt: ventasCbteTxt,
    alicuotasVentasTxt: ventasAlicTxt,
    comprobantesComprasTxt: comprasCbteTxt,
    alicuotasComprasTxt: comprasAlicTxt,
    resumen,
    validaciones,
  })

  // 8) Hashes
  const hashZip = sha256(zipBuffer)
  const hashCbteV = sha256(ventasCbteTxt)
  const hashAlicV = sha256(ventasAlicTxt)
  const hashCbteC = sha256(comprasCbteTxt)
  const hashAlicC = sha256(comprasAlicTxt)

  // 9) Storage
  const baseKey = `libros-iva-arca/${mesAnio.slice(0, 4)}/${mesAnio.slice(5, 7)}/${Date.now()}`
  const zipKey = await subirArchivoArbitrario(zipBuffer, `${baseKey}/${nombreZip(mesAnio)}`, "application/zip")
  const cbteVKey = await subirArchivoArbitrario(Buffer.from(ventasCbteTxt, "latin1"), `${baseKey}/${nombreComprobantesVentas(mesAnio)}`, "text/plain")
  const alicVKey = await subirArchivoArbitrario(Buffer.from(ventasAlicTxt, "latin1"), `${baseKey}/${nombreAlicuotasVentas(mesAnio)}`, "text/plain")
  const cbteCKey = await subirArchivoArbitrario(Buffer.from(comprasCbteTxt, "latin1"), `${baseKey}/${nombreComprobantesCompras(mesAnio)}`, "text/plain")
  const alicCKey = await subirArchivoArbitrario(Buffer.from(comprasAlicTxt, "latin1"), `${baseKey}/${nombreAlicuotasCompras(mesAnio)}`, "text/plain")

  // 10) Persistir ExportacionIvaArca
  const exportacion = await prisma.exportacionIvaArca.create({
    data: {
      periodoIvaId: periodo.id,
      mesAnio,
      estado: "GENERADA",
      zipS3Key: zipKey,
      comprobantesVentasS3Key: cbteVKey,
      alicuotasVentasS3Key: alicVKey,
      comprobantesComprasS3Key: cbteCKey,
      alicuotasComprasS3Key: alicCKey,
      hashZip,
      hashComprobantesVentas: hashCbteV,
      hashAlicuotasVentas: hashAlicV,
      hashComprobantesCompras: hashCbteC,
      hashAlicuotasCompras: hashAlicC,
      resumenJson: JSON.stringify(resumen),
      validacionesJson: JSON.stringify(validaciones),
      generadoPorId,
      observaciones,
    },
  })

  // 11) Si el período estaba en ABIERTO o EN_REVISION_CONTADOR, pasarlo
  // a TXT_GENERADO (es una transición opcional pero conveniente)
  if (periodo.estado === "ABIERTO" || periodo.estado === "EN_REVISION_CONTADOR") {
    await prisma.periodoIva.update({
      where: { id: periodo.id },
      data: { estado: "TXT_GENERADO" },
    })
  }

  return {
    ok: true,
    exportacionId: exportacion.id,
    advertencias: validaciones.advertencias,
    resumen,
  }
}
