-- AlterTable
ALTER TABLE "viajes" ADD COLUMN "carta_porte_s3_key" TEXT;
ALTER TABLE "viajes" ADD COLUMN "nro_carta_porte" TEXT;

-- CreateIndex
CREATE INDEX "viajes_nro_carta_porte_idx" ON "viajes"("nro_carta_porte");
