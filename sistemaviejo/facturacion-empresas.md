# Facturacion a Empresas — Sistema Viejo Trans-Magg (VB6)

## Resumen general

La facturacion a empresas es el proceso donde Trans-Magg cobra a sus clientes (empresas) por los viajes realizados. Los viajes que se facturan **ya fueron previamente liquidados al fletero** (existen en `LiqDetViajes` con `Facturado = 'NO'`).

Flujo obligatorio: **Viaje → Liquidacion al fletero → Facturacion a empresa**

---

## Formularios de facturacion

| Formulario | Proposito |
|------------|-----------|
| **FacturarViajes.frm** | Principal. Factura viajes ya liquidados. Con ARCA/AFIP. PtoVta 4 (terceros) o 5 (propios). |
| **FactViajesDirecto.frm** | Variante para viajes directos de Trans-Magg. PtoVta fijo = 4. |
| **FactEmpresas.frm** | Manual simplificado. El usuario carga lineas a mano. SIN integracion AFIP. |
| **FactxCta.frm** | Facturacion "por Cuenta y Orden". Tablas separadas (EncabFactCta). |
| **GeneraCAE.frm** | Generacion de CAE en lote para comprobantes que no lo obtuvieron. |

---

## FacturarViajes.frm — El formulario principal

### Datos que carga el usuario

#### Encabezado

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Tipo de Comprobante | Factura / NC / ND / FE / LP / Pyme | SI (combo, default: Factura Electronica) |
| Terceros o Propios | Filtra viajes por fletero propio (1107) o terceros | SI (radio button) |
| Codigo de Empresa | Codigo numerico | SI |
| Nombre de Empresa | Razon social | NO — autocompleta de tabla Empresas |
| Fecha | Fecha del comprobante | SI (default: fecha actual) |
| Forma de Pago (solo Pyme) | 30/60/90 dias FF | SI |
| Agente (solo Pyme) | SCA / ADC | SI |

#### Seleccion de viajes

Al ingresar la empresa, se cargan automaticamente los viajes pendientes de facturar desde `LiqDetViajes` (donde `Facturado = 'NO'`). Filtrados por Terceros (CodFlet ≠ 1107) o Propios (CodFlet = 1107).

El usuario hace **doble-click** en cada viaje para seleccionarlo. Se muestran:

| Dato del viaje | Ingresa el usuario? |
|----------------|---------------------|
| Fecha del viaje | NO — viene de LiqDetViajes |
| Nro Remito | NO |
| Chofer | NO |
| Mercaderia | NO |
| Procedencia | NO (pero editable) |
| Destino | NO (pero editable) |
| Kilos | NO (pero editable) |
| **Tarifa** | NO (pero **EDITABLE** — el usuario puede cambiarla) |
| SubTotal | NO — autocalculado |
| Cupo | NO |

### Formula de calculo

**SubTotal por viaje:**
```
SubTotal = (Kilos / 1000) * Tarifa
```
La tarifa es **por tonelada**. Se dividen los kilos entre 1000.

**Totales (al confirmar cada viaje con "Ok"):**
```
Neto = Suma de SubTotales de todos los viajes
IVA = Neto * 21 / 100
Total = Neto + IVA
```

El IVA se calcula sobre el **neto acumulado total**, no por linea.

### Tipos de comprobante y su codigo AFIP

| Opcion del combo | Procedimiento | TipoAfip | TipoSistema | ClaseFact |
|------------------|--------------|----------|-------------|-----------|
| Factura (manual) | Genera_FA() | — | — | — |
| Factura Electronica | Genera_FE() | 1 | 16 | 1 |
| Nota de Credito | Genera_NC() | 3 | 17 | 3 |
| Liquido Producto | Genera_LP() | 60 | 60 | 1 |
| Factura Pyme | FAPyme() | 201 | 201 | 1 |

### Puntos de venta

| Seleccion | PtoVta |
|-----------|--------|
| Terceros | 4 |
| Propios | 5 |

---

## Flujo completo paso a paso

### 1. Seleccionar tipo de comprobante y terceros/propios

### 2. Ingresar empresa
Se autocompleta el nombre y se cargan viajes pendientes.

### 3. Ingresar fecha

### 4. Seleccionar viajes
Doble-click en cada viaje pendiente. Opcionalmente modificar tarifa. Confirmar con "Ok". Se acumulan los totales.

### 5. Aceptar
Valida que el neto > 0. Segun tipo de comprobante, ejecuta el procedimiento correspondiente.

---

## Operaciones de base de datos al grabar

### Factura Electronica (Genera_FE) — el caso mas comun

#### EncabFE (encabezado del comprobante)

| Campo | Valor |
|-------|-------|
| PtoVtaFE | 4 o 5 (segun terceros/propios) |
| NroFE | Secuencial (max + 1) |
| FechaFE | Fecha ingresada |
| CodClie | Codigo de empresa |
| TotalNetoFE | Neto |
| TotalIvaFE | IVA |
| TotalGralFE | Total |
| TipoAfip | 1 (Factura A) |
| TipoSistema | 16 |
| ClaseFact | 1 (Factura de Viajes) |
| Emp_Flet | 0 (es para empresa) |
| CAE, VtoCAE | Del CAE obtenido de AFIP |

#### DetFE (detalle por viaje)

| Campo | Valor |
|-------|-------|
| NroFact | Numero del comprobante |
| PtoVta | Punto de venta |
| FechaViaje, NroRem, Chofer, Mercaderia, etc. | Datos del viaje |
| Kilos, Tarifa, STotal | Valores del viaje |
| TipoComp | 1 |
| Alicuota | "21" |

#### CtaCteEmp (cuenta corriente empresa)

| Campo | Valor |
|-------|-------|
| Fecha | Fecha del comprobante |
| CodEmp | Codigo de empresa |
| PtoVta | 4 o 5 |
| NroComp | Numero del comprobante |
| TipoComp | 16 (Factura Electronica) |
| Debe | Total del comprobante |
| SaldoComp | Total del comprobante |

#### LiqDetViajes (actualizacion)

| Campo | Valor anterior | Valor nuevo |
|-------|---------------|-------------|
| Facturado | "NO" | "SI" |
| FacturadoEn | (vacio) | "1 / 4-{NroFact}" |

---

## Integracion ARCA/AFIP

Usa control OCX `WSAFIPFEOCX.WSAFIPFEx`:

1. Inicializa con CUIT 30709381683, certificado PFX
2. Obtiene ticket WSAA
3. Datos del comprobante WSFEv1:
   - CbteTipo = 1 (Factura A)
   - Concepto = 2 (Servicios)
   - DocTipo = 80 (CUIT)
   - DocNro = CUIT de la empresa
   - ImpTotal, ImpNeto, ImpIva
   - IVA Id=5 (21%), o Id=3 si IVA=0
   - Moneda PES, Cotizacion 1
4. Solicita CAE: `FE.F1CAESolicitar()`
5. Genera QR fiscal (imagen JPG)
6. Guarda CAE, VtoCAE en EncabFE

### Factura MiPyme (tipo 201)

Datos adicionales:
- CBU hardcodeado: "3300043310430002552086"
- Agente: "SCA" o "ADC" (seleccionado por usuario)
- Fecha de pago calculada: 30/60/90 dias segun seleccion
- Opcionales AFIP: ID 2101 (CBU), ID 27 (agente)

### Nota de Credito

Datos adicionales:
- CbteTipo = 3 (NC A)
- Comprobante asociado: tipo, pto vta, numero, CUIT, fecha de la factura original
- En CtaCteEmp: va al **HABER** (no Debe), y ademas reduce SaldoComp de la factura original

---

## FactEmpresas.frm — Facturacion manual

Formulario simplificado donde el usuario carga todo manualmente, sin vincular a viajes liquidados. Sin integracion AFIP.

**Campos por linea (todos manuales):**
- Fecha viaje, Remito, Mercaderia, Procedencia, Destino, Kilos, Tarifa
- SubTotal autocalculado: `(Kilos / 1000) * Tarifa`
- Checkbox "Calcula IVA" (default SI)

**Tablas**: EncabFact, DetFact, CtaCteEmp (TipoComp=1 para factura, 2 para NC)

---

## FactxCta.frm — Facturacion por Cuenta y Orden

Factura viajes "por cuenta y orden" de un fletero a una empresa. Usa tablas separadas.

**Fuente de viajes**: tabla `ViajesFactura` (no LiqDetViajes)

**Tablas**: EncabFactCta, DetFactCta, CtaCteEmp (TipoComp=13 para factura, 14 para NC)

---

## GeneraCAE.frm — Generacion de CAE en lote

Para comprobantes grabados sin CAE. Busca por rango de fechas, punto de venta y tipo. Genera CAE para cada comprobante seleccionado.

Tipos soportados:

| Indice | TipoSistema | CbteTipo AFIP | Comprobante |
|--------|-------------|---------------|-------------|
| 0 | 16 | 1 | Factura A |
| 1 | 17 | 3 | NC A |
| 2 | 18 | 2 | ND A |
| 3 | 201 | 201 | Factura MiPyme |
| 4 | 203 | 203 | NC MiPyme |
| 5 | 202 | 202 | ND MiPyme |
| 6 | 60 | 60 | Liquido Producto |
| 7 | 19 | 6 | Factura B |
| 8 | 90 | 90 | NC LP |

---

## Impresion de factura

Formato A4 con Printer object:
- Encabezado: "TRANSPORTE TRANS-MAGG", tipo de comprobante, numero formateado PPPP-NNNNNNNN, fecha
- Datos empresa: Nombre, Domicilio, Localidad, Situacion IVA, CUIT
- Detalle: tabla con Fecha, Remito, Mercaderia, Procedencia, Destino, Kilos, Tarifa, SubTotal
- Pie: Neto, IVA, Total
- Se imprimen 2 copias

---

## Relacion Tarifa Empresa vs Tarifa Fletero

- La **tarifa empresa** esta en `LiqDetViajes.Tarifa` y se usa para facturar
- La **tarifa fletero** pertenece al circuito de liquidacion (no aparece en este formulario)
- La **comision de Trans-Magg** es la diferencia implicita entre ambas tarifas
- Este formulario NO calcula comisiones — eso se hace en la liquidacion

---

## Reglas de negocio criticas

1. **Un viaje solo se factura una vez**: `Facturado` pasa de "NO" a "SI"
2. **Los viajes ya deben estar liquidados**: vienen de `LiqDetViajes` (creados en el proceso de liquidacion)
3. **La factura va al DEBE de CtaCteEmp**: aumenta la deuda de la empresa
4. **La NC va al HABER de CtaCteEmp**: reduce la deuda y ademas reduce SaldoComp de la factura original
5. **IVA siempre 21%** sobre neto total (IVA Id=5 en AFIP). Si IVA=0, usa Id=3
6. **Concepto AFIP = 2 (Servicios)**: transporte
7. **Documento = 80 (CUIT)**: siempre factura con CUIT
8. **Moneda PES, Cotizacion 1**
9. **Tarifa editable**: el usuario puede modificar la tarifa antes de confirmar
10. **Tarifa por tonelada**: SubTotal = (Kilos / 1000) * Tarifa
11. **Numeracion secuencial** por tabla (max + 1)
12. **PtoVta 4 (terceros) o 5 (propios)** segun tipo de fletero

---

## Estructura de tablas

### EncabFE (Factura Electronica)
```
Indice          Long (PK)
PtoVtaFE        Long
NroFE           Long
FechaFE         Date
CodClie         Long (FK a Empresas o Fleteros)
TotalNetoFE     Double
TotalIvaFE      Double
TotalGralFE     Double
TipoAfip        Long (1, 2, 3, 6, 60, 90, 201, 202, 203)
TipoSistema     Long (16, 17, 18, 19, 60, 90, 201, 202, 203)
ClaseFact       Long (1=Viajes, 2=Comision, 3=NC, 4=ND emp, 5=ND flet)
Emp_Flet        Long (0=Empresa, 1=Fletero)
FVto            Date
FServD          Date
FServH          Date
FPago           Date
CAE             String
VtoCAE          String
ObsCAE          String
MotivoCAE       String
QR              String (ruta archivo JPG)
Agente          String (SCA/ADC, solo Pyme)
ImpLetras       String (importe en letras, solo Pyme)
TipoComp_Asoc   Long (para NC/ND)
PtoVta_Asoc     Long
Nro_Asoc        Long
Fecha_Asoc      Date
Motivo_Asoc     String
```

### DetFE (Detalle)
```
NroFact         Long (FK a EncabFE)
PtoVta          Long
FechaViaje      Date
NroRem          String
Chofer          String
Mercaderia      String
Procedencia     String
Destino         String
Kilos           Double
Tarifa          Double
STotal          Double
TipoComp        Long
Alicuota        String
Cupo            String
ConceptoNC      String (solo para NC)
```

### LiqDetViajes (viajes liquidados, fuente para facturacion)
```
NroViaje        Long
NroLiq          Long
Fecha           Date
CodEmpresa      Long
DescEmpresa     String
CodFlet         Long
CodChofer       Long
DescChofer      String
NroRemito       String
Mercaderia      String
Procedencia     String
Destino         String
Kilos           Double
Tarifa          Double
SubTotal        Double
Facturado       String ("SI" / "NO")
FacturadoEn     String
Provincia       String
Cupo            String
```
