-- CreateTable
CREATE TABLE "permisos_usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permisos_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagos_impuesto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo_impuesto" TEXT NOT NULL,
    "descripcion" TEXT,
    "periodo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha_pago" DATETIME NOT NULL,
    "medio_pago" TEXT NOT NULL,
    "cuenta_id" TEXT,
    "tarjeta_id" TEXT,
    "comprobante_pdf_s3_key" TEXT,
    "observaciones" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagos_impuesto_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_impuesto_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_impuesto_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "infracciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "camion_id" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "organismo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha_pago" DATETIME,
    "medio_pago" TEXT,
    "cuenta_id" TEXT,
    "comprobante_pdf_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "infracciones_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "infracciones_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "infracciones_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "libros_iva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mes_anio" TEXT NOT NULL,
    "pdf_s3_key" TEXT,
    "generado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador_id" TEXT NOT NULL,
    CONSTRAINT "libros_iva_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "facturas_seguro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aseguradora_id" TEXT NOT NULL,
    "nro_comprobante" TEXT NOT NULL,
    "tipo_comprobante" TEXT NOT NULL DEFAULT 'A',
    "fecha" DATETIME NOT NULL,
    "periodo_desde" DATETIME NOT NULL,
    "periodo_hasta" DATETIME NOT NULL,
    "neto" REAL NOT NULL,
    "iva" REAL NOT NULL,
    "total" REAL NOT NULL,
    "forma_pago" TEXT NOT NULL,
    "medio_pago_contado" TEXT,
    "cuenta_id" TEXT,
    "tarjeta_id" TEXT,
    "cant_cuotas" INTEGER,
    "monto_cuota" REAL,
    "estado_pago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "facturas_seguro_aseguradora_id_fkey" FOREIGN KEY ("aseguradora_id") REFERENCES "proveedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_seguro_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "facturas_seguro_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "facturas_seguro_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cuotas_facturas_seguro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_seguro_id" TEXT NOT NULL,
    "tarjeta_id" TEXT NOT NULL,
    "nro_cuota" INTEGER NOT NULL,
    "total_cuotas" INTEGER NOT NULL,
    "monto" REAL NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "resumen_tarjeta_id" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cuotas_facturas_seguro_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cuotas_facturas_seguro_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cuotas_facturas_seguro_resumen_tarjeta_id_fkey" FOREIGN KEY ("resumen_tarjeta_id") REFERENCES "resumenes_tarjeta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cierres_resumen_tarjeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarjeta_id" TEXT NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "total_pagado" REAL NOT NULL,
    "cuenta_pago_id" TEXT NOT NULL,
    "fecha_pago" DATETIME NOT NULL,
    "pdf_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cierres_resumen_tarjeta_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cierres_resumen_tarjeta_cuenta_pago_id_fkey" FOREIGN KEY ("cuenta_pago_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cierres_resumen_tarjeta_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagos_factura_tarjeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cierre_resumen_id" TEXT NOT NULL,
    "factura_proveedor_id" TEXT,
    "factura_seguro_id" TEXT,
    "monto_pagado" REAL NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagos_factura_tarjeta_cierre_resumen_id_fkey" FOREIGN KEY ("cierre_resumen_id") REFERENCES "cierres_resumen_tarjeta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_factura_tarjeta_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_factura_tarjeta_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recibos_cobranza" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nro" INTEGER NOT NULL,
    "pto_venta" INTEGER NOT NULL DEFAULT 1,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresa_id" TEXT NOT NULL,
    "total_cobrado" REAL NOT NULL,
    "total_retenciones" REAL NOT NULL DEFAULT 0,
    "total_comprobantes" REAL NOT NULL,
    "retencion_ganancias" REAL NOT NULL DEFAULT 0,
    "retencion_iibb" REAL NOT NULL DEFAULT 0,
    "retencion_suss" REAL NOT NULL DEFAULT 0,
    "pdf_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recibos_cobranza_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "recibos_cobranza_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medios_pago_recibo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recibo_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "cuenta_id" TEXT,
    "fecha_transferencia" DATETIME,
    "referencia" TEXT,
    "nro_cheque" TEXT,
    "banco_emisor" TEXT,
    "fecha_emision" DATETIME,
    "fecha_pago" DATETIME,
    CONSTRAINT "medios_pago_recibo_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos_cobranza" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_asientos_iva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_emitida_id" TEXT,
    "factura_proveedor_id" TEXT,
    "liquidacion_id" TEXT,
    "tipo_referencia" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "base_imponible" REAL NOT NULL,
    "alicuota" REAL NOT NULL,
    "monto_iva" REAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "factura_seguro_id" TEXT,
    CONSTRAINT "asientos_iva_factura_emitida_id_fkey" FOREIGN KEY ("factura_emitida_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iva_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iva_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iva_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_asientos_iva" ("alicuota", "base_imponible", "factura_emitida_id", "factura_proveedor_id", "id", "liquidacion_id", "monto_iva", "periodo", "tipo", "tipo_referencia") SELECT "alicuota", "base_imponible", "factura_emitida_id", "factura_proveedor_id", "id", "liquidacion_id", "monto_iva", "periodo", "tipo", "tipo_referencia" FROM "asientos_iva";
DROP TABLE "asientos_iva";
ALTER TABLE "new_asientos_iva" RENAME TO "asientos_iva";
CREATE UNIQUE INDEX "asientos_iva_liquidacion_id_key" ON "asientos_iva"("liquidacion_id");
CREATE UNIQUE INDEX "asientos_iva_factura_seguro_id_key" ON "asientos_iva"("factura_seguro_id");
CREATE TABLE "new_cheques_recibidos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT,
    "broker_origen_id" TEXT,
    "factura_id" TEXT,
    "nro_cheque" TEXT NOT NULL,
    "banco_emisor" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha_emision" DATETIME NOT NULL,
    "fecha_cobro" DATETIME NOT NULL,
    "estado" TEXT NOT NULL,
    "cuenta_deposito_id" TEXT,
    "endosado_a_tipo" TEXT,
    "endosado_a_fletero_id" TEXT,
    "endosado_a_proveedor_id" TEXT,
    "endosado_a_broker_id" TEXT,
    "fecha_acreditacion" DATETIME,
    "cuit_librador" TEXT,
    "tasa_descuento" REAL,
    "fecha_deposito_broker" DATETIME,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "es_electronico" BOOLEAN NOT NULL DEFAULT false,
    "recibo_cobranza_id" TEXT,
    CONSTRAINT "cheques_recibidos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_broker_origen_id_fkey" FOREIGN KEY ("broker_origen_id") REFERENCES "brokers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_recibo_cobranza_id_fkey" FOREIGN KEY ("recibo_cobranza_id") REFERENCES "recibos_cobranza" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_cuenta_deposito_id_fkey" FOREIGN KEY ("cuenta_deposito_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_fletero_id_fkey" FOREIGN KEY ("endosado_a_fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_proveedor_id_fkey" FOREIGN KEY ("endosado_a_proveedor_id") REFERENCES "proveedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_broker_id_fkey" FOREIGN KEY ("endosado_a_broker_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cheques_recibidos" ("banco_emisor", "creado_en", "cuenta_deposito_id", "cuit_librador", "empresa_id", "endosado_a_broker_id", "endosado_a_fletero_id", "endosado_a_proveedor_id", "endosado_a_tipo", "es_electronico", "estado", "factura_id", "fecha_acreditacion", "fecha_cobro", "fecha_deposito_broker", "fecha_emision", "id", "monto", "nro_cheque", "operador_id", "tasa_descuento") SELECT "banco_emisor", "creado_en", "cuenta_deposito_id", "cuit_librador", "empresa_id", "endosado_a_broker_id", "endosado_a_fletero_id", "endosado_a_proveedor_id", "endosado_a_tipo", "es_electronico", "estado", "factura_id", "fecha_acreditacion", "fecha_cobro", "fecha_deposito_broker", "fecha_emision", "id", "monto", "nro_cheque", "operador_id", "tasa_descuento" FROM "cheques_recibidos";
DROP TABLE "cheques_recibidos";
ALTER TABLE "new_cheques_recibidos" RENAME TO "cheques_recibidos";
CREATE TABLE "new_configuracion_arca" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'unico',
    "cuit" TEXT NOT NULL DEFAULT '30709381683',
    "razon_social" TEXT NOT NULL DEFAULT '',
    "certificado_b64" TEXT,
    "certificado_pass" TEXT,
    "modo" TEXT NOT NULL DEFAULT 'homologacion',
    "puntos_venta" TEXT NOT NULL DEFAULT '{}',
    "cbu_mi_pymes" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "actualizado_en" DATETIME NOT NULL,
    "actualizado_por" TEXT
);
INSERT INTO "new_configuracion_arca" ("activa", "actualizado_en", "actualizado_por", "cbu_mi_pymes", "certificado_b64", "certificado_pass", "cuit", "id", "modo", "puntos_venta", "razon_social") SELECT "activa", "actualizado_en", "actualizado_por", "cbu_mi_pymes", "certificado_b64", "certificado_pass", "cuit", "id", "modo", "puntos_venta", "razon_social" FROM "configuracion_arca";
DROP TABLE "configuracion_arca";
ALTER TABLE "new_configuracion_arca" RENAME TO "configuracion_arca";
CREATE TABLE "new_cuentas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "banco_o_entidad" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "saldo_inicial" REAL NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" DATETIME,
    "tiene_impuesto_debcred" BOOLEAN NOT NULL DEFAULT false,
    "alicuota_impuesto" REAL NOT NULL DEFAULT 0.006,
    "tiene_chequera" BOOLEAN NOT NULL DEFAULT false,
    "tiene_planilla_emision_masiva" BOOLEAN NOT NULL DEFAULT false,
    "formato_planilla" TEXT,
    "tiene_cuenta_remunerada" BOOLEAN NOT NULL DEFAULT false,
    "tiene_tarjetas_prepagas_choferes" BOOLEAN NOT NULL DEFAULT false,
    "formato_reconciliacion" TEXT,
    "es_cuenta_comitente_broker" BOOLEAN NOT NULL DEFAULT false,
    "cuenta_padre_id" TEXT,
    "nro_cuenta" TEXT,
    "cbu" TEXT,
    "alias" TEXT,
    CONSTRAINT "cuentas_cuenta_padre_id_fkey" FOREIGN KEY ("cuenta_padre_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cuentas" ("activa", "alicuota_impuesto", "banco_o_entidad", "cerrada_en", "creado_en", "es_cuenta_comitente_broker", "formato_planilla", "formato_reconciliacion", "id", "moneda", "nombre", "saldo_inicial", "tiene_chequera", "tiene_cuenta_remunerada", "tiene_impuesto_debcred", "tiene_planilla_emision_masiva", "tiene_tarjetas_prepagas_choferes", "tipo") SELECT "activa", "alicuota_impuesto", "banco_o_entidad", "cerrada_en", "creado_en", "es_cuenta_comitente_broker", "formato_planilla", "formato_reconciliacion", "id", "moneda", "nombre", "saldo_inicial", "tiene_chequera", "tiene_cuenta_remunerada", "tiene_impuesto_debcred", "tiene_planilla_emision_masiva", "tiene_tarjetas_prepagas_choferes", "tipo" FROM "cuentas";
DROP TABLE "cuentas";
ALTER TABLE "new_cuentas" RENAME TO "cuentas";
CREATE UNIQUE INDEX "cuentas_nombre_key" ON "cuentas"("nombre");
CREATE TABLE "new_facturas_emitidas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "nro_comprobante" TEXT,
    "tipo_cbte" INTEGER NOT NULL DEFAULT 1,
    "modalidad_mi_pymes" TEXT,
    "iva_pct" REAL NOT NULL DEFAULT 21,
    "neto" REAL NOT NULL,
    "iva_monto" REAL NOT NULL,
    "total" REAL NOT NULL,
    "estado_arca" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "pdf_s3_key" TEXT,
    "emitida_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recibo_id" TEXT,
    "estado_cobro" TEXT NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT "facturas_emitidas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_emitidas_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_emitidas_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos_cobranza" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_facturas_emitidas" ("emitida_en", "empresa_id", "estado", "estado_arca", "id", "iva_monto", "iva_pct", "modalidad_mi_pymes", "neto", "nro_comprobante", "operador_id", "pdf_s3_key", "tipo_cbte", "total") SELECT "emitida_en", "empresa_id", "estado", "estado_arca", "id", "iva_monto", "iva_pct", "modalidad_mi_pymes", "neto", "nro_comprobante", "operador_id", "pdf_s3_key", "tipo_cbte", "total" FROM "facturas_emitidas";
DROP TABLE "facturas_emitidas";
ALTER TABLE "new_facturas_emitidas" RENAME TO "facturas_emitidas";
CREATE TABLE "new_fci" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "dias_habiles_alerta" INTEGER NOT NULL DEFAULT 1,
    "saldo_actual" REAL NOT NULL DEFAULT 0,
    "saldo_actualizado_en" DATETIME,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fci_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_fci" ("activo", "creado_en", "cuenta_id", "dias_habiles_alerta", "id", "moneda", "nombre") SELECT "activo", "creado_en", "cuenta_id", "dias_habiles_alerta", "id", "moneda", "nombre" FROM "fci";
DROP TABLE "fci";
ALTER TABLE "new_fci" RENAME TO "fci";
CREATE UNIQUE INDEX "fci_nombre_key" ON "fci"("nombre");
CREATE TABLE "new_polizas_seguro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "camion_id" TEXT,
    "aseguradora" TEXT NOT NULL,
    "nro_poliza" TEXT NOT NULL,
    "cobertura" TEXT,
    "monto_mensual" REAL,
    "vigencia_desde" DATETIME NOT NULL,
    "vigencia_hasta" DATETIME NOT NULL,
    "archivos" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_bien" TEXT NOT NULL DEFAULT 'CAMION',
    "proveedor_id" TEXT,
    "descripcion_bien" TEXT,
    "pdf_s3_key" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "factura_seguro_id" TEXT,
    CONSTRAINT "polizas_seguro_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "polizas_seguro_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "polizas_seguro_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_polizas_seguro" ("archivos", "aseguradora", "camion_id", "cobertura", "creado_en", "id", "monto_mensual", "nro_poliza", "vigencia_desde", "vigencia_hasta") SELECT "archivos", "aseguradora", "camion_id", "cobertura", "creado_en", "id", "monto_mensual", "nro_poliza", "vigencia_desde", "vigencia_hasta" FROM "polizas_seguro";
DROP TABLE "polizas_seguro";
ALTER TABLE "new_polizas_seguro" RENAME TO "polizas_seguro";
CREATE TABLE "new_proveedores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "condicion_iva" TEXT NOT NULL,
    "rubro" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'GENERAL',
    "activo" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_proveedores" ("activo", "condicion_iva", "cuit", "id", "razon_social", "rubro") SELECT "activo", "condicion_iva", "cuit", "id", "razon_social", "rubro" FROM "proveedores";
DROP TABLE "proveedores";
ALTER TABLE "new_proveedores" RENAME TO "proveedores";
CREATE UNIQUE INDEX "proveedores_cuit_key" ON "proveedores"("cuit");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "permisos_usuario_usuario_id_seccion_key" ON "permisos_usuario"("usuario_id", "seccion");

-- CreateIndex
CREATE UNIQUE INDEX "libros_iva_mes_anio_key" ON "libros_iva"("mes_anio");
