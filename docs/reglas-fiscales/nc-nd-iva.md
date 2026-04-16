# Reglas de IVA para NC/ND — Trans-Magg S.R.L.

## Principio general

El IVA de la comisión de Trans-Magg NO se registra por separado. Se tributa implícitamente en la diferencia entre la factura a empresa (IVA sobre bruto) y el LP (IVA sobre neto = bruto - comisión).

Ejemplo con viaje $1.000.000 y 10% comisión:
```
Factura empresa: IVA sobre $1.000.000 = $210.000  (IVA Ventas)
LP fletero:      IVA sobre $900.000   = $189.000  (IVA Compras)
Diferencia:                             $21.000  = IVA de la comisión ($100.000 × 21%)
```

Por lo tanto, los LP y sus NC/ND solo generan asientos en IVA Compras.

---

## Facturas a empresas

### Factura emitida
- Impacta en **IVA Ventas** (débito fiscal)
- Base imponible: neto de la factura (bruto completo, sin descontar comisión)
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
- Impacta **solo en IVA Compras** (crédito fiscal)
- Base imponible: neto viajes (bruto - comisión)
- IVA: sobre el neto
- La comisión NO genera asiento IVA separado

### NC/ND sobre LP — Dos maneras

#### Manera 1: Con comisión (anulación de viaje)
**Checkbox "Incluir comisión en el ajuste" = tildado**

El usuario ingresa el subtotal del viaje (bruto). El sistema resta la comisión del LP antes de calcular IVA. El neto del comprobante es menor.

| Impacto | Libro IVA | Efecto |
|---------|-----------|--------|
| Ajuste viajes (neto = bruto - comisión) | **IVA Compras** | ↓ crédito fiscal |
| IVA Ventas | — | **Sin cambio** |

Ejemplo: NC por viaje de $1.080.000 sobre LP con 10% comisión:
```
Subtotal viajes:  $1.080.000  (lo que ingresa el usuario)
Comisión (10%):    -$108.000  (se resta automáticamente)
Neto comprobante:   $972.000
IVA 21%:            $204.120
Total:            $1.176.120

Asiento IVA: COMPRA → base -$972.000, IVA -$204.120
```

#### Manera 2: Sin comisión (faltante / penalización)
**Checkbox "Incluir comisión en el ajuste" = destildado**

El usuario ingresa el monto del ajuste. No se resta comisión. La comisión de Trans-Magg queda intacta.

| Impacto | Libro IVA | Efecto |
|---------|-----------|--------|
| Ajuste viajes (neto = bruto directo) | **IVA Compras** | ↓ crédito fiscal |
| IVA Ventas | — | **Sin cambio** |

Ejemplo: NC por faltante de $50.000:
```
Neto comprobante: $50.000
IVA 21%:          $10.500
Total:            $60.500

Asiento IVA: COMPRA → base -$50.000, IVA -$10.500
```

**Regla**: toda NC/ND sobre LP siempre impacta solo en IVA Compras. La diferencia entre Manera 1 y 2 es solo el neto del comprobante (con o sin resta de comisión).

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
| LP a fletero | — | ✓ Crédito fiscal |
| NC sobre LP (con comisión) | — | ✓ Reduce crédito |
| NC sobre LP (sin comisión) | — | ✓ Reduce crédito |
| ND sobre LP (con comisión) | — | ✓ Aumenta crédito |
| ND sobre LP (sin comisión) | — | ✓ Aumenta crédito |
| Factura proveedor | — | ✓ Crédito fiscal |
| NC proveedor | — | ✓ Reduce crédito |
| ND proveedor | — | ✓ Aumenta crédito |
| Póliza seguro | — | ✓ Crédito fiscal |
| Recibo cobranza | — | — |

---

## Implementación en el sistema

### Modelo AsientoIva
Cada comprobante genera un registro en `AsientoIva` con:
- `tipo`: "VENTA" (IVA Ventas) o "COMPRA" (IVA Compras)
- `tipoReferencia`: identifica el origen (FACTURA_EMITIDA, LIQUIDACION, NC_EMITIDA, ND_EMITIDA, etc.)
- `baseImponible`: positivo para facturas/ND, negativo para NC
- `alicuota`: porcentaje de IVA
- `montoIva`: monto de IVA calculado
- `periodo`: YYYY-MM

### LP genera 1 asiento
- `LIQUIDACION` tipo `COMPRA` (neto viajes = bruto - comisión)

### NC/ND sobre LP
- Siempre genera 1 asiento tipo `COMPRA`
- Con comisión: base = neto del comprobante (bruto - comisión)
- Sin comisión: base = bruto directo

### NC/ND sobre factura
- Siempre genera 1 asiento tipo `VENTA`

### Checkbox "Incluir comisión en el ajuste"
- Campo `incluirComision` en modelo `NotaCreditoDebito`
- Default: `true` (tildado)
- Controla si el sistema resta la comisión del bruto antes de calcular el neto del comprobante
- Con comisión: neto = bruto - comisión (anulación de viaje)
- Sin comisión: neto = bruto (faltante, penalización al fletero)
- En ambos casos solo impacta IVA Compras
