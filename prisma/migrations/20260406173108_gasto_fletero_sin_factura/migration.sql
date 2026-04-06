-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_gastos_fleteros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "factura_proveedor_id" TEXT,
    "tipo" TEXT NOT NULL,
    "sin_factura" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,
    "monto_pagado" DECIMAL NOT NULL,
    "monto_descontado" DECIMAL NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gastos_fleteros_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "gastos_fleteros_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_gastos_fleteros" ("creado_en", "estado", "factura_proveedor_id", "fletero_id", "id", "monto_descontado", "monto_pagado", "tipo") SELECT "creado_en", "estado", "factura_proveedor_id", "fletero_id", "id", "monto_descontado", "monto_pagado", "tipo" FROM "gastos_fleteros";
DROP TABLE "gastos_fleteros";
ALTER TABLE "new_gastos_fleteros" RENAME TO "gastos_fleteros";
CREATE UNIQUE INDEX "gastos_fleteros_factura_proveedor_id_key" ON "gastos_fleteros"("factura_proveedor_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
