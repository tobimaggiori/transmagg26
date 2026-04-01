-- RedefineTables: change tipo_cbte from TEXT to INTEGER and add modalidad_mi_pymes
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "facturas_emitidas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_emitidas_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_facturas_emitidas" ("emitida_en", "empresa_id", "estado", "estado_arca", "id", "iva_monto", "iva_pct", "neto", "nro_comprobante", "operador_id", "pdf_s3_key", "total",
    "tipo_cbte", "modalidad_mi_pymes")
SELECT "emitida_en", "empresa_id", "estado", "estado_arca", "id", "iva_monto", "iva_pct", "neto", "nro_comprobante", "operador_id", "pdf_s3_key", "total",
    CASE "tipo_cbte"
        WHEN 'A' THEN 1
        WHEN 'B' THEN 6
        WHEN 'C' THEN 6
        WHEN 'M' THEN 1
        WHEN 'X' THEN 6
        ELSE 1
    END,
    NULL
FROM "facturas_emitidas";
DROP TABLE "facturas_emitidas";
ALTER TABLE "new_facturas_emitidas" RENAME TO "facturas_emitidas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
