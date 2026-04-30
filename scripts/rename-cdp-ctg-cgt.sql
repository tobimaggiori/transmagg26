-- Rename de columnas en `viajes` para reflejar que el documento con PDF es CTG
-- (no CDP) y que CDP queda como número opcional sin PDF.
--
-- Mapeo:
--   nro_carta_porte    -> nro_ctg
--   carta_porte_s3_key -> ctg_s3_key
--   tiene_cpe          -> tiene_ctg
--   cgt                -> cdp
--
-- Correr ANTES de `prisma db push` para que Prisma vea los nombres ya migrados
-- y no intente drop/add (que perdería datos).

BEGIN;

ALTER TABLE viajes RENAME COLUMN nro_carta_porte    TO nro_ctg;
ALTER TABLE viajes RENAME COLUMN carta_porte_s3_key TO ctg_s3_key;
ALTER TABLE viajes RENAME COLUMN tiene_cpe          TO tiene_ctg;
ALTER TABLE viajes RENAME COLUMN cgt                TO cdp;

COMMIT;
