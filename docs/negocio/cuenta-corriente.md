# Cuenta corriente — modelo unificado

Reglas de cálculo de saldo pendiente por documento (LP / factura) y saldo de
cuenta corriente por actor (fletero / empresa). Refactor consolidado en
2026-04.

## Fórmula única

```
saldoPendiente(doc) = total
                    − sum(pagos no anulados)
                    − sum(NCs aplicadas, leídas del link table correspondiente)
                    − sum(gastos descontados)            ← solo LP
                    − sum(adelantos descontados)         ← solo LP
```

Source of truth: [`src/lib/cuenta-corriente.ts`](../../src/lib/cuenta-corriente.ts),
helper `calcularSaldoPendienteDoc`.

## Decisión clave: aplicación explícita de NC

Una NC emitida **NO reduce automáticamente** el saldo del documento. Solo lo
reduce cuando se aplica explícitamente (vía recibo de cobranza para empresas o
vía OP para fleteros).

Mientras la NC tenga saldo sin aplicar (`montoTotal − montoDescontado > 0`),
ese remanente forma parte del **crédito disponible** del actor y se reporta
separado del saldo deudor.

```
creditoDisponible = sum(NC.montoTotal − NC.montoDescontado) por NCs activas
```

## Saldo de cuenta corriente

```
saldoCC(actor) = sum(saldoPendiente de cada doc del actor)
               − sobrepagos sin asignar (pagos sin liquidacion/factura)
```

`SaldoCC` (tipo) tiene cuatro campos:

```typescript
{
  saldoDeudor: number          // si saldoNeto > 0
  saldoAFavor: number          // si saldoNeto < 0 (sobrepagos)
  creditoDisponible: number    // NCs sin aplicar (separado, no afecta saldoNeto)
  saldoNeto: number            // positivo = debe, negativo = a favor
}
```

## Helpers públicos

```typescript
import {
  calcularSaldoPendienteDoc,        // pura
  calcularCreditoDisponible,        // pura
  calcularSaldoCC,                  // pura
  calcularSaldoPendienteFactura,    // con Prisma
  calcularSaldoPendienteLiquidacion,// con Prisma
  calcularSaldoCCEmpresa,           // con Prisma
  calcularSaldoCCFletero,           // con Prisma
} from "@/lib/cuenta-corriente"
```

## Fuente de "NC aplicadas" — punto crítico

Para **fleteros**: leer del link table `nc_descuentos` filtrado por
`liquidacionId`. Una NC emitida sobre LP1 puede aplicarse a LP2 en una OP — el
descuento queda registrado en `nc_descuentos` con `liquidacionId = LP2`,
mientras la NC sigue ligada a LP1 vía `notaCreditoDebito.liquidacionId`.

❌ **NO** usar `liquidacion.notasCreditoDebito.montoDescontado`. Eso lista NCs
emitidas SOBRE esa LP, no las aplicadas A esa LP.

✅ **SÍ** usar `liquidacion.ncDescuentos` (la link table).

Para **empresas**: leer `factura.notasCreditoDebito.montoDescontado`. Cada
recibo de cobranza registra qué NC/ND aplicó (y por cuánto) en el link table
`notas_aplicadas_en_recibo`, e incrementa `montoDescontado` de la nota. La
aplicación es **explícita**: el operador elige en el recibo qué notas
descontar; no se aplican automáticamente al cobrar.

## Link tables relacionadas

| Tabla | Tracking |
|---|---|
| `nc_descuentos` | `{ ncId, liquidacionId, montoDescontado, fecha }` — NC aplicada a LP |
| `gasto_descuentos` | `{ gastoId, liquidacionId, montoDescontado, fecha }` — gasto descontado en LP |
| `adelanto_descuentos` | `{ adelantoId, liquidacionId, montoDescontado, fecha }` — adelanto descontado en LP |
| `notas_aplicadas_en_recibo` | `{ notaId, reciboId, monto, fecha }` — NC/ND aplicada en recibo de cobranza a empresa |

Las tres son alimentadas por `ejecutarCrearOrdenPago` cuando se crea una OP
con aplicaciones. Ver [ordenes-pago.md](./ordenes-pago.md).

## Distribución entre LPs (oldest-first)

Cuando una OP cubre varios LPs, los descuentos (NC, gastos, adelantos) **no se
acumulan al primer LP** — se distribuyen entre los LPs en orden cronológico,
igual que los pagos. Helper: `distribuirEnLPs` en
`src/lib/orden-pago-commands.ts`.

Si un descuento individual cubre más de un LP, se generan N registros en la
link table correspondiente (uno por LP que recibió parte).

## Tests

- Unit tests de las helpers puras y mock-Prisma de las orquestadoras:
  `src/__tests__/cuenta-corriente.test.ts`.
- Tests del invariante de distribución y cancelación:
  `src/__tests__/orden-pago-distribucion.test.ts`.

Ver [politicas/invariantes.md](../politicas/invariantes.md) para invariantes
generales.
