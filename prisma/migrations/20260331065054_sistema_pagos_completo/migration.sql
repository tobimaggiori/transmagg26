/*
  Warnings:

  - Added the required column `operador_id` to the `pagos_a_fleteros` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operador_id` to the `pagos_de_empresas` table without a default value. This is not possible if the table is not empty.

*/
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
    CONSTRAINT "pagos_a_fleteros_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cheque_emitido_id_fkey" FOREIGN KEY ("cheque_emitido_id") REFERENCES "cheques_emitidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pagos_a_fleteros" ("cheque_emitido_id", "cheque_recibido_id", "comprobante_s3_key", "cuenta_id", "fecha_pago", "fletero_id", "id", "liquidacion_id", "monto", "referencia", "tipo_pago", "operador_id") SELECT "cheque_emitido_id", "cheque_recibido_id", "comprobante_s3_key", "cuenta_id", "fecha_pago", "fletero_id", "id", "liquidacion_id", "monto", "referencia", "tipo_pago", (SELECT "id" FROM "usuarios" LIMIT 1) FROM "pagos_a_fleteros";
DROP TABLE "pagos_a_fleteros";
ALTER TABLE "new_pagos_a_fleteros" RENAME TO "pagos_a_fleteros";
CREATE TABLE "new_pagos_de_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "factura_id" TEXT,
    "tipo_pago" TEXT NOT NULL,
    "monto" REAL NOT NULL,
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
INSERT INTO "new_pagos_de_empresas" ("cheque_recibido_id", "comprobante_s3_key", "cuenta_id", "empresa_id", "factura_id", "fecha_pago", "id", "monto", "referencia", "tipo_pago", "operador_id") SELECT "cheque_recibido_id", "comprobante_s3_key", "cuenta_id", "empresa_id", "factura_id", "fecha_pago", "id", "monto", "referencia", "tipo_pago", (SELECT "id" FROM "usuarios" LIMIT 1) FROM "pagos_de_empresas";
DROP TABLE "pagos_de_empresas";
ALTER TABLE "new_pagos_de_empresas" RENAME TO "pagos_de_empresas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
