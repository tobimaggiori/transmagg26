-- CreateTable
CREATE TABLE "cuentas" (
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
    "es_cuenta_comitente_broker" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "fci" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "dias_habiles_alerta" INTEGER NOT NULL DEFAULT 1,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fci_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movimientos_fci" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fci_id" TEXT NOT NULL,
    "cuenta_origen_destino_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_fci_fci_id_fkey" FOREIGN KEY ("fci_id") REFERENCES "fci" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "movimientos_fci_cuenta_origen_destino_id_fkey" FOREIGN KEY ("cuenta_origen_destino_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimientos_fci_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saldos_fci" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fci_id" TEXT NOT NULL,
    "saldo_informado" REAL NOT NULL,
    "fecha_actualizacion" DATETIME NOT NULL,
    "rendimiento_periodo" REAL NOT NULL,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saldos_fci_fci_id_fkey" FOREIGN KEY ("fci_id") REFERENCES "fci" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "saldos_fci_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "cargo" TEXT,
    "fecha_ingreso" DATETIME NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "empleados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movimientos_bancarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cuenta_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT NOT NULL,
    "referencia" TEXT,
    "comprobante_s3_key" TEXT,
    "impuesto_debito_aplica" BOOLEAN NOT NULL DEFAULT false,
    "impuesto_debito_monto" REAL NOT NULL DEFAULT 0,
    "impuesto_credito_aplica" BOOLEAN NOT NULL DEFAULT false,
    "impuesto_credito_monto" REAL NOT NULL DEFAULT 0,
    "otros_descuentos_descripcion" TEXT,
    "otros_descuentos_monto" REAL NOT NULL DEFAULT 0,
    "cuenta_destino_id" TEXT,
    "cuenta_broker_id" TEXT,
    "empleado_id" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_bancarios_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimientos_bancarios_cuenta_destino_id_fkey" FOREIGN KEY ("cuenta_destino_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_bancarios_cuenta_broker_id_fkey" FOREIGN KEY ("cuenta_broker_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_bancarios_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_bancarios_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cheques_recibidos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
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
    "tasa_descuento" REAL,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cheques_recibidos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_cuenta_deposito_id_fkey" FOREIGN KEY ("cuenta_deposito_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_fletero_id_fkey" FOREIGN KEY ("endosado_a_fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_proveedor_id_fkey" FOREIGN KEY ("endosado_a_proveedor_id") REFERENCES "proveedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_broker_id_fkey" FOREIGN KEY ("endosado_a_broker_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cheques_emitidos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT,
    "proveedor_id" TEXT,
    "cuenta_id" TEXT NOT NULL,
    "nro_cheque" TEXT,
    "tipo_doc_beneficiario" TEXT NOT NULL,
    "nro_doc_beneficiario" TEXT NOT NULL,
    "monto" REAL NOT NULL,
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
    CONSTRAINT "cheques_emitidos_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_planilla_galicia_id_fkey" FOREIGN KEY ("planilla_galicia_id") REFERENCES "planillas_galicia" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "planillas_galicia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "total_monto" REAL NOT NULL,
    "cantidad_cheques" INTEGER NOT NULL,
    "xlsx_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "planillas_galicia_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "planillas_galicia_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tarjetas_prepagas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chofer_id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "nro_tarjeta" TEXT,
    "limite_mensual" REAL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tarjetas_prepagas_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tarjetas_prepagas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gastos_tarjeta_prepaga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarjeta_id" TEXT NOT NULL,
    "tipo_gasto" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT,
    "comprobante_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gastos_tarjeta_prepaga_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas_prepagas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gastos_tarjeta_prepaga_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "brokers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "brokers_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "adelantos_fleteros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT,
    "cheque_emitido_id" TEXT,
    "cheque_recibido_id" TEXT,
    "monto_descontado" REAL NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_DESCUENTO',
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "adelantos_fleteros_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "adelantos_fleteros_cheque_emitido_id_fkey" FOREIGN KEY ("cheque_emitido_id") REFERENCES "cheques_emitidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "adelantos_fleteros_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "adelantos_fleteros_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "adelanto_descuentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adelanto_id" TEXT NOT NULL,
    "liquidacion_id" TEXT NOT NULL,
    "monto_descontado" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    CONSTRAINT "adelanto_descuentos_adelanto_id_fkey" FOREIGN KEY ("adelanto_id") REFERENCES "adelantos_fleteros" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "adelanto_descuentos_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pagos_a_fleteros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "liquidacion_id" TEXT NOT NULL,
    "tipo_pago" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "referencia" TEXT,
    "fecha_pago" DATETIME NOT NULL,
    "comprobante_s3_key" TEXT,
    "cheque_emitido_id" TEXT,
    "cheque_recibido_id" TEXT,
    "cuenta_id" TEXT,
    CONSTRAINT "pagos_a_fleteros_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cheque_emitido_id_fkey" FOREIGN KEY ("cheque_emitido_id") REFERENCES "cheques_emitidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_pagos_a_fleteros" ("comprobante_s3_key", "fecha_pago", "fletero_id", "id", "liquidacion_id", "monto", "referencia", "tipo_pago") SELECT "comprobante_s3_key", "fecha_pago", "fletero_id", "id", "liquidacion_id", "monto", "referencia", "tipo_pago" FROM "pagos_a_fleteros";
DROP TABLE "pagos_a_fleteros";
ALTER TABLE "new_pagos_a_fleteros" RENAME TO "pagos_a_fleteros";
CREATE TABLE "new_pagos_de_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "tipo_pago" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "referencia" TEXT,
    "fecha_pago" DATETIME NOT NULL,
    "comprobante_s3_key" TEXT,
    "cheque_recibido_id" TEXT,
    "cuenta_id" TEXT,
    CONSTRAINT "pagos_de_empresas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_de_empresas_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_de_empresas_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_de_empresas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_pagos_de_empresas" ("comprobante_s3_key", "empresa_id", "factura_id", "fecha_pago", "id", "monto", "referencia", "tipo_pago") SELECT "comprobante_s3_key", "empresa_id", "factura_id", "fecha_pago", "id", "monto", "referencia", "tipo_pago" FROM "pagos_de_empresas";
DROP TABLE "pagos_de_empresas";
ALTER TABLE "new_pagos_de_empresas" RENAME TO "pagos_de_empresas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_nombre_key" ON "cuentas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "fci_nombre_key" ON "fci"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_usuario_id_key" ON "empleados"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_cuit_key" ON "empleados"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "brokers_nombre_key" ON "brokers"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "brokers_cuit_key" ON "brokers"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "brokers_cuenta_id_key" ON "brokers"("cuenta_id");
