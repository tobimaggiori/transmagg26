# Liquidaciones a Fleteros — Sistema Viejo Trans-Magg (VB6)

## Resumen general

La liquidacion a fleteros es un proceso de **3 pasos** que registra los viajes realizados por un fletero, genera el comprobante fiscal, y realiza el pago:

```
PASO 1: Liquidacion interna (Liquidaciones.frm)
   → Registra viajes + descuentos + calcula comisiones
   → Documento interno, no fiscal
   
PASO 2: Comprobante fiscal tipo 60 (LiqProducto.frm)
   → Genera Cuenta de Venta y Liquido Producto ante AFIP
   → Obtiene CAE
   → Genera deuda en cuenta corriente del fletero

PASO 3: Pago al fletero (LiquidoProducto.frm)
   → Aplica facturas pendientes
   → Deduce comisiones + adelantos
   → Registra forma de pago (efectivo + cheques)
   → Genera Factura de Comision (tipo AFIP 1)
   → Cancela saldo en cuenta corriente
```

---

## PASO 1: Liquidacion interna (Liquidaciones.frm)

### Datos que carga el usuario

#### Encabezado

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Codigo de Fletero | Codigo numerico | SI |
| Nombre del Fletero | Razon social | NO — autocompleta de tabla Fleteros |
| Fecha | Fecha de la liquidacion | SI (default: fecha actual) |
| Observaciones | Texto libre (max 50 chars) | SI |
| Porcentaje de Comision | % que cobra Trans-Magg | NO — autocompleta de tabla Fleteros |
| Situacion IIBB | "Exento" o "Agente de Retencion" | NO — autocompleta de tabla Fleteros |
| Porcentaje IIBB | % de retencion IIBB | NO — autocompleta de tabla Fleteros |

#### Viajes (el usuario carga cada viaje manualmente)

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Fecha del viaje | | SI |
| Codigo de Empresa | Cliente del viaje | SI (o busca con F3) |
| Nombre de Empresa | | NO — autocompleta |
| Nro Remito (carta de porte) | Validado contra duplicados | SI |
| Codigo de Chofer | | SI (o busca con F3) |
| Nombre de Chofer | | NO — autocompleta |
| Mercaderia | Tipo de carga | SI |
| Procedencia | Origen | SI |
| Destino | | SI |
| Kilos | Peso de la carga | SI |
| Tarifa | Tarifa del fletero (por tonelada) | SI |
| Provincia | | SI (combo) |

#### Descuentos (el usuario puede cargar multiples lineas)

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Nro Remito | Del viaje al que aplica | SI (o doble-click en pendiente) |
| Adelanto Efectivo | Monto adelantado en efectivo | SI |
| Adelanto Gas-Oil | Monto de gas-oil | SI |
| Faltantes de carga | Monto de faltantes | SI |

Los adelantos de gas-oil pendientes se cargan automaticamente de tabla GasOilFleteros.

### Formulas de calculo

**SubTotal por viaje:**
```
SubTotal = (Kilos / 1000) * Tarifa
```

**Totales al agregar cada viaje:**
```
Neto Viajes += SubTotal
IVA Viajes += SubTotal * 21 / 100
Retencion IIBB = Neto Viajes * %IIBB / 100      (si aplica)
Total Viajes = Neto Viajes + IVA Viajes + Ret IIBB

Comision Neta = Neto Viajes * %Comision / 100
IVA Comision = Comision Neta * 21 / 100
Total Comision = Comision Neta + IVA Comision

Total Descuentos = Suma de (Efvo + Gas-Oil + Faltantes) de cada linea

Total a Pagar = Total Viajes - Total Comision - Total Descuentos
```

### Campos del resumen (todos autocalculados)

| Campo | Contenido |
|-------|-----------|
| Neto Viajes | Suma de subtotales |
| IVA Viajes | Neto * 21% |
| Retencion IIBB | Neto * %IIBB (si aplica) |
| Total Viajes | Neto + IVA + Ret IIBB |
| Comision Neta | Neto * %Comision |
| IVA Comision | Comision Neta * 21% |
| Total Comision | Comision Neta + IVA Comision |
| Total Descuentos | Suma descuentos |
| **Total a Pagar** | Total Viajes - Total Comision - Total Descuentos |

### Tablas escritas al grabar

| Tabla | Campos clave |
|-------|-------------|
| EncabLiquidacion | NroLiq, CodFlet, Fecha, Obs, TNetoViajes, TIVAViajes, TViajes, TNetoComis, TIVAComis, TComis, TDescuentos, TPagar, Pagada="NO", RetIIBB |
| LiqDetViajes | NroLiq, CodEmpresa, Fecha, NroRemito, Mercaderia, Procedencia, Destino, Kilos, Tarifa, SubTotal, Facturado="NO", CodFlet |
| LiqDetDescuentos | NroLiq, NroRemito, Efvo, Gas-Oil, Faltante |
| ViajesFactura | Copia de viajes para facturacion posterior, Facturado="NO" |
| GasOilFleteros | Actualiza: Descontada="SI" o reduce importe parcial |

La liquidacion queda con `Pagada = "NO"` hasta que se genera el Liquido Producto.

---

## PASO 2: Comprobante fiscal tipo 60 (LiqProducto.frm)

### Datos que carga el usuario

#### Encabezado

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Codigo de Fletero | | SI |
| Nombre del Fletero | | NO — autocompleta |
| Comision % | | NO — autocompleta de tabla Fleteros |
| Fecha | | SI |

#### Viajes (el usuario carga cada viaje)

Mismos campos que en Liquidaciones.frm: Fecha, Empresa, Remito, Chofer, Mercaderia, Procedencia, Destino, Kilos, Tarifa, Provincia, Cupo.

### Formulas de calculo

**DIFERENCIA CRITICA con Paso 1**: La comision se **resta del neto ANTES de calcular IVA**:

```
Viajes Bruto = Suma de SubTotales
Comision Neta = Viajes Bruto * %Comision / 100
IVA Comision = Comision Neta * 21 / 100
Total Comision = Comision Neta + IVA Comision

Neto Comprobante = Viajes Bruto - Comision Neta     ← comision restada del neto
IVA Comprobante = Neto Comprobante * 21 / 100
Total Comprobante = Neto Comprobante + IVA Comprobante
```

El neto que va al comprobante fiscal es `Viajes Bruto - Comision Neta`, no el bruto.

### Campos del resumen

| Campo | Contenido |
|-------|-----------|
| Sub Total | Viajes Bruto (suma de subtotales) |
| Comision | Comision Neta |
| Neto | Viajes Bruto - Comision Neta |
| IVA | Neto * 21% |
| Total | Neto + IVA |

### Bifurcacion segun fletero

- **CodFlet = 1107** (fletero propio): solo graba en tablas internas, SIN comprobante fiscal ni CAE
- **Otros fleteros**: genera comprobante fiscal tipo 60 con CAE

### Integracion AFIP

- Tipo comprobante: 60 (Cuenta de Venta y Liquido Producto)
- Punto de venta: 4
- Concepto: 2 (Servicios)
- Documento: 80 (CUIT)
- IVA: Id=5 (21%)
- Moneda: PES, Cotizacion 1
- Genera QR fiscal

### Tablas escritas al grabar

| Tabla | Campos clave |
|-------|-------------|
| EncabLProd | PtoVta=4, NroComp, Fecha, CodFlet, TotalViajes (bruto), NetoComis, IVAComis, TotalComis, NetoViajes (=bruto-comis), IVAViaje, TotalViajes1 (=neto+iva), TipoAFIP=60, TipoSistema=60, CAE, VtoCAE |
| DetViajesLP | PtoVta=4, NroComp, datos de cada viaje, Facturado="NO" |
| LiqDetViajes | Copia de viajes |
| ViajesFactura | Copia para facturacion posterior |
| CtaCteProv | CodProv, PtoVta=4, NroComp, TipoComp=60, **Haber**=Total, SaldoComp=Total |

El comprobante va al **HABER** de CtaCteProv — genera deuda de Trans-Magg hacia el fletero.

---

## PASO 3: Pago al fletero (LiquidoProducto.frm)

### Datos que carga el usuario

#### Encabezado

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Codigo de Fletero | | SI |
| Nombre del Fletero | | NO — autocompleta |
| Fecha | | SI |

#### Seleccion de facturas pendientes

Al ingresar el fletero se cargan automaticamente las facturas del proveedor (fletero) con saldo > 0 desde CtaCteProv / EncabFactProv. El usuario hace **doble-click** para seleccionar cada factura.

Al seleccionar una factura, el sistema busca automaticamente la liquidacion asociada y acumula:
- Comisiones (neta, IVA, total)
- Adelantos en efectivo
- Adelantos en gas-oil
- Faltantes de carga

#### Medios de pago

| Medio | Ingresa el usuario? |
|-------|---------------------|
| Efectivo | SI — ingresa el monto |
| Cheques propios | SI — ingresa cuenta, numero, vto, importe (max 7) |
| Cheques propios adelantados | PARCIAL — doble-click para incluir |
| Cheques de terceros (de cartera) | PARCIAL — doble-click para seleccionar |
| Cheques de terceros adelantados | PARCIAL — doble-click para incluir |

### Formulas de calculo

```
Total A Pagar = Total General Facturas Aplicadas

Deducciones automaticas = Comisiones + Adelantos Efvo + Gas-Oil + Faltantes
Lo que falta pagar = Total A Pagar - Deducciones

El usuario cubre lo que falta con: Efectivo + Cheques Propios + Cheques Terceros

Total Pago = Deducciones + Efectivo + Cheques Propios + Cheques Terceros
Diferencia = Total A Pagar - Total Pago
```

**REGLA CRITICA**: Diferencia debe ser **exactamente 0** para grabar.

### Campos del resumen (todos autocalculados)

| Campo | Contenido |
|-------|-----------|
| Total Neto Facturas | Suma netos facturas aplicadas |
| Total IVA Facturas | Suma IVA |
| Total General Facturas | Suma totales |
| Neto Comision | Suma comisiones netas |
| IVA Comision | Suma IVA comisiones |
| Total Comision | Suma total comisiones |
| Total Efectivo | Monto en efectivo |
| Total Cheques Propios | Suma cheques propios |
| Total Cheques Terceros | Suma cheques terceros |
| Total Adelantos Efvo | Suma adelantos |
| Total Gas-Oil | Suma gas-oil |
| Total Faltantes | Suma faltantes |
| **Total Pago** | Suma de todo |
| **DIFERENCIA** | Total Facturas - Total Pago |

### Tablas escritas al grabar

#### 1. EncabLP (Encabezado del Liquido Producto)

| Campo | Valor |
|-------|-------|
| NroLP | Secuencial |
| Fecha | Fecha ingresada |
| CodFlet | Codigo del fletero |
| TotalLP | Total Pago |
| TNComis, IVAComis, TComis | Comisiones |
| TAdel, TGasOil, TFalt | Descuentos |
| TEfvo | Efectivo |
| TCHP | Cheques propios |
| TCHT | Cheques terceros |

#### 2. CtaCteProv (movimiento del pago)

| Campo | Valor |
|-------|-------|
| TipoComp | 4 (Liquido Producto) |
| Debe | Total Pago |
| SaldoComp | 0 |

Ademas actualiza SaldoComp = 0 en las facturas aplicadas.

#### 3. Factura de Comision (EncabFE)

Se genera una **Factura A** (tipo AFIP 1) por la comision de Trans-Magg:

| Campo | Valor |
|-------|-------|
| TipoAfip | 1 (Factura A) |
| TipoSistema | 16 |
| ClaseFact | 2 (Factura de Comision) |
| CodClie | Codigo del fletero |
| TotalNetoFE | Comision Neta |
| TotalIvaFE | IVA Comision |
| TotalGralFE | Total Comision |
| CAE, VtoCAE | Del CAE obtenido de AFIP |

Detalle: "Comis. por Flete Fact: NroFact1, NroFact2..."

#### 4. Cheques propios emitidos

Para cada cheque propio:
- **ChEmitidos**: Estado="Pendiente", CodComp=11
- **CtaCteBco**: Movimiento bancario
- **DetLPCHPropios**: Detalle del LP

#### 5. Cheques de terceros

Para cada cheque de terceros:
- **ChequesTerc**: Estado cambia de "En Cartera" a "Liquido Producto"
- **DetLPCHTerc**: Detalle del LP

#### 6. Adelantos descontados

- **DetAdelCHP** / **DetAdelCHT**: Descontado = "SI"

#### 7. Asientos contables

Genera DOS asientos:
- **Asiento Factura Comision** (TipoAsiento=2): Debe=TComis, Haber=TNComis + IVA
- **Asiento Liquido Producto** (TipoAsiento=4): Debe=TPago (cta contable del fletero), Haber distribuido en comision, efectivo, adelantos, cheques propios (por cta bancaria), cheques terceros

---

## Impresion del Liquido Producto

Formato A4:
- Encabezado: NroLP, Fecha, datos del fletero
- Gas-Oil descontado
- Facturas proveedor aplicadas (numeros y netos)
- Adelantos, Faltantes
- Comision neta
- Neto fletero = Neto factura - Comision neta
- IVA fletero (21%)
- Efectivo
- Cheques propios: banco, numero, importe
- Cheques terceros: banco, numero, importe
- Total LP
- Monto en letras

---

## Formularios auxiliares

| Formulario | Proposito |
|------------|-----------|
| ConsLiqPend.frm | Consulta liquidaciones con Pagada="NO" |
| ConsLiquidaciones.frm | Busca y carga liquidaciones existentes para modificar |
| LiqProducto1.frm | Reimpresion del LP + impresion de cheques |
| InfComisiones.frm | Reporte de comisiones por provincia |

---

## Reglas de negocio criticas

1. **Tarifa por tonelada**: SubTotal = (Kilos / 1000) * Tarifa
2. **Comision**: porcentaje almacenado en tabla Fleteros, aplicado sobre neto de viajes
3. **IVA siempre 21%** sobre neto y sobre comision
4. **Retencion IIBB**: solo en Paso 1, si el fletero es "Agente de Retencion". Se SUMA al total de viajes
5. **Diferencia = 0**: en Paso 3, no se graba si no cuadra
6. **Max 7 cheques** (propios o terceros) por LP
7. **Remito unico**: no se puede repetir NroRemito + CodEmpresa
8. **Fletero 1107 = propios**: no genera comprobante fiscal
9. **PtoVta siempre 4**
10. **Tipo AFIP 60** = Cuenta de Venta y Liquido Producto
11. **Factura de comision**: se genera automaticamente como Factura A (tipo 1) al pagar
12. **La comision se resta del neto antes de calcular IVA** en el comprobante fiscal (Paso 2)
13. **Los viajes quedan con Facturado="NO"**: para que despues se facturen a la empresa
14. **Asientos contables**: se generan automaticamente en Paso 3

---

## Estructura de tablas

### EncabLiquidacion (Paso 1)
```
NroLiq          Long (PK)
CodFlet         Long
Fecha           Date
Obs             String
TNetoViajes     Double
TIVAViajes      Double
TViajes         Double
TNetoComis      Double
TIVAComis       Double
TComis          Double
TDescuentos     Double
TPagar          Double
Pagada          String ("SI" / "NO")
RetIIBB         Double
```

### EncabLProd (Paso 2 — comprobante fiscal)
```
PtoVta          Long (4)
NroComp         Long
Fecha           Date
CodFlet         Long
TotalViajes     Double (bruto)
NetoComis       Double
IVAComis        Double
TotalComis      Double
NetoViajes      Double (bruto - comision)
IVAViaje        Double
TotalViajes1    Double (neto + IVA)
TipoAFIP        Long (60)
TipoSistema     Long (60)
CAE             String
VtoCAE          String
FVto, FServD, FServH, FPago  Date
Indice          Long
```

### EncabLP (Paso 3 — pago)
```
NroLP           Long (PK)
Fecha           Date
CodFlet         Long
TotalLP         Double
TNComis         Double
IVAComis        Double
TComis          Double
TAdel           Double
TGasOil         Double
TFalt           Double
TEfvo           Double
TCHP            Double
TCHT            Double
```

### DetViajesLP (detalle viajes del comprobante fiscal)
```
PtoVta          Long
NroComp         Long
FechaViaje      Date
Remito          String
CodEmpresa      Long
Mercaderia      String
Procedencia     String
Provincia       String
Destino         String
Kilos           Double
Tarifa          Double
SubTotal        Double
Facturado       String
CodFlet         Long
NroViaje        Long
Cupo            String
```

### DetLPCHPropios / DetLPCHTerc
```
NroLP           Long
Cuenta/CodBanco ...
Importe         Double
Vto             Date
NroCH           String
```
