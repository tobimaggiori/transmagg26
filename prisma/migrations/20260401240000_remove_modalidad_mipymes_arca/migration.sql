-- AlterTable: remove modalidad_mi_pymes from configuracion_arca
-- La modalidad SCA/ADC se elige por factura en el formulario de emisión,
-- no es una configuración global del sistema.

CREATE TABLE "configuracion_arca_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cuit" TEXT NOT NULL DEFAULT '30709381683',
    "razon_social" TEXT NOT NULL DEFAULT '',
    "certificado_b64" TEXT,
    "certificado_pass" TEXT,
    "modo" TEXT NOT NULL DEFAULT 'homologacion',
    "puntos_venta" TEXT NOT NULL DEFAULT '{}',
    "cbu_mi_pymes" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "actualizado_en" DATETIME NOT NULL,
    "actualizado_por" TEXT
);

INSERT INTO "configuracion_arca_new" SELECT
    "id", "cuit", "razon_social", "certificado_b64", "certificado_pass",
    "modo", "puntos_venta", "cbu_mi_pymes", "activa", "actualizado_en", "actualizado_por"
FROM "configuracion_arca";

DROP TABLE "configuracion_arca";
ALTER TABLE "configuracion_arca_new" RENAME TO "configuracion_arca";
