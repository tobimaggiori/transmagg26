# Notas de Credito y Notas de Debito — Sistema Viejo Trans-Magg (VB6)

## Resumen general

Trans-Magg **solo emite** NC/ND. No existe funcionalidad para registrar NC/ND recibidas de terceros (empresas ni fleteros). Todas las NC/ND son comprobantes que Trans-Magg genera hacia empresas (clientes) o fleteros (transportistas).

---

## Tipos de comprobantes NC/ND

| Tipo | Codigo AFIP | TipoSistema | ClaseFact | Destino | Formulario |
|------|-------------|-------------|-----------|---------|------------|
| NC A | 3 | 17 | 3 | Empresa o Fletero | NotasCredito.frm |
| NC Cta y Orden | sin AFIP | 5 | 5 | Empresa o Fletero | NotasCredito.frm |
| NC MiPyme | 203 | 203 | 3 | Empresa o Fletero | NotasCredito.frm |
| NC Liq. Producto | 90 | 90 | 3 | Fletero | NotasCredito.frm |
| ND A | 2 | 18 | 4 (emp) / 5 (flet) | Empresa o Fletero | NotaDebito.frm |
| ND Liq. Producto | — | 37 | 4/5 | Fletero | NotaDebito.frm |

### Tabla maestra de codigos de comprobante (TipoComp en CtaCte)

| TipoComp | Descripcion | Categoria |
|----------|-------------|-----------|
| 1 | Factura (viajes) | Factura |
| 2 | NC (empresa, viejo) | NC |
| 3 | Factura de Comision / OP | Factura |
| 6 | Recibo de Cobranza | Recibo |
| 11 | Orden de Pago (fletero) | OP |
| 13 | Factura por Cta y Orden | Factura |
| 14 | NC por Cta y Orden | NC |
| 16 | Factura Electronica | Factura |
| 17 | NC Factura Electronica | NC |
| 18 | Nota de Debito | ND |
| 60 | Liquidacion Producto | Factura |
| 90 | NC Pyme | NC |
| 201 | Factura MiPyme | Factura |
| 203 | NC Liquidacion Producto | NC |

---

## Emision de una Nota de Credito

### Formulario: NotasCredito.frm ("Confeccion de Notas de Credito")

**Acceso**: Menu Empresas > Facturar > Notas de Credito

### Paso a paso

1. **Seleccionar destino**: Empresa (Option1(0)) o Fletero (Option1(1))
2. **Seleccionar tipo de NC**: Combo con 4 opciones:
   - NC "A" (electronica, AFIP codigo 3)
   - NC "Cta y Orden" (sin AFIP)
   - NC "Pyme" (AFIP codigo 203)
   - NC "Liquidacion Producto" (AFIP codigo 90)
3. **Ingresar codigo del cliente**: Busca en tabla Empresas o Fleteros segun destino
4. **Ingresar comprobante asociado**: Punto de venta + numero del comprobante original
   - El sistema valida que exista y pertenezca al cliente
   - Tipos de comprobante asociable: 16 (FE), 60 (LP), 201 (Pyme)
5. **Cargar items**: Concepto (texto libre, max 250 chars), % IVA, importe neto
6. **Calculo automatico**:
   ```
   Neto acumulado = suma de netos de cada item
   IVA = suma de (neto * %IVA / 100) por item
   Total = Neto + IVA
   ```
7. **Autorizacion ARCA/AFIP**: Segun tipo:
   - NC A: genera_cae_nc() con CbteTipo=3, asocia a factura tipo 1
   - NC Pyme: GeneraCAE_Pyme() con CbteTipo=203, asocia a factura tipo 201
   - NC LP: genera_cae_nc_LP() con CbteTipo=90
   - NC Cta y Orden: sin autorizacion AFIP
8. **Grabacion en base de datos**: Encabezado en EncabFE (o EncabFact para Cta y Orden), detalle en DetFE (o DetFact)

### Datos del encabezado grabado

| Campo | Valor |
|-------|-------|
| ClaseFact | 3 (siempre para NC) |
| TipoAfip | 3 (NC A), 203 (NC Pyme), 90 (NC LP) |
| TipoSistema | 17 (NC A), 5 (Cta y Orden), 90 (NC Pyme), 203 (NC LP) |
| Emp_Flet | 1 = Empresa, 0 = Fletero |
| TipoComp_Asoc | Tipo del comprobante original |
| PtoVta_Asoc | Punto de venta del comprobante original |
| Nro_Asoc | Numero del comprobante original |
| Fecha_Asoc | Fecha del comprobante original |
| Motivo_Asoc | Solo para Pyme: "S" = Anula sin enviar, "N" = Rechazada |
| CAE, VtoCAE | Datos de autorizacion AFIP |

---

## Emision de una Nota de Debito

### Formulario: NotaDebito.frm ("Nota de Debito")

**Acceso**: Menu Empresas > Facturar > Nota de Debito

### Paso a paso

1. **Seleccionar destino**: Empresa (Option1(0)) o Fletero (Option1(1))
2. **Seleccionar tipo de ND**: Combo con 2 opciones:
   - ND A (AFIP codigo 2, TipoSistema=18)
   - ND Liquidacion Producto (TipoSistema=37)
3. **Ingresar codigo del cliente**: Igual que NC
4. **Ingresar comprobante asociado**: Punto de venta + numero
   - Tipos de comprobante asociable: 60 (LP), 17 (NC — para revertir una NC)
5. **Cargar items**: Concepto, % IVA, importe neto
6. **Calculo**: Identico a NC
7. **Autorizacion ARCA**: CAE_ND() con CbteTipo=2, asocia a factura tipo 1
8. **Grabacion**: Encabezado en EncabFE, detalle en DetFE

### Datos del encabezado grabado

| Campo | Valor |
|-------|-------|
| ClaseFact | 4 (ND a empresa) o 5 (ND a fletero) |
| TipoAfip | 2 |
| TipoSistema | 18 (ND A) o 37 (ND LP) |
| Emp_Flet | 1 = Empresa, 0 = Fletero |

---

## Impacto en Cuenta Corriente

### Regla fundamental

Las NC/ND siempre impactan en **ambas** cuentas corrientes (empresa Y fletero) simultaneamente.

### Cuenta Corriente Empresas (CtaCteEmp)

| Comprobante | Columna | Efecto en saldo |
|-------------|---------|-----------------|
| Factura (1, 13, 16, 60, 201) | Debe | Suma (empresa debe mas) |
| NC (2, 14, 17, 203) | Haber | Resta (empresa debe menos) |
| ND (18) | Debe | Suma (empresa debe mas) |
| Recibo (6) | Haber | Resta (empresa pago) |

**Formula saldo empresa**: `Saldo = sum(Debe) - sum(Haber)`

### Cuenta Corriente Fleteros (CtaCteProv)

| Comprobante | Columna | Efecto en saldo |
|-------------|---------|-----------------|
| LP (60) | Haber | Suma (le debemos mas al fletero) |
| OP (11) | Debe | Resta (le pagamos al fletero) |
| NC (17, 203) | Debe | Resta (le debemos menos al fletero) |
| ND (18) | Haber | Suma (le debemos mas al fletero) |

**Formula saldo fletero**: `Saldo = sum(Haber) - sum(Debe)` (invertido respecto a empresa)

### Doble impacto al emitir

Cuando se emite una NC/ND, se registra en AMBAS cuentas corrientes:

**NC emitida**:
- CtaCteEmp: Haber = Total (reduce deuda de empresa)
- CtaCteProv: Debe = Total (reduce lo que le debemos al fletero)

**ND emitida**:
- CtaCteEmp: Debe = Total (aumenta deuda de empresa)
- CtaCteProv: Haber = Total (aumenta lo que le debemos al fletero)

---

## Impacto en Libro IVA Ventas

Las NC/ND aparecen en el libro IVA Ventas con reglas especificas:

| Tipo | Neto | IVA | Total | Identificacion |
|------|------|-----|-------|----------------|
| Factura | Positivo | Positivo | Positivo | "FC" |
| NC | **Negativo** | **Negativo** | **Negativo** | "NC" |
| ND | Positivo | Positivo | Positivo | "ND" |

Los importes de NC se multiplican por -1 al registrarse en el libro IVA.

### Detalle por tabla de origen

- **EncabFE (facturas electronicas)**: Se identifica por TipoAfip (3=NC, 2=ND)
- **EncabLProd (liquidaciones producto)**: Atencion: la polaridad esta invertida (TipoAfip 2=NC, 3=ND)
- **EncabFact (facturas viejas)**: Se identifica por TipoFact (3=NC, 2=ND)
- **EncabFactCta (cta y orden)**: TipoFact=4 es NC Orden

### Exportacion CITI

Las NC/ND se exportan al archivo CITI con su codigo AFIP correspondiente. El sistema detecta TipoSistema=203 y 201 para buscar el detalle correcto en DetFe.

---

## Impacto en Libro IVA Compras

Similar al IVA Ventas pero para compras:

| Tipo | Importes | Identificacion |
|------|----------|----------------|
| Factura Proveedor | Positivos | "FC" |
| NC Proveedor (CodComp=2) | **Negativos** | "NC" |
| ND Proveedor (CodComp=3) | Positivos | "ND" |

---

## Aplicacion de NC/ND contra comprobantes

### Formulario: AplicComprobantes.frm

Este formulario permite aplicar NC y recibos contra facturas pendientes.

**Tres listas**:
1. **Facturas pendientes**: TipoComp = 1, 3, 13, 16, 18, 60, 201, 202 (incluye ND como "factura")
2. **NC pendientes**: TipoComp = 2, 14, 17, 203
3. **Recibos**: TipoComp = 6

**Regla clave**: Las ND (TipoComp=18) se clasifican junto con las facturas, no con las NC. Esto es correcto porque la ND aumenta la deuda.

**Mecanismo de aplicacion**:
1. Seleccionar una factura + una NC (o recibo)
2. Ingresar importe a aplicar
3. Se descuenta del SaldoComp de ambos comprobantes
4. Se graba en tabla AplicRec

Las NC se usan exactamente igual que un recibo para cancelar saldo de facturas.

### NC NO se aplican en Recibos de Cobranza

Las NC se aplican exclusivamente en AplicComprobantes, no dentro del formulario de Recibo de Cobranza (RecCobranza.frm). El recibo solo aplica contra facturas.

---

## Ordenes de Pago y NC/ND

### NuevaOrdenPago.frm

- Las NC **no aparecen** directamente en la pantalla de orden de pago
- Solo se muestran LP (TipoComp=60) y facturas de proveedor como pendientes
- La OP se registra en CtaCteProv con TipoComp=11

### OrdenPago.frm (version anterior)

- En esta version mas vieja, TipoComp=2 (NC) aparece como comprobante seleccionable para descontarlo de la OP

### AplicOP.frm

- Facturas: TipoComp=1 o 60
- OPs: TipoComp=11, 3 o 18
- Las NC no aparecen en este formulario

---

## Saldos y Balances

### SaldosEmpresas.frm

- Muestra comprobantes con SaldoComp <> 0
- NC aparecen con importe negativo: `ImpComp = Haber * -1`, `SaldoComp = SaldoComp * -1`

### SaldoCero.frm

- Pone a cero el saldo de una empresa o fletero hasta una fecha
- Empresas: `Saldo = sum(Debe) - sum(Haber)`
- Fleteros: `Saldo = sum(Haber) - sum(Debe)` (invertido)
- Inserta registro compensatorio con TipoComp=1

### ConsSaldoHistoricos.frm

- Misma logica de calculo de saldos que SaldoCero

---

## Formulario viejo: FactNCND.frm

Version anterior reemplazada por NotasCredito.frm y NotaDebito.frm. Solo trabajaba con empresas (sin opcion empresa/fletero). Usaba tablas EncabFact/DetFact. Sin integracion AFIP.

## Formulario de reingreso: NotasCreditos1.frm

Identico a NotasCredito.frm pero permite ingresar manualmente el numero de NC (para reingresar NC ya emitidas que se perdieron de la base).

---

## Reportes de impresion

| Formulario | Reporte | Proposito |
|------------|---------|-----------|
| InfNC_FE.frm | NCFE.rpt | NC tipo A |
| InfNC_FEP.frm | NCMiPyme.rpt | NC MiPyme |
| InfNC_LP.frm | NCLP.rpt | NC Liquido Producto |
| InfND_E.frm | ND_E.rpt | ND tipo A |
| InfND_LP.frm | ND_LP.rpt | ND Liquido Producto |
| InfConsNCCta.frm | NCCta.rpt | NC por Cuenta y Orden |

---

## Resumen de reglas criticas

1. **Trans-Magg solo EMITE NC/ND** — no recibe de terceros
2. **Toda NC/ND debe asociarse a un comprobante original** (factura o liquidacion)
3. **NC/ND impactan AMBAS cuentas corrientes** (empresa y fletero) simultaneamente
4. **NC en empresa = Haber** (reduce deuda), **NC en fletero = Debe** (reduce lo que le debemos)
5. **ND en empresa = Debe** (aumenta deuda), **ND en fletero = Haber** (aumenta lo que le debemos)
6. **NC en IVA = importes negativos**, ND = importes positivos
7. **NC se aplica como un recibo** en AplicComprobantes para cancelar facturas
8. **ND se clasifica como factura** en AplicComprobantes (porque aumenta deuda)
9. **NC no va dentro del recibo de cobranza** — se aplica por separado
10. **Cada comprobante tiene SaldoComp** que se reduce con aplicaciones
