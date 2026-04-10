# Reglas de IVA para NC/ND — Trans-Magg S.R.L.

## Principio general

Cada comprobante que Trans-Magg emite tiene un impacto específico en los libros de IVA. Las NC/ND revierten o ajustan ese impacto siguiendo las mismas reglas del comprobante original.

---

## Facturas a empresas

### Factura emitida
- Impacta en **IVA Ventas** (débito fiscal)
- Base imponible: neto de la factura
- IVA: sobre el neto

### NC a empresa
- Impacta en **IVA Ventas** (reduce débito fiscal)
- Importes **negativos** en el libro
- Casos: reducción de factura, anulación total/parcial, error de facturación, faltante

### ND a empresa
- Impacta en **IVA Ventas** (aumenta débito fiscal)
- Importes **positivos** en el libro

**Regla**: toda NC/ND sobre factura a empresa siempre impacta solo en IVA Ventas.

---

## Liquidaciones a fleteros (LP)

### LP emitido
El LP es un **comprobante híbrido** con doble impacto:

| Componente | Libro IVA | Tipo | Base imponible |
|------------|-----------|------|----------------|
| Viajes (neto = bruto - comisión) | **IVA Compras** | Crédito fiscal | netoViajes |
| Comisión de Trans-Magg | **IVA Ventas** | Débito fiscal | comisiónMonto |

### NC/ND sobre LP — Dos maneras

#### Manera 1: Se ajustan viajes Y comisión
**Checkbox "Incluir comisión en el ajuste" = tildado**

Caso típico: error en el LP, anulación de un viaje completo.

| Impacto | Libro IVA | Efecto |
|---------|-----------|--------|
| Ajuste viajes | **IVA Compras** | ↓ crédito fiscal |
| Ajuste comisión | **IVA Ventas** | ↓ débito fiscal |

Se revierte completamente el efecto del LP en la parte ajustada. El desglose se calcula proporcionalmente usando el `comisionPct` del LP original.

Ejemplo: NC por $100.000 sobre LP con 10% comisión:
- IVA Compras: -$90.000 neto viajes, -$18.900 IVA
- IVA Ventas: -$10.000 comisión, -$2.100 IVA

#### Manera 2: Se ajustan SOLO viajes, NO comisión
**Checkbox "Incluir comisión en el ajuste" = destildado**

Caso típico: faltante de mercadería, penalización al fletero.

| Impacto | Libro IVA | Efecto |
|---------|-----------|--------|
| Ajuste viajes | **IVA Compras** | ↓ crédito fiscal |
| Comisión | **IVA Ventas** | **Sin cambio** |

100% del ajuste va a IVA Compras. La comisión de Trans-Magg queda intacta porque el problema es responsabilidad del fletero, no de Trans-Magg.

Ejemplo: NC por $100.000 sobre LP sin comisión:
- IVA Compras: -$100.000 neto, -$21.000 IVA
- IVA Ventas: sin cambio

---

## Facturas de proveedor

### Factura recibida
- Impacta en **IVA Compras** (crédito fiscal)

### NC/ND de proveedor
- Impacta en **IVA Compras**
- NC: importes negativos (reduce crédito fiscal)
- ND: importes positivos (aumenta crédito fiscal)

---

## Pólizas de seguro

- Impacta en **IVA Compras** (crédito fiscal)

---

## Recibos de cobranza

- **No impactan en libros de IVA** (no son comprobantes fiscales)

---

## Resumen de impacto por comprobante

| Comprobante | IVA Ventas | IVA Compras |
|-------------|-----------|-------------|
| Factura a empresa | ✓ Débito fiscal | — |
| NC sobre factura empresa | ✓ Reduce débito | — |
| ND sobre factura empresa | ✓ Aumenta débito | — |
| LP a fletero (viajes) | — | ✓ Crédito fiscal |
| LP a fletero (comisión) | ✓ Débito fiscal | — |
| NC sobre LP (con comisión) | ✓ Reduce débito | ✓ Reduce crédito |
| NC sobre LP (sin comisión) | — | ✓ Reduce crédito |
| ND sobre LP (con comisión) | ✓ Aumenta débito | ✓ Aumenta crédito |
| ND sobre LP (sin comisión) | — | ✓ Aumenta crédito |
| Factura proveedor | — | ✓ Crédito fiscal |
| NC proveedor | — | ✓ Reduce crédito |
| ND proveedor | — | ✓ Aumenta crédito |
| Póliza seguro | — | ✓ Crédito fiscal |
| Recibo cobranza | — | — |

---

## Implementación en el sistema

### Modelo AsientoIva
Cada comprobante genera uno o más registros en `AsientoIva` con:
- `tipo`: "VENTA" (IVA Ventas) o "COMPRA" (IVA Compras)
- `tipoReferencia`: identifica el origen (FACTURA_EMITIDA, LIQUIDACION, LIQUIDACION_COMISION, NC_EMITIDA, ND_EMITIDA, etc.)
- `baseImponible`: positivo para facturas/ND, negativo para NC
- `alicuota`: porcentaje de IVA
- `montoIva`: monto de IVA calculado
- `periodo`: YYYY-MM

### LP genera 2 asientos
1. `LIQUIDACION_COMISION` tipo `VENTA` (comisión)
2. `LIQUIDACION` tipo `COMPRA` (neto viajes)

### NC/ND sobre LP
- Con comisión: genera 2 asientos (NC_EMITIDA_COMISION tipo VENTA + NC_EMITIDA tipo COMPRA)
- Sin comisión: genera 1 asiento (NC_EMITIDA tipo COMPRA)

### NC/ND sobre factura
- Siempre genera 1 asiento tipo VENTA

### Checkbox "Incluir comisión en el ajuste"
- Campo `incluirComision` en modelo `NotaCreditoDebito`
- Default: `true` (tildado)
- Controla si la NC/ND sobre LP desglosa la comisión o va 100% a IVA Compras
- Usado por el backend (asientos IVA) y el PDF (desglose visual)
