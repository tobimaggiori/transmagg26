import { z } from "zod"

export const cuentaTipoSchema = z.enum(["BANCO", "BILLETERA_VIRTUAL", "BROKER"])
export const monedaSchema = z.enum(["PESOS", "DOLARES", "OTRO"])
export const formatoReconciliacionSchema = z.enum(["PDF", "EXCEL", "AMBOS"])
export const movimientoFciTipoSchema = z.enum(["SUSCRIPCION", "RESCATE"])
export const movimientoBancarioTipoSchema = z.enum([
  "CHEQUE_DEPOSITADO",
  "CHEQUE_EMITIDO_DEBITADO",
  "TRANSFERENCIA_RECIBIDA",
  "TRANSFERENCIA_ENVIADA",
  "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS",
  "ENVIO_A_BROKER",
  "RESCATE_DE_BROKER",
  "INTERES_CUENTA_REMUNERADA",
  "PAGO_SERVICIO",
  "MANTENIMIENTO_CUENTA",
  "PAGO_TARJETA",
  "DESCUENTO_CHEQUE_BANCO",
  "PAGO_SUELDO",
  "OTRO",
])
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
export const motivoPagoChequeSchema = z.enum(["VARIOS", "FACTURA", "ORDEN_DE_PAGO", "ALQUILER", "EXPENSAS", "SERVICIOS"])
export const clausulaChequeSchema = z.enum(["A_LA_ORDEN", "NO_A_LA_ORDEN"])
export const estadoPlanillaGaliciaSchema = z.enum(["BORRADOR", "DESCARGADA", "PROCESADA"])
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

export const crearCuentaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  tipo: cuentaTipoSchema,
  bancoOEntidad: z.string().min(1, "La entidad es obligatoria"),
  moneda: monedaSchema,
  saldoInicial: z.number(),
  activa: z.boolean().default(true),
  cerradaEn: z.coerce.date().nullable().optional(),
  tieneImpuestoDebcred: z.boolean().default(false),
  alicuotaImpuesto: z.number().min(0).default(0.006),
  tieneChequera: z.boolean().default(false),
  tienePlanillaEmisionMasiva: z.boolean().default(false),
  formatoPlanilla: z.string().nullable().optional(),
  tieneCuentaRemunerada: z.boolean().default(false),
  tieneTarjetasPrepagasChoferes: z.boolean().default(false),
  formatoReconciliacion: formatoReconciliacionSchema.nullable().optional(),
  esCuentaComitenteBroker: z.boolean().default(false),
  tieneIibbSircrebTucuman: z.boolean().default(false),
  alicuotaIibbSircrebTucuman: z.number().min(0).default(0.06),
  cuentaPadreId: z.string().uuid().nullable().optional(),
  nroCuenta: z.string().nullable().optional(),
  cbu: z.string().nullable().optional(),
  alias: z.string().nullable().optional(),
})

export const actualizarCuentaSchema = crearCuentaSchema.partial()

export const crearFciSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  cuentaId: z.string().uuid("Cuenta inválida"),
  moneda: monedaSchema,
  activo: z.boolean().default(true),
  diasHabilesAlerta: z.number().int().min(1).default(1),
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
  cuentaId: z.string().uuid("Cuenta inválida"),
  activo: z.boolean().default(true),
})

export const actualizarBrokerSchema = crearBrokerSchema.partial()

export const crearEmpleadoSchema = z.object({
  usuarioId: z.string().uuid("Usuario inválido").nullable().optional(),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe tener 11 dígitos"),
  cargo: z.string().nullable().optional(),
  fechaIngreso: z.coerce.date(),
  activo: z.boolean().default(true),
})

export const actualizarEmpleadoSchema = crearEmpleadoSchema.partial()

export const crearMovimientoBancarioSchema = z.object({
  cuentaId: z.string().uuid("Cuenta inválida"),
  tipo: movimientoBancarioTipoSchema,
  monto: z.number(),
  fecha: z.coerce.date(),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  referencia: z.string().nullable().optional(),
  comprobanteS3Key: z.string().nullable().optional(),
  impuestoDebitoAplica: z.boolean().optional(),
  impuestoDebitoMonto: z.number().optional(),
  impuestoCreditoAplica: z.boolean().optional(),
  impuestoCreditoMonto: z.number().optional(),
  otrosDescuentosDescripcion: z.string().nullable().optional(),
  otrosDescuentosMonto: z.number().default(0),
  cuentaDestinoId: z.string().uuid("Cuenta destino inválida").nullable().optional(),
  cuentaBrokerId: z.string().uuid("Cuenta broker inválida").nullable().optional(),
  empleadoId: z.string().uuid("Empleado inválido").nullable().optional(),
})

export const actualizarMovimientoBancarioSchema = crearMovimientoBancarioSchema.partial()

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
  planillaGaliciaId: z.string().uuid("Planilla inválida").nullable().optional(),
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

export const crearPlanillaGaliciaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  cuentaId: z.string().uuid("Cuenta inválida"),
  estado: estadoPlanillaGaliciaSchema.default("BORRADOR"),
  totalMonto: z.number().min(0),
  cantidadCheques: z.number().int().min(0).max(250),
  xlsxS3Key: z.string().nullable().optional(),
})

export const actualizarPlanillaGaliciaSchema = crearPlanillaGaliciaSchema.partial()

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

export const crearAdelantoFleteroSchema = z.object({
  fleteroId: z.string().uuid("Fletero inválido"),
  tipo: tipoAdelantoFleteroSchema,
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.coerce.date(),
  descripcion: z.string().nullable().optional(),
  chequeEmitidoId: z.string().uuid("Cheque emitido inválido").nullable().optional(),
  chequeRecibidoId: z.string().uuid("Cheque recibido inválido").nullable().optional(),
  montoDescontado: z.number().min(0).default(0),
  estado: estadoAdelantoFleteroSchema.default("PENDIENTE_DESCUENTO"),
})

export const actualizarAdelantoFleteroSchema = crearAdelantoFleteroSchema.partial()

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
  montoNeto: z.number().positive(),
  ivaPct: z.number().min(0).max(100).default(21),
  descripcion: z.string().min(1),
  motivoDetalle: z.string().optional(),
  viajesIds: z.array(z.string().uuid()).optional(),
  nroComprobanteExterno: z.string().optional(),
  fechaComprobanteExterno: z.string().optional(),
  emisorExterno: z.string().optional(),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)").optional(),
  emisionArca: z.boolean().optional(),
  idempotencyKey: z.string().uuid().optional(),
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
  idempotencyKey: z.string().uuid().optional(),
})
