# Recibos de Cobranza — Sistema Viejo Trans-Magg (VB6)

## Resumen general

El Recibo de Cobranza registra un cobro realizado a una empresa (cliente). Puede incluir efectivo, cheques de terceros y otros conceptos (retenciones, etc.). Se aplica contra facturas pendientes de esa empresa, reduciendo su saldo deudor.

No es un comprobante fiscal (no va a AFIP). Es un comprobante interno con numeracion secuencial.

---

## Formularios

Existen dos versiones:
- **RecCobranza.frm** (version anterior/simplificada)
- **RecCob.frm** (version mas reciente/completa — la que se usa)

La diferencia clave: RecCob incluye `PtoVta` y `TipoComp` en la aplicacion a facturas, y agrega `FRecibido` en los cheques.

---

## Datos que carga el usuario

### Encabezado

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Codigo de Empresa | Codigo numerico de la empresa | SI |
| Nombre de Empresa | Razon social | NO — se autocompleta de tabla Empresas |
| Fecha del Recibo | Fecha del recibo (formato DD/MM/AAAA) | SI |
| Numero de Recibo | Secuencial automatico | NO — se calcula como max(NroRec) + 1 |

### Efectivo

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Total Efectivo | Importe cobrado en efectivo | SI |

### Cheques (se pueden cargar multiples)

Para cada cheque:

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Fecha de Vencimiento | Fecha vto del cheque | SI |
| Codigo de Banco | Codigo numerico del banco | SI |
| Descripcion del Banco | Nombre del banco | NO — se autocompleta de tabla Bancos |
| Numero de Cheque | Numero del cheque | SI |
| Importe del Cheque | Monto del cheque | SI |
| Total de Cheques | Suma de todos los cheques | NO — autocalculado |

Al ingresar el importe del cheque, automaticamente:
1. Se agrega a la lista de cheques
2. Se suma al total de cheques y al total del recibo
3. Se limpian los campos para el proximo cheque

### Otros Conceptos (retenciones, varios — hasta 5 lineas)

Para cada concepto:

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Codigo de Concepto | Codigo del concepto (validado contra tabla ConceptoRec) | SI |
| Descripcion del Concepto | Nombre del concepto | NO — se autocompleta |
| Importe | Monto del concepto | SI |
| Total Otros Conceptos | Suma de todos los conceptos | NO — autocalculado |

Los conceptos son genericos — pueden ser retenciones de impuestos, descuentos, o cualquier cosa definida en la tabla ConceptoRec. No hay campos especificos de retencion (nro certificado, tipo impuesto, etc.).

### Aplicacion a facturas

Al seleccionar la empresa, se cargan todas las facturas pendientes (SaldoComp > 0) de CtaCteEmp.

Para cada factura a aplicar:

| Campo | Descripcion | Ingresa el usuario? |
|-------|-------------|---------------------|
| Fecha de la factura | | NO — se carga al hacer doble-click en factura pendiente |
| Numero de la factura | Formato PPPP-NNNNNNNN | NO — autocargado |
| Saldo pendiente | Saldo actual de la factura | NO — autocargado |
| Importe a aplicar | Cuanto aplicar contra esta factura | PARCIAL — se pre-carga con el saldo, el usuario puede reducirlo |
| Punto de Venta | | NO — autocargado (oculto) |
| Tipo de Comprobante | | NO — autocargado (oculto) |

### Totales (pie del formulario)

| Campo | Formula | Ingresa el usuario? |
|-------|---------|---------------------|
| Total Recibo | Efectivo + Cheques + Otros Conceptos | NO — autocalculado |
| Total Aplicado | Suma de importes aplicados a facturas | NO — autocalculado |
| Diferencia | Total Recibo - Total Aplicado | NO — autocalculado |

---

## Formulas de calculo

```
Total Recibo = Total Efectivo + Total Cheques + Total Otros Conceptos
Total Aplicado = Suma de importes aplicados a facturas
Diferencia = Total Recibo - Total Aplicado
```

**Regla critica**: La diferencia NO puede ser negativa. No se puede aplicar mas de lo que se cobra.

Si la diferencia es positiva, el sobrante queda como saldo "a cuenta" del recibo.

---

## Flujo completo de emision

### 1. Abrir formulario
Se ocultan todas las secciones. Totales en 0.

### 2. Ingresar empresa
El usuario ingresa el codigo. Se autocompleta el nombre y se cargan las facturas pendientes.

### 3. Ingresar fecha
El usuario ingresa la fecha del recibo.

### 4. Cargar medios de pago (en cualquier orden)
El formulario tiene 3 botones que muestran/ocultan secciones:
- **Efectivo** — ingresar monto en efectivo
- **Cheques** — cargar uno o mas cheques
- **Otros Conceptos** — cargar retenciones u otros conceptos

### 5. Aplicar a facturas
El usuario hace doble-click en cada factura pendiente, ajusta el importe si es parcial, y clickea "Aplicar". La factura pasa a la lista de aplicadas.

Reglas de aplicacion:
- **Importe = saldo**: factura completamente aplicada
- **Importe < saldo**: aplicacion parcial, la factura vuelve a pendientes con saldo reducido
- **Importe > saldo**: ERROR — no permitido

### 6. Aceptar (grabar)
Validacion: Diferencia >= 0, sino error "La aplicacion de Facturas no puede superar al Total del Recibo".

---

## Operaciones de base de datos al grabar

Se graba en **5 tablas** en este orden:

### 1. EncabRec (Encabezado del Recibo)

| Campo | Valor |
|-------|-------|
| NroRec | Secuencial (max + 1) |
| Fecha | Fecha ingresada |
| CodEmpresa | Codigo de empresa |
| TotalRec | Total del recibo |
| TEfvo | Total efectivo |
| TCheques | Total cheques |
| TOtros | Total otros conceptos |

### 2. ChequesTerc (Cheques de Terceros)

Un registro por cada cheque. Todos entran con Estado = "En Cartera".

| Campo | Valor |
|-------|-------|
| CodBanco | Codigo del banco |
| NroCh | Numero del cheque |
| FechaVto | Fecha de vencimiento |
| Importe | Importe del cheque |
| Entregado | Nombre de la empresa que lo entrego |
| Estado | "En Cartera" (siempre al ingresar) |
| NroRec | Numero del recibo |
| FRecibido | Fecha del recibo |

### 3. RecOtros (Otros Conceptos)

Un registro por cada concepto ingresado.

| Campo | Valor |
|-------|-------|
| NroRec | Numero del recibo |
| CodConc | Codigo del concepto |
| Importe | Importe del concepto |

### 4. AplicRec (Aplicacion contra Facturas)

Un registro por cada factura aplicada.

| Campo | Valor |
|-------|-------|
| NroRec | Numero del recibo |
| PtoVta | Punto de venta de la factura |
| NroFact | Numero de la factura |
| ImpAplic | Importe aplicado |
| CodComp | Tipo de comprobante de la factura |

Ademas, por cada factura aplicada se actualiza `CtaCteEmp.SaldoComp`:
- Si es factura (TipoComp = 1, 3, 13, 16, 201, 203): **resta** el importe del SaldoComp
- Si es recibo (TipoComp = 6): **suma** el importe al SaldoComp

**Si hay diferencia positiva (saldo a cuenta):**
Se agrega un registro adicional en AplicRec con `ACta = "SI"` y el importe sobrante.

### 5. CtaCteEmp (Cuenta Corriente)

Se agrega un movimiento:

| Campo | Valor |
|-------|-------|
| Fecha | Fecha del recibo |
| CodEmp | Codigo de empresa |
| PtoVta | 4 (fijo en RecCob) / 1 (en RecCobranza) |
| NroComp | Numero del recibo |
| TipoComp | 6 (Recibo de Cobranza) |
| Debe | (vacio) |
| Haber | Total del recibo |
| SaldoComp | Diferencia (saldo a cuenta) |

El recibo va al **HABER** — reduce el saldo deudor de la empresa.

### 6. Impresion automatica

Inmediatamente despues de grabar se imprime el recibo.

---

## Impacto en el sistema

### Cuenta Corriente de Empresa

- El recibo aparece como movimiento al **HABER** con TipoComp=6
- Reduce el saldo corrido: `Saldo = Saldo - Haber`
- Si tiene saldo a cuenta (SaldoComp > 0), puede aplicarse despues desde AplicComprobantes

### Facturas aplicadas

- El `SaldoComp` de cada factura aplicada se reduce
- Si queda en 0, la factura esta completamente cancelada
- Si queda > 0, la factura sigue apareciendo como pendiente

### Cheques recibidos

Los cheques ingresan con Estado "En Cartera" y tienen un ciclo de vida posterior independiente del recibo:

| Estado | Cuando | Formulario |
|--------|--------|------------|
| En Cartera | Al crear el recibo | RecCob.frm |
| Depositado CtaXXXX | Al depositar en banco | IngMovBanco.frm |
| Mutuo | Al entregar en operacion de mutuo | CambCh.frm |
| Liquido Producto | Al usar como pago de liquidacion | LiquidoProducto.frm |
| Orden de Pago | Al usar en orden de pago | OrdenPago.frm |

### Aplicacion de comprobantes (posterior)

Si el recibo queda con saldo > 0 (a cuenta), puede aplicarse despues desde AplicComprobantes.frm:
- El recibo aparece en la lista de "Recibos" (TipoComp=6)
- Se selecciona junto con una factura pendiente
- Se ingresa el importe a aplicar
- Se reduce el SaldoComp de ambos

### IVA

El recibo **NO aparece en libros de IVA** — no es un comprobante fiscal.

---

## Estructura de tablas (reconstruida del codigo)

### EncabRec
```
NroRec        Long (PK, autoincremental)
Fecha         Date
CodEmpresa    Long (FK a Empresas)
TotalRec      Double
TEfvo         Double
TCheques      Double
TOtros        Double
```

### ChequesTerc
```
CodBanco      Long (FK a Bancos)
NroCh         String
FechaVto      Date
Importe       Double
Entregado     String (nombre de quien entrego el cheque)
Estado        String ("En Cartera", "Depositado CtaXXX", "Mutuo", etc.)
NroRec        Long (FK a EncabRec)
FRecibido     Date
Dado          String (a quien se entrego despues)
FEntregado    Date
```

### RecOtros
```
NroRec        Long (FK a EncabRec)
CodConc       Long (FK a ConceptoRec)
Importe       Double
```

### AplicRec
```
NroRec        Long (FK a EncabRec)
PtoVta        Long
NroFact       Long
ImpAplic      Double
CodComp       Long (tipo de comprobante)
ACta          String ("SI" si es saldo a cuenta)
```

### ConceptoRec
```
CodConcepto   Long (PK)
descconcepto  String
```

---

## Recibo impreso

El recibo impreso tiene esta estructura:

**Encabezado:**
- "TRANSPORTE TRANS-MAGG" (titulo)
- "Recibo POR COBRANZA" (tipo)
- "Recibo Nro: 0001-XXXXXXXX"
- Fecha
- Datos de la empresa: Nombre, Domicilio, Localidad, Situacion IVA, CUIT

**Columna izquierda — "Comprobantes Cancelados":**
- Lista de facturas aplicadas con numero (PPPP-NNNNNNNN) e importe
- Si hay saldo a cuenta: "A Cuenta" + importe
- Total Facturas Aplicadas

**Columna derecha — "Detalle Recibos":**
- Efectivo (si hay)
- Cheques: banco, numero, importe por cada uno. Total Cheques.
- Otros Conceptos: descripcion e importe por cada uno. Total Otros Concepto.
- TOTAL DETALLE

---

## Reglas de negocio criticas

1. **Diferencia >= 0 siempre.** No se puede aplicar mas de lo que se cobra.
2. **Aplicacion parcial permitida.** Se puede aplicar menos del saldo de una factura.
3. **Saldo a cuenta permitido.** Si sobra importe, queda como saldo del recibo para aplicar despues.
4. **Cheques siempre "En Cartera" al ingresar.** Su ciclo de vida posterior es independiente.
5. **Aplicacion posterior permitida.** Recibos con saldo > 0 se aplican desde AplicComprobantes.
6. **El recibo se imprime automaticamente al grabar.**
7. **Numero secuencial.** Se calcula como max(NroRec) + 1, sin considerar punto de venta.
8. **Punto de venta fijo.** 4 en RecCob, 1 en RecCobranza.
9. **No es comprobante fiscal.** No va a AFIP ni a libros de IVA.
10. **Los "Otros Conceptos" son genericos.** No hay campos especificos para retenciones (nro certificado, tipo impuesto).
