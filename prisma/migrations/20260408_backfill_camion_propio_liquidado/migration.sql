-- Backfill: viajes con camión propio que quedaron PENDIENTE_LIQUIDAR
-- sin liquidación asociada deben pasar a LIQUIDADO.
-- Idempotente: solo toca viajes que cumplan las 3 condiciones.

UPDATE viajes
SET estado_liquidacion = 'LIQUIDADO'
WHERE es_camion_propio = 1
  AND estado_liquidacion = 'PENDIENTE_LIQUIDAR'
  AND id NOT IN (
    SELECT viaje_id FROM viajes_en_liquidacion
  );
