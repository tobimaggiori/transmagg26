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
    CONSTRAINT "asientos_iva_factura_emitida_id_fkey" FOREIGN KEY ("factura_emitida_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iva_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iva_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_asientos_iva" ("alicuota", "base_imponible", "factura_emitida_id", "factura_proveedor_id", "id", "monto_iva", "periodo", "tipo", "tipo_referencia") SELECT "alicuota", "base_imponible", "factura_emitida_id", "factura_proveedor_id", "id", "monto_iva", "periodo", "tipo", "tipo_referencia" FROM "asientos_iva";
DROP TABLE "asientos_iva";
ALTER TABLE "new_asientos_iva" RENAME TO "asientos_iva";
CREATE UNIQUE INDEX "asientos_iva_liquidacion_id_key" ON "asientos_iva"("liquidacion_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
