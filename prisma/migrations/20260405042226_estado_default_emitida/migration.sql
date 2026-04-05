/*
  Warnings:

  - You are about to alter the column `monto_descontado` on the `adelanto_descuentos` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `adelantos_fleteros` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_descontado` on the `adelantos_fleteros` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_ingreso` on the `asientos_iibb` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `base_imponible` on the `asientos_iva` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_iva` on the `asientos_iva` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `cheques_emitidos` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `cheques_recibidos` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total_pagado` on the `cierres_resumen_tarjeta` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `saldo_inicial` on the `cuentas` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `cuotas_facturas_seguro` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `iva_monto` on the `facturas_emitidas` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `neto` on the `facturas_emitidas` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total` on the `facturas_emitidas` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `iva_monto` on the `facturas_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `neto` on the `facturas_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `percepcion_ganancias` on the `facturas_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `percepcion_iibb` on the `facturas_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `percepcion_iva` on the `facturas_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total` on the `facturas_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `iva` on the `facturas_seguro` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_cuota` on the `facturas_seguro` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `neto` on the `facturas_seguro` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total` on the `facturas_seguro` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `saldo_actual` on the `fci` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_descontado` on the `gasto_descuentos` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_descontado` on the `gastos_fleteros` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_pagado` on the `gastos_fleteros` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `gastos_tarjeta` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `gastos_tarjeta_prepaga` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `infracciones` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_iva` on the `items_factura_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `precio_unitario` on the `items_factura_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `subtotal_neto` on the `items_factura_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `subtotal_total` on the `items_factura_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `comision_monto` on the `liquidaciones` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `iva_monto` on the `liquidaciones` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `neto` on the `liquidaciones` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `subtotal_bruto` on the `liquidaciones` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total` on the `liquidaciones` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `medios_pago_recibo` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `movimientos_fci` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `movimientos_sin_factura` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_iva` on the `notas_credito_debito` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_neto` on the `notas_credito_debito` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_total` on the `notas_credito_debito` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `pagos_a_fleteros` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `pagos_de_empresas` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_pagado` on the `pagos_factura_tarjeta` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `pagos_impuesto` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `pagos_proveedor` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto` on the `percepciones_impuestos` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total_monto` on the `planillas_galicia` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monto_mensual` on the `polizas_seguro` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `retencion_ganancias` on the `recibos_cobranza` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `retencion_iibb` on the `recibos_cobranza` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `retencion_suss` on the `recibos_cobranza` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total_cobrado` on the `recibos_cobranza` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total_comprobantes` on the `recibos_cobranza` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total_retenciones` on the `recibos_cobranza` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total_ars` on the `resumenes_tarjeta` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total_usd` on the `resumenes_tarjeta` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `rendimiento_periodo` on the `saldos_fci` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `saldo_informado` on the `saldos_fci` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `limite_mensual` on the `tarjetas` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `limite_mensual` on the `tarjetas_prepagas` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `tarifa_empresa` on the `viajes` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `tarifa_fletero` on the `viajes` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `subtotal` on the `viajes_en_factura` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `tarifa_empresa` on the `viajes_en_factura` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `subtotal` on the `viajes_en_liquidacion` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `tarifa_fletero` on the `viajes_en_liquidacion` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `subtotal_corregido` on the `viajes_en_nota_cd` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `subtotal_original` on the `viajes_en_nota_cd` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `tarifa_original` on the `viajes_en_nota_cd` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_adelanto_descuentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adelanto_id" TEXT NOT NULL,
    "liquidacion_id" TEXT NOT NULL,
    "monto_descontado" DECIMAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    CONSTRAINT "adelanto_descuentos_adelanto_id_fkey" FOREIGN KEY ("adelanto_id") REFERENCES "adelantos_fleteros" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "adelanto_descuentos_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_adelanto_descuentos" ("adelanto_id", "fecha", "id", "liquidacion_id", "monto_descontado") SELECT "adelanto_id", "fecha", "id", "liquidacion_id", "monto_descontado" FROM "adelanto_descuentos";
DROP TABLE "adelanto_descuentos";
ALTER TABLE "new_adelanto_descuentos" RENAME TO "adelanto_descuentos";
CREATE TABLE "new_adelantos_fleteros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT,
    "cheque_emitido_id" TEXT,
    "cheque_recibido_id" TEXT,
    "monto_descontado" DECIMAL NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_DESCUENTO',
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "adelantos_fleteros_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "adelantos_fleteros_cheque_emitido_id_fkey" FOREIGN KEY ("cheque_emitido_id") REFERENCES "cheques_emitidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "adelantos_fleteros_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "adelantos_fleteros_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_adelantos_fleteros" ("cheque_emitido_id", "cheque_recibido_id", "creado_en", "descripcion", "estado", "fecha", "fletero_id", "id", "monto", "monto_descontado", "operador_id", "tipo") SELECT "cheque_emitido_id", "cheque_recibido_id", "creado_en", "descripcion", "estado", "fecha", "fletero_id", "id", "monto", "monto_descontado", "operador_id", "tipo" FROM "adelantos_fleteros";
DROP TABLE "adelantos_fleteros";
ALTER TABLE "new_adelantos_fleteros" RENAME TO "adelantos_fleteros";
CREATE TABLE "new_asientos_iibb" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viaje_en_liq_id" TEXT,
    "viaje_en_fact_id" TEXT,
    "tabla_origen" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "monto_ingreso" DECIMAL NOT NULL,
    "periodo" TEXT NOT NULL,
    CONSTRAINT "asientos_iibb_viaje_en_liq_id_fkey" FOREIGN KEY ("viaje_en_liq_id") REFERENCES "viajes_en_liquidacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iibb_viaje_en_fact_id_fkey" FOREIGN KEY ("viaje_en_fact_id") REFERENCES "viajes_en_factura" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_asientos_iibb" ("id", "monto_ingreso", "periodo", "provincia", "tabla_origen", "viaje_en_fact_id", "viaje_en_liq_id") SELECT "id", "monto_ingreso", "periodo", "provincia", "tabla_origen", "viaje_en_fact_id", "viaje_en_liq_id" FROM "asientos_iibb";
DROP TABLE "asientos_iibb";
ALTER TABLE "new_asientos_iibb" RENAME TO "asientos_iibb";
CREATE TABLE "new_asientos_iva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_emitida_id" TEXT,
    "factura_proveedor_id" TEXT,
    "liquidacion_id" TEXT,
    "tipo_referencia" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "base_imponible" DECIMAL NOT NULL,
    "alicuota" REAL NOT NULL,
    "monto_iva" DECIMAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "factura_seguro_id" TEXT,
    CONSTRAINT "asientos_iva_factura_emitida_id_fkey" FOREIGN KEY ("factura_emitida_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iva_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iva_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iva_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_asientos_iva" ("alicuota", "base_imponible", "factura_emitida_id", "factura_proveedor_id", "factura_seguro_id", "id", "liquidacion_id", "monto_iva", "periodo", "tipo", "tipo_referencia") SELECT "alicuota", "base_imponible", "factura_emitida_id", "factura_proveedor_id", "factura_seguro_id", "id", "liquidacion_id", "monto_iva", "periodo", "tipo", "tipo_referencia" FROM "asientos_iva";
DROP TABLE "asientos_iva";
ALTER TABLE "new_asientos_iva" RENAME TO "asientos_iva";
CREATE UNIQUE INDEX "asientos_iva_liquidacion_id_key" ON "asientos_iva"("liquidacion_id");
CREATE UNIQUE INDEX "asientos_iva_factura_seguro_id_key" ON "asientos_iva"("factura_seguro_id");
CREATE TABLE "new_cheques_emitidos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT,
    "proveedor_id" TEXT,
    "cuenta_id" TEXT NOT NULL,
    "nro_cheque" TEXT,
    "tipo_doc_beneficiario" TEXT NOT NULL,
    "nro_doc_beneficiario" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "fecha_emision" DATETIME NOT NULL,
    "fecha_pago" DATETIME NOT NULL,
    "motivo_pago" TEXT NOT NULL,
    "descripcion_1" TEXT,
    "descripcion_2" TEXT,
    "mail_beneficiario" TEXT,
    "clausula" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_EMISION',
    "fecha_deposito" DATETIME,
    "liquidacion_id" TEXT,
    "planilla_galicia_id" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "es_electronico" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "cheques_emitidos_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_planilla_galicia_id_fkey" FOREIGN KEY ("planilla_galicia_id") REFERENCES "planillas_galicia" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cheques_emitidos" ("clausula", "creado_en", "cuenta_id", "descripcion_1", "descripcion_2", "es_electronico", "estado", "fecha_deposito", "fecha_emision", "fecha_pago", "fletero_id", "id", "liquidacion_id", "mail_beneficiario", "monto", "motivo_pago", "nro_cheque", "nro_doc_beneficiario", "operador_id", "planilla_galicia_id", "proveedor_id", "tipo_doc_beneficiario") SELECT "clausula", "creado_en", "cuenta_id", "descripcion_1", "descripcion_2", "es_electronico", "estado", "fecha_deposito", "fecha_emision", "fecha_pago", "fletero_id", "id", "liquidacion_id", "mail_beneficiario", "monto", "motivo_pago", "nro_cheque", "nro_doc_beneficiario", "operador_id", "planilla_galicia_id", "proveedor_id", "tipo_doc_beneficiario" FROM "cheques_emitidos";
DROP TABLE "cheques_emitidos";
ALTER TABLE "new_cheques_emitidos" RENAME TO "cheques_emitidos";
CREATE TABLE "new_cheques_recibidos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT,
    "broker_origen_id" TEXT,
    "factura_id" TEXT,
    "nro_cheque" TEXT NOT NULL,
    "banco_emisor" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
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
    "proveedor_origen_id" TEXT,
    CONSTRAINT "cheques_recibidos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_proveedor_origen_id_fkey" FOREIGN KEY ("proveedor_origen_id") REFERENCES "proveedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_broker_origen_id_fkey" FOREIGN KEY ("broker_origen_id") REFERENCES "brokers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_recibo_cobranza_id_fkey" FOREIGN KEY ("recibo_cobranza_id") REFERENCES "recibos_cobranza" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_cuenta_deposito_id_fkey" FOREIGN KEY ("cuenta_deposito_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_fletero_id_fkey" FOREIGN KEY ("endosado_a_fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_proveedor_id_fkey" FOREIGN KEY ("endosado_a_proveedor_id") REFERENCES "proveedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_broker_id_fkey" FOREIGN KEY ("endosado_a_broker_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cheques_recibidos" ("banco_emisor", "broker_origen_id", "creado_en", "cuenta_deposito_id", "cuit_librador", "empresa_id", "endosado_a_broker_id", "endosado_a_fletero_id", "endosado_a_proveedor_id", "endosado_a_tipo", "es_electronico", "estado", "factura_id", "fecha_acreditacion", "fecha_cobro", "fecha_deposito_broker", "fecha_emision", "id", "monto", "nro_cheque", "operador_id", "recibo_cobranza_id", "tasa_descuento") SELECT "banco_emisor", "broker_origen_id", "creado_en", "cuenta_deposito_id", "cuit_librador", "empresa_id", "endosado_a_broker_id", "endosado_a_fletero_id", "endosado_a_proveedor_id", "endosado_a_tipo", "es_electronico", "estado", "factura_id", "fecha_acreditacion", "fecha_cobro", "fecha_deposito_broker", "fecha_emision", "id", "monto", "nro_cheque", "operador_id", "recibo_cobranza_id", "tasa_descuento" FROM "cheques_recibidos";
DROP TABLE "cheques_recibidos";
ALTER TABLE "new_cheques_recibidos" RENAME TO "cheques_recibidos";
CREATE TABLE "new_cierres_resumen_tarjeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarjeta_id" TEXT NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "total_pagado" DECIMAL NOT NULL,
    "diferencia" DECIMAL NOT NULL DEFAULT 0,
    "descripcion_diferencia" TEXT,
    "cuenta_pago_id" TEXT NOT NULL,
    "fecha_pago" DATETIME NOT NULL,
    "pdf_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cierres_resumen_tarjeta_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cierres_resumen_tarjeta_cuenta_pago_id_fkey" FOREIGN KEY ("cuenta_pago_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cierres_resumen_tarjeta_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cierres_resumen_tarjeta" ("creado_en", "cuenta_pago_id", "fecha_pago", "id", "mes_anio", "operador_id", "pdf_s3_key", "tarjeta_id", "total_pagado") SELECT "creado_en", "cuenta_pago_id", "fecha_pago", "id", "mes_anio", "operador_id", "pdf_s3_key", "tarjeta_id", "total_pagado" FROM "cierres_resumen_tarjeta";
DROP TABLE "cierres_resumen_tarjeta";
ALTER TABLE "new_cierres_resumen_tarjeta" RENAME TO "cierres_resumen_tarjeta";
CREATE TABLE "new_cuentas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "banco_o_entidad" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "saldo_inicial" DECIMAL NOT NULL DEFAULT 0,
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
    "tiene_iibb_sircreb_tucuman" BOOLEAN NOT NULL DEFAULT false,
    "alicuota_iibb_sircreb_tucuman" REAL NOT NULL DEFAULT 0.06,
    "cuenta_padre_id" TEXT,
    "nro_cuenta" TEXT,
    "cbu" TEXT,
    "alias" TEXT,
    CONSTRAINT "cuentas_cuenta_padre_id_fkey" FOREIGN KEY ("cuenta_padre_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cuentas" ("activa", "alias", "alicuota_impuesto", "banco_o_entidad", "cbu", "cerrada_en", "creado_en", "cuenta_padre_id", "es_cuenta_comitente_broker", "formato_planilla", "formato_reconciliacion", "id", "moneda", "nombre", "nro_cuenta", "saldo_inicial", "tiene_chequera", "tiene_cuenta_remunerada", "tiene_impuesto_debcred", "tiene_planilla_emision_masiva", "tiene_tarjetas_prepagas_choferes", "tipo") SELECT "activa", "alias", "alicuota_impuesto", "banco_o_entidad", "cbu", "cerrada_en", "creado_en", "cuenta_padre_id", "es_cuenta_comitente_broker", "formato_planilla", "formato_reconciliacion", "id", "moneda", "nombre", "nro_cuenta", "saldo_inicial", "tiene_chequera", "tiene_cuenta_remunerada", "tiene_impuesto_debcred", "tiene_planilla_emision_masiva", "tiene_tarjetas_prepagas_choferes", "tipo" FROM "cuentas";
DROP TABLE "cuentas";
ALTER TABLE "new_cuentas" RENAME TO "cuentas";
CREATE UNIQUE INDEX "cuentas_nombre_key" ON "cuentas"("nombre");
CREATE TABLE "new_cuotas_facturas_seguro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_seguro_id" TEXT NOT NULL,
    "tarjeta_id" TEXT NOT NULL,
    "nro_cuota" INTEGER NOT NULL,
    "total_cuotas" INTEGER NOT NULL,
    "monto" DECIMAL NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "resumen_tarjeta_id" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cuotas_facturas_seguro_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cuotas_facturas_seguro_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cuotas_facturas_seguro_resumen_tarjeta_id_fkey" FOREIGN KEY ("resumen_tarjeta_id") REFERENCES "resumenes_tarjeta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cuotas_facturas_seguro" ("creado_en", "estado", "factura_seguro_id", "id", "mes_anio", "monto", "nro_cuota", "resumen_tarjeta_id", "tarjeta_id", "total_cuotas") SELECT "creado_en", "estado", "factura_seguro_id", "id", "mes_anio", "monto", "nro_cuota", "resumen_tarjeta_id", "tarjeta_id", "total_cuotas" FROM "cuotas_facturas_seguro";
DROP TABLE "cuotas_facturas_seguro";
ALTER TABLE "new_cuotas_facturas_seguro" RENAME TO "cuotas_facturas_seguro";
CREATE TABLE "new_facturas_emitidas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "nro_comprobante" TEXT,
    "tipo_cbte" INTEGER NOT NULL DEFAULT 1,
    "modalidad_mi_pymes" TEXT,
    "iva_pct" REAL NOT NULL DEFAULT 21,
    "neto" DECIMAL NOT NULL,
    "iva_monto" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "pto_venta" INTEGER DEFAULT 1,
    "cae" TEXT,
    "cae_vto" DATETIME,
    "qr_data" TEXT,
    "estado_arca" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "arca_observaciones" TEXT,
    "request_arca_json" TEXT,
    "response_arca_json" TEXT,
    "autorizada_en" DATETIME,
    "idempotency_key" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "pdf_s3_key" TEXT,
    "emitida_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recibo_id" TEXT,
    "estado_cobro" TEXT NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT "facturas_emitidas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_emitidas_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_emitidas_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos_cobranza" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_facturas_emitidas" ("arca_observaciones", "autorizada_en", "cae", "cae_vto", "emitida_en", "empresa_id", "estado", "estado_arca", "estado_cobro", "id", "idempotency_key", "iva_monto", "iva_pct", "modalidad_mi_pymes", "neto", "nro_comprobante", "operador_id", "pdf_s3_key", "pto_venta", "qr_data", "recibo_id", "request_arca_json", "response_arca_json", "tipo_cbte", "total") SELECT "arca_observaciones", "autorizada_en", "cae", "cae_vto", "emitida_en", "empresa_id", "estado", "estado_arca", "estado_cobro", "id", "idempotency_key", "iva_monto", "iva_pct", "modalidad_mi_pymes", "neto", "nro_comprobante", "operador_id", "pdf_s3_key", "pto_venta", "qr_data", "recibo_id", "request_arca_json", "response_arca_json", "tipo_cbte", "total" FROM "facturas_emitidas";
DROP TABLE "facturas_emitidas";
ALTER TABLE "new_facturas_emitidas" RENAME TO "facturas_emitidas";
CREATE TABLE "new_facturas_proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proveedor_id" TEXT NOT NULL,
    "nro_comprobante" TEXT NOT NULL,
    "pto_venta" TEXT,
    "tipo_cbte" TEXT NOT NULL,
    "neto" DECIMAL NOT NULL,
    "iva_monto" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "fecha_cbte" DATETIME NOT NULL,
    "concepto" TEXT,
    "pdf_s3_key" TEXT,
    "estado_pago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "percepcion_iibb" DECIMAL,
    "percepcion_iva" DECIMAL,
    "percepcion_ganancias" DECIMAL,
    "es_por_cuenta_de_fletero" BOOLEAN NOT NULL DEFAULT false,
    "fletero_id" TEXT,
    "tipo_gasto_fletero" TEXT,
    CONSTRAINT "facturas_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_proveedor_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_facturas_proveedor" ("concepto", "es_por_cuenta_de_fletero", "estado_pago", "fecha_cbte", "fletero_id", "id", "iva_monto", "neto", "nro_comprobante", "pdf_s3_key", "percepcion_ganancias", "percepcion_iibb", "percepcion_iva", "proveedor_id", "pto_venta", "tipo_cbte", "tipo_gasto_fletero", "total") SELECT "concepto", "es_por_cuenta_de_fletero", "estado_pago", "fecha_cbte", "fletero_id", "id", "iva_monto", "neto", "nro_comprobante", "pdf_s3_key", "percepcion_ganancias", "percepcion_iibb", "percepcion_iva", "proveedor_id", "pto_venta", "tipo_cbte", "tipo_gasto_fletero", "total" FROM "facturas_proveedor";
DROP TABLE "facturas_proveedor";
ALTER TABLE "new_facturas_proveedor" RENAME TO "facturas_proveedor";
CREATE TABLE "new_facturas_seguro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aseguradora_id" TEXT NOT NULL,
    "nro_comprobante" TEXT NOT NULL,
    "tipo_comprobante" TEXT NOT NULL DEFAULT 'A',
    "fecha" DATETIME NOT NULL,
    "periodo_desde" DATETIME NOT NULL,
    "periodo_hasta" DATETIME NOT NULL,
    "neto" DECIMAL NOT NULL,
    "iva" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "forma_pago" TEXT NOT NULL,
    "medio_pago_contado" TEXT,
    "cuenta_id" TEXT,
    "tarjeta_id" TEXT,
    "cant_cuotas" INTEGER,
    "monto_cuota" DECIMAL,
    "estado_pago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "facturas_seguro_aseguradora_id_fkey" FOREIGN KEY ("aseguradora_id") REFERENCES "proveedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_seguro_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "facturas_seguro_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "facturas_seguro_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_facturas_seguro" ("aseguradora_id", "cant_cuotas", "creado_en", "cuenta_id", "estado_pago", "fecha", "forma_pago", "id", "iva", "medio_pago_contado", "monto_cuota", "neto", "nro_comprobante", "operador_id", "periodo_desde", "periodo_hasta", "tarjeta_id", "tipo_comprobante", "total") SELECT "aseguradora_id", "cant_cuotas", "creado_en", "cuenta_id", "estado_pago", "fecha", "forma_pago", "id", "iva", "medio_pago_contado", "monto_cuota", "neto", "nro_comprobante", "operador_id", "periodo_desde", "periodo_hasta", "tarjeta_id", "tipo_comprobante", "total" FROM "facturas_seguro";
DROP TABLE "facturas_seguro";
ALTER TABLE "new_facturas_seguro" RENAME TO "facturas_seguro";
CREATE TABLE "new_fci" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "dias_habiles_alerta" INTEGER NOT NULL DEFAULT 1,
    "saldo_actual" DECIMAL NOT NULL DEFAULT 0,
    "saldo_actualizado_en" DATETIME,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fci_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_fci" ("activo", "creado_en", "cuenta_id", "dias_habiles_alerta", "id", "moneda", "nombre", "saldo_actual", "saldo_actualizado_en") SELECT "activo", "creado_en", "cuenta_id", "dias_habiles_alerta", "id", "moneda", "nombre", "saldo_actual", "saldo_actualizado_en" FROM "fci";
DROP TABLE "fci";
ALTER TABLE "new_fci" RENAME TO "fci";
CREATE UNIQUE INDEX "fci_nombre_key" ON "fci"("nombre");
CREATE TABLE "new_gasto_descuentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gasto_id" TEXT NOT NULL,
    "liquidacion_id" TEXT NOT NULL,
    "monto_descontado" DECIMAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    CONSTRAINT "gasto_descuentos_gasto_id_fkey" FOREIGN KEY ("gasto_id") REFERENCES "gastos_fleteros" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gasto_descuentos_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_gasto_descuentos" ("fecha", "gasto_id", "id", "liquidacion_id", "monto_descontado") SELECT "fecha", "gasto_id", "id", "liquidacion_id", "monto_descontado" FROM "gasto_descuentos";
DROP TABLE "gasto_descuentos";
ALTER TABLE "new_gasto_descuentos" RENAME TO "gasto_descuentos";
CREATE TABLE "new_gastos_fleteros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "factura_proveedor_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto_pagado" DECIMAL NOT NULL,
    "monto_descontado" DECIMAL NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gastos_fleteros_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "gastos_fleteros_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_gastos_fleteros" ("creado_en", "estado", "factura_proveedor_id", "fletero_id", "id", "monto_descontado", "monto_pagado", "tipo") SELECT "creado_en", "estado", "factura_proveedor_id", "fletero_id", "id", "monto_descontado", "monto_pagado", "tipo" FROM "gastos_fleteros";
DROP TABLE "gastos_fleteros";
ALTER TABLE "new_gastos_fleteros" RENAME TO "gastos_fleteros";
CREATE UNIQUE INDEX "gastos_fleteros_factura_proveedor_id_key" ON "gastos_fleteros"("factura_proveedor_id");
CREATE TABLE "new_gastos_tarjeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarjeta_id" TEXT NOT NULL,
    "tipo_gasto" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT,
    "comprobante_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gastos_tarjeta_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gastos_tarjeta_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_gastos_tarjeta" ("comprobante_s3_key", "creado_en", "descripcion", "fecha", "id", "monto", "operador_id", "tarjeta_id", "tipo_gasto") SELECT "comprobante_s3_key", "creado_en", "descripcion", "fecha", "id", "monto", "operador_id", "tarjeta_id", "tipo_gasto" FROM "gastos_tarjeta";
DROP TABLE "gastos_tarjeta";
ALTER TABLE "new_gastos_tarjeta" RENAME TO "gastos_tarjeta";
CREATE TABLE "new_gastos_tarjeta_prepaga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarjeta_id" TEXT NOT NULL,
    "tipo_gasto" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT,
    "comprobante_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gastos_tarjeta_prepaga_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas_prepagas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gastos_tarjeta_prepaga_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_gastos_tarjeta_prepaga" ("comprobante_s3_key", "creado_en", "descripcion", "fecha", "id", "monto", "operador_id", "tarjeta_id", "tipo_gasto") SELECT "comprobante_s3_key", "creado_en", "descripcion", "fecha", "id", "monto", "operador_id", "tarjeta_id", "tipo_gasto" FROM "gastos_tarjeta_prepaga";
DROP TABLE "gastos_tarjeta_prepaga";
ALTER TABLE "new_gastos_tarjeta_prepaga" RENAME TO "gastos_tarjeta_prepaga";
CREATE TABLE "new_infracciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "camion_id" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "organismo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
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
INSERT INTO "new_infracciones" ("camion_id", "comprobante_pdf_s3_key", "creado_en", "cuenta_id", "descripcion", "estado", "fecha", "fecha_pago", "id", "medio_pago", "monto", "operador_id", "organismo") SELECT "camion_id", "comprobante_pdf_s3_key", "creado_en", "cuenta_id", "descripcion", "estado", "fecha", "fecha_pago", "id", "medio_pago", "monto", "operador_id", "organismo" FROM "infracciones";
DROP TABLE "infracciones";
ALTER TABLE "new_infracciones" RENAME TO "infracciones";
CREATE TABLE "new_items_factura_proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_proveedor_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL NOT NULL,
    "alicuota_iva" REAL NOT NULL,
    "es_exento" BOOLEAN NOT NULL DEFAULT false,
    "subtotal_neto" DECIMAL NOT NULL,
    "monto_iva" DECIMAL NOT NULL,
    "subtotal_total" DECIMAL NOT NULL,
    CONSTRAINT "items_factura_proveedor_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_items_factura_proveedor" ("alicuota_iva", "cantidad", "descripcion", "es_exento", "factura_proveedor_id", "id", "monto_iva", "precio_unitario", "subtotal_neto", "subtotal_total") SELECT "alicuota_iva", "cantidad", "descripcion", "es_exento", "factura_proveedor_id", "id", "monto_iva", "precio_unitario", "subtotal_neto", "subtotal_total" FROM "items_factura_proveedor";
DROP TABLE "items_factura_proveedor";
ALTER TABLE "new_items_factura_proveedor" RENAME TO "items_factura_proveedor";
CREATE TABLE "new_liquidaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "comision_pct" REAL NOT NULL,
    "iva_pct" REAL NOT NULL DEFAULT 21,
    "subtotal_bruto" DECIMAL NOT NULL,
    "comision_monto" DECIMAL NOT NULL,
    "neto" DECIMAL NOT NULL,
    "iva_monto" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "nro_comprobante" INTEGER,
    "pto_venta" INTEGER DEFAULT 1,
    "tipo_cbte" INTEGER DEFAULT 186,
    "cae" TEXT,
    "cae_vto" DATETIME,
    "qr_data" TEXT,
    "arca_estado" TEXT DEFAULT 'PENDIENTE',
    "arca_observaciones" TEXT,
    "request_arca_json" TEXT,
    "response_arca_json" TEXT,
    "autorizada_en" DATETIME,
    "idempotency_key" TEXT,
    "pdf_s3_key" TEXT,
    "grabada_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factura_emitida_id" TEXT,
    CONSTRAINT "liquidaciones_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "liquidaciones_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "liquidaciones_factura_emitida_id_fkey" FOREIGN KEY ("factura_emitida_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_liquidaciones" ("arca_estado", "arca_observaciones", "autorizada_en", "cae", "cae_vto", "comision_monto", "comision_pct", "estado", "factura_emitida_id", "fletero_id", "grabada_en", "id", "idempotency_key", "iva_monto", "iva_pct", "neto", "nro_comprobante", "operador_id", "pdf_s3_key", "pto_venta", "qr_data", "request_arca_json", "response_arca_json", "subtotal_bruto", "tipo_cbte", "total") SELECT "arca_estado", "arca_observaciones", "autorizada_en", "cae", "cae_vto", "comision_monto", "comision_pct", "estado", "factura_emitida_id", "fletero_id", "grabada_en", "id", "idempotency_key", "iva_monto", "iva_pct", "neto", "nro_comprobante", "operador_id", "pdf_s3_key", "pto_venta", "qr_data", "request_arca_json", "response_arca_json", "subtotal_bruto", "tipo_cbte", "total" FROM "liquidaciones";
DROP TABLE "liquidaciones";
ALTER TABLE "new_liquidaciones" RENAME TO "liquidaciones";
CREATE UNIQUE INDEX "liquidaciones_factura_emitida_id_key" ON "liquidaciones"("factura_emitida_id");
CREATE TABLE "new_medios_pago_recibo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recibo_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "cuenta_id" TEXT,
    "fecha_transferencia" DATETIME,
    "referencia" TEXT,
    "nro_cheque" TEXT,
    "banco_emisor" TEXT,
    "fecha_emision" DATETIME,
    "fecha_pago" DATETIME,
    CONSTRAINT "medios_pago_recibo_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos_cobranza" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_medios_pago_recibo" ("banco_emisor", "cuenta_id", "fecha_emision", "fecha_pago", "fecha_transferencia", "id", "monto", "nro_cheque", "recibo_id", "referencia", "tipo") SELECT "banco_emisor", "cuenta_id", "fecha_emision", "fecha_pago", "fecha_transferencia", "id", "monto", "nro_cheque", "recibo_id", "referencia", "tipo" FROM "medios_pago_recibo";
DROP TABLE "medios_pago_recibo";
ALTER TABLE "new_medios_pago_recibo" RENAME TO "medios_pago_recibo";
CREATE TABLE "new_movimientos_fci" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fci_id" TEXT NOT NULL,
    "cuenta_origen_destino_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_fci_fci_id_fkey" FOREIGN KEY ("fci_id") REFERENCES "fci" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "movimientos_fci_cuenta_origen_destino_id_fkey" FOREIGN KEY ("cuenta_origen_destino_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimientos_fci_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_movimientos_fci" ("creado_en", "cuenta_origen_destino_id", "descripcion", "fci_id", "fecha", "id", "monto", "operador_id", "tipo") SELECT "creado_en", "cuenta_origen_destino_id", "descripcion", "fci_id", "fecha", "id", "monto", "operador_id", "tipo" FROM "movimientos_fci";
DROP TABLE "movimientos_fci";
ALTER TABLE "new_movimientos_fci" RENAME TO "movimientos_fci";
CREATE TABLE "new_movimientos_sin_factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cuenta_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT NOT NULL,
    "referencia" TEXT,
    "comprobante_s3_key" TEXT,
    "cuenta_destino_id" TEXT,
    "tarjeta_id" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_sin_factura_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimientos_sin_factura_cuenta_destino_id_fkey" FOREIGN KEY ("cuenta_destino_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_sin_factura_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_sin_factura_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_movimientos_sin_factura" ("categoria", "comprobante_s3_key", "creado_en", "cuenta_destino_id", "cuenta_id", "descripcion", "fecha", "id", "monto", "operador_id", "referencia", "tarjeta_id", "tipo") SELECT "categoria", "comprobante_s3_key", "creado_en", "cuenta_destino_id", "cuenta_id", "descripcion", "fecha", "id", "monto", "operador_id", "referencia", "tarjeta_id", "tipo" FROM "movimientos_sin_factura";
DROP TABLE "movimientos_sin_factura";
ALTER TABLE "new_movimientos_sin_factura" RENAME TO "movimientos_sin_factura";
CREATE TABLE "new_notas_credito_debito" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "subtipo" TEXT,
    "factura_id" TEXT,
    "liquidacion_id" TEXT,
    "cheque_recibido_id" TEXT,
    "nro_comprobante_externo" TEXT,
    "fecha_comprobante_externo" DATETIME,
    "emisor_externo" TEXT,
    "monto_neto" DECIMAL NOT NULL,
    "monto_iva" DECIMAL NOT NULL DEFAULT 0,
    "monto_total" DECIMAL NOT NULL,
    "descripcion" TEXT,
    "motivo_detalle" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "nro_comprobante" INTEGER,
    "pto_venta" INTEGER DEFAULT 1,
    "tipo_cbte" INTEGER,
    "cae" TEXT,
    "cae_vto" DATETIME,
    "qr_data" TEXT,
    "arca_estado" TEXT DEFAULT 'PENDIENTE',
    "arca_observaciones" TEXT,
    "request_arca_json" TEXT,
    "response_arca_json" TEXT,
    "autorizada_en" DATETIME,
    "idempotency_key" TEXT,
    "cbte_asoc_tipo" INTEGER,
    "cbte_asoc_pto_vta" INTEGER,
    "cbte_asoc_nro" INTEGER,
    "pdf_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notas_credito_debito_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notas_credito_debito_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notas_credito_debito_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notas_credito_debito_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_notas_credito_debito" ("arca_estado", "arca_observaciones", "autorizada_en", "cae", "cae_vto", "cbte_asoc_nro", "cbte_asoc_pto_vta", "cbte_asoc_tipo", "cheque_recibido_id", "creado_en", "descripcion", "emisor_externo", "estado", "factura_id", "fecha_comprobante_externo", "id", "idempotency_key", "liquidacion_id", "monto_iva", "monto_neto", "monto_total", "motivo_detalle", "nro_comprobante", "nro_comprobante_externo", "operador_id", "pdf_s3_key", "pto_venta", "qr_data", "request_arca_json", "response_arca_json", "subtipo", "tipo", "tipo_cbte") SELECT "arca_estado", "arca_observaciones", "autorizada_en", "cae", "cae_vto", "cbte_asoc_nro", "cbte_asoc_pto_vta", "cbte_asoc_tipo", "cheque_recibido_id", "creado_en", "descripcion", "emisor_externo", "estado", "factura_id", "fecha_comprobante_externo", "id", "idempotency_key", "liquidacion_id", "monto_iva", "monto_neto", "monto_total", "motivo_detalle", "nro_comprobante", "nro_comprobante_externo", "operador_id", "pdf_s3_key", "pto_venta", "qr_data", "request_arca_json", "response_arca_json", "subtipo", "tipo", "tipo_cbte" FROM "notas_credito_debito";
DROP TABLE "notas_credito_debito";
ALTER TABLE "new_notas_credito_debito" RENAME TO "notas_credito_debito";
CREATE TABLE "new_pagos_a_fleteros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "liquidacion_id" TEXT,
    "tipo_pago" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "referencia" TEXT,
    "fecha_pago" DATETIME NOT NULL,
    "comprobante_s3_key" TEXT,
    "cheque_emitido_id" TEXT,
    "cheque_recibido_id" TEXT,
    "cuenta_id" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    "orden_pago_id" TEXT,
    CONSTRAINT "pagos_a_fleteros_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cheque_emitido_id_fkey" FOREIGN KEY ("cheque_emitido_id") REFERENCES "cheques_emitidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_orden_pago_id_fkey" FOREIGN KEY ("orden_pago_id") REFERENCES "ordenes_pago" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_pagos_a_fleteros" ("anulado", "cheque_emitido_id", "cheque_recibido_id", "comprobante_s3_key", "creado_en", "cuenta_id", "fecha_pago", "fletero_id", "id", "liquidacion_id", "monto", "motivo_anulacion", "operador_id", "orden_pago_id", "referencia", "tipo_pago") SELECT "anulado", "cheque_emitido_id", "cheque_recibido_id", "comprobante_s3_key", "creado_en", "cuenta_id", "fecha_pago", "fletero_id", "id", "liquidacion_id", "monto", "motivo_anulacion", "operador_id", "orden_pago_id", "referencia", "tipo_pago" FROM "pagos_a_fleteros";
DROP TABLE "pagos_a_fleteros";
ALTER TABLE "new_pagos_a_fleteros" RENAME TO "pagos_a_fleteros";
CREATE TABLE "new_pagos_de_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "factura_id" TEXT,
    "tipo_pago" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "referencia" TEXT,
    "fecha_pago" DATETIME NOT NULL,
    "comprobante_s3_key" TEXT,
    "cheque_recibido_id" TEXT,
    "cuenta_id" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagos_de_empresas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_de_empresas_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_de_empresas_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_de_empresas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_de_empresas_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pagos_de_empresas" ("cheque_recibido_id", "comprobante_s3_key", "creado_en", "cuenta_id", "empresa_id", "factura_id", "fecha_pago", "id", "monto", "operador_id", "referencia", "tipo_pago") SELECT "cheque_recibido_id", "comprobante_s3_key", "creado_en", "cuenta_id", "empresa_id", "factura_id", "fecha_pago", "id", "monto", "operador_id", "referencia", "tipo_pago" FROM "pagos_de_empresas";
DROP TABLE "pagos_de_empresas";
ALTER TABLE "new_pagos_de_empresas" RENAME TO "pagos_de_empresas";
CREATE TABLE "new_pagos_factura_tarjeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cierre_resumen_id" TEXT NOT NULL,
    "factura_proveedor_id" TEXT,
    "factura_seguro_id" TEXT,
    "monto_pagado" DECIMAL NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagos_factura_tarjeta_cierre_resumen_id_fkey" FOREIGN KEY ("cierre_resumen_id") REFERENCES "cierres_resumen_tarjeta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_factura_tarjeta_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_factura_tarjeta_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_pagos_factura_tarjeta" ("cierre_resumen_id", "creado_en", "factura_proveedor_id", "factura_seguro_id", "id", "monto_pagado") SELECT "cierre_resumen_id", "creado_en", "factura_proveedor_id", "factura_seguro_id", "id", "monto_pagado" FROM "pagos_factura_tarjeta";
DROP TABLE "pagos_factura_tarjeta";
ALTER TABLE "new_pagos_factura_tarjeta" RENAME TO "pagos_factura_tarjeta";
CREATE TABLE "new_pagos_impuesto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo_impuesto" TEXT NOT NULL,
    "descripcion" TEXT,
    "periodo" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
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
INSERT INTO "new_pagos_impuesto" ("comprobante_pdf_s3_key", "creado_en", "cuenta_id", "descripcion", "fecha_pago", "id", "medio_pago", "monto", "observaciones", "operador_id", "periodo", "tarjeta_id", "tipo_impuesto") SELECT "comprobante_pdf_s3_key", "creado_en", "cuenta_id", "descripcion", "fecha_pago", "id", "medio_pago", "monto", "observaciones", "operador_id", "periodo", "tarjeta_id", "tipo_impuesto" FROM "pagos_impuesto";
DROP TABLE "pagos_impuesto";
ALTER TABLE "new_pagos_impuesto" RENAME TO "pagos_impuesto";
CREATE TABLE "new_pagos_proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_proveedor_id" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "monto" DECIMAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "observaciones" TEXT,
    "comprobante_pdf_s3_key" TEXT,
    "cuenta_id" TEXT,
    "cheque_recibido_id" TEXT,
    "cheque_emitido_id" TEXT,
    "tarjeta_id" TEXT,
    "resumen_tarjeta_id" TEXT,
    "operador_id" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    CONSTRAINT "pagos_proveedor_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_cheque_emitido_id_fkey" FOREIGN KEY ("cheque_emitido_id") REFERENCES "cheques_emitidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_resumen_tarjeta_id_fkey" FOREIGN KEY ("resumen_tarjeta_id") REFERENCES "resumenes_tarjeta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_pagos_proveedor" ("anulado", "cheque_emitido_id", "cheque_recibido_id", "comprobante_pdf_s3_key", "creado_en", "cuenta_id", "factura_proveedor_id", "fecha", "id", "monto", "motivo_anulacion", "observaciones", "operador_id", "resumen_tarjeta_id", "tarjeta_id", "tipo") SELECT "anulado", "cheque_emitido_id", "cheque_recibido_id", "comprobante_pdf_s3_key", "creado_en", "cuenta_id", "factura_proveedor_id", "fecha", "id", "monto", "motivo_anulacion", "observaciones", "operador_id", "resumen_tarjeta_id", "tarjeta_id", "tipo" FROM "pagos_proveedor";
DROP TABLE "pagos_proveedor";
ALTER TABLE "new_pagos_proveedor" RENAME TO "pagos_proveedor";
CREATE TABLE "new_percepciones_impuestos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_proveedor_id" TEXT,
    "factura_seguro_id" TEXT,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DECIMAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "percepciones_impuestos_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "percepciones_impuestos_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_percepciones_impuestos" ("categoria", "creado_en", "descripcion", "factura_proveedor_id", "factura_seguro_id", "id", "monto", "periodo", "tipo") SELECT "categoria", "creado_en", "descripcion", "factura_proveedor_id", "factura_seguro_id", "id", "monto", "periodo", "tipo" FROM "percepciones_impuestos";
DROP TABLE "percepciones_impuestos";
ALTER TABLE "new_percepciones_impuestos" RENAME TO "percepciones_impuestos";
CREATE TABLE "new_planillas_galicia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "total_monto" DECIMAL NOT NULL,
    "cantidad_cheques" INTEGER NOT NULL,
    "xlsx_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "planillas_galicia_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "planillas_galicia_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_planillas_galicia" ("cantidad_cheques", "creado_en", "cuenta_id", "estado", "id", "nombre", "operador_id", "total_monto", "xlsx_s3_key") SELECT "cantidad_cheques", "creado_en", "cuenta_id", "estado", "id", "nombre", "operador_id", "total_monto", "xlsx_s3_key" FROM "planillas_galicia";
DROP TABLE "planillas_galicia";
ALTER TABLE "new_planillas_galicia" RENAME TO "planillas_galicia";
CREATE TABLE "new_polizas_seguro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "camion_id" TEXT,
    "aseguradora" TEXT NOT NULL,
    "nro_poliza" TEXT NOT NULL,
    "cobertura" TEXT,
    "monto_mensual" DECIMAL,
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
INSERT INTO "new_polizas_seguro" ("activa", "archivos", "aseguradora", "camion_id", "cobertura", "creado_en", "descripcion_bien", "factura_seguro_id", "id", "monto_mensual", "nro_poliza", "pdf_s3_key", "proveedor_id", "tipo_bien", "vigencia_desde", "vigencia_hasta") SELECT "activa", "archivos", "aseguradora", "camion_id", "cobertura", "creado_en", "descripcion_bien", "factura_seguro_id", "id", "monto_mensual", "nro_poliza", "pdf_s3_key", "proveedor_id", "tipo_bien", "vigencia_desde", "vigencia_hasta" FROM "polizas_seguro";
DROP TABLE "polizas_seguro";
ALTER TABLE "new_polizas_seguro" RENAME TO "polizas_seguro";
CREATE TABLE "new_recibos_cobranza" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nro" INTEGER NOT NULL,
    "pto_venta" INTEGER NOT NULL DEFAULT 1,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresa_id" TEXT NOT NULL,
    "total_cobrado" DECIMAL NOT NULL,
    "total_retenciones" DECIMAL NOT NULL DEFAULT 0,
    "total_comprobantes" DECIMAL NOT NULL,
    "retencion_ganancias" DECIMAL NOT NULL DEFAULT 0,
    "retencion_iibb" DECIMAL NOT NULL DEFAULT 0,
    "retencion_suss" DECIMAL NOT NULL DEFAULT 0,
    "pdf_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recibos_cobranza_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "recibos_cobranza_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_recibos_cobranza" ("creado_en", "empresa_id", "fecha", "id", "nro", "operador_id", "pdf_s3_key", "pto_venta", "retencion_ganancias", "retencion_iibb", "retencion_suss", "total_cobrado", "total_comprobantes", "total_retenciones") SELECT "creado_en", "empresa_id", "fecha", "id", "nro", "operador_id", "pdf_s3_key", "pto_venta", "retencion_ganancias", "retencion_iibb", "retencion_suss", "total_cobrado", "total_comprobantes", "total_retenciones" FROM "recibos_cobranza";
DROP TABLE "recibos_cobranza";
ALTER TABLE "new_recibos_cobranza" RENAME TO "recibos_cobranza";
CREATE TABLE "new_resumenes_tarjeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarjeta_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fecha_vto_pago" DATETIME NOT NULL,
    "total_ars" DECIMAL NOT NULL,
    "total_usd" DECIMAL,
    "s3_key" TEXT,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resumenes_tarjeta_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_resumenes_tarjeta" ("creado_en", "fecha_vto_pago", "id", "pagado", "periodo", "s3_key", "tarjeta_id", "total_ars", "total_usd") SELECT "creado_en", "fecha_vto_pago", "id", "pagado", "periodo", "s3_key", "tarjeta_id", "total_ars", "total_usd" FROM "resumenes_tarjeta";
DROP TABLE "resumenes_tarjeta";
ALTER TABLE "new_resumenes_tarjeta" RENAME TO "resumenes_tarjeta";
CREATE TABLE "new_saldos_fci" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fci_id" TEXT NOT NULL,
    "saldo_informado" DECIMAL NOT NULL,
    "fecha_actualizacion" DATETIME NOT NULL,
    "rendimiento_periodo" DECIMAL NOT NULL,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saldos_fci_fci_id_fkey" FOREIGN KEY ("fci_id") REFERENCES "fci" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "saldos_fci_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_saldos_fci" ("creado_en", "fci_id", "fecha_actualizacion", "id", "operador_id", "rendimiento_periodo", "saldo_informado") SELECT "creado_en", "fci_id", "fecha_actualizacion", "id", "operador_id", "rendimiento_periodo", "saldo_informado" FROM "saldos_fci";
DROP TABLE "saldos_fci";
ALTER TABLE "new_saldos_fci" RENAME TO "saldos_fci";
CREATE TABLE "new_tarjetas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "ultimos_4" TEXT NOT NULL,
    "titular_tipo" TEXT NOT NULL,
    "titular_nombre" TEXT NOT NULL,
    "cuenta_id" TEXT,
    "chofer_id" TEXT,
    "limite_mensual" DECIMAL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tarjetas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tarjetas_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tarjetas" ("activa", "banco", "chofer_id", "creado_en", "cuenta_id", "id", "limite_mensual", "nombre", "tipo", "titular_nombre", "titular_tipo", "ultimos_4") SELECT "activa", "banco", "chofer_id", "creado_en", "cuenta_id", "id", "limite_mensual", "nombre", "tipo", "titular_nombre", "titular_tipo", "ultimos_4" FROM "tarjetas";
DROP TABLE "tarjetas";
ALTER TABLE "new_tarjetas" RENAME TO "tarjetas";
CREATE TABLE "new_tarjetas_prepagas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chofer_id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "nro_tarjeta" TEXT,
    "limite_mensual" DECIMAL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tarjetas_prepagas_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tarjetas_prepagas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tarjetas_prepagas" ("activa", "chofer_id", "creado_en", "cuenta_id", "id", "limite_mensual", "nro_tarjeta") SELECT "activa", "chofer_id", "creado_en", "cuenta_id", "id", "limite_mensual", "nro_tarjeta" FROM "tarjetas_prepagas";
DROP TABLE "tarjetas_prepagas";
ALTER TABLE "new_tarjetas_prepagas" RENAME TO "tarjetas_prepagas";
CREATE TABLE "new_viajes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT,
    "es_camion_propio" BOOLEAN NOT NULL DEFAULT false,
    "camion_id" TEXT NOT NULL,
    "chofer_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "fecha_viaje" DATETIME NOT NULL,
    "remito" TEXT,
    "tiene_cupo" BOOLEAN NOT NULL DEFAULT false,
    "cupo" TEXT,
    "mercaderia" TEXT,
    "procedencia" TEXT,
    "provincia_origen" TEXT,
    "destino" TEXT,
    "provincia_destino" TEXT,
    "kilos" REAL,
    "tarifa_fletero" DECIMAL NOT NULL,
    "tarifa_empresa" DECIMAL NOT NULL,
    "tarifa_operativa_inicial" DECIMAL NOT NULL DEFAULT 0,
    "estado_liquidacion" TEXT NOT NULL DEFAULT 'PENDIENTE_LIQUIDAR',
    "estado_factura" TEXT NOT NULL DEFAULT 'PENDIENTE_FACTURAR',
    "tiene_cpe" BOOLEAN NOT NULL DEFAULT true,
    "nro_carta_porte" TEXT,
    "carta_porte_s3_key" TEXT,
    "historial_cambios" TEXT DEFAULT '[]',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "viajes_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "viajes_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_viajes" ("camion_id", "carta_porte_s3_key", "chofer_id", "creado_en", "cupo", "destino", "empresa_id", "es_camion_propio", "estado_factura", "estado_liquidacion", "fecha_viaje", "fletero_id", "historial_cambios", "id", "kilos", "mercaderia", "nro_carta_porte", "operador_id", "procedencia", "provincia_destino", "provincia_origen", "remito", "tarifa_empresa", "tarifa_fletero", "tiene_cpe", "tiene_cupo") SELECT "camion_id", "carta_porte_s3_key", "chofer_id", "creado_en", "cupo", "destino", "empresa_id", "es_camion_propio", "estado_factura", "estado_liquidacion", "fecha_viaje", "fletero_id", "historial_cambios", "id", "kilos", "mercaderia", "nro_carta_porte", "operador_id", "procedencia", "provincia_destino", "provincia_origen", "remito", "tarifa_empresa", "tarifa_fletero", "tiene_cpe", "tiene_cupo" FROM "viajes";
DROP TABLE "viajes";
ALTER TABLE "new_viajes" RENAME TO "viajes";
CREATE INDEX "viajes_nro_carta_porte_idx" ON "viajes"("nro_carta_porte");
CREATE TABLE "new_viajes_en_factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viaje_id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "fecha_viaje" DATETIME NOT NULL,
    "remito" TEXT,
    "cupo" TEXT,
    "mercaderia" TEXT,
    "procedencia" TEXT,
    "provincia_origen" TEXT,
    "destino" TEXT,
    "provincia_destino" TEXT,
    "kilos" REAL,
    "tarifa_empresa" DECIMAL NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    CONSTRAINT "viajes_en_factura_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_en_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_viajes_en_factura" ("cupo", "destino", "factura_id", "fecha_viaje", "id", "kilos", "mercaderia", "procedencia", "provincia_destino", "provincia_origen", "remito", "subtotal", "tarifa_empresa", "viaje_id") SELECT "cupo", "destino", "factura_id", "fecha_viaje", "id", "kilos", "mercaderia", "procedencia", "provincia_destino", "provincia_origen", "remito", "subtotal", "tarifa_empresa", "viaje_id" FROM "viajes_en_factura";
DROP TABLE "viajes_en_factura";
ALTER TABLE "new_viajes_en_factura" RENAME TO "viajes_en_factura";
CREATE UNIQUE INDEX "viajes_en_factura_viaje_id_factura_id_key" ON "viajes_en_factura"("viaje_id", "factura_id");
CREATE TABLE "new_viajes_en_liquidacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viaje_id" TEXT NOT NULL,
    "liquidacion_id" TEXT NOT NULL,
    "fecha_viaje" DATETIME NOT NULL,
    "remito" TEXT,
    "cupo" TEXT,
    "mercaderia" TEXT,
    "procedencia" TEXT,
    "provincia_origen" TEXT,
    "destino" TEXT,
    "provincia_destino" TEXT,
    "kilos" REAL,
    "tarifa_fletero" DECIMAL NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    CONSTRAINT "viajes_en_liquidacion_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_en_liquidacion_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_viajes_en_liquidacion" ("cupo", "destino", "fecha_viaje", "id", "kilos", "liquidacion_id", "mercaderia", "procedencia", "provincia_destino", "provincia_origen", "remito", "subtotal", "tarifa_fletero", "viaje_id") SELECT "cupo", "destino", "fecha_viaje", "id", "kilos", "liquidacion_id", "mercaderia", "procedencia", "provincia_destino", "provincia_origen", "remito", "subtotal", "tarifa_fletero", "viaje_id" FROM "viajes_en_liquidacion";
DROP TABLE "viajes_en_liquidacion";
ALTER TABLE "new_viajes_en_liquidacion" RENAME TO "viajes_en_liquidacion";
CREATE UNIQUE INDEX "viajes_en_liquidacion_viaje_id_liquidacion_id_key" ON "viajes_en_liquidacion"("viaje_id", "liquidacion_id");
CREATE TABLE "new_viajes_en_nota_cd" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nota_id" TEXT NOT NULL,
    "viaje_id" TEXT NOT NULL,
    "tarifa_original" DECIMAL NOT NULL,
    "kilos_original" REAL,
    "subtotal_original" DECIMAL NOT NULL,
    "subtotal_corregido" DECIMAL,
    CONSTRAINT "viajes_en_nota_cd_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "notas_credito_debito" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "viajes_en_nota_cd_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_viajes_en_nota_cd" ("id", "kilos_original", "nota_id", "subtotal_corregido", "subtotal_original", "tarifa_original", "viaje_id") SELECT "id", "kilos_original", "nota_id", "subtotal_corregido", "subtotal_original", "tarifa_original", "viaje_id" FROM "viajes_en_nota_cd";
DROP TABLE "viajes_en_nota_cd";
ALTER TABLE "new_viajes_en_nota_cd" RENAME TO "viajes_en_nota_cd";
CREATE UNIQUE INDEX "viajes_en_nota_cd_nota_id_viaje_id_key" ON "viajes_en_nota_cd"("nota_id", "viaje_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
