import { z } from "zod"

export const cuentaTipoSchema = z.enum(["BANCO", "BILLETERA_VIRTUAL", "BROKER"])
export const monedaSchema = z.enum(["PESOS", "DOLARES", "OTRO"])
export const movimientoFciTipoSchema = z.enum(["SUSCRIPCION", "RESCATE"])
export const chequeRecibidoEstadoSchema = z.enum([
  "EN_CARTERA",
  "DEPOSITADO",
  "ENDOSADO_FLETERO",
  "ENDOSADO_PROVEEDOR",
  "ENDOSADO_BROKER",
  "DESCONTADO_BANCO",
  "RECHAZADO",
])
export const chequeEmitidoEstadoSchema = z.enum([
  "PENDIENTE_EMISION",
  "EMITIDO",
  "DEPOSITADO",
  "RECHAZADO",
])
export const endosadoATipoSchema = z.enum(["FLETERO", "PROVEEDOR", "BROKER"])
export const tipoDocBeneficiarioSchema = z.enum(["CUIT", "CUIL", "CDI"])
export const motivoPagoChequeSchema = z.enum(["VARIOS", "FACTURA", "ORDEN_DE_PAGO", "ALQUILER", "EXPENSAS", "SERVICIOS", "ADELANTO"])
export const clausulaChequeSchema = z.enum(["A_LA_ORDEN", "NO_A_LA_ORDEN"])
export const tipoGastoTarjetaPrepagaSchema = z.enum([
  "COMBUSTIBLE",
  "PEAJE",
  "COMIDA",
  "ALOJAMIENTO",
  "REPUESTO",
  "LAVADO",
  "OTRO",
])
export const tipoAdelantoFleteroSchema = z.enum([
  "EFECTIVO",
  "TRANSFERENCIA",
  "CHEQUE_PROPIO",
  "CHEQUE_TERCERO",
  "COMBUSTIBLE",
])
export const estadoAdelantoFleteroSchema = z.enum([
  "PENDIENTE_DESCUENTO",
  "DESCONTADO_PARCIAL",
  "DESCONTADO_TOTAL",
])

const cuentaBaseSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  tipo: cuentaTipoSchema,
  bancoId: z.string().uuid().nullable().optional(),
  billeteraId: z.string().uuid().nullable().optional(),
  brokerId: z.string().uuid().nullable().optional(),
  moneda: monedaSchema,
  saldoInicial: z.number(),
  fechaSaldoInicial: z.coerce.date().nullable().optional(),
  activa: z.boolean().default(true),
  cerradaEn: z.coerce.date().nullable().optional(),
  tieneImpuestoDebcred: z.boolean().default(false),
  alicuotaImpuesto: z.number().min(0).default(0.006),
  tieneChequera: z.boolean().default(false),
  tieneCuentaRemunerada: z.boolean().default(false),
  tieneTarjetasPrepagasChoferes: z.boolean().default(false),
  esCuentaComitenteBroker: z.boolean().default(false),
  tieneIibbSircrebTucuman: z.boolean().default(false),
  alicuotaIibbSircrebTucuman: z.number().min(0).default(0.06),
  nroCuenta: z.string().nullable().optional(),
  cbu: z.string().nullable().optional(),
  alias: z.string().nullable().optional(),
})

export const crearCuentaSchema = cuentaBaseSchema.refine(
  (d) => {
    if (d.tipo === "BANCO") return !!d.bancoId && !d.billeteraId && !d.brokerId
    if (d.tipo === "BILLETERA_VIRTUAL") return !!d.billeteraId && !d.bancoId && !d.brokerId
    if (d.tipo === "BROKER") return !!d.brokerId && !d.bancoId && !d.billeteraId
    return false
  },
  {
    message:
      "Cada tipo debe asociarse a su entidad maestra: BANCO→bancoId, BILLETERA_VIRTUAL→billeteraId, BROKER→brokerId (y no a otra)",
    path: ["tipo"],
  },
)

export const actualizarCuentaSchema = cuentaBaseSchema.partial()

export const crearBancoSchema = z.object({
  nombre: z.string().min(1, "El nombre del banco es obligatorio").max(120),
})

export const actualizarBancoSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  activo: z.boolean().optional(),
})

export const crearBilleteraVirtualSchema = z.object({
  nombre: z.string().min(1, "El nombre de la billetera es obligatorio").max(120),
})

export const actualizarBilleteraVirtualSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  activa: z.boolean().optional(),
})

export const crearFciSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  cuentaId: z.string().uuid("Cuenta inválida"),
  moneda: monedaSchema,
  activo: z.boolean().default(true),
  diasHabilesAlerta: z.number().int().min(1).default(1),
  saldoInicial: z.number().min(0).optional(),
})

export const actualizarFciSchema = crearFciSchema.partial()

export const crearMovimientoFciSchema = z.object({
  fciId: z.string().uuid("FCI inválido"),
  cuentaOrigenDestinoId: z.string().uuid("Cuenta origen/destino inválida"),
  tipo: movimientoFciTipoSchema,
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.coerce.date(),
  descripcion: z.string().nullable().optional(),
})

export const actualizarMovimientoFciSchema = crearMovimientoFciSchema.partial()

export const crearSaldoFciSchema = z.object({
  fciId: z.string().uuid("FCI inválido"),
  saldoInformado: z.number(),
  fechaActualizacion: z.coerce.date(),
})

export const actualizarSaldoFciSchema = crearSaldoFciSchema.partial()

export const crearBrokerSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe tener 11 dígitos"),
})

export const actualizarBrokerSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe tener 11 dígitos").optional(),
  activo: z.boolean().optional(),
})

export const crearEmpleadoSchema = z.object({
  usuarioId: z.string().uuid("Usuario inválido").nullable().optional(),
  fleteroId: z.string().uuid("Fletero inválido").nullable().optional(),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  cuit: z.string().regex(/^\d{11}$/, "CUIT/CUIL debe tener 11 dígitos"),
  cargo: z.string().nullable().optional(),
  fechaIngreso: z.coerce.date(),
  activo: z.boolean().default(true),
})

export const actualizarEmpleadoSchema = crearEmpleadoSchema.partial()

export const crearChequeRecibidoSchema = z.object({
  empresaId: z.string().uuid("Empresa inválida").optional(),
  brokerOrigenId: z.string().uuid("Broker inválido").optional(),
  facturaId: z.string().uuid("Factura inválida").nullable().optional(),
  nroCheque: z.string().min(1, "El número de cheque es obligatorio"),
  bancoEmisor: z.string().min(1, "El banco emisor es obligatorio"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fechaEmision: z.coerce.date(),
  fechaCobro: z.coerce.date(),
  estado: chequeRecibidoEstadoSchema,
  cuentaDepositoId: z.string().uuid("Cuenta depósito inválida").nullable().optional(),
  endosadoATipo: endosadoATipoSchema.nullable().optional(),
  endosadoAFleteroId: z.string().uuid("Fletero inválido").nullable().optional(),
  endosadoAProveedorId: z.string().uuid("Proveedor inválido").nullable().optional(),
  endosadoABrokerId: z.string().uuid("Broker inválido").nullable().optional(),
  fechaAcreditacion: z.coerce.date().nullable().optional(),
  tasaDescuento: z.number().nullable().optional(),
  esElectronico: z.boolean().optional().default(false),
})

export const actualizarChequeRecibidoSchema = crearChequeRecibidoSchema.partial()

export const crearChequeEmitidoSchema = z.object({
  fleteroId: z.string().uuid("Fletero inválido").nullable().optional(),
  proveedorId: z.string().uuid("Proveedor inválido").nullable().optional(),
  cuentaId: z.string().uuid("Cuenta inválida"),
  nroCheque: z.string().nullable().optional(),
  tipoDocBeneficiario: tipoDocBeneficiarioSchema,
  nroDocBeneficiario: z.string().regex(/^\d{1,11}$/, "El documento debe tener entre 1 y 11 dígitos"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fechaEmision: z.coerce.date(),
  fechaPago: z.coerce.date(),
  motivoPago: motivoPagoChequeSchema,
  descripcion1: z.string().max(100, "Descripción 1 admite hasta 100 caracteres").nullable().optional(),
  descripcion2: z.string().max(50, "Descripción 2 admite hasta 50 caracteres").nullable().optional(),
  mailBeneficiario: z.string().email("Mail inválido").max(100).nullable().optional(),
  clausula: clausulaChequeSchema,
  estado: chequeEmitidoEstadoSchema.default("PENDIENTE_EMISION"),
  fechaDeposito: z.coerce.date().nullable().optional(),
  liquidacionId: z.string().uuid("Liquidación inválida").nullable().optional(),
})

export const actualizarChequeEmitidoSchema = crearChequeEmitidoSchema.partial()

export const registrarDepositoChequeEmitidoSchema = z.object({
  nroCheque: z.string().min(1, "El número de cheque es obligatorio"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  impuestoDebitoAplica: z.boolean().optional(),
  impuestoDebitoMonto: z.number().optional(),
  otrosDescuentosDescripcion: z.string().nullable().optional(),
  otrosDescuentosMonto: z.number().default(0),
  descripcion: z.string().min(1).default("Débito por cheque emitido depositado"),
})

export const crearTarjetaPrepagaSchema = z.object({
  choferId: z.string().uuid("Chofer inválido"),
  cuentaId: z.string().uuid("Cuenta inválida"),
  nroTarjeta: z.string().nullable().optional(),
  limiteMensual: z.number().nullable().optional(),
  activa: z.boolean().default(true),
})

export const actualizarTarjetaPrepagaSchema = crearTarjetaPrepagaSchema.partial()

export const crearGastoTarjetaPrepagaSchema = z.object({
  tarjetaId: z.string().uuid("Tarjeta inválida"),
  tipoGasto: tipoGastoTarjetaPrepagaSchema,
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.coerce.date(),
  descripcion: z.string().nullable().optional(),
  comprobanteS3Key: z.string().nullable().optional(),
})

export const actualizarGastoTarjetaPrepagaSchema = crearGastoTarjetaPrepagaSchema.partial()

export const chequePropioAdelantoSchema = z.object({
  cuentaId: z.string().uuid("Cuenta (chequera) inválida"),
  nroCheque: z.string().min(1, "El número de cheque es obligatorio"),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de emisión inválida"),
  fechaPago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de pago inválida"),
  clausula: clausulaChequeSchema.default("NO_A_LA_ORDEN"),
  descripcion1: z.string().max(100, "Descripción 1 admite hasta 100 caracteres").nullable().optional(),
  descripcion2: z.string().max(50, "Descripción 2 admite hasta 50 caracteres").nullable().optional(),
  mailBeneficiario: z.string().email("Mail inválido").max(100).nullable().optional(),
})

const adelantoFleteroBaseSchema = z.object({
  fleteroId: z.string().uuid("Fletero inválido"),
  tipo: tipoAdelantoFleteroSchema,
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.coerce.date(),
  descripcion: z.string().nullable().optional(),
  chequeEmitidoId: z.string().uuid("Cheque emitido inválido").nullable().optional(),
  chequeRecibidoId: z.string().uuid("Cheque recibido inválido").nullable().optional(),
  chequePropio: chequePropioAdelantoSchema.nullable().optional(),
  comprobanteS3Key: z.string().nullable().optional(),
  montoDescontado: z.number().min(0).default(0),
  estado: estadoAdelantoFleteroSchema.default("PENDIENTE_DESCUENTO"),
})

export const crearAdelantoFleteroSchema = adelantoFleteroBaseSchema.superRefine((data, ctx) => {
  if (data.tipo === "CHEQUE_PROPIO") {
    if (!data.chequePropio) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Datos del cheque propio obligatorios", path: ["chequePropio"] })
    }
    if (!data.comprobanteS3Key) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Comprobante de emisión obligatorio", path: ["comprobanteS3Key"] })
    }
  }
  if (data.tipo === "CHEQUE_TERCERO") {
    if (!data.chequeRecibidoId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cheque en cartera obligatorio", path: ["chequeRecibidoId"] })
    }
    if (!data.comprobanteS3Key) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Comprobante de endoso obligatorio", path: ["comprobanteS3Key"] })
    }
  }
})

export const actualizarAdelantoFleteroSchema = adelantoFleteroBaseSchema.partial()

export const crearAdelantoDescuentoSchema = z.object({
  adelantoId: z.string().uuid("Adelanto inválido"),
  liquidacionId: z.string().uuid("Liquidación inválida"),
  montoDescontado: z.number().positive("El monto descontado debe ser mayor a 0"),
  fecha: z.coerce.date(),
})

export const actualizarAdelantoDescuentoSchema = crearAdelantoDescuentoSchema.partial()

/**
 * crearNotaCDSchema: Schema de validación para crear una Nota de Crédito o Débito.
 *
 * Valida el tipo (NC_EMITIDA | ND_EMITIDA | NC_RECIBIDA | ND_RECIBIDA), el subtipo
 * correspondiente, el documento asociado (factura, liquidación o cheque recibido),
 * los montos y la descripción obligatoria.
 * Para NC_RECIBIDA y ND_RECIBIDA se pueden agregar datos del comprobante externo.
 * Este schema existe para garantizar integridad de datos antes de ejecutar la
 * lógica de negocio en el POST de /api/notas-credito-debito.
 *
 * Ejemplos:
 * crearNotaCDSchema.parse({ tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "uuid", montoNeto: 1000, descripcion: "Anulación" })
 * // => datos válidos
 * crearNotaCDSchema.parse({ tipo: "INVALIDO", subtipo: "X", montoNeto: -1, descripcion: "" })
 * // => ZodError con errores en tipo, montoNeto y descripcion
 */
export const crearNotaCDSchema = z.object({
  tipo: z.enum(["NC_EMITIDA", "ND_EMITIDA", "NC_RECIBIDA", "ND_RECIBIDA"]),
  subtipo: z.string().min(1),
  facturaId: z.string().uuid().optional(),
  liquidacionId: z.string().uuid().optional(),
  chequeRecibidoId: z.string().uuid().optional(),
  facturaProveedorId: z.string().uuid().optional(),
  montoNeto: z.number().positive(),
  ivaPct: z.number().min(0).max(100).default(21),
  descripcion: z.string().min(1),
  motivoDetalle: z.string().optional(),
  viajesIds: z.array(z.string().uuid()).optional(),
  nroComprobanteExterno: z.string().optional(),
  fechaComprobanteExterno: z.string().optional(),
  emisorExterno: z.string().optional(),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)").optional(),
  incluirComision: z.boolean().optional(),
  emisionArca: z.boolean().optional(),
  idempotencyKey: z.string().uuid().optional(),
  percepcionIIBB: z.number().min(0).optional(),
  percepcionIVA: z.number().min(0).optional(),
  percepcionGanancias: z.number().min(0).optional(),
})

/**
 * Schema para emisión contextual de NC/ND empresa con ítems.
 * El operador ingresa facturaId, tipoNota, fechaEmision e ítems.
 * tipoCbte, PV, IVA, total se resuelven en backend.
 */
export const crearNotaEmpresaSchema = z.object({
  facturaId: z.string().uuid(),
  tipoNota: z.enum(["NC", "ND"]),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)").optional(),
  items: z.array(z.object({
    concepto: z.string().min(1, "El concepto es obligatorio"),
    subtotal: z.number().positive("El subtotal debe ser mayor a 0"),
  })).min(1, "Se requiere al menos un ítem"),
  viajesIds: z.array(z.string().uuid()).optional(),
  idempotencyKey: z.string().uuid().optional(),
})

/**
 * Schema para registrar una ND recibida de una empresa por faltante de mercadería.
 * El operador ingresa los datos del comprobante externo, selecciona viajes afectados
 * y carga el detalle del faltante (descripción, kilos, neto, IVA).
 * No pasa por ARCA (es un documento de terceros).
 *
 * Ejemplos:
 * crearNDRecibidaFaltanteSchema.parse({ facturaId: "uuid", nroComprobanteExterno: "0001-00000123",
 *   fechaComprobanteExterno: "2026-04-10", viajesIds: ["uuid1"], descripcion: "Faltante 500kg soja",
 *   kilosFaltante: 500, montoNeto: 50000, ivaPct: 21 })
 * // => datos válidos
 */
export const crearNDRecibidaFaltanteSchema = z.object({
  facturaId: z.string().uuid("Factura inválida"),
  nroComprobanteExterno: z.string().min(1, "El nro de comprobante es obligatorio"),
  fechaComprobanteExterno: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  viajesIds: z.array(z.string().uuid()).min(1, "Seleccione al menos un viaje"),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  kilosFaltante: z.number().min(0, "Los kilos deben ser >= 0"),
  montoNeto: z.number().positive("El monto neto debe ser mayor a 0"),
  ivaPct: z.number().min(0).max(100),
  pdfS3Key: z.string().min(1, "El PDF del comprobante es obligatorio"),
})
