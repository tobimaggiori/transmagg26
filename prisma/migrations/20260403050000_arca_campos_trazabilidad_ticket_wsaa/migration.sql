-- Campos ARCA faltantes en facturas_emitidas
ALTER TABLE "facturas_emitidas" ADD COLUMN "pto_venta" INTEGER DEFAULT 1;
ALTER TABLE "facturas_emitidas" ADD COLUMN "cae" TEXT;
ALTER TABLE "facturas_emitidas" ADD COLUMN "cae_vto" DATETIME;
ALTER TABLE "facturas_emitidas" ADD COLUMN "qr_data" TEXT;
ALTER TABLE "facturas_emitidas" ADD COLUMN "arca_observaciones" TEXT;
ALTER TABLE "facturas_emitidas" ADD COLUMN "request_arca_json" TEXT;
ALTER TABLE "facturas_emitidas" ADD COLUMN "response_arca_json" TEXT;
ALTER TABLE "facturas_emitidas" ADD COLUMN "autorizada_en" DATETIME;
ALTER TABLE "facturas_emitidas" ADD COLUMN "idempotency_key" TEXT;

-- Campos de trazabilidad ARCA en liquidaciones
ALTER TABLE "liquidaciones" ADD COLUMN "request_arca_json" TEXT;
ALTER TABLE "liquidaciones" ADD COLUMN "response_arca_json" TEXT;
ALTER TABLE "liquidaciones" ADD COLUMN "autorizada_en" DATETIME;
ALTER TABLE "liquidaciones" ADD COLUMN "idempotency_key" TEXT;

-- Campos de trazabilidad ARCA en notas_credito_debito
ALTER TABLE "notas_credito_debito" ADD COLUMN "request_arca_json" TEXT;
ALTER TABLE "notas_credito_debito" ADD COLUMN "response_arca_json" TEXT;
ALTER TABLE "notas_credito_debito" ADD COLUMN "autorizada_en" DATETIME;
ALTER TABLE "notas_credito_debito" ADD COLUMN "idempotency_key" TEXT;
ALTER TABLE "notas_credito_debito" ADD COLUMN "cbte_asoc_tipo" INTEGER;
ALTER TABLE "notas_credito_debito" ADD COLUMN "cbte_asoc_pto_vta" INTEGER;
ALTER TABLE "notas_credito_debito" ADD COLUMN "cbte_asoc_nro" INTEGER;

-- Cache de tickets WSAA
CREATE TABLE "tickets_wsaa" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'wsfe',
    "token" TEXT NOT NULL,
    "sign" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "obtained_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
