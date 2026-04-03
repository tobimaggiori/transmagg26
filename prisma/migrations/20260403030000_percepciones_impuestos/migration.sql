CREATE TABLE "percepciones_impuestos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_proveedor_id" TEXT,
    "factura_seguro_id" TEXT,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" REAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "percepciones_impuestos_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "percepciones_impuestos_factura_seguro_id_fkey" FOREIGN KEY ("factura_seguro_id") REFERENCES "facturas_seguro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "libros_percepciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mes_anio" TEXT NOT NULL,
    "pdf_s3_key" TEXT,
    "generado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador_id" TEXT NOT NULL,
    CONSTRAINT "libros_percepciones_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "libros_percepciones_mes_anio_key" ON "libros_percepciones"("mes_anio");
