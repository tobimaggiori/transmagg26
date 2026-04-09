-- Agregar columna anio (nullable primero para permitir backfill)
ALTER TABLE ordenes_pago ADD COLUMN anio INTEGER;

-- Backfill: usar el año extraído de la fecha existente
UPDATE ordenes_pago SET anio = CAST(strftime('%Y', fecha) AS INTEGER);

-- Recrear tabla con NOT NULL y nueva constraint UNIQUE(fletero_id, nro, anio)
-- SQLite no soporta ALTER COLUMN, se recrea la tabla
CREATE TABLE ordenes_pago_new (
  id          TEXT NOT NULL PRIMARY KEY,
  nro         INTEGER NOT NULL,
  anio        INTEGER NOT NULL,
  fecha       DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  fletero_id  TEXT NOT NULL REFERENCES fleteros(id),
  pdf_s3_key  TEXT,
  operador_id TEXT NOT NULL REFERENCES usuarios(id),
  creado_en   DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE (fletero_id, nro, anio)
);

INSERT INTO ordenes_pago_new
  SELECT id, nro, anio, fecha, fletero_id, pdf_s3_key, operador_id, creado_en
  FROM ordenes_pago;

DROP TABLE ordenes_pago;
ALTER TABLE ordenes_pago_new RENAME TO ordenes_pago;
