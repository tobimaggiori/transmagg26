/*
  Warnings:

  - You are about to drop the `movimientos_bancarios` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "cheques_recibidos" ADD COLUMN "fecha_deposito_broker" DATETIME;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "movimientos_bancarios";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "resumenes_bancarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cuenta_id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "pdf_s3_key" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resumenes_bancarios_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "resumenes_bancarios_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movimientos_sin_factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cuenta_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT NOT NULL,
    "referencia" TEXT,
    "comprobante_s3_key" TEXT,
    "cuenta_destino_id" TEXT,
    "tarjeta_id" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_sin_factura_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimientos_sin_factura_cuenta_destino_id_fkey" FOREIGN KEY ("cuenta_destino_id") REFERENCES "cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_sin_factura_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_sin_factura_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gastos_fleteros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "factura_proveedor_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto_pagado" REAL NOT NULL,
    "monto_descontado" REAL NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gastos_fleteros_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "gastos_fleteros_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gasto_descuentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gasto_id" TEXT NOT NULL,
    "liquidacion_id" TEXT NOT NULL,
    "monto_descontado" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    CONSTRAINT "gasto_descuentos_gasto_id_fkey" FOREIGN KEY ("gasto_id") REFERENCES "gastos_fleteros" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gasto_descuentos_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items_factura_proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_proveedor_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 1,
    "precio_unitario" REAL NOT NULL,
    "alicuota_iva" REAL NOT NULL,
    "es_exento" BOOLEAN NOT NULL DEFAULT false,
    "subtotal_neto" REAL NOT NULL,
    "monto_iva" REAL NOT NULL,
    "subtotal_total" REAL NOT NULL,
    CONSTRAINT "items_factura_proveedor_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_facturas_proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proveedor_id" TEXT NOT NULL,
    "nro_comprobante" TEXT NOT NULL,
    "pto_venta" TEXT,
    "tipo_cbte" TEXT NOT NULL,
    "neto" REAL NOT NULL,
    "iva_monto" REAL NOT NULL,
    "total" REAL NOT NULL,
    "fecha_cbte" DATETIME NOT NULL,
    "concepto" TEXT,
    "pdf_s3_key" TEXT,
    "estado_pago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "percepcion_iibb" REAL,
    "percepcion_iva" REAL,
    "percepcion_ganancias" REAL,
    "es_por_cuenta_de_fletero" BOOLEAN NOT NULL DEFAULT false,
    "fletero_id" TEXT,
    "tipo_gasto_fletero" TEXT,
    CONSTRAINT "facturas_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_proveedor_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_facturas_proveedor" ("concepto", "estado_pago", "fecha_cbte", "id", "iva_monto", "neto", "nro_comprobante", "pdf_s3_key", "proveedor_id", "tipo_cbte", "total") SELECT "concepto", "estado_pago", "fecha_cbte", "id", "iva_monto", "neto", "nro_comprobante", "pdf_s3_key", "proveedor_id", "tipo_cbte", "total" FROM "facturas_proveedor";
DROP TABLE "facturas_proveedor";
ALTER TABLE "new_facturas_proveedor" RENAME TO "facturas_proveedor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "resumenes_bancarios_cuenta_id_mes_anio_key" ON "resumenes_bancarios"("cuenta_id", "mes", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "gastos_fleteros_factura_proveedor_id_key" ON "gastos_fleteros"("factura_proveedor_id");
