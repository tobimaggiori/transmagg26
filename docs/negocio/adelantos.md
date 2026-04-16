# Adelantos a fleteros

## Concepto

Anticipos entregados a un fletero antes de la liquidación. Se descuentan en
LPs futuras o se aplican explícitamente en una OP.

Modelo: `AdelantoFletero` en `prisma/schema.prisma`.

## Tipos

| Tipo | Comprobante | Impacto adicional |
|---|---|---|
| `EFECTIVO` | PDF opcional | — |
| `TRANSFERENCIA` | PDF obligatorio | — |
| `COMBUSTIBLE` | — | (ver Gasto Fletero) |
| `CHEQUE_PROPIO` | PDF obligatorio | Crea `ChequeEmitido` en cartera |
| `CHEQUE_TERCERO` | PDF obligatorio | Endosa `ChequeRecibido` al fletero |

> **Nota**: `Adlto Combustible` en la planilla y en el PDF de OP refiere a
> `GastoFletero` con `tipo=COMBUSTIBLE`, no a `AdelantoFletero` de tipo
> `COMBUSTIBLE`. Son tablas distintas. Ver [gastos a fletero](#gastos-fletero)
> abajo.

## Flujo de ingreso

UI: `/fleteros/adelantos/ingresar`. Componente client:
`ingresar-adelanto-client.tsx`.

API: `POST /api/adelantos-fleteros`. Schema:
[`crearAdelantoFleteroSchema`](../../src/lib/financial-schemas.ts).

### Cheque propio

Al elegir tipo `CHEQUE_PROPIO`, el formulario pide datos del cheque (cuenta
chequera, nro, fechas emisión/pago, cláusula, descripciones, mail
beneficiario). El comprobante PDF es obligatorio y se sube a R2 con prefijo
`comprobantes-pago-fletero`.

Backend en transacción:
1. Valida que la cuenta tenga chequera (`tieneChequera: true`).
2. Valida que no exista `ChequeEmitido` duplicado `(nroCheque, cuentaId)`.
3. Crea `ChequeEmitido` con `estado: "EMITIDO"`, `motivoPago: "ADELANTO"`,
   beneficiario = CUIT del fletero, `esElectronico: true`.
4. Crea `AdelantoFletero` con `chequeEmitidoId` apuntando al cheque y
   `comprobanteS3Key`.

Resultado: el cheque aparece automáticamente en cartera de cheques propios.

### Cheque tercero

Al elegir `CHEQUE_TERCERO`, el formulario carga
`/api/cheques-recibidos/en-cartera` y muestra un selector. **El monto del
adelanto se fuerza al monto del cheque** (no editable). El comprobante de
endoso PDF es obligatorio.

Backend en transacción:
1. Valida que el cheque esté en `EN_CARTERA`.
2. Valida que el monto coincida exactamente (vía `importesIguales` de
   `money.ts`).
3. Actualiza el cheque a `ENDOSADO_FLETERO` con
   `endosadoAFleteroId = fletero.id`.
4. Crea `AdelantoFletero` con `chequeRecibidoId` apuntando al cheque.

Resultado: el cheque sale de la cartera de cheques de tercero.

### Otros tipos

`EFECTIVO`, `TRANSFERENCIA`, `COMBUSTIBLE`: solo crea el `AdelantoFletero`,
sin movimiento de cartera. PDF opcional para EFECTIVO y COMBUSTIBLE,
obligatorio para TRANSFERENCIA.

## Aplicación en OP

Al crear una orden de pago, el operador puede descontar adelantos pendientes
del fletero (saldo > 0) como medio de aplicación. Ver
[ordenes-pago.md](./ordenes-pago.md).

Endpoint que lista adelantos disponibles:
`GET /api/fleteros/[id]/adelantos-pendientes`.

Al aplicarlo, se crea `AdelantoDescuento` ligado al LP correspondiente, y
`AdelantoFletero.montoDescontado` se incrementa. Cuando el monto descontado
iguala el monto total, el adelanto pasa a `DESCONTADO_TOTAL`.

## Estados

| Estado | Significado |
|---|---|
| `PENDIENTE_DESCUENTO` | Recién creado, sin descuentos aún |
| `DESCONTADO_PARCIAL` | Algo se aplicó pero queda saldo |
| `DESCONTADO_TOTAL` | Completamente consumido |

## Campos clave

```
AdelantoFletero {
  fleteroId
  tipo                 EFECTIVO | TRANSFERENCIA | COMBUSTIBLE | CHEQUE_PROPIO | CHEQUE_TERCERO
  monto
  fecha
  descripcion
  chequeEmitidoId      // si tipo = CHEQUE_PROPIO
  chequeRecibidoId     // si tipo = CHEQUE_TERCERO
  comprobanteS3Key     // PDF en R2
  montoDescontado      // acumulado de descuentos aplicados
  estado               // PENDIENTE_DESCUENTO | DESCONTADO_PARCIAL | DESCONTADO_TOTAL
}
```

## Gastos a fletero (entidad relacionada pero distinta) {#gastos-fletero}

`GastoFletero` es **otra cosa**: gastos pagados por Transmagg al proveedor
**por cuenta del fletero** (factura a nombre del fletero). Tiene tipos
`COMBUSTIBLE` y `OTRO`. Se descuenta en OPs igual que adelantos, pero su
origen y semántica son distintos.

| | AdelantoFletero | GastoFletero |
|---|---|---|
| Origen | Transmagg da plata al fletero | Transmagg paga a un proveedor por cuenta del fletero |
| Deuda generada | Fletero le debe a Transmagg | Idem, pero por la factura que el proveedor cobró |
| Tabla descuento | `adelanto_descuentos` | `gasto_descuentos` |

En el PDF de OP, ambos aparecen en la sección "Aplicaciones" con etiquetas:
`Adlto Cheque`, `Adlto Transferencia`, `Adlto Efectivo` para los
`AdelantoFletero`, y `Adlto Combustible`, `Adlto` (otros) para los
`GastoFletero`. Ver [ordenes-pago.md](./ordenes-pago.md).
