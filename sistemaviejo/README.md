# sistemaviejo/ — contexto histórico VB6

Este directorio contiene el código fuente del **sistema anterior** (Visual
Basic 6) que Transmagg usó antes de migrar al sistema actual.

## Qué hay acá

- `**.frm`, `**.bas`, `**.frx`: código fuente VB6. **No leer directamente**
  desde el sistema nuevo.
- `**.md`: extracción ordenada de la lógica de negocio del sistema viejo,
  hecha para que sirva de referencia comparativa.

## Cuándo leer los `.md`

- Necesitás entender el **por qué** de una decisión heredada.
- Estás migrando un flujo y querés ver cómo lo resolvía el sistema viejo.
- Aparece un nombre o concepto raro y sospechás que viene del sistema
  anterior (campos legacy, tablas heredadas, etc.).

## Cuándo NO usar este directorio

- **NO** es la especificación vigente del sistema actual. Para eso, ver
  [`../docs/`](../docs/).
- **NO** se debe replicar lógica del sistema viejo automáticamente. El
  sistema nuevo a menudo cambió decisiones a propósito (ej. doble tarifa
  con dos campos en `Viaje` en vez de un solo campo reinterpretado).
- **NO** leer los `.frm`/`.bas` directamente cuando hay un `.md` que
  extrajo lo relevante.

## Mapeo aproximado a docs nuevos

| Concepto | Sistema viejo | Sistema nuevo |
|---|---|---|
| Viajes | `viajes.md` | [`docs/negocio/viajes.md`](../docs/negocio/viajes.md) |
| Líquidos productos | `liquidaciones-fleteros.md` | [`docs/negocio/liquidacion.md`](../docs/negocio/liquidacion.md) |
| Facturación a empresas | `facturacion-empresas.md` | [`docs/negocio/facturacion.md`](../docs/negocio/facturacion.md) |
| NC/ND | `nc-nd.md` | [`docs/reglas-fiscales/nc-nd-iva.md`](../docs/reglas-fiscales/nc-nd-iva.md) |
| Tipos de comprobante | `tipos-comprobante.md` | [`docs/arca/matriz.md`](../docs/arca/matriz.md) |
| Recibos | `recibos-cobranza.md` | (en `docs/negocio/facturacion.md`, sección recibos) |
| Órdenes de pago | `ordenes-de-pago.md` | [`docs/negocio/ordenes-pago.md`](../docs/negocio/ordenes-pago.md) |
| Cuentas corrientes | `cuentas-corrientes.md` | [`docs/negocio/cuenta-corriente.md`](../docs/negocio/cuenta-corriente.md) |
| Adelantos | `adelantos.md` | [`docs/negocio/adelantos.md`](../docs/negocio/adelantos.md) |
| Cheques | `cheques.md` | [`docs/negocio/cheques.md`](../docs/negocio/cheques.md) |

Si la doc nueva contradice al sistema viejo, **prevalece la doc nueva**.
