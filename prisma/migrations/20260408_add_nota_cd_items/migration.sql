-- CreateTable: ítems de detalle para NC/ND emitidas con flujo items-based
CREATE TABLE "notas_cd_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nota_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    CONSTRAINT "notas_cd_items_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "notas_credito_debito" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
