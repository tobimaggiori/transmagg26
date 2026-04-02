-- CreateTable
CREATE TABLE "configuracion_otp" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "host" TEXT,
    "puerto" INTEGER,
    "usuario" TEXT,
    "password_hash" TEXT,
    "usar_ssl" BOOLEAN NOT NULL DEFAULT true,
    "email_remitente" TEXT,
    "nombre_remitente" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "actualizado_en" DATETIME NOT NULL
);
