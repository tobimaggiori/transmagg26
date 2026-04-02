-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_viajes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT,
    "es_camion_propio" BOOLEAN NOT NULL DEFAULT false,
    "camion_id" TEXT NOT NULL,
    "chofer_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "fecha_viaje" DATETIME NOT NULL,
    "remito" TEXT,
    "tiene_cupo" BOOLEAN NOT NULL DEFAULT false,
    "cupo" TEXT,
    "mercaderia" TEXT,
    "procedencia" TEXT,
    "provincia_origen" TEXT,
    "destino" TEXT,
    "provincia_destino" TEXT,
    "kilos" REAL,
    "tarifa_fletero" REAL NOT NULL,
    "tarifa_empresa" REAL NOT NULL,
    "estado_liquidacion" TEXT NOT NULL DEFAULT 'PENDIENTE_LIQUIDAR',
    "estado_factura" TEXT NOT NULL DEFAULT 'PENDIENTE_FACTURAR',
    "nro_carta_porte" TEXT,
    "carta_porte_s3_key" TEXT,
    "historial_cambios" TEXT DEFAULT '[]',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "viajes_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "viajes_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_viajes" ("camion_id", "carta_porte_s3_key", "chofer_id", "creado_en", "cupo", "destino", "empresa_id", "es_camion_propio", "estado_factura", "estado_liquidacion", "fecha_viaje", "fletero_id", "historial_cambios", "id", "kilos", "mercaderia", "nro_carta_porte", "operador_id", "procedencia", "provincia_destino", "provincia_origen", "remito", "tarifa_empresa", "tarifa_fletero", "tiene_cupo") SELECT "camion_id", "carta_porte_s3_key", "chofer_id", "creado_en", "cupo", "destino", "empresa_id", "es_camion_propio", "estado_factura", "estado_liquidacion", "fecha_viaje", "fletero_id", "historial_cambios", "id", "kilos", "mercaderia", "nro_carta_porte", "operador_id", "procedencia", "provincia_destino", "provincia_origen", "remito", "tarifa_empresa", "tarifa_fletero", "tiene_cupo" FROM "viajes";
DROP TABLE "viajes";
ALTER TABLE "new_viajes" RENAME TO "viajes";
CREATE INDEX "viajes_nro_carta_porte_idx" ON "viajes"("nro_carta_porte");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
