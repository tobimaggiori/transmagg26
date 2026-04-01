-- CreateTable
CREATE TABLE "polizas_seguro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "camion_id" TEXT NOT NULL,
    "aseguradora" TEXT NOT NULL,
    "nro_poliza" TEXT NOT NULL,
    "cobertura" TEXT,
    "monto_mensual" REAL,
    "vigencia_desde" DATETIME NOT NULL,
    "vigencia_hasta" DATETIME NOT NULL,
    "archivos" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "polizas_seguro_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_camiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT,
    "es_propio" BOOLEAN NOT NULL DEFAULT false,
    "patente_chasis" TEXT NOT NULL,
    "patente_acoplado" TEXT,
    "tipo_camion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "camiones_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_camiones" ("activo", "fletero_id", "id", "patente_acoplado", "patente_chasis", "tipo_camion") SELECT "activo", "fletero_id", "id", "patente_acoplado", "patente_chasis", "tipo_camion" FROM "camiones";
DROP TABLE "camiones";
ALTER TABLE "new_camiones" RENAME TO "camiones";
CREATE UNIQUE INDEX "camiones_patente_chasis_key" ON "camiones"("patente_chasis");
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
    "tarifa_operativa_inicial" REAL NOT NULL,
    "estado_liquidacion" TEXT NOT NULL DEFAULT 'PENDIENTE_LIQUIDAR',
    "estado_factura" TEXT NOT NULL DEFAULT 'PENDIENTE_FACTURAR',
    "nro_carta_porte" TEXT,
    "carta_porte_s3_key" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "viajes_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "viajes_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_viajes" ("camion_id", "carta_porte_s3_key", "chofer_id", "creado_en", "cupo", "destino", "empresa_id", "estado_factura", "estado_liquidacion", "fecha_viaje", "fletero_id", "id", "kilos", "mercaderia", "nro_carta_porte", "operador_id", "procedencia", "provincia_destino", "provincia_origen", "remito", "tarifa_operativa_inicial", "tiene_cupo") SELECT "camion_id", "carta_porte_s3_key", "chofer_id", "creado_en", "cupo", "destino", "empresa_id", "estado_factura", "estado_liquidacion", "fecha_viaje", "fletero_id", "id", "kilos", "mercaderia", "nro_carta_porte", "operador_id", "procedencia", "provincia_destino", "provincia_origen", "remito", "tarifa_operativa_inicial", "tiene_cupo" FROM "viajes";
DROP TABLE "viajes";
ALTER TABLE "new_viajes" RENAME TO "viajes";
CREATE INDEX "viajes_nro_carta_porte_idx" ON "viajes"("nro_carta_porte");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
