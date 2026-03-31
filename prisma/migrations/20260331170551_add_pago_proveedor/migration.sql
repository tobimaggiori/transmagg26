/*
  Warnings:

  - You are about to drop the `pagos_a_proveedores` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "pagos_a_proveedores";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "pagos_proveedor" (
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
    CONSTRAINT "pagos_proveedor_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_cheque_emitido_id_fkey" FOREIGN KEY ("cheque_emitido_id") REFERENCES "cheques_emitidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_resumen_tarjeta_id_fkey" FOREIGN KEY ("resumen_tarjeta_id") REFERENCES "resumenes_tarjeta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proveedor_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_facturas_proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proveedor_id" TEXT NOT NULL,
    "nro_comprobante" TEXT NOT NULL,
    "tipo_cbte" TEXT NOT NULL,
    "neto" REAL NOT NULL,
    "iva_monto" REAL NOT NULL,
    "total" REAL NOT NULL,
    "fecha_cbte" DATETIME NOT NULL,
    "concepto" TEXT,
    "pdf_s3_key" TEXT,
    "estado_pago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT "facturas_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_facturas_proveedor" ("concepto", "fecha_cbte", "id", "iva_monto", "neto", "nro_comprobante", "pdf_s3_key", "proveedor_id", "tipo_cbte", "total") SELECT "concepto", "fecha_cbte", "id", "iva_monto", "neto", "nro_comprobante", "pdf_s3_key", "proveedor_id", "tipo_cbte", "total" FROM "facturas_proveedor";
DROP TABLE "facturas_proveedor";
ALTER TABLE "new_facturas_proveedor" RENAME TO "facturas_proveedor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
