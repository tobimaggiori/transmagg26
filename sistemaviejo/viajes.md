# Viajes — Sistema Viejo Trans-Magg (VB6)

## Resumen general

Un viaje registra el transporte de mercaderia de un origen a un destino para una empresa (cliente), realizado por un fletero (transportista) con un chofer. Es la unidad basica de negocio de Trans-Magg.

**El viaje NO existe como entidad independiente.** Se crea dentro de una liquidacion al fletero y vive en la tabla `LiqDetViajes`. No hay un ABM de viajes separado.

---

## Campos del viaje

| Campo | Tipo | Descripcion | Ingresa el usuario? |
|-------|------|-------------|---------------------|
| NroViaje | Numerico | Identificador unico global (secuencial de tabla Comprobantes CodComp=15) | NO — autogenerado |
| NroLiq | Numerico | Nro de liquidacion a la que pertenece | NO — se asigna al grabar |
| Fecha | Fecha | Fecha del viaje | SI |
| CodEmpresa | Numerico | Empresa cliente | SI |
| DescEmpresa | Texto | Razon social de la empresa (desnormalizado) | NO — autocompleta |
| CodFlet | Numerico | Fletero que realiza el viaje | NO — viene del encabezado de la liquidacion |
| CodChofer | Numerico | Chofer que conduce | SI |
| DescChofer | Texto | Nombre del chofer (desnormalizado) | NO — autocompleta |
| NroRemito | Texto | Numero de carta de porte | SI |
| Mercaderia | Texto | Tipo de carga transportada | SI |
| Procedencia | Texto | Lugar de origen | SI |
| Destino | Texto | Lugar de destino | SI |
| Kilos | Numerico | Peso de la carga en kilogramos | SI |
| Tarifa | Numerico | Precio por tonelada | SI |
| SubTotal | Numerico | Importe calculado | NO — autocalculado |
| Facturado | Texto | "SI" o "NO" — si ya fue facturado a la empresa | NO — se actualiza al facturar |
| FacturadoEn | Texto | Referencia al comprobante (ej: "1 / 4-12345") | NO — se actualiza al facturar |
| Provincia | Numerico | Codigo de provincia | SI (combo) |
| Cupo | Texto | Campo adicional opcional | SI |

### Datos desnormalizados

DescEmpresa y DescChofer se guardan como texto plano, no solo como FK. Si se modifica el nombre de la empresa o chofer, los viajes viejos conservan el nombre original.

---

## Tarifa: UNA sola tarifa por viaje

**Hallazgo critico**: En el sistema viejo existe **UNA SOLA tarifa** por viaje. No hay distincion entre "tarifa empresa" y "tarifa fletero".

La tarifa se ingresa al cargar el viaje y se usa para:
1. **Calcular el SubTotal del viaje**: `(Kilos / 1000) * Tarifa`
2. **Calcular la comision de Trans-Magg**: `SubTotal * %Comision` (el % viene del fletero)
3. **Facturar a la empresa**: se usa el mismo SubTotal

La diferencia economica entre lo que se cobra a la empresa y lo que se paga al fletero se da **a traves de la comision** (porcentaje en la ficha del fletero), no a traves de tarifas diferentes.

### Formula del SubTotal

```
SubTotal = (Kilos / 1000) * Tarifa
```

La tarifa es **por tonelada**. Ejemplo: 30.000 kg a tarifa $150.000/tn = (30000/1000) * 150000 = $4.500.000

---

## Creacion de viajes

Los viajes se crean EXCLUSIVAMENTE dentro de **Liquidaciones.frm**, en el frame "Cargar Viajes".

### Flujo

1. El usuario selecciona un **fletero** en el encabezado de la liquidacion
2. Presiona **"Cargar Viajes"**
3. Para cada viaje:
   - Ingresa todos los campos manualmente
   - Presiona **"Agregar"**
   - El viaje se agrega a la lista en memoria
   - Se recalculan todos los totales
4. Puede agregar multiples viajes
5. Al presionar **"Aceptar"** se graban todos los viajes en la base

### Al agregar cada viaje se recalcula

```
Neto Viajes += SubTotal
IVA Viajes += SubTotal * 21 / 100
Ret IIBB = Neto Viajes * %IIBB / 100        (si aplica)
Total Viajes = Neto + IVA + Ret IIBB

Comision Neta = Neto Viajes * %Comision / 100
IVA Comision = Comision Neta * 21 / 100
Total Comision = Comision Neta + IVA Comision

Total a Pagar = Total Viajes - Total Comision - Total Descuentos
```

---

## Validaciones

| Validacion | Regla |
|------------|-------|
| Fletero | Debe existir en tabla Fleteros |
| Empresa | Debe existir en tabla Empresas |
| Chofer | Debe existir en tabla Choferes Y pertenecer al fletero (`CodFlet = X AND CodChoferes = Y`) |
| Nro Remito | Se verifica si ya fue cargado para la misma empresa. **Solo muestra warning, no bloquea** |
| Kilos | Numerico obligatorio |
| Tarifa | Numerico obligatorio |
| Mercaderia | Obligatorio |
| Procedencia | Obligatorio |
| Destino | Obligatorio |
| Fecha | Debe ser fecha valida |

---

## Ciclo de vida del viaje

```
1. CREACION
   Liquidaciones.frm → "Agregar"
   Viaje existe solo en memoria (ListView)
   
2. PERSISTENCIA
   Liquidaciones.frm → "Aceptar" (Grabar)
   Se inserta en: LiqDetViajes + ViajesFactura
   Estado: Facturado = "NO"
   Liquidacion: Pagada = "NO"

3. COMPROBANTE FISCAL (opcional)
   LiqProducto.frm → genera CVLP tipo 60
   Viaje se copia a DetViajesLP
   Se genera deuda en CtaCteProv del fletero

4. FACTURACION A EMPRESA
   FacturarViajes.frm → selecciona viajes con Facturado = "NO"
   Actualiza: LiqDetViajes.Facturado = "SI"
   Actualiza: LiqDetViajes.FacturadoEn = "TipoComp / PtoVta-NroFact"
   Viaje se copia a DetFE o DetFact (detalle de factura)

5. PAGO AL FLETERO
   LiquidoProducto.frm → aplica facturas, registra pago
   Actualiza: EncabLiquidacion.Pagada = "SI"

6. ANULACION (opcional)
   AnulaFact.frm → revierte Facturado a "NO"
   El viaje vuelve a estar disponible para facturar
```

### Estados del viaje

| Campo | Valor | Significado |
|-------|-------|-------------|
| Facturado | "NO" | Viaje pendiente de facturar a la empresa |
| Facturado | "SI" | Viaje ya facturado a la empresa |

### Estados de la liquidacion (EncabLiquidacion)

| Campo | Valor | Significado |
|-------|-------|-------------|
| Pagada | "NO" | Liquidacion pendiente de pago |
| Pagada | "SI" | Fletero ya cobro |

---

## Modificacion de viajes

### Desde Liquidaciones.frm (doble-click en viaje)

- Si `Facturado = "SI"`: **NO se puede modificar**. Muestra error.
- Si `Facturado = "NO"`: se elimina de la lista, se cargan los datos en los campos de edicion, se recalculan totales restando ese viaje. El usuario modifica y presiona "Agregar" de nuevo.

### Desde ConsultaViajes.frm (via ModificaTarifa.frm)

- ModificaTarifa.frm lista todos los viajes de una empresa
- Doble-click abre ConsultaViajes.frm
- Se pueden editar directamente en la base:
  - CodEmpresa, CodChofer, Mercaderia, Procedencia, Destino
  - Kilos, Tarifa (recalcula SubTotal on-the-fly)
  - NroRemito, Fecha
  - **Facturado** (se puede cambiar manualmente entre "SI" y "NO")
- "Modificar" actualiza directamente en LiqDetViajes

### Al modificar una liquidacion completa

Se **BORRAN** todos los viajes existentes de `LiqDetViajes` y `ViajesFactura` para ese NroLiq, y se re-insertan con los datos actualizados. No es un update parcial.

---

## Eliminacion de viajes

- **Solo se puede eliminar si Facturado = "NO"**
- Si `Facturado = "SI"`: "El Viaje ya fue facturado, no se puede eliminar"
- Al eliminar de la lista, se restan los montos de todos los totales
- La eliminacion se persiste al grabar la liquidacion

### Anulacion de factura (AnulaFact.frm)

Cuando se anula una factura, por cada viaje del detalle:
- `LiqDetViajes.Facturado = "NO"`
- `ViajesFactura.Facturado = "NO"`

Esto "libera" los viajes para volver a facturarlos.

---

## Relaciones entre entidades

### Fletero → Viaje

- El viaje hereda el CodFlet del encabezado de la liquidacion
- El fletero aporta: %Comision, situacion IIBB, %IIBB
- **Fletero 1107 = viajes propios** de Trans-Magg (no genera comprobante fiscal)

### Chofer → Viaje

- Cada viaje tiene un chofer
- El chofer **debe pertenecer al fletero**: `Choferes WHERE CodFlet = X AND CodChoferes = Y`
- Un fletero puede tener multiples choferes

### Empresa → Viaje

- La empresa es el cliente que paga por el transporte
- Cada viaje tiene una empresa
- Los viajes se agrupan por empresa para facturar

### Provincia → Viaje

- Cada viaje tiene una provincia (de la tabla Provincias)
- Se usa para reportes de comisiones por provincia

---

## Tablas donde vive el viaje

| Tabla | Cuando se usa | Proposito |
|-------|---------------|-----------|
| **LiqDetViajes** | Siempre | Tabla principal. Todos los viajes viven aca. |
| **ViajesFactura** | Siempre | Copia espejo para facturacion por Cta y Orden. |
| **DetViajesLP** | Al generar CVLP tipo 60 | Detalle del comprobante fiscal. |
| **DetFact** | Al facturar (manual) | Detalle de factura pre-electronica. |
| **DetFE** | Al facturar (electronica) | Detalle de factura electronica. |
| **DetFactCta** | Al facturar (Cta y Orden) | Detalle de factura cuenta y orden. |

---

## Numeracion de viajes

- El NroViaje es un **correlativo global unico** compartido por todo el sistema
- Se administra en la tabla `Comprobantes` con `CodComp = 15`
- Cada viaje recibe el siguiente numero secuencial
- No es por fletero, ni por empresa, ni por año

---

## Viajes pendientes: consultas

### ConsViajesPend.frm — Viajes sin facturar

- Filtra: `LiqDetViajes WHERE Facturado = 'NO'`
- Permite filtrar por empresa o todas
- Genera reporte Crystal Reports

### FacturarViajes.frm — Al ingresar empresa

- Filtra: `LiqDetViajes WHERE CodEmpresa = X AND Facturado = 'NO' ORDER BY Fecha`
- Distingue: Terceros (CodFlet ≠ 1107) vs Propios (CodFlet = 1107)

### Det_Viajes.frm — Detalle por fletero

- Filtra: `LiqDetViajes WHERE CodEmpresa = X AND CodFlet = Y AND Fecha BETWEEN Desde AND Hasta`

### ConsViajesProv.frm — Por provincia

- Recorre facturas y busca viajes asociados
- Calcula comision por viaje
- Agrupa por provincia

---

## Descuentos asociados a viajes

Los descuentos no son del viaje en si, sino de la liquidacion. Se almacenan en `LiqDetDescuentos`:

| Campo | Descripcion |
|-------|-------------|
| NroLiq | Vinculo a la liquidacion |
| NroRemito | Referencia al viaje |
| Efvo | Adelanto en efectivo |
| Gas-Oil | Adelanto de gas-oil |
| Faltante | Faltante de mercaderia |

Los descuentos de gas-oil vienen de `GasOilFleteros` (pendientes con Descontada = "NO"). Se pueden descontar total o parcialmente.

---

## Reportes de viajes

| Reporte | Template | Datos |
|---------|----------|-------|
| InfDetViajes | ViajesFlet.rpt | Viajes por fletero, empresa y rango de fechas |
| InfViajesPendEmp | ViajesPendEmpresa.rpt | Viajes sin facturar por empresa |
| InfViajeSinFact | ViajesSinFact.rpt | Todos los viajes sin facturar |
| InfViajesPorProv | ViajesProvincia.rpt | Viajes agrupados por provincia con comisiones |

---

## Particularidades importantes

1. **El viaje NO es una entidad independiente** — vive dentro de LiqDetViajes
2. **Una sola tarifa** — no hay tarifa empresa vs tarifa fletero. La diferencia se maneja con comision.
3. **Tarifa por tonelada**: `SubTotal = (Kilos / 1000) * Tarifa`
4. **IVA fijo 21%** — no configurable
5. **Datos desnormalizados** — DescEmpresa y DescChofer se guardan como texto
6. **NroViaje es global** — no es por fletero ni por liquidacion
7. **Validacion de remito debil** — muestra warning pero no bloquea
8. **Modificar liquidacion = borrar y re-insertar** — no es update parcial
9. **Fletero 1107 = propios** — hardcodeado como viajes propios de Trans-Magg
10. **Al anular una factura, los viajes se "liberan"** para volver a facturar
