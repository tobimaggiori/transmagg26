-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_configuracion_arca" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'unico',
    "cuit" TEXT NOT NULL DEFAULT '30709381683',
    "razon_social" TEXT NOT NULL DEFAULT '',
    "certificado_b64" TEXT,
    "certificado_pass" TEXT,
    "modo" TEXT NOT NULL DEFAULT 'homologacion',
    "puntos_venta" TEXT NOT NULL DEFAULT '{}',
    "comprobantes_habilitados" TEXT NOT NULL DEFAULT '[]',
    "cbu_mi_pymes" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "actualizado_en" DATETIME NOT NULL,
    "actualizado_por" TEXT
);
INSERT INTO "new_configuracion_arca" ("activa", "actualizado_en", "actualizado_por", "cbu_mi_pymes", "certificado_b64", "certificado_pass", "cuit", "id", "modo", "puntos_venta", "razon_social") SELECT "activa", "actualizado_en", "actualizado_por", "cbu_mi_pymes", "certificado_b64", "certificado_pass", "cuit", "id", "modo", "puntos_venta", "razon_social" FROM "configuracion_arca";
DROP TABLE "configuracion_arca";
ALTER TABLE "new_configuracion_arca" RENAME TO "configuracion_arca";
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
    "tipo_cbte" INTEGER DEFAULT 60,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
