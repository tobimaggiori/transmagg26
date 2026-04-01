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
    CONSTRAINT "pagos_a_fleteros_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cheque_emitido_id_fkey" FOREIGN KEY ("cheque_emitido_id") REFERENCES "cheques_emitidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pagos_a_fleteros" ("cheque_emitido_id", "cheque_recibido_id", "comprobante_s3_key", "creado_en", "cuenta_id", "fecha_pago", "fletero_id", "id", "liquidacion_id", "monto", "operador_id", "referencia", "tipo_pago") SELECT "cheque_emitido_id", "cheque_recibido_id", "comprobante_s3_key", "creado_en", "cuenta_id", "fecha_pago", "fletero_id", "id", "liquidacion_id", "monto", "operador_id", "referencia", "tipo_pago" FROM "pagos_a_fleteros";
DROP TABLE "pagos_a_fleteros";
ALTER TABLE "new_pagos_a_fleteros" RENAME TO "pagos_a_fleteros";
CREATE TABLE "new_pagos_proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_proveedor_id" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "monto" REAL NOT NULL,
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
INSERT INTO "new_pagos_proveedor" ("cheque_emitido_id", "cheque_recibido_id", "comprobante_pdf_s3_key", "creado_en", "cuenta_id", "factura_proveedor_id", "fecha", "id", "monto", "observaciones", "operador_id", "resumen_tarjeta_id", "tarjeta_id", "tipo") SELECT "cheque_emitido_id", "cheque_recibido_id", "comprobante_pdf_s3_key", "creado_en", "cuenta_id", "factura_proveedor_id", "fecha", "id", "monto", "observaciones", "operador_id", "resumen_tarjeta_id", "tarjeta_id", "tipo" FROM "pagos_proveedor";
DROP TABLE "pagos_proveedor";
ALTER TABLE "new_pagos_proveedor" RENAME TO "pagos_proveedor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
