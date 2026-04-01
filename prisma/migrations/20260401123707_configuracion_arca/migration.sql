-- CreateTable
CREATE TABLE "configuracion_arca" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'unico',
    "cuit" TEXT NOT NULL DEFAULT '30709381683',
    "razon_social" TEXT NOT NULL DEFAULT '',
    "certificado_b64" TEXT,
    "certificado_pass" TEXT,
    "modo" TEXT NOT NULL DEFAULT 'homologacion',
    "puntos_venta" TEXT NOT NULL DEFAULT '{}',
    "cbu_mi_pymes" TEXT,
    "modalidad_mi_pymes" TEXT DEFAULT 'SCA',
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "actualizado_en" DATETIME NOT NULL,
    "actualizado_por" TEXT
);
