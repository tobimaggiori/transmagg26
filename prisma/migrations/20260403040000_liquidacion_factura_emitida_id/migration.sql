ALTER TABLE "liquidaciones" ADD COLUMN "factura_emitida_id" TEXT;
CREATE UNIQUE INDEX "liquidaciones_factura_emitida_id_key" ON "liquidaciones"("factura_emitida_id");
