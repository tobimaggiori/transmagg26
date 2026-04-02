-- Rename tarifa_operativa_inicial → tarifa_fletero
ALTER TABLE "viajes" RENAME COLUMN "tarifa_operativa_inicial" TO "tarifa_fletero";

-- Add tarifa_empresa with same value as tarifa_fletero
ALTER TABLE "viajes" ADD COLUMN "tarifa_empresa" REAL NOT NULL DEFAULT 0;
UPDATE "viajes" SET "tarifa_empresa" = "tarifa_fletero";
