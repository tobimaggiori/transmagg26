-- CreateTable
CREATE TABLE "periodos_iva" (
    "id" TEXT NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "cerrado_en" TIMESTAMP(3),
    "cerrado_por_id" TEXT,

    CONSTRAINT "periodos_iva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes_iva_periodo" (
    "id" TEXT NOT NULL,
    "periodo_iva_id" TEXT NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "tipo_libro" TEXT NOT NULL,
    "tipo_ajuste" TEXT NOT NULL,
    "referencia_tipo" TEXT,
    "referencia_id" TEXT,
    "tipo_comprobante_arca" INTEGER,
    "punto_venta" INTEGER,
    "numero_desde" BIGINT,
    "numero_hasta" BIGINT,
    "fecha_comprobante" TIMESTAMP(3),
    "cuit_contraparte" TEXT,
    "razon_social_contraparte" TEXT,
    "neto_gravado" DECIMAL(65,30),
    "iva" DECIMAL(65,30),
    "exento" DECIMAL(65,30),
    "no_gravado" DECIMAL(65,30),
    "percepcion_iva" DECIMAL(65,30),
    "percepcion_iibb" DECIMAL(65,30),
    "percepcion_ganancias" DECIMAL(65,30),
    "total" DECIMAL(65,30),
    "alicuota" DOUBLE PRECISION,
    "motivo" TEXT NOT NULL,
    "creado_por_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "anulado_por_id" TEXT,
    "anulado_en" TIMESTAMP(3),
    "motivo_anulacion" TEXT,

    CONSTRAINT "ajustes_iva_periodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exportaciones_iva_arca" (
    "id" TEXT NOT NULL,
    "periodo_iva_id" TEXT NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'GENERADA',
    "zip_s3_key" TEXT,
    "comprobantes_ventas_s3_key" TEXT,
    "alicuotas_ventas_s3_key" TEXT,
    "comprobantes_compras_s3_key" TEXT,
    "alicuotas_compras_s3_key" TEXT,
    "hash_zip" TEXT,
    "hash_comprobantes_ventas" TEXT,
    "hash_alicuotas_ventas" TEXT,
    "hash_comprobantes_compras" TEXT,
    "hash_alicuotas_compras" TEXT,
    "resumen_json" TEXT,
    "validaciones_json" TEXT,
    "generado_por_id" TEXT NOT NULL,
    "generado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "exportaciones_iva_arca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "periodos_iva_mes_anio_key" ON "periodos_iva"("mes_anio");

-- CreateIndex
CREATE INDEX "ajustes_iva_periodo_mes_anio_idx" ON "ajustes_iva_periodo"("mes_anio");

-- CreateIndex
CREATE INDEX "ajustes_iva_periodo_tipo_libro_idx" ON "ajustes_iva_periodo"("tipo_libro");

-- CreateIndex
CREATE INDEX "ajustes_iva_periodo_referencia_tipo_referencia_id_idx" ON "ajustes_iva_periodo"("referencia_tipo", "referencia_id");

-- CreateIndex
CREATE INDEX "exportaciones_iva_arca_mes_anio_idx" ON "exportaciones_iva_arca"("mes_anio");

-- AddForeignKey
ALTER TABLE "periodos_iva" ADD CONSTRAINT "periodos_iva_cerrado_por_id_fkey" FOREIGN KEY ("cerrado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_iva_periodo" ADD CONSTRAINT "ajustes_iva_periodo_periodo_iva_id_fkey" FOREIGN KEY ("periodo_iva_id") REFERENCES "periodos_iva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_iva_periodo" ADD CONSTRAINT "ajustes_iva_periodo_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_iva_periodo" ADD CONSTRAINT "ajustes_iva_periodo_anulado_por_id_fkey" FOREIGN KEY ("anulado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exportaciones_iva_arca" ADD CONSTRAINT "exportaciones_iva_arca_periodo_iva_id_fkey" FOREIGN KEY ("periodo_iva_id") REFERENCES "periodos_iva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exportaciones_iva_arca" ADD CONSTRAINT "exportaciones_iva_arca_generado_por_id_fkey" FOREIGN KEY ("generado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
