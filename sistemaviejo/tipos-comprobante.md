# Tipos de Comprobante — Sistema Viejo Trans-Magg (VB6)

## Mapeo codigos internos vs codigos AFIP

El sistema viejo usa multiples codigos internos (TipoComp, TipoSistema, TipoFact, ClaseFact, CodComp) que NO coinciden con los codigos AFIP. En el sistema nuevo esto debe ir unificado usando directamente los codigos AFIP.

---

## Mapeo central: TipoSistema → CbteTipo AFIP

Extraido de GeneraCAE.frm (el formulario de generacion de CAE):

| TipoSistema (interno) | CbteTipo (AFIP) | Comprobante | Tabla |
|------------------------|-----------------|-------------|-------|
| 16 | 1 | Factura A | EncabFE |
| 17 | 3 | Nota de Credito A | EncabFE |
| 18 | 2 | Nota de Debito A | EncabFE |
| 19 | 6 | Factura B | EncabFE |
| 60 | 60 | Liquidacion Producto (CVLP A) | EncabLProd |
| 90 | 90 | NC Liquidacion Producto | EncabFE |
| 201 | 201 | Factura MiPyme A (FCE) | EncabFE |
| 202 | 202 | ND MiPyme A (ND FCE) | EncabFE |
| 203 | 203 | NC MiPyme A (NC FCE) | EncabFE |

---

## Codigos AFIP usados

| CbteTipo AFIP | Comprobante | Letra |
|---------------|-------------|-------|
| 1 | Factura A | A |
| 2 | Nota de Debito A | A |
| 3 | Nota de Credito A | A |
| 6 | Factura B | B |
| 60 | Comprobante de Venta Liq. Producto A (CVLP) | A |
| 90 | NC Liquidacion de Producto | A |
| 201 | Factura de Credito Electronica MiPyme A (FCE) | A |
| 202 | ND de Credito Electronica MiPyme A | A |
| 203 | NC de Credito Electronica MiPyme A | A |

---

## Codigos internos en Cuenta Corriente (TipoComp)

### Cuenta Corriente Empresas (CtaCteEmp)

| TipoComp | Descripcion | Columna | Efecto |
|----------|-------------|---------|--------|
| 1 | Factura vieja (pre-electronica) | Debe | Suma deuda |
| 2 | NC vieja (pre-electronica) | Haber | Resta deuda |
| 3 | Factura de Comision | Debe | Suma deuda |
| 6 | Recibo de Cobranza | Haber | Resta deuda |
| 13 | Factura por Cta y Orden | Debe | Suma deuda |
| 14 | NC por Cta y Orden | Haber | Resta deuda |
| 16 | Factura Electronica A | Debe | Suma deuda |
| 17 | NC Electronica A | Haber | Resta deuda |
| 18 | Nota de Debito | Debe | Suma deuda |
| 60 | Liquidacion Producto | Debe | Suma deuda |
| 90 | NC MiPyme | Haber | Resta deuda |
| 201 | Factura MiPyme | Debe | Suma deuda |
| 202 | ND MiPyme | Debe | Suma deuda |
| 203 | NC Liquidacion Producto | Haber | Resta deuda |

### Cuenta Corriente Fleteros/Proveedores (CtaCteProv)

| TipoComp | Descripcion | Columna | Efecto |
|----------|-------------|---------|--------|
| 1 | Factura de Proveedor | Haber | Le debemos mas |
| 4 | Factura de Comision (LP) | Debe | Le debemos menos |
| 11 | Orden de Pago | Debe | Le pagamos |
| 17 | NC Electronica | Debe | Le debemos menos |
| 18 | Nota de Debito | Haber | Le debemos mas |
| 60 | Liquidacion Producto | Haber | Le debemos mas |
| 203 | NC Liquidacion Producto | Debe | Le debemos menos |

---

## ClaseFact en EncabFE

| ClaseFact | Significado |
|-----------|-------------|
| 1 | Factura de Viajes |
| 2 | Factura de Comision (dentro de liquidacion de producto) |
| 3 | Nota de Credito |
| 4 | Nota de Debito a empresa |
| 5 | Nota de Debito a fletero |

---

## TipoFact en EncabFact (tabla vieja, pre-electronica)

| TipoFact | Significado |
|----------|-------------|
| 1 | Factura de Viajes |
| 2 | NC (en FactNCND.frm viejo) / ND (en otros contextos) |
| 3 | NC electronica (en contexto de impresion) |
| 4 | NC por Cta y Orden |
| 5 | NC A (en GENERA_NC_CTA) |

---

## CodComp en EncabFactProv (facturas recibidas de proveedores)

| CodComp | Descripcion | En IVA Compras |
|---------|-------------|----------------|
| 1 | Factura de Proveedor | Positivo |
| 2 | NC de Proveedor | Negativo |
| 3 | ND de Proveedor | Positivo |

---

## Clasificacion en AplicComprobantes.frm

Asi se agrupan los comprobantes al aplicar cobros:

**Facturas (suman deuda, seleccionables para cancelar):**
TipoComp = 1, 3, 13, 16, 18, 60, 201, 202

**Notas de Credito (restan deuda, se aplican como pago):**
TipoComp = 2, 14, 17, 203

**Recibos (restan deuda):**
TipoComp = 6

La ND (TipoComp=18) se clasifica junto con las facturas porque aumenta la deuda.
La NC se usa igual que un recibo para cancelar saldo de facturas.

---

## Tablas de almacenamiento

| Tabla | Que guarda | Campos clave de tipo |
|-------|------------|---------------------|
| EncabFE / DetFE | Facturas electronicas, NC, ND (con CAE) | TipoAfip, TipoSistema, ClaseFact |
| EncabFact / DetFact | Facturas viejas pre-electronicas | TipoFact |
| EncabFactCta / DetFactCta | Facturas y NC por cuenta y orden | TipoFact |
| EncabLProd / DetViajesLP | Liquidaciones de producto | TipoAfip |
| EncabFactProv / DetFactProv | Facturas recibidas de proveedores | CodComp |
| EncabRec | Recibos de cobranza | (siempre TipoComp=6) |
| EncabOP | Ordenes de pago | (siempre TipoComp=11) |
| Comprobantes | Tabla parametrica (CodComp, DescComp, UltNro) | CodComp |

---

## Atencion: inconsistencia en EncabLProd

En la tabla EncabLProd (liquidaciones de producto), la polaridad de TipoAfip esta **invertida** respecto a EncabFE:

| TipoAfip en EncabLProd | Significado |
|------------------------|-------------|
| 2 | NC (en EncabFE seria ND) |
| 3 | ND (en EncabFE seria NC) |

Esto es una inconsistencia del sistema viejo. En el sistema nuevo debe usarse el codigo AFIP estandar (3=NC, 2=ND) de forma consistente.

---

## Recomendacion para el sistema nuevo

Unificar todos los codigos internos usando directamente los codigos AFIP:

| Codigo unico | Comprobante |
|-------------|-------------|
| 1 | Factura A |
| 2 | Nota de Debito A |
| 3 | Nota de Credito A |
| 6 | Factura B |
| 7 | Nota de Debito B |
| 8 | Nota de Credito B |
| 60 | CVLP A (Liquidacion Producto) |
| 61 | CVLP B |
| 90 | NC Liquidacion Producto |
| 201 | FCE MiPyme A |
| 202 | ND FCE MiPyme A |
| 203 | NC FCE MiPyme A |

Eliminar TipoSistema, TipoFact, ClaseFact, CodComp como campos separados. Un solo campo `tipoComprobante` con el codigo AFIP.
