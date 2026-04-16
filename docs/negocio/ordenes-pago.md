# Órdenes de pago a fletero

OP no fiscal que cancela uno o varios LPs del mismo fletero con un mix de
medios de pago y aplicaciones (NC, gastos, adelantos descontados).

## Modelo

`OrdenPago` en `prisma/schema.prisma`. Numeración por `(fleteroId, anio)`.
Display: `Nro-Anio` (ej `12-2026`).

```
OrdenPago {
  nro             // correlativo por (fleteroId, anio)
  anio
  fecha
  fleteroId
  pdfS3Key        // cache R2 del PDF generado
  pagos           // PagoAFletero[]
}
```

## Crear una OP

UI: `/fleteros/pago` (selector de fletero → tabla de LPs pagables → modal de
medios y aplicaciones). Componentes:

- `src/app/(dashboard)/fleteros/pago/registrar-pago-client.tsx`
- `src/components/forms/registrar-pago-fletero-form.tsx` (modal)

API: `POST /api/ordenes-pago`. Comando:
[`ejecutarCrearOrdenPago`](../../src/lib/orden-pago-commands.ts).

## Estructura del request

```typescript
{
  fleteroId,
  liquidacionIds,
  pagos: [...],          // medios de pago (ver abajo)
  fecha,
  gastos?: [...],        // GastoFletero a descontar
  ncDescuentos?: [...],  // NC a aplicar
  adelantoDescuentos?: [...], // AdelantoFletero a descontar
}
```

### Medios de pago (`pagos`)

Discriminated union por `tipoPago`:

| tipoPago | Campos extra |
|---|---|
| `TRANSFERENCIA` | `cuentaBancariaId`, `referencia?`, `comprobanteS3Key` |
| `CHEQUE_PROPIO` | `chequePropio: { cuentaId, nroCheque, fechas, clausula, ... }`, `comprobanteS3Key` |
| `CHEQUE_TERCERO` | `chequeRecibidoId`, `comprobanteS3Key` |
| `EFECTIVO` | — |
| `SALDO_A_FAVOR` | — (consume saldo a favor del fletero) |

### Aplicaciones (`gastos`, `ncDescuentos`, `adelantoDescuentos`)

Cada entrada es `{ <id>, montoDescontar }`. Ver
[adelantos.md](./adelantos.md) y [cuenta-corriente.md](./cuenta-corriente.md).

## Validación

Invariante: `sum(pagos) + sum(gastos) + sum(NC) + sum(adelantos) == sum(saldos
pendientes de los LPs)`. Si no se cumple, el endpoint rechaza con 400.

## Flujo transaccional

1. Cargar y validar fletero + LPs + saldos pendientes.
2. Validar cobertura exacta.
3. Si hay `SALDO_A_FAVOR`: validar que alcance.
4. Distribuir cada pago entre los LPs en orden cronológico (oldest-first):
   - Crea instrumento financiero (`ChequeEmitido` para CHEQUE_PROPIO,
     actualiza `ChequeRecibido` para CHEQUE_TERCERO, `MovimientoSinFactura`
     para TRANSFERENCIA).
   - Crea `PagoAFletero` por LP cubierto (un pago puede cubrir varios LPs).
5. Distribuir cada aplicación (gasto, NC, adelanto) entre los LPs con saldo
   restante, usando `distribuirEnLPs`. Crea registros en las link tables
   `gasto_descuentos`, `nc_descuentos`, `adelanto_descuentos`.
6. Marcar todos los LPs de la OP como `PAGADA`.
7. Crear `OrdenPago` con numeración correlativa.
8. Generar PDF (con merge de adjuntos) y subir a R2.

## Invariante crítico — OP cancela LPs en su totalidad

> Si la validación de cobertura pasa, después de la distribución todos los LPs
> incluidos en la OP deben quedar con `saldoPendiente = 0`.

Tests del invariante: `src/__tests__/orden-pago-distribucion.test.ts`.

`distribuirEnLPs` (helper pura exportada desde `orden-pago-commands.ts`)
garantiza el reparto. Si se hace alguna refactorización del flujo de OP, los
tests del invariante deben seguir pasando — son no negociables.

## PDF de la OP

### Estructura

1. Encabezado (logo + recuadro "Orden de Pago Nº X-AAAA · Fecha")
2. Caja del fletero (Sres / CUIT / Domicilio / Situación IVA)
3. **Comprobantes Cancelados** (LPs pagadas)
4. **Aplicaciones** (solo si hay): NC + Adlto Combustible / Cheque /
   Transferencia / Efectivo / Otros, todos en negativo
5. **Neto a Pagar** = Comprobantes Cancelados + Aplicaciones
6. **Medios de Pago** (Cheque, Transferencia, Efectivo)

Sin elementos fiscales (no hay letra A/B/C, no hay QR, no hay CAE, no hay
firma). Estética y paleta navy/celeste consistente con LP. Ver
[arquitectura/pdfs.md](../arquitectura/pdfs.md).

### Anexos automáticos

`generarPDFOrdenPago` genera el PDF base y, si hay `comprobanteS3Key` en
adelantos descontados o pagos, los anexa con `mergePDFsMixto`. Orden:

1. PDF de la OP (página 1+)
2. Cheques propios (adelantos + medios de pago)
3. Cheques tercero (adelantos + medios de pago)
4. Transferencias (adelantos + medios de pago)

Dedupe por key. Si el merge falla (key faltante), loggea warn y devuelve solo
la OP — nunca se rompe por un adjunto malo.

### Cache y servido

`GET /api/ordenes-pago/[id]/pdf` sirve **PDF binario directo**
(`application/pdf`). Ver [arquitectura/pdfs.md](../arquitectura/pdfs.md).

Sirve desde cache R2 si existe `pdfS3Key`. Si no, regenera (incluye merge),
sube a R2, guarda la key.

### Cache invalidation

El `pdfS3Key` se setea a `null` cuando:
- Se modifica un pago de la OP (`PATCH /api/pagos-fletero/[id]`).
- Se anula un pago (`POST /api/pagos-fletero/[id]/anular`).

La próxima vista regenera con los datos nuevos. La key vieja queda huérfana en
R2 (no se borra automáticamente).

## Preview (UI)

El modal de pago muestra un preview que **debe coincidir 1:1** con la
estructura del PDF: Comprobantes Cancelados → Aplicaciones (unificadas) →
Neto a Pagar → Medios de Pago. Implementación en
`registrar-pago-fletero-form.tsx` (componente `PreviewOrdenPago`).
