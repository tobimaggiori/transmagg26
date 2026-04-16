# Cupo de viajes

## Concepto

Un **cupo** es un acuerdo comercial entre Transmagg y una empresa para
transportar mercadería bajo condiciones unificadas (mercadería, ruta,
tarifa, mismo fletero/camión/chofer). Un cupo se materializa en uno o
varios viajes "hermanos" — distintos viajes físicos del mismo camión en
días distintos, pero todos formando parte del mismo acuerdo.

Modelado: campo `cupo: String?` y `tieneCupo: Boolean` en `Viaje`. El
cupo es a nivel **empresa**: dos empresas distintas pueden tener el mismo
número de cupo y son cupos independientes.

## Reglas de oro

1. **Hermanos del mismo cupo comparten un conjunto de campos lockeados**
   (mercadería, origen+provincia, destino+provincia, tarifa, comisión,
   fletero, camión, chofer, esCamionPropio, tieneCpe). Solo varían:
   kilos, remito, nro de carta de porte y fecha del viaje.
2. **Mientras al menos un hermano esté pendiente de facturar**, ningún
   viaje nuevo del mismo cupo (misma empresa) puede tener datos lockeados
   distintos.
3. **Los hermanos se facturan juntos**. Una factura no puede incluir
   parte de un cupo: o todos los hermanos pendientes, o ninguno.
4. **Los hermanos se liquidan juntos**. Misma regla análoga al lado fletero.
5. **El cupo se cierra** cuando todos sus hermanos pasan a `FACTURADO`
   (lado empresa) o `LIQUIDADO` (lado fletero). A partir de ahí, el mismo
   número puede reusarse para un nuevo cupo independiente.

Lista canónica de campos lockeados:
[`CAMPOS_LOCKEADOS_CUPO`](../../src/lib/viaje-cupo.ts).

## Flujo: nuevo viaje

UI: `/fleteros/viajes/nuevo`. Componente:
[`nuevo-viaje-client.tsx`](../../src/app/(dashboard)/fleteros/viajes/nuevo/nuevo-viaje-client.tsx).

1. El operador elige empresa.
2. Tipea un nro de cupo en el campo "Cupo".
3. Cuando hay empresa + cupo no vacío, el cliente dispara con debounce
   ~350ms el lookup `GET /api/empresas/[id]/viajes-cupo?cupo=X`.
4. Si hay match (existe ≥1 viaje pendiente con ese cupo), el cliente
   autocompleta los campos lockeados con los del **viaje fuente** (el más
   antiguo pendiente) y los **deshabilita** vía `disabled`.
5. El operador solo puede modificar kilos, remito, nro CDP y fecha.

Validación defensiva server-side en `POST /api/viajes`: aún si el
cliente bypassea el lock, el endpoint compara los campos lockeados del
body contra el viaje fuente y rechaza con **409** indicando las
diferencias.

## Flujo: editar viaje individual

UI: modal de detalle de viaje.

Si el viaje tiene cupo y hay hermanos pendientes:

- Los campos lockeados se renderizan como **no editables** (sin botón
  "Modificar").
- Aparece un banner ámbar arriba del modal:
  > Este viaje comparte el cupo X con N viajes pendientes de facturar.
  > Solo se pueden modificar kilos, fecha, remito y carta de porte.
  > [Editar campos compartidos →]
- El botón abre el sub-modal `ModalBulkEditCupo`.

Validación server-side en `PATCH /api/viajes/[id]`: si se intenta
modificar un campo lockeado y existen hermanos pendientes, el endpoint
rechaza con **409** indicando que use el endpoint bulk.

## Edición en bloque (bulk)

Endpoint: `PATCH /api/viajes/cupo-bulk`.

Body:

```json
{
  "empresaId": "uuid",
  "cupo": "12345",
  "justificacion": "obligatoria, min 5 chars",
  "campos": { "tarifa": 6000 }
}
```

Aplica el cambio a **todos los viajes pendientes de facturar** del cupo
para esa empresa, dentro de una transacción. Snapshot del cambio
(valores anteriores y nuevos) en `Viaje.historialCambios`.

Sub-modal de UI: `ModalBulkEditCupo` en
[`modal-detalle-viaje.tsx`](../../src/app/(dashboard)/fleteros/viajes/_components/modal-detalle-viaje.tsx).
Lista los viajes que se afectarán, selector de campo, input para nuevo
valor, justificación obligatoria, confirmación.

## Facturación con cupo

UI: [`facturar-client.tsx`](../../src/app/(dashboard)/empresas/facturar/facturar-client.tsx).

Al hacer **toggle** de un viaje con cupo, el formulario auto-selecciona
(o auto-deselecciona) **todos los hermanos pendientes** del cupo de esa
empresa. Aparece notificación azul de 4s:
> Se auto-seleccionaron N viajes con cupo X.

Validación server-side al emitir
([`factura-commands.ts`](../../src/lib/factura-commands.ts)): si dos
viajes del mismo cupo tienen tarifa efectiva distinta (post-edición),
rechaza con 409 indicando unificar antes de facturar.

## Liquidación con cupo

Análogo a facturación, lado fletero.

UI:
[`liquidar-client.tsx`](../../src/app/(dashboard)/fleteros/liquidar/liquidar-client.tsx).
Mismo arrastre por cupo y notificación.

Validación server-side al liquidar
([`liquidacion-commands.ts`](../../src/lib/liquidacion-commands.ts)): si
dos viajes del mismo cupo tienen `tarifaFletero` distinta, rechaza con
409.

## Agrupamiento en PDFs

Los hermanos del mismo cupo aparecen como **un único renglón** en los
PDF de factura y de LP:

- **Kilos**: SUMA de todos los hermanos.
- **Subtotal**: SUMA de los subtotales individuales (preserva tarifas
  aunque no deberían diferir por validación).
- **Resto** (fecha, mercadería, origen, destino, tarifa): tomado del
  primer viaje del grupo.
- **Remitos**: formateados con [`formatearRemitosCupo`](#formato-de-remitos).
- **CDPs**: separados por `, ` (sin formato especial, cada hermano
  conserva su CDP individual).

Helper: [`agruparViajesPorCupo`](../../src/lib/viaje-cupo.ts), genérica
(sirve para factura y LP — el caller decide qué tarifa pasar).

### Formato de remitos

Helper: `formatearRemitosCupo(remitos: string[])`.

| Entrada | Salida |
|---|---|
| `["12345"]` | `"12345"` |
| `["12345", "12346"]` | `"12345/46"` |
| `["12345", "12346", "12347", "12348"]` | `"12345/46/47/48"` |
| `["100200", "100201", "100202"]` | `"100200/01/02"` |
| `["12345", "99999"]` | `"12345, 99999"` (sin prefijo común) |
| `["12345", "1234567"]` | `"12345, 1234567"` (largos distintos) |

Regla: si los remitos comparten prefijo y todos tienen igual largo, se
imprime el prefijo una sola vez seguido de los sufijos separados por
`/`. Sufijo mínimo 2 caracteres por legibilidad humana. Si no comparten
prefijo o tienen largos distintos, se separan por `, `.

### Línea de documentación en el PDF

Por cada renglón de viaje (o grupo), debajo se imprime una línea con:

- `Cupo: X` (negrita en "Cupo:", regular en valor)
- `Remito: Y` o `Remitos: Y/Z/...` (etiqueta plural si hay >1)
- `CDP: Z` o `CDPs: a, b, c` (etiqueta plural si hay >1)

Sin fondo redondeado, sobre el color base del PDF. Orden fijo: Cupo →
Remito(s) → CDP(s).

## Endpoints relacionados

| Método | Path | Uso |
|---|---|---|
| GET | `/api/empresas/[id]/viajes-cupo?cupo=X` | Lookup de hermanos pendientes de facturar |
| POST | `/api/viajes` | Validación de cupo al crear |
| PATCH | `/api/viajes/[id]` | Validación de cupo al editar individual |
| PATCH | `/api/viajes/cupo-bulk` | Edición en bloque de hermanos |

## Tests

`src/__tests__/viaje-cupo.test.ts` — 22 tests:

- `compararCamposLockeados`: 7 casos.
- `formatearRemitosCupo`: 8 casos (incluye los ejemplos de arriba).
- `agruparViajesPorCupo`: 7 casos (suma de kilos, agrupamiento, orden,
  CDPs, vacíos).
