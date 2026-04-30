-- AlterTable
ALTER TABLE "camiones" DROP COLUMN "creado_en";

-- AlterTable
ALTER TABLE "empleados" ADD COLUMN     "cargo" TEXT,
ADD COLUMN     "cuit" TEXT NOT NULL,
ADD COLUMN     "fecha_ingreso" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "empresas" DROP COLUMN "creado_en",
ADD COLUMN     "condicion_iva" TEXT NOT NULL,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "padron_fce" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "viajes" DROP COLUMN "tarifa",
ADD COLUMN     "estado_factura" TEXT NOT NULL DEFAULT 'PENDIENTE_FACTURAR',
ADD COLUMN     "tarifa_empresa" DECIMAL(65,30) NOT NULL,
ALTER COLUMN "tiene_ctg" SET DEFAULT true,
ALTER COLUMN "mercaderia" DROP NOT NULL,
ALTER COLUMN "kilos" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "contactos_email" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "empresa_id" TEXT,
    "proveedor_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contactos_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polizas_seguro" (
    "id" TEXT NOT NULL,
    "camion_id" TEXT,
    "aseguradora" TEXT NOT NULL,
    "nro_poliza" TEXT NOT NULL,
    "cobertura" TEXT,
    "monto_mensual" DECIMAL(65,30),
    "vigencia_desde" TIMESTAMP(3) NOT NULL,
    "vigencia_hasta" TIMESTAMP(3) NOT NULL,
    "archivos" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_bien" TEXT NOT NULL DEFAULT 'CAMION',
    "proveedor_id" TEXT,
    "descripcion_bien" TEXT,
    "pdf_s3_key" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "factura_seguro_id" TEXT,

    CONSTRAINT "polizas_seguro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camion_chofer" (
    "id" TEXT NOT NULL,
    "camion_id" TEXT NOT NULL,
    "chofer_id" TEXT NOT NULL,
    "desde" TIMESTAMP(3) NOT NULL,
    "hasta" TIMESTAMP(3),

    CONSTRAINT "camion_chofer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_impuesto" (
    "id" TEXT NOT NULL,
    "tipo_impuesto" TEXT NOT NULL,
    "descripcion" TEXT,
    "periodo" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "medio_pago" TEXT NOT NULL,
    "cuenta_id" TEXT,
    "tarjeta_id" TEXT,
    "comprobante_pdf_s3_key" TEXT,
    "observaciones" TEXT,
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_impuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infracciones" (
    "id" TEXT NOT NULL,
    "camion_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "organismo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha_pago" TIMESTAMP(3),
    "medio_pago" TEXT,
    "cuenta_id" TEXT,
    "comprobante_pdf_s3_key" TEXT,
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infracciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viajes_en_factura" (
    "id" TEXT NOT NULL,
    "viaje_id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "fecha_viaje" TIMESTAMP(3) NOT NULL,
    "remito" TEXT,
    "cupo" TEXT,
    "mercaderia" TEXT,
    "procedencia" TEXT,
    "provincia_origen" TEXT,
    "destino" TEXT,
    "provincia_destino" TEXT,
    "kilos" DOUBLE PRECISION,
    "tarifa_empresa" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "viajes_en_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_emitidas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "operador_email" TEXT NOT NULL,
    "nro_comprobante" TEXT,
    "tipo_cbte" INTEGER NOT NULL DEFAULT 1,
    "modalidad_mi_pymes" TEXT,
    "iva_pct" DOUBLE PRECISION NOT NULL DEFAULT 21,
    "neto" DECIMAL(65,30) NOT NULL,
    "iva_monto" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "pto_venta" INTEGER DEFAULT 1,
    "cae" TEXT,
    "cae_vto" TIMESTAMP(3),
    "qr_data" TEXT,
    "estado_arca" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "arca_observaciones" TEXT,
    "request_arca_json" TEXT,
    "response_arca_json" TEXT,
    "autorizada_en" TIMESTAMP(3),
    "idempotency_key" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "pdf_s3_key" TEXT,
    "emitida_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_cobro" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "metodo_pago" TEXT NOT NULL DEFAULT 'Transferencia Bancaria',

    CONSTRAINT "facturas_emitidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bancos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bancos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billeteras_virtuales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billeteras_virtuales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "banco_id" TEXT,
    "billetera_id" TEXT,
    "broker_id" TEXT,
    "moneda" TEXT NOT NULL,
    "saldo_inicial" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fecha_saldo_inicial" TIMESTAMP(3),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" TIMESTAMP(3),
    "tiene_impuesto_debcred" BOOLEAN NOT NULL DEFAULT false,
    "alicuota_impuesto" DOUBLE PRECISION NOT NULL DEFAULT 0.006,
    "tiene_chequera" BOOLEAN NOT NULL DEFAULT false,
    "tiene_cuenta_remunerada" BOOLEAN NOT NULL DEFAULT false,
    "tiene_tarjetas_prepagas_choferes" BOOLEAN NOT NULL DEFAULT false,
    "es_cuenta_comitente_broker" BOOLEAN NOT NULL DEFAULT false,
    "tiene_iibb_sircreb_tucuman" BOOLEAN NOT NULL DEFAULT false,
    "alicuota_iibb_sircreb_tucuman" DOUBLE PRECISION NOT NULL DEFAULT 0.06,
    "nro_cuenta" TEXT,
    "cbu" TEXT,
    "alias" TEXT,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_cuenta" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "es_manual" BOOLEAN NOT NULL DEFAULT false,
    "comprobante_s3_key" TEXT,
    "cheque_emitido_id" TEXT,
    "cheque_recibido_id" TEXT,
    "pago_proveedor_id" TEXT,
    "pago_de_empresa_id" TEXT,
    "pago_impuesto_id" TEXT,
    "movimiento_fci_id" TEXT,
    "infraccion_id" TEXT,
    "cuenta_destino_id" TEXT,
    "movimiento_grupo_id" TEXT,
    "operador_creacion_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliaciones_dia" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "saldo_extracto" DECIMAL(65,30) NOT NULL,
    "operador_email" TEXT NOT NULL,
    "conciliado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conciliaciones_dia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierres_mes_cuenta" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "operador_email" TEXT NOT NULL,
    "cerrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdf_extracto_key" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "cierres_mes_cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fci" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "dias_habiles_alerta" INTEGER NOT NULL DEFAULT 1,
    "saldo_actual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "saldo_actualizado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_fci" (
    "id" TEXT NOT NULL,
    "fci_id" TEXT NOT NULL,
    "cuenta_origen_destino_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_fci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saldos_fci" (
    "id" TEXT NOT NULL,
    "fci_id" TEXT NOT NULL,
    "saldo_informado" DECIMAL(65,30) NOT NULL,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "rendimiento_periodo" DECIMAL(65,30) NOT NULL,
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saldos_fci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheques_recibidos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT,
    "broker_origen_id" TEXT,
    "factura_id" TEXT,
    "nro_cheque" TEXT NOT NULL,
    "banco_emisor" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_cobro" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL,
    "cuenta_deposito_id" TEXT,
    "endosado_a_tipo" TEXT,
    "endosado_a_proveedor_id" TEXT,
    "endosado_a_broker_id" TEXT,
    "fecha_acreditacion" TIMESTAMP(3),
    "cuit_librador" TEXT,
    "tasa_descuento" DOUBLE PRECISION,
    "fecha_deposito_broker" TIMESTAMP(3),
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "es_electronico" BOOLEAN NOT NULL DEFAULT false,
    "recibo_cobranza_id" TEXT,
    "proveedor_origen_id" TEXT,

    CONSTRAINT "cheques_recibidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheques_emitidos" (
    "id" TEXT NOT NULL,
    "proveedor_id" TEXT,
    "cuenta_id" TEXT NOT NULL,
    "nro_cheque" TEXT,
    "tipo_doc_beneficiario" TEXT NOT NULL,
    "nro_doc_beneficiario" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "motivo_pago" TEXT NOT NULL,
    "descripcion_1" TEXT,
    "descripcion_2" TEXT,
    "mail_beneficiario" TEXT,
    "clausula" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_EMISION',
    "fecha_deposito" TIMESTAMP(3),
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "es_electronico" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cheques_emitidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarjetas_prepagas" (
    "id" TEXT NOT NULL,
    "chofer_id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "nro_tarjeta" TEXT,
    "limite_mensual" DECIMAL(65,30),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarjetas_prepagas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos_tarjeta_prepaga" (
    "id" TEXT NOT NULL,
    "tarjeta_id" TEXT NOT NULL,
    "tipo_gasto" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "comprobante_s3_key" TEXT,
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_tarjeta_prepaga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarjetas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "ultimos_4" TEXT NOT NULL,
    "titular_tipo" TEXT NOT NULL,
    "titular_nombre" TEXT NOT NULL,
    "cuenta_id" TEXT,
    "chofer_id" TEXT,
    "limite_mensual" DECIMAL(65,30),
    "dia_cierre" INTEGER,
    "dia_vencimiento" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarjetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumenes_tarjeta" (
    "id" TEXT NOT NULL,
    "tarjeta_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "periodo_desde" TIMESTAMP(3),
    "periodo_hasta" TIMESTAMP(3),
    "fecha_vto_pago" TIMESTAMP(3) NOT NULL,
    "total_ars" DECIMAL(65,30) NOT NULL,
    "total_usd" DECIMAL(65,30),
    "s3_key" TEXT,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "conciliado_en" TIMESTAMP(3),
    "operador_email" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumenes_tarjeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliacion_dia_tarjeta" (
    "id" TEXT NOT NULL,
    "resumen_tarjeta_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "saldo_resumen" DECIMAL(65,30) NOT NULL,
    "conciliado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador_email" TEXT NOT NULL,

    CONSTRAINT "conciliacion_dia_tarjeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos_tarjeta" (
    "id" TEXT NOT NULL,
    "tarjeta_id" TEXT NOT NULL,
    "tipo_gasto" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "comprobante_s3_key" TEXT,
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_tarjeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brokers" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brokers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_de_empresas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "factura_id" TEXT,
    "tipo_pago" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "referencia" TEXT,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "comprobante_s3_key" TEXT,
    "cheque_recibido_id" TEXT,
    "cuenta_id" TEXT,
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_de_empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "condicion_iva" TEXT NOT NULL,
    "rubro" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'GENERAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_proveedor" (
    "id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "nro_comprobante" TEXT NOT NULL,
    "pto_venta" TEXT,
    "tipo_cbte" TEXT NOT NULL,
    "neto" DECIMAL(65,30) NOT NULL,
    "iva_monto" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "fecha_cbte" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT,
    "pdf_s3_key" TEXT,
    "estado_pago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "percepcion_iibb" DECIMAL(65,30),
    "percepcion_iva" DECIMAL(65,30),
    "percepcion_ganancias" DECIMAL(65,30),

    CONSTRAINT "facturas_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_factura_proveedor" (
    "id" TEXT NOT NULL,
    "factura_proveedor_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "alicuota_iva" DOUBLE PRECISION NOT NULL,
    "es_exento" BOOLEAN NOT NULL DEFAULT false,
    "subtotal_neto" DECIMAL(65,30) NOT NULL,
    "monto_iva" DECIMAL(65,30) NOT NULL,
    "subtotal_total" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "items_factura_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_proveedor" (
    "id" TEXT NOT NULL,
    "factura_proveedor_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "tipo" TEXT NOT NULL,
    "observaciones" TEXT,
    "comprobante_pdf_s3_key" TEXT,
    "cuenta_id" TEXT,
    "cheque_recibido_id" TEXT,
    "cheque_emitido_id" TEXT,
    "tarjeta_id" TEXT,
    "resumen_tarjeta_id" TEXT,
    "operador_email" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,

    CONSTRAINT "pagos_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asientos_iva" (
    "id" TEXT NOT NULL,
    "factura_emitida_id" TEXT,
    "factura_proveedor_id" TEXT,
    "nota_credito_debito_id" TEXT,
    "tipo_referencia" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "base_imponible" DECIMAL(65,30) NOT NULL,
    "alicuota" DOUBLE PRECISION NOT NULL,
    "monto_iva" DECIMAL(65,30) NOT NULL,
    "periodo" TEXT NOT NULL,
    "factura_seguro_id" TEXT,

    CONSTRAINT "asientos_iva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libros_iva" (
    "id" TEXT NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "pdf_s3_key" TEXT,
    "generado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador_email" TEXT NOT NULL,

    CONSTRAINT "libros_iva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asientos_iibb" (
    "id" TEXT NOT NULL,
    "viaje_en_fact_id" TEXT,
    "tabla_origen" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "monto_ingreso" DECIMAL(65,30) NOT NULL,
    "periodo" TEXT NOT NULL,

    CONSTRAINT "asientos_iibb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libros_iibb" (
    "id" TEXT NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "pdf_s3_key" TEXT,
    "generado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador_email" TEXT NOT NULL,

    CONSTRAINT "libros_iibb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "percepciones_impuestos" (
    "id" TEXT NOT NULL,
    "factura_proveedor_id" TEXT,
    "factura_seguro_id" TEXT,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DECIMAL(65,30) NOT NULL,
    "periodo" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "percepciones_impuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libros_percepciones" (
    "id" TEXT NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "pdf_s3_key" TEXT,
    "generado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador_email" TEXT NOT NULL,

    CONSTRAINT "libros_percepciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_credito_debito" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "subtipo" TEXT,
    "factura_id" TEXT,
    "cheque_recibido_id" TEXT,
    "factura_proveedor_id" TEXT,
    "nro_comprobante_externo" TEXT,
    "fecha_comprobante_externo" TIMESTAMP(3),
    "emisor_externo" TEXT,
    "monto_neto" DECIMAL(65,30) NOT NULL,
    "monto_iva" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monto_total" DECIMAL(65,30) NOT NULL,
    "monto_descontado" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "percepcion_iibb" DECIMAL(65,30),
    "percepcion_iva" DECIMAL(65,30),
    "percepcion_ganancias" DECIMAL(65,30),
    "descripcion" TEXT,
    "motivo_detalle" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "nro_comprobante" INTEGER,
    "pto_venta" INTEGER DEFAULT 1,
    "tipo_cbte" INTEGER,
    "cae" TEXT,
    "cae_vto" TIMESTAMP(3),
    "qr_data" TEXT,
    "arca_estado" TEXT DEFAULT 'PENDIENTE',
    "arca_observaciones" TEXT,
    "request_arca_json" TEXT,
    "response_arca_json" TEXT,
    "autorizada_en" TIMESTAMP(3),
    "idempotency_key" TEXT,
    "cbte_asoc_tipo" INTEGER,
    "cbte_asoc_pto_vta" INTEGER,
    "cbte_asoc_nro" INTEGER,
    "pdf_s3_key" TEXT,
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_credito_debito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_aplicadas_en_recibo" (
    "id" TEXT NOT NULL,
    "nota_id" TEXT NOT NULL,
    "recibo_id" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_aplicadas_en_recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viajes_en_nota_cd" (
    "id" TEXT NOT NULL,
    "nota_id" TEXT NOT NULL,
    "viaje_id" TEXT NOT NULL,
    "tarifa_original" DECIMAL(65,30) NOT NULL,
    "kilos_original" DOUBLE PRECISION,
    "subtotal_original" DECIMAL(65,30) NOT NULL,
    "subtotal_corregido" DECIMAL(65,30),

    CONSTRAINT "viajes_en_nota_cd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_cd_items" (
    "id" TEXT NOT NULL,
    "nota_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "notas_cd_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_seguro" (
    "id" TEXT NOT NULL,
    "aseguradora_id" TEXT NOT NULL,
    "nro_comprobante" TEXT NOT NULL,
    "tipo_comprobante" TEXT NOT NULL DEFAULT 'A',
    "fecha" TIMESTAMP(3) NOT NULL,
    "periodo_desde" TIMESTAMP(3) NOT NULL,
    "periodo_hasta" TIMESTAMP(3) NOT NULL,
    "neto" DECIMAL(65,30) NOT NULL,
    "iva" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "forma_pago" TEXT NOT NULL,
    "medio_pago_contado" TEXT,
    "cuenta_id" TEXT,
    "tarjeta_id" TEXT,
    "cant_cuotas" INTEGER,
    "monto_cuota" DECIMAL(65,30),
    "estado_pago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facturas_seguro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_factura_seguro" (
    "id" TEXT NOT NULL,
    "factura_seguro_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "subtipo" TEXT,
    "descripcion" TEXT NOT NULL,
    "alicuota" DOUBLE PRECISION,
    "base_calculo" DECIMAL(65,30),
    "monto" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "items_factura_seguro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuotas_facturas_seguro" (
    "id" TEXT NOT NULL,
    "factura_seguro_id" TEXT NOT NULL,
    "tarjeta_id" TEXT NOT NULL,
    "nro_cuota" INTEGER NOT NULL,
    "total_cuotas" INTEGER NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "resumen_tarjeta_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuotas_facturas_seguro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_pagos" (
    "id" TEXT NOT NULL,
    "pago_proveedor_id" TEXT,
    "tipo_evento" TEXT NOT NULL,
    "justificacion" TEXT NOT NULL,
    "estado_anterior" TEXT,
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_arca" (
    "id" TEXT NOT NULL DEFAULT 'unico',
    "cuit" TEXT NOT NULL DEFAULT '',
    "razon_social" TEXT NOT NULL DEFAULT '',
    "certificado_b64" TEXT,
    "certificado_pass" TEXT,
    "modo" TEXT NOT NULL DEFAULT 'homologacion',
    "puntos_venta" TEXT NOT NULL DEFAULT '{}',
    "comprobantes_habilitados" TEXT NOT NULL DEFAULT '[]',
    "cbu_mi_pymes" TEXT,
    "monto_minimo_fce" DECIMAL(15,2),
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "logo_comprobante_b64" TEXT,
    "logo_arca_b64" TEXT,
    "logo_comprobante_r2_key" TEXT,
    "logo_arca_r2_key" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "configuracion_arca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets_wsaa" (
    "id" TEXT NOT NULL DEFAULT 'wsfe',
    "token" TEXT NOT NULL,
    "sign" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "obtained_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_wsaa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recibos_cobranza" (
    "id" TEXT NOT NULL,
    "nro" INTEGER NOT NULL,
    "pto_venta" INTEGER NOT NULL DEFAULT 1,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresa_id" TEXT NOT NULL,
    "total_cobrado" DECIMAL(65,30) NOT NULL,
    "total_retenciones" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_comprobantes" DECIMAL(65,30) NOT NULL,
    "retencion_ganancias" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "retencion_iibb" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "retencion_suss" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_faltantes" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "saldo_a_cuenta" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pdf_s3_key" TEXT,
    "operador_email" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recibos_cobranza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_en_recibo" (
    "id" TEXT NOT NULL,
    "recibo_id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "monto_aplicado" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "facturas_en_recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faltantes_viaje" (
    "id" TEXT NOT NULL,
    "recibo_cobranza_id" TEXT NOT NULL,
    "viaje_id" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "descripcion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faltantes_viaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medios_pago_recibo" (
    "id" TEXT NOT NULL,
    "recibo_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "cuenta_id" TEXT,
    "fecha_transferencia" TIMESTAMP(3),
    "referencia" TEXT,
    "nro_cheque" TEXT,
    "banco_emisor" TEXT,
    "fecha_emision" TIMESTAMP(3),
    "fecha_pago" TIMESTAMP(3),

    CONSTRAINT "medios_pago_recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feriados_argentinos" (
    "fecha" DATE NOT NULL,
    "year" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,

    CONSTRAINT "feriados_argentinos_pkey" PRIMARY KEY ("fecha")
);

-- CreateTable
CREATE TABLE "configuracion_envio" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "reply_to" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_envio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "viajes_en_factura_viaje_id_factura_id_key" ON "viajes_en_factura"("viaje_id", "factura_id");

-- CreateIndex
CREATE UNIQUE INDEX "bancos_nombre_key" ON "bancos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "billeteras_virtuales_nombre_key" ON "billeteras_virtuales"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_nombre_key" ON "cuentas"("nombre");

-- CreateIndex
CREATE INDEX "movimientos_cuenta_cuenta_id_fecha_idx" ON "movimientos_cuenta"("cuenta_id", "fecha");

-- CreateIndex
CREATE INDEX "movimientos_cuenta_movimiento_grupo_id_idx" ON "movimientos_cuenta"("movimiento_grupo_id");

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_cuenta_cuenta_id_fecha_orden_key" ON "movimientos_cuenta"("cuenta_id", "fecha", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "conciliaciones_dia_cuenta_id_fecha_key" ON "conciliaciones_dia"("cuenta_id", "fecha");

-- CreateIndex
CREATE INDEX "cierres_mes_cuenta_mes_anio_idx" ON "cierres_mes_cuenta"("mes", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "cierres_mes_cuenta_cuenta_id_mes_anio_key" ON "cierres_mes_cuenta"("cuenta_id", "mes", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "fci_nombre_key" ON "fci"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "conciliacion_dia_tarjeta_resumen_tarjeta_id_fecha_key" ON "conciliacion_dia_tarjeta"("resumen_tarjeta_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "brokers_nombre_key" ON "brokers"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "brokers_cuit_key" ON "brokers"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_cuit_key" ON "proveedores"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "libros_iva_mes_anio_key" ON "libros_iva"("mes_anio");

-- CreateIndex
CREATE UNIQUE INDEX "libros_iibb_mes_anio_key" ON "libros_iibb"("mes_anio");

-- CreateIndex
CREATE UNIQUE INDEX "libros_percepciones_mes_anio_key" ON "libros_percepciones"("mes_anio");

-- CreateIndex
CREATE UNIQUE INDEX "viajes_en_nota_cd_nota_id_viaje_id_key" ON "viajes_en_nota_cd"("nota_id", "viaje_id");

-- CreateIndex
CREATE INDEX "items_factura_seguro_factura_seguro_id_idx" ON "items_factura_seguro"("factura_seguro_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_en_recibo_recibo_id_factura_id_key" ON "facturas_en_recibo"("recibo_id", "factura_id");

-- CreateIndex
CREATE INDEX "feriados_argentinos_year_idx" ON "feriados_argentinos"("year");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_cuit_key" ON "empleados"("cuit");

-- AddForeignKey
ALTER TABLE "contactos_email" ADD CONSTRAINT "contactos_email_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactos_email" ADD CONSTRAINT "contactos_email_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas_seguro" ADD CONSTRAINT "polizas_seguro_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas_seguro" ADD CONSTRAINT "polizas_seguro_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas_seguro" ADD CONSTRAINT "polizas_seguro_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camion_chofer" ADD CONSTRAINT "camion_chofer_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camion_chofer" ADD CONSTRAINT "camion_chofer_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_impuesto" ADD CONSTRAINT "pagos_impuesto_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_impuesto" ADD CONSTRAINT "pagos_impuesto_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infracciones" ADD CONSTRAINT "infracciones_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infracciones" ADD CONSTRAINT "infracciones_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes_en_factura" ADD CONSTRAINT "viajes_en_factura_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes_en_factura" ADD CONSTRAINT "viajes_en_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_emitidas" ADD CONSTRAINT "facturas_emitidas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_banco_id_fkey" FOREIGN KEY ("banco_id") REFERENCES "bancos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_billetera_id_fkey" FOREIGN KEY ("billetera_id") REFERENCES "billeteras_virtuales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_cuenta_destino_id_fkey" FOREIGN KEY ("cuenta_destino_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_cheque_emitido_id_fkey" FOREIGN KEY ("cheque_emitido_id") REFERENCES "cheques_emitidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_pago_proveedor_id_fkey" FOREIGN KEY ("pago_proveedor_id") REFERENCES "pagos_proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_pago_de_empresa_id_fkey" FOREIGN KEY ("pago_de_empresa_id") REFERENCES "pagos_de_empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_pago_impuesto_id_fkey" FOREIGN KEY ("pago_impuesto_id") REFERENCES "pagos_impuesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_movimiento_fci_id_fkey" FOREIGN KEY ("movimiento_fci_id") REFERENCES "movimientos_fci"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_infraccion_id_fkey" FOREIGN KEY ("infraccion_id") REFERENCES "infracciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones_dia" ADD CONSTRAINT "conciliaciones_dia_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_mes_cuenta" ADD CONSTRAINT "cierres_mes_cuenta_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fci" ADD CONSTRAINT "fci_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_fci" ADD CONSTRAINT "movimientos_fci_fci_id_fkey" FOREIGN KEY ("fci_id") REFERENCES "fci"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_fci" ADD CONSTRAINT "movimientos_fci_cuenta_origen_destino_id_fkey" FOREIGN KEY ("cuenta_origen_destino_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saldos_fci" ADD CONSTRAINT "saldos_fci_fci_id_fkey" FOREIGN KEY ("fci_id") REFERENCES "fci"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_proveedor_origen_id_fkey" FOREIGN KEY ("proveedor_origen_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_broker_origen_id_fkey" FOREIGN KEY ("broker_origen_id") REFERENCES "brokers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_recibo_cobranza_id_fkey" FOREIGN KEY ("recibo_cobranza_id") REFERENCES "recibos_cobranza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_cuenta_deposito_id_fkey" FOREIGN KEY ("cuenta_deposito_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_endosado_a_proveedor_id_fkey" FOREIGN KEY ("endosado_a_proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_endosado_a_broker_id_fkey" FOREIGN KEY ("endosado_a_broker_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_emitidos" ADD CONSTRAINT "cheques_emitidos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_emitidos" ADD CONSTRAINT "cheques_emitidos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarjetas_prepagas" ADD CONSTRAINT "tarjetas_prepagas_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarjetas_prepagas" ADD CONSTRAINT "tarjetas_prepagas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_tarjeta_prepaga" ADD CONSTRAINT "gastos_tarjeta_prepaga_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas_prepagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumenes_tarjeta" ADD CONSTRAINT "resumenes_tarjeta_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliacion_dia_tarjeta" ADD CONSTRAINT "conciliacion_dia_tarjeta_resumen_tarjeta_id_fkey" FOREIGN KEY ("resumen_tarjeta_id") REFERENCES "resumenes_tarjeta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_tarjeta" ADD CONSTRAINT "gastos_tarjeta_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_de_empresas" ADD CONSTRAINT "pagos_de_empresas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_de_empresas" ADD CONSTRAINT "pagos_de_empresas_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_de_empresas" ADD CONSTRAINT "pagos_de_empresas_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_de_empresas" ADD CONSTRAINT "pagos_de_empresas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_proveedor" ADD CONSTRAINT "facturas_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_factura_proveedor" ADD CONSTRAINT "items_factura_proveedor_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_cheque_emitido_id_fkey" FOREIGN KEY ("cheque_emitido_id") REFERENCES "cheques_emitidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_resumen_tarjeta_id_fkey" FOREIGN KEY ("resumen_tarjeta_id") REFERENCES "resumenes_tarjeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_iva" ADD CONSTRAINT "asientos_iva_factura_emitida_id_fkey" FOREIGN KEY ("factura_emitida_id") REFERENCES "facturas_emitidas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_iva" ADD CONSTRAINT "asientos_iva_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_iva" ADD CONSTRAINT "asientos_iva_nota_credito_debito_id_fkey" FOREIGN KEY ("nota_credito_debito_id") REFERENCES "notas_credito_debito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_iva" ADD CONSTRAINT "asientos_iva_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_iibb" ADD CONSTRAINT "asientos_iibb_viaje_en_fact_id_fkey" FOREIGN KEY ("viaje_en_fact_id") REFERENCES "viajes_en_factura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "percepciones_impuestos" ADD CONSTRAINT "percepciones_impuestos_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "percepciones_impuestos" ADD CONSTRAINT "percepciones_impuestos_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_credito_debito" ADD CONSTRAINT "notas_credito_debito_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_credito_debito" ADD CONSTRAINT "notas_credito_debito_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_credito_debito" ADD CONSTRAINT "notas_credito_debito_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_aplicadas_en_recibo" ADD CONSTRAINT "notas_aplicadas_en_recibo_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "notas_credito_debito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_aplicadas_en_recibo" ADD CONSTRAINT "notas_aplicadas_en_recibo_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos_cobranza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes_en_nota_cd" ADD CONSTRAINT "viajes_en_nota_cd_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "notas_credito_debito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes_en_nota_cd" ADD CONSTRAINT "viajes_en_nota_cd_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_cd_items" ADD CONSTRAINT "notas_cd_items_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "notas_credito_debito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_seguro" ADD CONSTRAINT "facturas_seguro_aseguradora_id_fkey" FOREIGN KEY ("aseguradora_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_seguro" ADD CONSTRAINT "facturas_seguro_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_seguro" ADD CONSTRAINT "facturas_seguro_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_factura_seguro" ADD CONSTRAINT "items_factura_seguro_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas_facturas_seguro" ADD CONSTRAINT "cuotas_facturas_seguro_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas_facturas_seguro" ADD CONSTRAINT "cuotas_facturas_seguro_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas_facturas_seguro" ADD CONSTRAINT "cuotas_facturas_seguro_resumen_tarjeta_id_fkey" FOREIGN KEY ("resumen_tarjeta_id") REFERENCES "resumenes_tarjeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_pagos" ADD CONSTRAINT "historial_pagos_pago_proveedor_id_fkey" FOREIGN KEY ("pago_proveedor_id") REFERENCES "pagos_proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos_cobranza" ADD CONSTRAINT "recibos_cobranza_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_en_recibo" ADD CONSTRAINT "facturas_en_recibo_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos_cobranza"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_en_recibo" ADD CONSTRAINT "facturas_en_recibo_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faltantes_viaje" ADD CONSTRAINT "faltantes_viaje_recibo_cobranza_id_fkey" FOREIGN KEY ("recibo_cobranza_id") REFERENCES "recibos_cobranza"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faltantes_viaje" ADD CONSTRAINT "faltantes_viaje_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medios_pago_recibo" ADD CONSTRAINT "medios_pago_recibo_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos_cobranza"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
