# Cuentas Corrientes — Sistema Viejo Trans-Magg (VB6)

## Resumen general

El sistema maneja tres cuentas corrientes independientes:
- **CtaCteEmp** — Cuenta corriente de empresas (clientes)
- **CtaCteProv** — Cuenta corriente de fleteros/proveedores
- **CtaCteBco** — Cuenta corriente bancaria

Cada cuenta corriente tiene la misma estructura basica: movimientos con Fecha, comprobante, Debe, Haber y SaldoComp. La diferencia clave es que **empresas y fleteros tienen la logica de signos invertida**.

---

## Estructura de las tablas

### CtaCteEmp (Empresas/Clientes)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| Fecha | Date | Fecha del movimiento |
| CodEmp | Numerico | Codigo de la empresa |
| PtoVta | Numerico | Punto de venta del comprobante |
| NroComp | Numerico | Numero de comprobante |
| TipoComp | Numerico | Tipo de comprobante (FK a tabla Comprobantes) |
| Debe | Numerico | Importe en columna Debe (nullable) |
| Haber | Numerico | Importe en columna Haber (nullable) |
| SaldoComp | Numerico | Saldo individual del comprobante |

### CtaCteProv (Fleteros/Proveedores)

Estructura identica pero con `CodProv` en vez de `CodEmp`.

### CtaCteBco (Bancaria)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| Fecha | Date | Fecha del movimiento |
| CtaCte | Texto | Numero de cuenta bancaria (FK a CtaCtePropias) |
| NroMov | Numerico | Numero de movimiento |
| CodComp | Numerico | Codigo de concepto bancario (FK a ConceptoBco) |
| NroComp | Numerico | Numero de comprobante asociado |
| Debe | Numerico | Importe Debe |
| Haber | Numerico | Importe Haber |
| Conciliado | Boolean | True/False para conciliacion bancaria |
| Obs | Texto | Observaciones |

---

## Calculo de saldo corrido

### Empresas (CtaCteEmp)

```
Saldo = Saldo anterior + Debe - Haber
```

- **Saldo positivo** = la empresa nos debe dinero
- **Saldo negativo** = le debemos a la empresa (tiene saldo a favor)

| Tipo de movimiento | Columna | Efecto |
|-------------------|---------|--------|
| Factura, ND | Debe | Saldo SUBE (empresa debe mas) |
| Recibo, NC | Haber | Saldo BAJA (empresa paga/acredita) |

### Fleteros (CtaCteProv) — LOGICA INVERTIDA

```
Saldo = Saldo anterior - Debe + Haber
```

- **Saldo positivo** = le debemos al fletero
- **Saldo negativo** = el fletero nos debe

| Tipo de movimiento | Columna | Efecto |
|-------------------|---------|--------|
| LP, Factura proveedor, ND | Haber | Saldo SUBE (le debemos mas) |
| OP, NC | Debe | Saldo BAJA (le pagamos/descontamos) |

### Bancos (CtaCteBco)

```
Saldo = Saldo anterior + Debe - Haber
```

Misma logica que empresas.

---

## Saldo inicial en consultas

Al consultar un rango de fechas, el sistema calcula el **saldo inicial** sumando todos los movimientos anteriores a la fecha desde:

**Empresas:**
```
SaldoInicial = SUM(Debe) - SUM(Haber) WHERE Fecha < FechaDesde
```

**Fleteros:**
```
SaldoInicial = SUM(Haber) - SUM(Debe) WHERE Fecha < FechaDesde
```

Se muestra como primera fila "Saldo Inicial" antes de los movimientos del rango.

---

## SaldoComp: saldo individual del comprobante

Cada movimiento tiene un `SaldoComp` que representa **cuanto queda por cancelar** de ese comprobante individual.

- Al crear una factura: `SaldoComp = TotalFactura`
- Al crear un recibo: `SaldoComp = Diferencia` (parte no aplicada, "a cuenta")
- Al crear una NC: `SaldoComp = TotalNC`
- Al crear una OP: `SaldoComp = Diferencia` (parte no aplicada)
- Al aplicar un recibo/NC contra una factura: se reduce el `SaldoComp` de **ambos** comprobantes
- Cuando `SaldoComp = 0`, el comprobante esta totalmente cancelado

El SaldoComp es **independiente del saldo corrido**. Un comprobante puede tener SaldoComp > 0 (pendiente de cancelar) aunque el saldo corrido de la cuenta sea 0.

---

## Como cada operacion genera movimientos

### En CtaCteEmp (empresas)

| Operacion | TipoComp | Columna | SaldoComp inicial |
|-----------|----------|---------|-------------------|
| Factura viajes (manual) | 1 | Debe | Total factura |
| Factura Electronica A | 16 | Debe | Total factura |
| Factura MiPyme | 201 | Debe | Total factura |
| Factura LP (a empresa) | 60 | Debe | Total factura |
| Factura Cta y Orden | 13 | Debe | Total factura |
| NC vieja | 2 | Haber | Total NC |
| NC Electronica A | 17 | Haber | Total NC |
| NC Cta y Orden | 14 | Haber | Total NC |
| NC MiPyme | 203 | Haber | Total NC |
| NC LP | 90 | Haber | Total NC |
| ND | 18 | Debe | Total ND |
| ND MiPyme | 202 | Debe | Total ND |
| Recibo de Cobranza | 6 | Haber | Diferencia (a cuenta) |

### En CtaCteProv (fleteros)

| Operacion | TipoComp | Columna | SaldoComp inicial |
|-----------|----------|---------|-------------------|
| Liquido Producto | 60 | Haber | Total LP |
| Factura proveedor | 1 | Haber | Total factura |
| Factura comision (LP) | 4 | Debe | Total comision |
| Orden de Pago | 11 | Debe | Diferencia (a cuenta) |
| NC (de Trans-Magg al fletero) | 17, 203 | Debe | Total NC |
| ND (de Trans-Magg al fletero) | 18 | Haber | Total ND |

### En CtaCteBco (bancos)

| Operacion | Columna | Descripcion |
|-----------|---------|-------------|
| Cheque propio emitido | Haber | Egreso de la cuenta |
| Deposito de cheque terceros | Debe | Ingreso a la cuenta |
| Otros movimientos | Debe/Haber | Segun tipo de concepto bancario |

---

## Aplicacion de comprobantes

### AplicComprobantes.frm — Empresas

Permite cruzar facturas pendientes con recibos y/o NC para cancelar saldos.

**Tres listas:**
1. **Facturas pendientes** (SaldoComp > 0): TipoComp = 1, 3, 13, 16, 18, 60, 201, 202
2. **NC pendientes** (SaldoComp > 0): TipoComp = 2, 14, 17, 203
3. **Recibos pendientes** (SaldoComp > 0): TipoComp = 6

**Regla clave**: ND (TipoComp=18) se clasifica como **factura** (porque aumenta deuda). NC se usa igual que un recibo para cancelar facturas.

**Flujo:**
1. Seleccionar una factura
2. Seleccionar una NC o un recibo
3. Ingresar importe a aplicar (no puede superar el saldo de ninguno)
4. Se reduce SaldoComp de ambos comprobantes
5. Se graba en tabla `AplicRec`: NroRec, NroFact, PtoVta, ImpAplic

### AplicOP.frm — Fleteros

Permite cruzar OPs con saldo "a cuenta" contra facturas/LP pendientes del fletero.

**Dos listas:**
1. **Facturas/LP** (SaldoComp > 0): TipoComp = 1, 60
2. **OPs/NC** (SaldoComp > 0): TipoComp = 11, 3, 18

**Flujo:**
1. Seleccionar una OP (solo una a la vez)
2. Seleccionar una o mas facturas
3. Los totales deben coincidir exactamente
4. Se reduce SaldoComp de todos los comprobantes
5. Se graba en tabla `AplicOP`: NroOP, NroFact, PtoVta, ImpAplic, TipoComp

---

## Consultas de cuenta corriente

### ConsCtaCteEmp.frm — Empresas

**Filtros:** Codigo de empresa + Fecha desde + Fecha hasta

**Columnas:**
1. Fecha
2. CodComp (codigo del tipo)
3. Comprobante (descripcion, de tabla Comprobantes)
4. Numero (formateado PPPP-NNNNNNNN)
5. Debe
6. Haber
7. Saldo (corrido acumulado)
8. Saldo Comp (individual del comprobante)

**Drill-down al hacer click:**
- TipoComp 13 (Factura Cta y Orden): abre informe con detalle de viajes
- TipoComp 14 (NC Cta y Orden): abre informe con aplicacion de la NC

**Acciones:** Consultar, Imprimir (directo a impresora)

### ConsCtaCteFlet.frm — Fleteros

Identica estructura pero:
- Usa tabla CtaCteProv con CodProv
- Saldo calculado con logica invertida (- Debe + Haber)
- Boton "DEJA EN CERO" visible

### ConsCtaCteBco.frm — Bancos

**Filtros:** Numero de cuenta bancaria + Fecha desde + Fecha hasta

**Columnas:** Fecha, Comprobante (concepto bancario), Numero, Debe, Haber, Saldo, Obs

---

## Saldo a cero

### SaldoCero.frm — En lote

Opera sobre una lista predefinida de cuentas (tabla `SaldoCero`).

**Para empresas:**
- Calcula saldo acumulado hasta la fecha indicada
- Inserta un registro de ajuste inverso:
  - Si empresa debe (saldo > 0): `Haber = saldo`, para dejarlo en 0
  - Si empresa tiene a favor (saldo < 0): `Debe = saldo * -1`, para dejarlo en 0
- NroComp = 999 (ficticio), TipoComp = 1 o 4, SaldoComp = 0

**Para fleteros:**
- Misma logica pero sobre CtaCteProv con signos invertidos

### Boton "DEJA EN CERO" — Individual

Disponible en ConsCtaCteEmp y ConsCtaCteFlet. Hace lo mismo que SaldoCero pero para la cuenta que se esta consultando.

**Regla:** Nunca se borran registros. Se insertan asientos de ajuste.

---

## Saldos historicos

### ConsSaldoHistoricos.frm

Genera informe de saldos acumulados hasta una fecha para todas las cuentas.

**Para empresas:**
- Recorre CtaCteEmp agrupando por empresa
- Calcula: `Saldo = SUM(Debe) - SUM(Haber)` por empresa
- Solo muestra cuentas con saldo <> 0

**Para fleteros:**
- Recorre CtaCteProv agrupando por proveedor
- Calcula: `Saldo = SUM(Haber) - SUM(Debe)` por proveedor (invertido)
- Solo muestra cuentas con saldo <> 0

### SaldosEmpresas.frm

Muestra comprobantes individuales con SaldoComp <> 0.

- NC/Recibos: importe y SaldoComp se muestran como **negativos** (`* -1`)
- Facturas/ND: importe y SaldoComp positivos
- Filtros: todos/un cliente/rango, fechas opcionales, orden por codigo o razon social

---

## Conciliacion bancaria

### ConciliacionBancaria.frm

3 pestanas:
1. **General**: todos los movimientos
2. **Conciliado**: solo movimientos con `Conciliado = True`
3. **Pendiente**: movimientos con `Conciliado = False`, con checkboxes

**Flujo:**
1. Seleccionar cuenta bancaria y rango de fechas
2. Ir a pestana "Pendiente"
3. Tildar los movimientos que coinciden con el extracto bancario
4. Presionar "Grabar Conciliacion" → actualiza `Conciliado = True`

Tambien permite imprimir cheques emitidos pendientes.

---

## Tablas auxiliares

| Tabla | Proposito |
|-------|-----------|
| Comprobantes | Maestra de tipos (CodComp, DescComp, UltNro) |
| ConceptoBco | Maestra de conceptos bancarios (CodConcepto, descconcepto) |
| CtaCtePropias | Maestra de cuentas bancarias propias (CtaCte, DescBco) |
| AplicRec | Aplicacion recibos vs facturas (NroRec, NroFact, PtoVta, ImpAplic, ACta) |
| AplicOP | Aplicacion OPs vs facturas (NroOP, NroFact, PtoVta, ImpAplic, TipoComp, ACta) |
| SaldoCero | Lista de cuentas a cerrar en lote (Cod) |

---

## Reglas de negocio criticas

1. **Dos tablas con logica invertida**: CtaCteEmp (`+Debe -Haber`) y CtaCteProv (`-Debe +Haber`). Nunca mezclar las formulas.

2. **SaldoComp es independiente del saldo corrido**. Se puede tener saldo corrido = 0 con comprobantes individuales con SaldoComp > 0 (y viceversa).

3. **La aplicacion es manual**. El usuario debe cruzar comprobantes explicitamente en AplicComprobantes (empresas) o AplicOP (fleteros). No es automatica.

4. **Nunca se borran registros**. Los ajustes se hacen insertando asientos de cierre (NroComp=999).

5. **ND se clasifica como factura** en aplicacion (porque aumenta deuda). NC se clasifica como recibo (porque reduce deuda).

6. **SaldoComp de recibos y OPs puede ser > 0** si quedaron "a cuenta" (no se aplicaron completamente contra facturas).

7. **El saldo corrido se calcula on-the-fly** en cada consulta. No se almacena. Solo se almacena SaldoComp (saldo individual).

8. **Los comprobantes con SaldoComp = 0 ya no aparecen** en las pantallas de aplicacion ni en los listados de saldos pendientes.

9. **El saldo a cero no borra nada** — inserta un movimiento de ajuste inverso con NroComp=999 y SaldoComp=0.

10. **La conciliacion bancaria es manual** — checkbox por cada movimiento que coincide con el extracto.
