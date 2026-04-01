-- CreateTable
CREATE TABLE "ordenes_pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nro" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fletero_id" TEXT NOT NULL,
    "pdf_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ordenes_pago_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ordenes_pago_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pagos_a_fleteros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "liquidacion_id" TEXT,
    "tipo_pago" TEXT NOT NULL,
    "monto" REAL NOT NULL,
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
INSERT INTO "new_pagos_a_fleteros" ("anulado", "cheque_emitido_id", "cheque_recibido_id", "comprobante_s3_key", "creado_en", "cuenta_id", "fecha_pago", "fletero_id", "id", "liquidacion_id", "monto", "motivo_anulacion", "operador_id", "referencia", "tipo_pago") SELECT "anulado", "cheque_emitido_id", "cheque_recibido_id", "comprobante_s3_key", "creado_en", "cuenta_id", "fecha_pago", "fletero_id", "id", "liquidacion_id", "monto", "motivo_anulacion", "operador_id", "referencia", "tipo_pago" FROM "pagos_a_fleteros";
DROP TABLE "pagos_a_fleteros";
ALTER TABLE "new_pagos_a_fleteros" RENAME TO "pagos_a_fleteros";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_pago_nro_key" ON "ordenes_pago"("nro");
