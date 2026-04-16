# Inconsistencias detectadas (auditoría 2026-04)

Lista de divergencias entre documentación previa (pre-refactor) y código
actual, o entre docs y la realidad operativa. Generada durante el refactor de
documentación. **Requiere revisión manual** para decidir caso por caso si la
fuente de verdad es el código (actualizar docs) o la doc (cambiar el código).

Usar como checklist. Cuando un punto se resuelve, taché.

---

## 1. Estados derivados de viajes

**Doc original**: `docs/facturacion-empresa.md` y `docs/liquidacion-fletero.md`
(ahora movidos a `docs/negocio/facturacion.md` y `liquidacion.md`) describen
estados derivados de la situación económica:

- `PENDIENTE_FACTURACION`, `FACTURADO_VIGENTE`, `FACTURADO_AJUSTADO_PARCIAL`
- `PENDIENTE_LIQUIDACION`, `LIQUIDADO_VIGENTE`, `LIQUIDADO_AJUSTADO_PARCIAL`

**Código actual** (`prisma/schema.prisma`, modelo `Viaje`): solo flags
booleanos disfrazados:

- `estadoLiquidacion`: default `PENDIENTE_LIQUIDAR`, transiciona a `LIQUIDADO`
- `estadoFactura`: default `PENDIENTE_FACTURAR`, transiciona a `FACTURADO`

**Decisión pendiente**: ¿implementar estados derivados (computados a partir
de viaje + comprobantes vivos), o aceptar que los flags simples alcanzan y
actualizar la doc para reflejar la realidad?

---

## 2. README.md original (ya reescrito)

**Doc original**: `README.md` decía:

- "Integración ARCA real: FALTA"
- "Generación de PDFs no implementada"

**Código actual**: ambas cosas están implementadas hace tiempo
(`src/lib/arca/`, `src/lib/pdf-*.ts`).

**Acción tomada**: README.md fue reescrito con estado real.

---

## 3. NCs aplicadas en empresas vs fleteros — modelo asimétrico

**Hallazgo**: el flujo de aplicación de NC es distinto en cada lado:

- **Fleteros**: NC se aplica explícitamente vía OP, parcial posible. Link
  table `nc_descuentos` registra cada aplicación por LP.
- **Empresas**: NC se aplica entera al cobrar la factura
  (`recibo-cobranza-commands.ts:323`). NO hay link table — solo se actualiza
  `nota.montoDescontado = nota.montoTotal`.

**Decisión pendiente**: ¿unificar (agregar link table para empresas y
permitir aplicación parcial), o documentar la asimetría como decisión y
dejarla?

Hoy la doc unificada
([docs/negocio/cuenta-corriente.md](./negocio/cuenta-corriente.md))
documenta la asimetría como aceptada.

---

## 4. PENDIENTE.md eliminado

**Doc original**: `PENDIENTE.md` listaba estado y pendientes del proyecto.

**Acción tomada**: contenido vivo (estado actual + pendientes operativos)
movido al `README.md`. Archivo eliminado por ser fuente alternativa
contradictoria.

Si querés mantener un changelog formal o roadmap separado, conviene crear
`docs/ROADMAP.md`.

---

## 5. Receta HTDP duplicada

**Doc original**: `CLAUDE.md` y `docs/AGENTS.md` tenían la receta HTDP
duplicada palabra por palabra.

**Acción tomada**: única fuente en
[`docs/politicas/htdp.md`](./politicas/htdp.md). `CLAUDE.md` referencia,
`docs/AGENTS.md` eliminado.

---

## 6. NC/ND documentado en 4 lugares

**Doc original**: contenido de NC/ND repartido en:

1. `sistemaviejo/nc-nd.md` (302 líneas, contexto histórico VB6)
2. `docs/reglas-iva-nc-nd.md` (165 líneas, IVA específico)
3. `docs/arca-matriz-comprobantes.md` (tipos permitidos)
4. `docs/invariantes-y-tests.md` (invariantes y tests)

**Acción tomada**: la fuente normativa es ahora
[`docs/reglas-fiscales/nc-nd-iva.md`](./reglas-fiscales/nc-nd-iva.md). Los
otros archivos cumplen rol específico (matriz cubre tipos, invariantes cubre
tests transversales).

`sistemaviejo/nc-nd.md` queda como referencia histórica.

---

## 7. Cache R2 — archivos huérfanos

**Hallazgo**: cuando un PDF se regenera (por invalidación de cache vía
`pdfS3Key = null`), se sube uno nuevo con UUID nuevo. El viejo queda
huérfano en R2.

**Decisión pendiente**: implementar job de limpieza de huérfanos, o aceptar
acumulación de basura en R2 (costo bajo a corto plazo).

---

## 8. Features sin documentación de negocio

Implementadas pero sin doc de negocio dedicado:

- **Tarjetas corporativas** (gastos, cierres, conciliación): mencionadas en
  schema (`Tarjeta`, `GastoTarjeta`, `ResumenTarjeta`, `CierreResumenTarjeta`)
  y en `src/lib/tarjeta-commands.ts`.
- **Flota propia** (vehículos, infracciones): `mi-flota/`.
- **Panel chofer**.
- **Contabilidad / libros IVA / IIBB / percepciones**: hay generators PDF y
  endpoints, falta documento de negocio.
- **Chequeras** (planillas Galicia): mencionado en cheques.md como esqueleto.

**Decisión pendiente**: documentar en próximas pasadas. Quedan fuera del
scope de esta refactorización.

---

## 9. Botones "Imprimir" rotos

**Hallazgo**: algunas vistas (modal de detalle de liquidación, etc.) abren
`/api/ordenes-pago/<id>/pdf?print=true` esperando que inyecte JS de
impresión. Eso funcionaba con el flujo HTML viejo, pero ahora la OP genera
PDF real y el query param se ignora.

**Decisión pendiente**: borrar esos botones o reemplazarlos. Ya quitado del
modal de confirmación de OP. Quedan posiblemente en otros lugares.

---

## 10. Un endpoint de PDF que devuelve JSON, otro que devuelve binario

**Hallazgo**:
- `/api/liquidaciones/[id]/pdf` devuelve `{ url }` (URL firmada).
- `/api/facturas/[id]/pdf` ídem.
- `/api/notas-credito-debito/[id]/pdf` ídem.
- `/api/ordenes-pago/[id]/pdf` devuelve **el PDF binario directo**.

Esto rompe `<a href>` directos para los primeros tres. Hay clientes que
asumen el comportamiento equivocado y caen en errores 404 / "documento no se
puede cargar".

**Decisión pendiente**: unificar el comportamiento. Opciones:
- (A) Hacer que todos devuelvan PDF binario (más simple para el cliente).
- (B) Hacer que todos devuelvan JSON con URL firmada (separación de
  preocupaciones, pero requiere fetch + window.open en cliente).

Yo iría con A para evitar confusión. Hoy hay un mix incoherente que viene
mordiendo.
