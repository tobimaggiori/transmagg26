-- CreateTable
CREATE TABLE "tarjetas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "ultimos_4" TEXT NOT NULL,
    "titular_tipo" TEXT NOT NULL,
    "titular_nombre" TEXT NOT NULL,
    "cuenta_id" TEXT,
    "chofer_id" TEXT,
    "limite_mensual" REAL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tarjetas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tarjetas_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "resumenes_tarjeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarjeta_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fecha_vto_pago" DATETIME NOT NULL,
    "total_ars" REAL NOT NULL,
    "total_usd" REAL,
    "s3_key" TEXT,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resumenes_tarjeta_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gastos_tarjeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarjeta_id" TEXT NOT NULL,
    "tipo_gasto" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT,
    "comprobante_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gastos_tarjeta_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gastos_tarjeta_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
