-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cheques_emitidos" (
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
    "es_electronico" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "cheques_emitidos_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_planilla_galicia_id_fkey" FOREIGN KEY ("planilla_galicia_id") REFERENCES "planillas_galicia" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_emitidos_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cheques_emitidos" ("clausula", "creado_en", "cuenta_id", "descripcion_1", "descripcion_2", "estado", "fecha_deposito", "fecha_emision", "fecha_pago", "fletero_id", "id", "liquidacion_id", "mail_beneficiario", "monto", "motivo_pago", "nro_cheque", "nro_doc_beneficiario", "operador_id", "planilla_galicia_id", "proveedor_id", "tipo_doc_beneficiario") SELECT "clausula", "creado_en", "cuenta_id", "descripcion_1", "descripcion_2", "estado", "fecha_deposito", "fecha_emision", "fecha_pago", "fletero_id", "id", "liquidacion_id", "mail_beneficiario", "monto", "motivo_pago", "nro_cheque", "nro_doc_beneficiario", "operador_id", "planilla_galicia_id", "proveedor_id", "tipo_doc_beneficiario" FROM "cheques_emitidos";
DROP TABLE "cheques_emitidos";
ALTER TABLE "new_cheques_emitidos" RENAME TO "cheques_emitidos";
CREATE TABLE "new_cheques_recibidos" (
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
    "cuit_librador" TEXT,
    "tasa_descuento" REAL,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "es_electronico" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "cheques_recibidos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_cuenta_deposito_id_fkey" FOREIGN KEY ("cuenta_deposito_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_fletero_id_fkey" FOREIGN KEY ("endosado_a_fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_proveedor_id_fkey" FOREIGN KEY ("endosado_a_proveedor_id") REFERENCES "proveedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_endosado_a_broker_id_fkey" FOREIGN KEY ("endosado_a_broker_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cheques_recibidos_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cheques_recibidos" ("banco_emisor", "creado_en", "cuenta_deposito_id", "cuit_librador", "empresa_id", "endosado_a_broker_id", "endosado_a_fletero_id", "endosado_a_proveedor_id", "endosado_a_tipo", "estado", "factura_id", "fecha_acreditacion", "fecha_cobro", "fecha_emision", "id", "monto", "nro_cheque", "operador_id", "tasa_descuento") SELECT "banco_emisor", "creado_en", "cuenta_deposito_id", "cuit_librador", "empresa_id", "endosado_a_broker_id", "endosado_a_fletero_id", "endosado_a_proveedor_id", "endosado_a_tipo", "estado", "factura_id", "fecha_acreditacion", "fecha_cobro", "fecha_emision", "id", "monto", "nro_cheque", "operador_id", "tasa_descuento" FROM "cheques_recibidos";
DROP TABLE "cheques_recibidos";
ALTER TABLE "new_cheques_recibidos" RENAME TO "cheques_recibidos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
