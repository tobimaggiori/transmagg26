-- CreateTable
CREATE TABLE "notas_credito_debito" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "subtipo" TEXT,
    "factura_id" TEXT,
    "liquidacion_id" TEXT,
    "cheque_recibido_id" TEXT,
    "nro_comprobante_externo" TEXT,
    "fecha_comprobante_externo" DATETIME,
    "emisor_externo" TEXT,
    "monto_neto" REAL NOT NULL,
    "monto_iva" REAL NOT NULL DEFAULT 0,
    "monto_total" REAL NOT NULL,
    "descripcion" TEXT,
    "motivo_detalle" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "nro_comprobante" INTEGER,
    "pto_venta" INTEGER DEFAULT 1,
    "tipo_cbte" INTEGER,
    "cae" TEXT,
    "cae_vto" DATETIME,
    "qr_data" TEXT,
    "arca_estado" TEXT DEFAULT 'PENDIENTE',
    "arca_observaciones" TEXT,
    "pdf_s3_key" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notas_credito_debito_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notas_credito_debito_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notas_credito_debito_cheque_recibido_id_fkey" FOREIGN KEY ("cheque_recibido_id") REFERENCES "cheques_recibidos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notas_credito_debito_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "viajes_en_nota_cd" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nota_id" TEXT NOT NULL,
    "viaje_id" TEXT NOT NULL,
    "tarifa_original" REAL NOT NULL,
    "kilos_original" REAL,
    "subtotal_original" REAL NOT NULL,
    "subtotal_corregido" REAL,
    CONSTRAINT "viajes_en_nota_cd_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "notas_credito_debito" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "viajes_en_nota_cd_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "viajes_en_nota_cd_nota_id_viaje_id_key" ON "viajes_en_nota_cd"("nota_id", "viaje_id");
