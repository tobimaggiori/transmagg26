-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_facturas_emitidas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "nro_comprobante" TEXT,
    "tipo_cbte" TEXT NOT NULL,
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
INSERT INTO "new_facturas_emitidas" ("emitida_en", "empresa_id", "estado", "estado_arca", "id", "iva_monto", "neto", "nro_comprobante", "operador_id", "pdf_s3_key", "tipo_cbte", "total") SELECT "emitida_en", "empresa_id", "estado", "estado_arca", "id", "iva_monto", "neto", "nro_comprobante", "operador_id", "pdf_s3_key", "tipo_cbte", "total" FROM "facturas_emitidas";
DROP TABLE "facturas_emitidas";
ALTER TABLE "new_facturas_emitidas" RENAME TO "facturas_emitidas";
CREATE TABLE "new_liquidaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "comision_pct" REAL NOT NULL,
    "iva_pct" REAL NOT NULL DEFAULT 21,
    "subtotal_bruto" REAL NOT NULL,
    "comision_monto" REAL NOT NULL,
    "neto" REAL NOT NULL,
    "iva_monto" REAL NOT NULL,
    "total" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "pdf_s3_key" TEXT,
    "grabada_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "liquidaciones_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "liquidaciones_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_liquidaciones" ("comision_monto", "comision_pct", "estado", "fletero_id", "grabada_en", "id", "iva_monto", "neto", "operador_id", "pdf_s3_key", "subtotal_bruto", "total") SELECT "comision_monto", "comision_pct", "estado", "fletero_id", "grabada_en", "id", "iva_monto", "neto", "operador_id", "pdf_s3_key", "subtotal_bruto", "total" FROM "liquidaciones";
DROP TABLE "liquidaciones";
ALTER TABLE "new_liquidaciones" RENAME TO "liquidaciones";
CREATE TABLE "new_viajes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "camion_id" TEXT NOT NULL,
    "chofer_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "fecha_viaje" DATETIME NOT NULL,
    "remito" TEXT,
    "cupo" TEXT,
    "mercaderia" TEXT,
    "procedencia" TEXT,
    "provincia_origen" TEXT,
    "destino" TEXT,
    "provincia_destino" TEXT,
    "kilos" REAL,
    "tarifa_base" REAL NOT NULL,
    "estado_liquidacion" TEXT NOT NULL DEFAULT 'PENDIENTE_LIQUIDAR',
    "estado_factura" TEXT NOT NULL DEFAULT 'PENDIENTE_FACTURAR',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "viajes_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_viajes" ("camion_id", "chofer_id", "creado_en", "cupo", "destino", "empresa_id", "fecha_viaje", "fletero_id", "id", "kilos", "mercaderia", "operador_id", "procedencia", "provincia_destino", "provincia_origen", "remito", "tarifa_base") SELECT "camion_id", "chofer_id", "creado_en", "cupo", "destino", "empresa_id", "fecha_viaje", "fletero_id", "id", "kilos", "mercaderia", "operador_id", "procedencia", "provincia_destino", "provincia_origen", "remito", "tarifa_base" FROM "viajes";
DROP TABLE "viajes";
ALTER TABLE "new_viajes" RENAME TO "viajes";
CREATE TABLE "new_viajes_en_factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viaje_id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "fecha_viaje" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remito" TEXT,
    "cupo" TEXT,
    "mercaderia" TEXT,
    "procedencia" TEXT,
    "provincia_origen" TEXT,
    "destino" TEXT,
    "provincia_destino" TEXT,
    "kilos" REAL,
    "tarifa_empresa" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "viajes_en_factura_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_en_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_viajes_en_factura" ("factura_id", "id", "subtotal", "tarifa_empresa", "viaje_id") SELECT "factura_id", "id", "subtotal", "tarifa_empresa", "viaje_id" FROM "viajes_en_factura";
DROP TABLE "viajes_en_factura";
ALTER TABLE "new_viajes_en_factura" RENAME TO "viajes_en_factura";
CREATE UNIQUE INDEX "viajes_en_factura_viaje_id_factura_id_key" ON "viajes_en_factura"("viaje_id", "factura_id");
CREATE TABLE "new_viajes_en_liquidacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viaje_id" TEXT NOT NULL,
    "liquidacion_id" TEXT NOT NULL,
    "fecha_viaje" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remito" TEXT,
    "cupo" TEXT,
    "mercaderia" TEXT,
    "procedencia" TEXT,
    "provincia_origen" TEXT,
    "destino" TEXT,
    "provincia_destino" TEXT,
    "kilos" REAL,
    "tarifa_fletero" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "viajes_en_liquidacion_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_en_liquidacion_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_viajes_en_liquidacion" ("id", "liquidacion_id", "subtotal", "tarifa_fletero", "viaje_id") SELECT "id", "liquidacion_id", "subtotal", "tarifa_fletero", "viaje_id" FROM "viajes_en_liquidacion";
DROP TABLE "viajes_en_liquidacion";
ALTER TABLE "new_viajes_en_liquidacion" RENAME TO "viajes_en_liquidacion";
CREATE UNIQUE INDEX "viajes_en_liquidacion_viaje_id_liquidacion_id_key" ON "viajes_en_liquidacion"("viaje_id", "liquidacion_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
