# README - Reglas fiscales obligatorias

Antes de tocar cualquier parte del sistema relacionada con:

- facturación
- notas de crédito / débito
- líquidos productos
- configuración ARCA
- validaciones fiscales
- emisión de comprobantes
- UI o API de comprobantes
- tests de comprobantes

leer obligatoriamente:

- `arca-matriz-comprobantes.md`

## Regla de prioridad

Si el código actual, una implementación heredada, un test viejo o una sugerencia previa contradicen ese documento, **prevalece `arca-matriz-comprobantes.md`**.

## Recordatorios clave

- El catálogo de comprobantes ARCA de Transmagg es cerrado.
- No deben proponerse ni implementarse comprobantes fuera de esa matriz.
- Los LP en esta etapa solo se emiten como **60** o **61**.
- **65** existe en el catálogo, pero no debe quedar operativo por ahora.
- Las notas sobre facturas deben respetar estrictamente la matriz de compatibilidad por comprobante origen.
- Contabilidad / Notas C-D es solo consulta global, no el punto principal de emisión.

## Instrucción para cualquier IA o desarrollador

Si vas a modificar emisión, comprobantes, configuración ARCA, notas o tests fiscales:

1. Leé primero `arca-matriz-comprobantes.md`
2. Alineá tu propuesta con ese documento
3. Si encontrás una contradicción en el código, corregí el código para que prevalezca el documento