CREATE TABLE "libros_iibb" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mes_anio" TEXT NOT NULL,
    "pdf_s3_key" TEXT,
    "generado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador_id" TEXT NOT NULL,
    CONSTRAINT "libros_iibb_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "libros_iibb_mes_anio_key" ON "libros_iibb"("mes_anio");
