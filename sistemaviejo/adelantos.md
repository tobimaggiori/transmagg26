# Adelantos — Sistema Viejo Trans-Magg (VB6)

## Resumen general

Un adelanto es un pago anticipado que Trans-Magg le entrega a un fletero antes de emitir la Orden de Pago o Liquido Producto. Puede ser en efectivo, cheques propios o cheques de terceros. Luego se descuenta cuando se emite la OP o LP.

El gas-oil NO se crea desde el formulario de adelantos — nace de una factura de proveedor asignada a un fletero. Pero se descuenta de la misma manera.

**Regla clave: el adelanto NO genera movimiento en cuenta corriente del fletero.** Solo impacta la cuenta corriente cuando se descuenta en una OP o LP.

---

## Tipos de adelanto

| Tipo | Origen | Tabla | Descuento parcial |
|------|--------|-------|-------------------|
| Efectivo | Adelantos.frm | Solo EncabAdel.TEfvo | N/A (monto manual) |
| Cheque propio | Adelantos.frm | DetAdelCHP | No (cheque entero) |
| Cheque de terceros | Adelantos.frm | DetAdelCHT | No (cheque entero) |
| Gas-Oil | FactProv.frm (factura proveedor) | GasOilFleteros | SI (reduce importe) |

---

## Formulario: Adelantos.frm

### Datos que carga el usuario

#### Encabezado

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Fecha | Fecha del adelanto | SI (default: fecha actual) |
| Nro Orden | Numero secuencial del adelanto | NO — autogenerado (max + 1) |
| Codigo Proveedor | Codigo del fletero | SI |
| Nombre Proveedor | Razon social | NO — autocompleta de tabla Fleteros |

#### Efectivo

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Importe en efectivo | Monto entregado en efectivo | SI |

#### Cheques propios (hasta 10 cheques)

Para cada cheque:

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Cuenta | Numero de cuenta bancaria propia | SI |
| Banco | Nombre del banco | NO — autocompleta de CtaCtePropias |
| Nro Cheque | Numero del cheque | SI |
| Vencimiento | Fecha de vencimiento | SI |
| Importe | Monto del cheque | SI |
| Total Cheques Propios | Suma de todos | NO — autocalculado |

#### Cheques de terceros (de cartera)

Se muestra la lista de cheques con Estado = "En Cartera". El usuario hace click para seleccionarlos.

| Dato | Ingresa el usuario? |
|------|---------------------|
| Datos del cheque | NO — vienen de ChequesTerc |
| Total Cheques Terceros | NO — autocalculado |

#### Total

| Campo | Formula |
|-------|---------|
| Total Adelanto | Efectivo + Cheques Propios + Cheques Terceros |

---

## Operaciones de base de datos al grabar

### 1. EncabAdel (Encabezado del Adelanto)

| Campo | Valor |
|-------|-------|
| NroAdel | Secuencial (max + 1) |
| Fecha | Fecha ingresada |
| CodProv | Codigo del fletero |
| TotalAdel | Total del adelanto |
| TEfvo | Total efectivo |
| TChPropio | Total cheques propios |
| TCHTerceros | Total cheques terceros |

### 2. DetAdelCHP (Cheques Propios)

Un registro por cada cheque propio entregado.

| Campo | Valor |
|-------|-------|
| NroAdel | Numero del adelanto |
| Cuenta | Cuenta bancaria propia |
| Importe | Monto del cheque |
| Vto | Fecha de vencimiento |
| NroCH | Numero del cheque |
| Descontado | **"NO"** (pendiente de descontar) |
| CodProv | Codigo del fletero |
| FEmision | Fecha del adelanto |

**IMPORTANTE**: Al crear el adelanto, el cheque propio NO se registra en CHEmitidos ni en CtaCteBco. Eso sucede cuando se descuenta en la OP/LP.

### 3. DetAdelCHT (Cheques de Terceros)

Un registro por cada cheque de terceros entregado.

| Campo | Valor |
|-------|-------|
| NroAdel | Numero del adelanto |
| CodBco | Codigo del banco |
| Vto | Fecha de vencimiento |
| Importe | Monto del cheque |
| NroCH | Numero del cheque |
| Descontado | **"NO"** (pendiente de descontar) |
| CodProv | Codigo del fletero |

Ademas actualiza **ChequesTerc**: Estado cambia de "En Cartera" a **"Adelanto"**, Dado = nombre del fletero, FEntregado = fecha del adelanto.

### 4. NO genera movimiento en CtaCteProv

El adelanto no impacta la cuenta corriente del fletero. Solo se registra el impacto cuando se descuenta en una OP o LP.

---

## Gas-Oil: origen diferente

El gas-oil NO se crea en Adelantos.frm. Se crea en **FactProv.frm** (Factura de Proveedor):

Cuando se registra una factura de proveedor de gas-oil y se le asigna un fletero, automaticamente se inserta en `GasOilFleteros`:

| Campo | Valor |
|-------|-------|
| CodFlet | Codigo del fletero |
| PtoVta | Punto de venta de la factura proveedor |
| NroFact | Numero de la factura proveedor |
| Fecha | Fecha de la factura |
| Importe | Monto pendiente de descontar |
| Descontada | "NO" |

---

## Descuento de adelantos

Los adelantos se descuentan en la **Orden de Pago** (NuevaOrdenPAgo.frm) y en el **Liquido Producto** (LiquidoProducto.frm). Ambos tienen la misma mecanica.

### Al seleccionar un fletero, se cargan automaticamente:

**Cheques propios adelantados pendientes (lista CHPAdel):**
```
SELECT * FROM DetAdelCHP WHERE CodProv = X AND Descontado = 'NO'
```

**Cheques terceros adelantados pendientes (lista LCHTAdel):**
```
SELECT * FROM DetAdelCHT WHERE CodProv = X AND Descontado = 'NO'
```

**Gas-oil pendiente (lista DescPendientes):**
```
SELECT * FROM GasOilFleteros WHERE CodFlet = X AND Descontada = 'NO'
```

### Mecanica de descuento

**Cheques propios adelantados:**
- El usuario hace doble-click en la lista CHPAdel
- Se mueve a la lista de cheques propios a emitir, marcado con "Adel = SI"
- Suma al TPago y TCHPropios
- Al grabar: `DetAdelCHP.Descontado = "SI"` + se crea registro en CHEmitidos (Adel="SI") + CtaCteBco

**Cheques terceros adelantados:**
- El usuario hace doble-click en la lista LCHTAdel
- Se mueve a la lista de cheques aplicados, marcado con "Adel = SI"
- Suma al TPago y TCHTerceros
- Al grabar: `DetAdelCHT.Descontado = "SI"`. El cheque en ChequesTerc NO cambia de estado (ya estaba como "Adelanto").

**Gas-oil / Descuentos:**
- El usuario hace doble-click en DescPendientes o ingresa manualmente
- Se cargan 3 campos: Adelanto Efectivo, Gas-Oil, Faltantes
- Se agregan a la lista de descuentos
- Suman a TAdel, TGasOil, TFalt (y al TPago total)
- Al grabar: `GasOilFleteros.Descontada = "SI"` si se desconto todo, o reduce Importe si es parcial

### Gas-oil tambien se descuenta en Liquidaciones

En Liquidaciones.frm (Paso 1 de la liquidacion), el gas-oil pendiente tambien aparece y se puede descontar. Se graba en `LiqDetDescuentos` y se actualiza GasOilFleteros.

---

## Ciclo de vida completo

```
1. CREACION DEL ADELANTO (Adelantos.frm)
   |
   ├─ EncabAdel (encabezado)
   ├─ DetAdelCHP (cheques propios, Descontado="NO")
   ├─ DetAdelCHT (cheques terceros, Descontado="NO")
   ├─ ChequesTerc.Estado = "Adelanto" (si hay CH terceros)
   |
   [NO hay movimiento en CtaCteProv ni en CHEmitidos]

2. PENDIENTE
   |
   Los cheques propios aparecen en lista CHPAdel al crear OP/LP
   Los cheques terceros aparecen en lista LCHTAdel al crear OP/LP
   Los gas-oil aparecen en lista DescPendientes

3. DESCUENTO EN OP o LP
   |
   ├─ DetAdelCHP.Descontado = "SI"
   ├─ DetAdelCHT.Descontado = "SI"
   ├─ GasOilFleteros.Descontada = "SI" (o reduce Importe si parcial)
   ├─ CHEmitidos: se crea registro con Adel="SI" (solo CH propios)
   ├─ CtaCteBco: movimiento bancario (solo CH propios)
   ├─ CtaCteProv: Debe = TPago total (incluye adelantos como parte del pago)
   ├─ DetOPAdel o LiqDetDescuentos: detalle por remito
   └─ Asientos: Haber por total adelantos (efvo + gasoil + faltante)
```

---

## Diferencias por tipo de adelanto

| Aspecto | Efectivo | Cheque Propio | Cheque Tercero | Gas-Oil |
|---------|----------|---------------|----------------|---------|
| Se crea en | Adelantos.frm | Adelantos.frm | Adelantos.frm | FactProv.frm |
| Tabla detalle | Solo EncabAdel.TEfvo | DetAdelCHP | DetAdelCHT | GasOilFleteros |
| Campo de estado | N/A | Descontado (SI/NO) | Descontado (SI/NO) | Descontada (SI/NO) |
| Impacto en cheques al crear | N/A | Ninguno | ChequesTerc.Estado="Adelanto" | N/A |
| Donde se descuenta | OP / LP (manual) | OP / LP (doble-click) | OP / LP (doble-click) | Liquidacion / OP / LP |
| Descuento parcial | N/A | No (cheque entero) | No (cheque entero) | SI (reduce importe) |
| Al descontar en OP/LP | Suma a TAdel | CHEmitidos + CtaCteBco | Solo marca Descontado | Descontada="SI" o reduce |
| Movimiento en CtaCteProv | Solo via OP/LP | Solo via OP/LP | Solo via OP/LP | Solo via OP/LP |

---

## Impresion del adelanto

### Comprobante (ImprimeAdel)

**Encabezado:**
- "TRANSPORTE TRANS-MAGG"
- "Adelanto"
- "Adelanto Nro: 0001-XXXXXXXX"
- Fecha
- Datos del fletero: Codigo, Nombre, Domicilio, Localidad, Situacion IVA, CUIT

**Cuerpo "Detalle Adelantos":**
- Efectivo (si hay)
- Cheques de Terceros: Banco, NroCH, Importe por cada uno. Total.
- Cheques Propios: Banco, NroCH, Importe por cada uno. Total.
- Total General

### Impresion de cheques fisicos (ImprimeCHAdel)

Imprime los cheques propios en hojas de cheque de banco con formato especial:
- Importe numerico
- Fecha de emision y vencimiento (dia, mes en letras, año)
- Destinatario (nombre del fletero)
- Importe en letras

---

## Estructura de tablas

### EncabAdel
```
NroAdel       Long (PK, autoincremental)
Fecha         String (DD/MM/YYYY)
CodProv       Long (FK a Fleteros)
TotalAdel     Double
TEfvo         Double
TChPropio     Double
TCHTerceros   Double
```

### DetAdelCHP (Cheques Propios)
```
NroAdel       Long (FK a EncabAdel)
Cuenta        String (FK a CtaCtePropias)
Importe       Double
Vto           String (DD/MM/YYYY)
NroCH         String
Descontado    String ("SI" / "NO")
CodProv       Long
FEmision      String (DD/MM/YYYY)
NroOP         Long (se usa en queries de impresion)
```

### DetAdelCHT (Cheques Terceros)
```
NroAdel       Long (FK a EncabAdel)
CodBco        Long (FK a Bancos)
Vto           String (DD/MM/YYYY)
Importe       Double
NroCH         String
Descontado    String ("SI" / "NO")
CodProv       Long
```

### GasOilFleteros
```
CodFlet       Long (FK a Fleteros)
PtoVta        String
NroFact       String
Fecha         String (DD/MM/YYYY)
Importe       Double (pendiente de descontar)
Descontada    String ("SI" / "NO")
```

---

## Reglas de negocio criticas

1. **El adelanto NO genera movimiento en CtaCteProv.** Solo impacta cuando se descuenta en OP/LP.
2. **Los cheques propios NO se registran en CHEmitidos al crear el adelanto.** Solo al descontar en OP/LP.
3. **Los cheques terceros SI cambian de estado** ("En Cartera" → "Adelanto") al crear el adelanto.
4. **Gas-oil nace de factura de proveedor**, no del formulario de adelantos.
5. **Gas-oil soporta descuento parcial** — reduce el importe pendiente. Los cheques no (se descuentan enteros).
6. **Numeracion secuencial global** — no por fletero ni por año.
7. **No es comprobante fiscal** — no pasa por ARCA/AFIP.
8. **Los adelantos suman al Total Pago** de la OP/LP porque ya se entregaron antes.
9. **El gas-oil se puede descontar en 3 lugares**: Liquidacion (Paso 1), OP y LP.
10. **Impresion automatica** despues de grabar (con opcion de imprimir cheques fisicos).
