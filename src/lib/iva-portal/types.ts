/**
 * types.ts — Tipos compartidos del módulo Portal IVA / LID ARCA.
 *
 * Estos DTOs son neutros: no dependen de Prisma ni de tenant. Tanto Transmagg
 * como JM pueden importarlos para construir los TXT.
 *
 * Diseño: el TXT de comprobantes y el de alícuotas son archivos separados.
 * Por cada comprobante puede haber 1..N filas de alícuota (tasas distintas).
 */

/**
 * TipoLibro: VENTAS o COMPRAS. Determina a qué archivos se exporta el
 * comprobante (REGINFO_CV_VENTAS_* vs REGINFO_CV_COMPRAS_*).
 */
export type TipoLibro = "VENTAS" | "COMPRAS"

/**
 * TipoReferencia: vínculo del registro con el origen.
 * - FACTURA_EMITIDA / NC_EMITIDA / ND_EMITIDA → ventas (a empresa)
 * - LIQUIDACION → compras (LP a fletero, neto = bruto - comisión)
 * - NC_RECIBIDA / ND_RECIBIDA sobre LP → compras
 * - FACTURA_PROVEEDOR → compras
 * - NC_RECIBIDA / ND_RECIBIDA sobre proveedor → compras
 * - FACTURA_SEGURO → compras
 * - MANUAL → ajuste manual sin vínculo a entidad
 */
export type TipoReferencia =
  | "FACTURA_EMITIDA"
  | "LIQUIDACION"
  | "FACTURA_PROVEEDOR"
  | "FACTURA_SEGURO"
  | "NC_EMITIDA"
  | "ND_EMITIDA"
  | "NC_RECIBIDA"
  | "ND_RECIBIDA"
  | "MANUAL"

/**
 * ComprobanteIva: una fila del archivo REGINFO_CV_*_CBTE.
 *
 * Importes en pesos (number con 2 decimales). El generador de TXT los
 * convierte a centavos al escribir. Los signos los aplica el generador
 * según tipoComprobanteArca (NC restan, facturas/ND suman).
 *
 * Excepción: NC/ND ya vienen con valores positivos. Es responsabilidad de
 * generar-txt aplicar el signo si la spec ARCA lo requiere para alguna fila.
 * Por ahora ARCA acepta los valores tal como se ingresaron — el signo lo da
 * el código de comprobante.
 */
export interface ComprobanteIva {
  // Identidad
  tipoLibro: TipoLibro
  tipoReferencia: TipoReferencia
  referenciaId: string | null

  // Cabecera
  fecha: Date
  tipoComprobanteArca: number          // 1, 2, 3, 6, 7, 8, 60, 61, 201, 202, 203
  puntoVenta: number                   // 0..99999
  numeroDesde: number                  // 0..99999999
  numeroHasta: number                  // 0..99999999, suele ser igual a Desde
  cuitContraparte: string              // 11 dígitos
  razonSocialContraparte: string       // texto libre, se limpia y pad a 30

  // Importes (positivos en pesos)
  totalOperacion: number
  netoGravado: number
  noGravado: number
  noCategorizados: number              // % a no categorizados (vendedor)
  exento: number
  pagosACuenta: number
  percepcionIibb: number
  impuestosMunicipales: number
  impuestosInternos: number
  otrosTributos: number
  // Solo para compras
  percepcionIva: number
  percepcionGanancias: number

  // Datos secundarios
  codigoMoneda: string                 // "PES" siempre
  tipoCambio: number                   // 1.0 para PES
  cantidadAlicuotas: number            // 1..N (debe coincidir con AlicuotaIva.length para este comprobante)
  codigoOperacion: string              // "0" normal, "Z" exportación, etc.
  fechaPago: Date | null               // solo para 201/FCE; si no aplica, null
}

/**
 * AlicuotaIva: una fila del archivo REGINFO_CV_*_ALICUOTAS.
 *
 * Vinculada a un ComprobanteIva por (tipoComprobanteArca, puntoVenta,
 * numeroDesde) — esa terna identifica el comprobante padre dentro del archivo.
 */
export interface AlicuotaIva {
  tipoLibro: TipoLibro

  // Identificador del comprobante padre (mismo de ComprobanteIva.numeroDesde)
  tipoComprobanteArca: number
  puntoVenta: number
  numeroComprobante: number

  // Datos de la alícuota
  netoGravado: number                  // base imponible para esta tasa
  alicuotaPorcentaje: number           // 0, 5, 10.5, 21, 27, 2.5
  montoIva: number                     // monto de IVA correspondiente

  // Solo para compras: CUIT del proveedor (algunos formatos lo incluyen)
  cuitProveedor?: string
}

/**
 * Datos completos del período listos para exportar.
 */
export interface DatosIvaPeriodo {
  mesAnio: string                      // YYYY-MM
  ventas: {
    comprobantes: ComprobanteIva[]
    alicuotas: AlicuotaIva[]
  }
  compras: {
    comprobantes: ComprobanteIva[]
    alicuotas: AlicuotaIva[]
  }
}

/**
 * EmisorInfo: datos del emisor que van en TXT y validaciones.
 * Se inyecta como parámetro para que las funciones puras no lean de DB.
 */
export interface EmisorInfo {
  cuit: string                         // 11 dígitos
  razonSocial: string
}

/**
 * Resultado de validación de un período.
 */
export interface ResultadoValidacion {
  errores: ValidacionItem[]            // bloqueantes — impiden generar TXT
  advertencias: ValidacionItem[]       // permiten generar pero se loggean
}

export interface ValidacionItem {
  codigo: string                       // "CUIT_INVALIDO" | "TIPO_NO_SOPORTADO" | etc.
  mensaje: string
  referencia?: { tipoReferencia: TipoReferencia; id: string | null; cbte?: string }
}

/**
 * AjusteAplicable: ajuste manual ya validado, listo para aplicar a los datos
 * recolectados antes de generar TXT. Forma desnuda del modelo Prisma.
 */
export interface AjusteAplicable {
  id: string
  tipoLibro: TipoLibro
  tipoAjuste: "AGREGAR" | "MODIFICAR" | "EXCLUIR" | "REDONDEO" | "RECLASIFICAR"
  referenciaTipo: TipoReferencia | null
  referenciaId: string | null
  // Datos para AGREGAR / MODIFICAR / RECLASIFICAR
  tipoComprobanteArca?: number
  puntoVenta?: number
  numeroDesde?: number
  numeroHasta?: number
  fechaComprobante?: Date
  cuitContraparte?: string
  razonSocialContraparte?: string
  netoGravado?: number
  iva?: number
  exento?: number
  noGravado?: number
  percepcionIva?: number
  percepcionIibb?: number
  percepcionGanancias?: number
  total?: number
  alicuota?: number
  motivo: string
}
