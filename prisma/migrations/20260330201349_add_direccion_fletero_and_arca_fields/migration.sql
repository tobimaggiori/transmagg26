-- AlterTable
ALTER TABLE "fleteros" ADD COLUMN "direccion" TEXT;

-- AlterTable
ALTER TABLE "liquidaciones" ADD COLUMN "arca_estado" TEXT DEFAULT 'PENDIENTE';
ALTER TABLE "liquidaciones" ADD COLUMN "arca_observaciones" TEXT;
ALTER TABLE "liquidaciones" ADD COLUMN "cae" TEXT;
ALTER TABLE "liquidaciones" ADD COLUMN "cae_vto" DATETIME;
ALTER TABLE "liquidaciones" ADD COLUMN "nro_comprobante" INTEGER;
ALTER TABLE "liquidaciones" ADD COLUMN "pto_venta" INTEGER DEFAULT 1;
ALTER TABLE "liquidaciones" ADD COLUMN "qr_data" TEXT;
ALTER TABLE "liquidaciones" ADD COLUMN "tipo_cbte" INTEGER DEFAULT 186;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_viajes_en_factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viaje_id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "fecha_viaje" DATETIME NOT NULL,
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
INSERT INTO "new_viajes_en_factura" ("cupo", "destino", "factura_id", "fecha_viaje", "id", "kilos", "mercaderia", "procedencia", "provincia_destino", "provincia_origen", "remito", "subtotal", "tarifa_empresa", "viaje_id") SELECT "cupo", "destino", "factura_id", "fecha_viaje", "id", "kilos", "mercaderia", "procedencia", "provincia_destino", "provincia_origen", "remito", "subtotal", "tarifa_empresa", "viaje_id" FROM "viajes_en_factura";
DROP TABLE "viajes_en_factura";
ALTER TABLE "new_viajes_en_factura" RENAME TO "viajes_en_factura";
CREATE UNIQUE INDEX "viajes_en_factura_viaje_id_factura_id_key" ON "viajes_en_factura"("viaje_id", "factura_id");
CREATE TABLE "new_viajes_en_liquidacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viaje_id" TEXT NOT NULL,
    "liquidacion_id" TEXT NOT NULL,
    "fecha_viaje" DATETIME NOT NULL,
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
INSERT INTO "new_viajes_en_liquidacion" ("cupo", "destino", "fecha_viaje", "id", "kilos", "liquidacion_id", "mercaderia", "procedencia", "provincia_destino", "provincia_origen", "remito", "subtotal", "tarifa_fletero", "viaje_id") SELECT "cupo", "destino", "fecha_viaje", "id", "kilos", "liquidacion_id", "mercaderia", "procedencia", "provincia_destino", "provincia_origen", "remito", "subtotal", "tarifa_fletero", "viaje_id" FROM "viajes_en_liquidacion";
DROP TABLE "viajes_en_liquidacion";
ALTER TABLE "new_viajes_en_liquidacion" RENAME TO "viajes_en_liquidacion";
CREATE UNIQUE INDEX "viajes_en_liquidacion_viaje_id_liquidacion_id_key" ON "viajes_en_liquidacion"("viaje_id", "liquidacion_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
