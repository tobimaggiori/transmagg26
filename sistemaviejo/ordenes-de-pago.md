# Ordenes de Pago — Sistema Viejo Trans-Magg (VB6)

## Resumen general

La Orden de Pago (OP) registra un pago realizado a un fletero (transportista). Puede incluir efectivo, cheques propios, cheques de terceros, y descuentos de adelantos previos (efectivo, gas-oil, faltantes de carga). Se aplica contra liquidaciones/facturas pendientes del fletero.

No es un comprobante fiscal (no va a AFIP). Es un documento interno con numeracion secuencial.

---

## Formularios

- **NuevaOrdenPAgo.frm** — version actual/completa
- **OrdenPago.frm** — version anterior (permite saldo a cuenta)
- **AplicOP.frm** — aplicacion posterior de OPs con saldo
- **Msg_NuevaOP.frm** — dialogo post-grabado con opciones de impresion

---

## Datos que carga el usuario

### Encabezado

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Codigo de Fletero | Codigo numerico del fletero | SI |
| Nombre del Fletero | Razon social | NO — se autocompleta de tabla Fleteros |
| Fecha de la OP | Fecha del pago | SI (default: fecha actual) |
| Numero de OP | Secuencial automatico | NO — se calcula como max(NroOP) + 1 |

### Seleccion de facturas/liquidaciones a cancelar

Al ingresar el fletero se cargan automaticamente las facturas/liquidaciones pendientes (SaldoComp > 0 en CtaCteProv):
- **TipoComp = 60**: Liquidaciones de Producto (busca datos en EncabLProd)
- **Otros TipoComp**: Facturas de proveedor (busca en EncabFactProv)

El usuario hace **doble click** en cada factura para moverla a "Facturas Aplicadas". Se aplica siempre el total completo de cada factura (no permite aplicacion parcial en la version nueva).

| Dato de cada factura | Ingresa el usuario? |
|---------------------|---------------------|
| Numero de factura | NO — viene de la lista |
| Fecha | NO |
| Neto, IVA, Total | NO — se buscan en la tabla de origen |
| Punto de Venta | NO |
| Tipo de Comprobante | NO |

---

## Medios de pago

### 1. Efectivo

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Importe en efectivo | Monto pagado en efectivo | SI |

### 2. Descuentos de adelantos

Se muestran automaticamente los adelantos pendientes del fletero. Para cada linea de descuento:

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Punto de Venta del remito | PtoVta del viaje | SI (o doble-click en pendiente) |
| Remito Nro | Numero de remito del viaje | SI (o doble-click en pendiente) |
| Adelanto en Efectivo | Monto de adelanto en efectivo a descontar | SI |
| Adelanto en Gas-Oil | Monto de gas-oil a descontar | SI |
| Faltantes de carga | Monto de faltantes a descontar | SI |
| Total Descuentos | Suma de todos los descuentos | NO — autocalculado |

Los adelantos de gas-oil pendientes se cargan de la tabla GasOilFleteros (donde Descontada = "NO"). Al hacer doble-click se autocompletant los campos.

**Regla importante**: Los descuentos **suman al Total Pago** porque son valores que ya se entregaron previamente al fletero.

### 3. Cheques Propios (nuevos)

Para cada cheque propio emitido:

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Cuenta Corriente | Numero de cuenta bancaria propia | SI |
| Nombre del Banco | Descripcion del banco | NO — se autocompleta de tabla CtaCtePropias |
| Numero de Cheque | Numero del cheque | SI (validado: no puede estar ya emitido) |
| Fecha de Vencimiento | Vto del cheque | SI |
| Importe | Monto del cheque | SI |

### 4. Cheques Propios Adelantados

Se muestran automaticamente los cheques propios entregados previamente como adelanto (DetAdelCHP donde Descontado = "NO"). El usuario hace doble-click para incluirlos en la OP.

| Dato | Ingresa el usuario? |
|------|---------------------|
| Datos del cheque | NO — vienen del adelanto previo |

### 5. Cheques de Terceros (de cartera)

Se muestra la cartera de cheques de terceros con Estado = "En Cartera", ordenados por fecha de vencimiento. El usuario hace doble-click para seleccionarlos.

| Dato | Ingresa el usuario? |
|------|---------------------|
| Datos del cheque | NO — vienen de ChequesTerc |

### 6. Cheques de Terceros Adelantados

Similar a cheques propios adelantados. Se muestran los de DetAdelCHT donde Descontado = "NO".

---

## Panel de resumen (siempre visible)

| Campo | Contenido | Autocalculado? |
|-------|-----------|----------------|
| Total Neto Facturas Aplicadas | Suma netos | SI |
| Total IVA Facturas Aplicadas | Suma IVA | SI |
| Total General Facturas Aplicadas | Suma totales | SI |
| Total Efectivo | Efectivo ingresado | SI |
| Total Cheques Propios | Suma cheques propios | SI |
| Total Cheques Terceros | Suma cheques terceros | SI |
| Total Adelantos Efectivo | Suma adelantos efvo | SI |
| Total Adelantos Gas-Oil | Suma adelantos gas-oil | SI |
| Total Faltantes de Carga | Suma faltantes | SI |
| **Total Pago** | Suma de todos los medios | SI |
| **DIFERENCIA** | Total Facturas - Total Pago | SI |

---

## Formulas de calculo

```
Total A Pagar = Total General Facturas Aplicadas

Total Pago = Efectivo + Cheques Propios + Cheques Terceros
           + Adelantos Efectivo + Adelantos Gas-Oil + Faltantes de Carga

Diferencia = Total A Pagar - Total Pago
```

**Regla critica (version nueva)**: La diferencia debe ser **exactamente 0** para poder grabar.

**Regla version vieja**: La diferencia debe ser >= 0 (permite saldo a cuenta).

---

## Flujo completo de emision

### 1. Seleccionar fletero
El usuario ingresa el codigo. Se cargan automaticamente:
- Facturas/liquidaciones pendientes
- Cheques propios adelantados pendientes
- Cheques de terceros adelantados pendientes
- Adelantos de gas-oil pendientes

### 2. Seleccionar facturas a cancelar
Doble-click en cada factura pendiente para moverla a "Facturas Aplicadas".

### 3. Cargar medios de pago
En cualquier orden:
- Efectivo + descuentos de adelantos
- Cheques propios (nuevos o adelantados)
- Cheques de terceros (de cartera o adelantados)

### 4. Verificar diferencia = 0

### 5. Grabar
Se escribe en multiples tablas (ver seccion siguiente).

### 6. Post-grabado
Se muestra dialogo con opciones:
- Imprimir cheque formato Banco Santa Fe
- Imprimir cheque formato Banco Macro
- Imprimir Orden de Pago

---

## Operaciones de base de datos al grabar

### 1. EncabOP (Encabezado de la OP)

| Campo | Valor |
|-------|-------|
| NroOP | Secuencial (max + 1) |
| Fecha | Fecha ingresada |
| CodProv | Codigo del fletero |
| TotalOP | Total Pago (suma de todos los medios) |
| TAdelantos | Total adelantos en efectivo |
| TGasOil | Total gas-oil descontado |
| TFalt | Total faltantes descontados |
| TEfvo | Total efectivo |
| TCHPropio | Total cheques propios |
| TCHTerceros | Total cheques de terceros |

### 2. DetOPAdel (Detalle de adelantos descontados)

Un registro por cada linea de descuento.

| Campo | Valor |
|-------|-------|
| NroOP | Numero de la OP |
| NroRemito | Numero del remito del viaje |
| Efvo | Monto adelanto efectivo |
| GasOil | Monto gas-oil |
| Faltante | Monto faltante de carga |

Ademas actualiza GasOilFleteros:
- Si gas-oil descontado = total pendiente: marca Descontada = "SI"
- Si es parcial: reduce el Importe. Si llega a 0, marca como descontada.

### 3. CtaCteProv (Cuenta Corriente del Fletero)

Se inserta un movimiento:

| Campo | Valor |
|-------|-------|
| Fecha | Fecha de la OP |
| CodProv | Codigo del fletero |
| PtoVta | 1 (hardcodeado) |
| NroComp | Numero de la OP |
| TipoComp | **11** (Orden de Pago) |
| Debe | Total Pago |
| SaldoComp | 0 (en version nueva) / Diferencia (en version vieja) |

La OP va al **DEBE** — reduce lo que Trans-Magg le debe al fletero.

### 4. Actualizacion de saldos de facturas

Para cada factura aplicada:
- Busca en CtaCteProv por CodProv + NroComp + PtoVta + TipoComp
- Pone SaldoComp = 0 (version nueva) / resta el importe (version vieja)

### 5. AplicOP (Detalle de aplicacion)

Un registro por cada factura aplicada.

| Campo | Valor |
|-------|-------|
| NroOP | Numero de la OP |
| PtoVta | Punto de venta de la factura |
| NroFact | Numero de la factura |
| ImpAplic | Importe aplicado (= total de la factura) |
| TipoComp | Tipo de comprobante de la factura |

En version vieja, si hay saldo a cuenta se agrega un registro con ACta = "SI".

### 6. Cheques propios emitidos

Para cada cheque propio:

**Tabla ChEmitidos:**

| Campo | Valor |
|-------|-------|
| Fecha | Fecha de vencimiento |
| CtaCte | Cuenta corriente bancaria |
| CodComp | 11 (Orden de Pago) |
| NroComp | Numero del cheque |
| NroMov | Numero de la OP |
| Haber | Importe del cheque |
| Estado | "Pendiente" |
| FEmision | Fecha de la OP |
| Dado | Nombre del fletero |
| Adel | "SI" si era adelanto, "NO" si es nuevo |

**Tabla CtaCteBco (movimiento bancario):**

| Campo | Valor |
|-------|-------|
| Fecha | Fecha de vencimiento |
| CtaCte | Cuenta corriente bancaria |
| CodComp | 1 |
| NroComp | Numero del cheque |
| Haber | Importe del cheque |
| Conciliado | False |

**Tabla DetOPCHPropios:**

| Campo | Valor |
|-------|-------|
| NroOP | Numero de la OP |
| Cuenta | Cuenta corriente bancaria |
| Importe | Monto del cheque |
| Vto | Fecha de vencimiento |
| NroCH | Numero del cheque |

Si era adelanto: actualiza DetAdelCHP poniendo Descontado = "SI".

### 7. Cheques de terceros entregados

Para cada cheque de terceros:

**Tabla ChequesTerc (actualizacion):**

| Campo | Valor anterior | Valor nuevo |
|-------|---------------|-------------|
| Estado | "En Cartera" | "Orden de Pago" |
| Dado | (vacio) | Nombre del fletero |
| FEntregado | (vacio) | Fecha de la OP |

**Tabla DetOPCHT:**

| Campo | Valor |
|-------|-------|
| NroOP | Numero de la OP |
| CodBco | Codigo del banco |
| Vto | Fecha de vencimiento |
| Importe | Monto del cheque |
| NroCH | Numero del cheque |

Si era adelanto: actualiza DetAdelCHT poniendo Descontado = "SI".

---

## Aplicacion posterior (AplicOP.frm)

Cuando una OP queda con saldo a cuenta (solo version vieja), se puede aplicar despues:

1. Ingresar codigo de fletero
2. Se cargan comprobantes pendientes:
   - **Facturas/LP** (TipoComp 1, 60): lista "Facturas"
   - **OPs/NC** (TipoComp 11, 3, 18): lista "Ordenes de Pago"
3. Seleccionar una OP (doble-click)
4. Seleccionar facturas (doble-click)
5. Los totales deben coincidir exactamente
6. Al grabar: reduce SaldoComp de ambos, inserta en AplicOP

---

## Relacion con Adelantos (Adelantos.frm)

Los adelantos son pagos anticipados al fletero. Tienen 3 tipos:
- **Efectivo**: se graba en EncabAdel.TEfvo
- **Cheques propios**: se registran en DetAdelCHP con Descontado = "NO"
- **Cheques de terceros**: se registran en DetAdelCHT con Descontado = "NO". El cheque cambia estado a "Adelanto" en ChequesTerc.

**Los adelantos NO registran movimiento en CtaCteProv.** Solo la OP que los descuenta lo hace.

Al crear la OP, los adelantos pendientes aparecen automaticamente y al incluirlos se marcan como Descontado = "SI".

---

## Impacto en el sistema

### Cuenta Corriente del Fletero (CtaCteProv)

- La OP aparece con TipoComp = 11 en columna **DEBE**
- Reduce el saldo: `Saldo = Saldo - Debe + Haber`
- Las facturas/LP aplicadas quedan con SaldoComp = 0

### Cheques propios

- Se registran en ChEmitidos con Estado = "Pendiente"
- Se registra movimiento en CtaCteBco (cuenta corriente bancaria)
- Quedan pendientes de acreditacion/debito real en el banco

### Cheques de terceros

- Cambian de Estado "En Cartera" a "Orden de Pago"
- Se registra a quien se entregaron y cuando
- Salen de la cartera disponible

### Gas-oil

- Se marca como descontado en GasOilFleteros
- Soporta descuento parcial (reduce el importe pendiente)

---

## Impresion de la OP

**Encabezado:**
- "TRANSPORTE TRANS-MAGG"
- "Orden de Pago"
- "Orden Nro 0001-NNNNNNNN"
- Fecha
- Datos del fletero: Codigo, Nombre, Domicilio, Localidad, Situacion IVA, CUIT

**Seccion "Comprobantes Cancelados":**
- Lista de facturas aplicadas con numero y monto
- Si hay saldo a cuenta: "A Cuenta" + importe

**Seccion "Detalle Orden de Pago":**
- Efectivo (si hay)
- Adelantos: tabla con Efectivo, GasOil, Faltante, Remito
- Total Adelantos
- Cheques de Terceros: Banco, NroCH, Importe
- Total Cheques de Terceros
- Cheques Propios: Cuenta, NroCH, Importe
- Total Cheques Propios

---

## Diferencias entre version nueva y vieja

| Aspecto | NuevaOrdenPAgo.frm | OrdenPago.frm |
|---------|-------------------|---------------|
| Diferencia permitida | Exactamente 0 | >= 0 (permite a cuenta) |
| Aplicacion de facturas | Doble-click, total completo | Manual, permite parcial |
| Saldo a cuenta | No permitido | Si, se graba en AplicOP con ACta="SI" |
| Limite de cheques | Sin limite | Max 7 cheques propios |
| Numero de OP visible | Oculto (auto) | Visible (readonly) |

---

## Reglas de negocio criticas

1. **La OP es un pago al fletero**, no una compra.
2. **Diferencia = 0 para grabar** (version nueva). No puede quedar sobrante.
3. **6 medios de pago**: efectivo, cheques propios nuevos, cheques propios adelantados, cheques terceros de cartera, cheques terceros adelantados, descuentos (adelantos efvo + gas-oil + faltantes).
4. **Los descuentos de adelantos suman al Total Pago** (porque ya se pagaron antes).
5. **Los adelantos NO van a CtaCteProv**. Solo la OP registra el movimiento.
6. **Numeracion secuencial global**, no por fletero ni por año.
7. **Punto de venta fijo**: 1 en CtaCteProv, "0001" en impresion.
8. **No hay retenciones impositivas** en el sistema viejo.
9. **No hay transferencia bancaria** como medio de pago en el sistema viejo.
10. **No es comprobante fiscal** — no pasa por ARCA/AFIP.
11. **Gas-oil soporta descuento parcial** — reduce importe pendiente.

---

## Estructura de tablas (reconstruida del codigo)

### EncabOP
```
NroOP         Long (PK, autoincremental)
Fecha         Date
CodProv       Long (FK a Fleteros)
TotalOP       Double
TAdelantos    Double
TGasOil       Double
TFalt         Double
TEfvo         Double
TCHPropio     Double
TCHTerceros   Double
```

### AplicOP
```
NroOP         Long (FK a EncabOP)
PtoVta        Long
NroFact       Long
ImpAplic      Double
TipoComp      Long
ACta          String ("SI" si es saldo a cuenta)
```

### DetOPAdel
```
NroOP         Long (FK a EncabOP)
NroRemito     Long
Efvo          Double
GasOil        Double
Faltante      Double
```

### DetOPCHPropios
```
NroOP         Long (FK a EncabOP)
Cuenta        String (cuenta corriente bancaria)
Importe       Double
Vto           Date
NroCH         String
```

### DetOPCHT
```
NroOP         Long (FK a EncabOP)
CodBco        Long (FK a Bancos)
Vto           Date
Importe       Double
NroCH         String
```

### ChEmitidos
```
Fecha         Date (fecha vto)
CtaCte        String
CodComp       Long (11 = OP)
NroComp       String (nro cheque)
NroMov        Long (nro OP)
Haber         Double
Estado        String ("Pendiente")
FEmision      Date
Dado          String (nombre fletero)
Adel          String ("SI" / "NO")
```

### GasOilFleteros
```
CodProv       Long
Importe       Double
Descontada    String ("SI" / "NO")
```

### DetAdelCHP / DetAdelCHT
```
NroAdel       Long
Cuenta/CodBco ...
Importe       Double
Vto           Date
NroCH         String
Descontado    String ("SI" / "NO")
CodProv       Long
```
