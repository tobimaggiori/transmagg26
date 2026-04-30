# Cheques (propios y de tercero)

## Modelos

| Modelo | Descripción |
|---|---|
| `ChequeEmitido` | Cheque propio emitido por Transmagg (cartera propia) |
| `ChequeRecibido` | Cheque de tercero recibido por Transmagg (cartera de terceros) |

## Cheque propio (`ChequeEmitido`)

```
ChequeEmitido {
  cuentaId            // chequera (Cuenta con tieneChequera=true)
  nroCheque
  tipoDocBeneficiario // CUIT | CUIL | CDI
  nroDocBeneficiario
  monto
  fechaEmision, fechaPago
  motivoPago          // VARIOS | FACTURA | ORDEN_DE_PAGO | ALQUILER | EXPENSAS | SERVICIOS | ADELANTO
  clausula            // A_LA_ORDEN | NO_A_LA_ORDEN
  estado              // PENDIENTE_EMISION | EMITIDO | DEPOSITADO | RECHAZADO
  esElectronico       // siempre true (Transmagg solo emite ECheq)
  fleteroId | proveedorId  // beneficiario
  liquidacionId  // contexto opcional
}
```

### Origen

- **Adelanto a fletero** tipo `CHEQUE_PROPIO`: ver [adelantos.md](./adelantos.md).
  Crea cheque con `motivoPago: "ADELANTO"`.
- **Pago a fletero en OP** tipo `CHEQUE_PROPIO`: ver [ordenes-pago.md](./ordenes-pago.md).
  Crea cheque con `motivoPago: "ORDEN_DE_PAGO"`.
- **Pago a proveedor**.

### Validaciones al crear

- La cuenta debe tener `tieneChequera: true`.
- No debe existir ya un cheque con el mismo `(nroCheque, cuentaId)`.
- Beneficiario obligatorio (`fleteroId` o `proveedorId`).

## Cheque tercero (`ChequeRecibido`)

```
ChequeRecibido {
  empresaId | brokerOrigenId | proveedorOrigenId  // origen
  facturaId                // factura cobrada con este cheque (puede ser null)
  nroCheque, bancoEmisor
  monto
  fechaEmision, fechaCobro
  estado                   // EN_CARTERA | DEPOSITADO | ENDOSADO_FLETERO | ENDOSADO_PROVEEDOR | ENDOSADO_BROKER | DESCONTADO_BANCO | RECHAZADO
  cuentaDepositoId         // si se depositó
  endosadoATipo, endosadoAFleteroId, endosadoAProveedorId, endosadoABrokerId
  esElectronico
}
```

### Origen

- **Recibo de cobranza a empresa** con cheque como medio de pago.
- **Adelanto recibido sin factura** (`POST /api/cheques-recibidos/adelanto`).
- **Cheque de proveedor** (caso menos común).

### Estados de salida

Un cheque en `EN_CARTERA` puede:

- **Depositarse** en una cuenta bancaria → `DEPOSITADO`.
- **Endosarse a un fletero** (en una OP, como medio de pago o como
  adelanto) → `ENDOSADO_FLETERO`.
- **Endosarse a un proveedor**.
- **Endosarse a un broker**.
- **Descontarse en banco** → `DESCONTADO_BANCO`.
- **Ser rechazado** → `RECHAZADO`.

## Cartera

Vista de cheques propios + tercero: `/contabilidad/chequeras`. Implementación
en `src/app/(dashboard)/contabilidad/chequeras/`.

## API endpoints relevantes

| Endpoint | Uso |
|---|---|
| `GET /api/cheques-recibidos/en-cartera` | Lista cheques `EN_CARTERA` para selectores |
| `POST /api/cheques-recibidos/adelanto` | Recibir cheque sin factura asociada |
| `POST /api/cheques-emitidos` | Crear cheque emitido (manual) |
| `GET /api/cheques-emitidos/disponibles` | Cheques en estado `EMITIDO` sin uso |
| `POST /api/cheques-emitidos/registrar-deposito` | Marcar como depositado |


## Pendiente de profundizar en doc

Esta página es un esqueleto. Quedan por documentar en detalle:

- Flujo completo de aplicación de cheque a recibo de cobranza.
- Manejo de rechazos (NC/ND y reversiones).
- Reportes y conciliación con extracto bancario.
- Estados de transición permitidos (máquina de estados completa).

Ver `sistemaviejo/cheques.md` para contexto histórico exhaustivo.
