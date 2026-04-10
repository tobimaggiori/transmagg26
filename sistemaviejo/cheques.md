# Cheques — Sistema Viejo Trans-Magg (VB6)

## Resumen general

El sistema maneja dos tipos de cheques con ciclos de vida independientes:
- **Cheques de terceros** (ChequesTerc) — recibidos de empresas, circulan en cartera
- **Cheques propios** (ChEmitidos) — emitidos por Trans-Magg, pendientes de acreditacion bancaria

No hay soft-delete: los cheques nunca se borran, solo cambian de estado.

---

## Cheques de Terceros (ChequesTerc)

### Estructura de la tabla

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| CodBanco | Numerico | FK a tabla Bancos |
| NroCH | Numerico | Numero del cheque |
| FechaVto | Date | Fecha de vencimiento |
| Importe | Double | Monto del cheque |
| Estado | Texto | Estado actual |
| Entregado | Texto | De quien se recibio (nombre empresa) |
| Dado | Texto | A quien se entrego (nombre fletero, nro cuenta, etc.) |
| NroRec | Numerico | Nro de recibo/comprobante que lo origino o movio |
| FRecibido | Date | Fecha en que se recibio |
| FEntregado | Date | Fecha en que se entrego/salio de cartera |

**Identificacion**: No tiene ID propio. Se identifica por la combinacion `CodBanco + NroCH`.

### Todos los estados posibles

| Estado | Significado |
|--------|-------------|
| **En Cartera** | Disponible para usar. Estado inicial al ingresar. |
| **Liquido Producto** | Entregado a un fletero como parte de un LP |
| **Orden de Pago** | Entregado a un proveedor como parte de una OP |
| **Mutuo** | Entregado a un tercero en operacion de canje de cheques |
| **Adelanto** | Entregado a un fletero como adelanto |
| **Depositado CtaXXXX** | Depositado en cuenta bancaria propia (string dinamico) |
| **Otro** | Estado generico |

### Diagrama de transiciones

```
INGRESO (3 vias)                    SALIDA (6 destinos)
===================================  =====================================
RecCobranza.frm                     LiquidoProducto.frm
  → "En Cartera"                      → "Liquido Producto"

CambCh.frm (mutuo, recibidos)       NuevaOrdenPAgo.frm
  → "En Cartera"                      → "Orden de Pago"

IngCHCartera.frm (manual)           CambCh.frm (mutuo, entregados)
  → "En Cartera"                      → "Mutuo"

                                    Adelantos.frm
REVERSION                            → "Adelanto"
=====================================
AnulaFact.frm                       IngMovBanco.frm (deposito)
  → "En Cartera"                      → "Depositado CtaXXXX"
```

### Como entra un cheque al sistema

#### Via Recibo de Cobranza (RecCobranza.frm / RecCob.frm)

Al cobrar a una empresa, el usuario carga cheques con: Banco, NroCH, FechaVto, Importe.

| Campo | Valor |
|-------|-------|
| Estado | "En Cartera" |
| Entregado | Nombre de la empresa que lo entrego |
| NroRec | Numero del recibo |
| FRecibido | Fecha del recibo |

#### Via Mutuo (CambCh.frm)

Los cheques nuevos recibidos en un canje entran como "En Cartera".

#### Via Ingreso Manual (IngCHCartera.frm)

Ingreso manual directo. Crea simultaneamente un cheque de tercero y un cheque emitido.

### Como sale un cheque del sistema

#### Entrega en Liquido Producto (LiquidoProducto.frm)

| Campo | Valor anterior | Valor nuevo |
|-------|---------------|-------------|
| Estado | "En Cartera" | "Liquido Producto" |
| Dado | (vacio) | Nombre del fletero |
| FEntregado | (vacio) | Fecha del LP |

Se registra tambien en tabla `DetLPCHTerc`.

#### Entrega en Orden de Pago (NuevaOrdenPAgo.frm)

| Campo | Valor anterior | Valor nuevo |
|-------|---------------|-------------|
| Estado | "En Cartera" | "Orden de Pago" |
| Dado | (vacio) | Nombre del fletero/proveedor |
| FEntregado | (vacio) | Fecha de la OP |

Se registra tambien en tabla `DetOPCHT`.

#### Entrega como Adelanto (Adelantos.frm)

| Campo | Valor anterior | Valor nuevo |
|-------|---------------|-------------|
| Estado | "En Cartera" | "Adelanto" |
| Dado | (vacio) | Nombre del fletero |
| FEntregado | (vacio) | Fecha del adelanto |

Se registra tambien en tabla `DetAdelCHT` con `Descontado = "NO"`.

#### Deposito bancario (IngMovBanco.frm)

| Campo | Valor anterior | Valor nuevo |
|-------|---------------|-------------|
| Estado | "En Cartera" | "Depositado Cta" + nro cuenta |
| Dado | (vacio) | Numero de cuenta |
| NroRec | (anterior) | Nro del movimiento bancario |
| FEntregado | (vacio) | Fecha del deposito |

Se registra en `CtaCteBco` (Debe = importe) y en `DetMovBco`.

#### Mutuo/Canje (CambCh.frm)

| Campo | Valor anterior | Valor nuevo |
|-------|---------------|-------------|
| Estado | "En Cartera" | "Mutuo" |
| Dado | (vacio) | Nombre de la empresa |
| NroRec | (anterior) | Nro del mutuo |
| FEntregado | (vacio) | Fecha del mutuo |

Se registra en tabla `CHEntMutuo`.

#### Reversion por anulacion (AnulaFact.frm)

Si se anula un LP o OP, los cheques de terceros entregados vuelven a cartera:

| Campo | Valor anterior | Valor nuevo |
|-------|---------------|-------------|
| Estado | "Liquido Producto" / "Orden de Pago" | "En Cartera" |
| Dado | (nombre) | "" (vacio) |

---

## Cheques Propios (ChEmitidos)

### Estructura de la tabla

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| Fecha | Date | Fecha de vencimiento del cheque |
| CtaCte | Texto | Numero de cuenta corriente bancaria propia |
| CodComp | Numerico | Tipo: 1 = LP, 11 = OP |
| NroComp | Numerico | Numero del cheque fisico |
| NroMov | Numerico | Nro del LP/OP/Adelanto que lo origino |
| Haber | Double | Importe del cheque |
| Estado | Texto | "Pendiente" o "Acreditado" |
| FEmision | Date | Fecha de emision del comprobante |
| FAcred | Date | Fecha de acreditacion (cuando el banco lo debita) |
| Dado | Texto | A quien se le dio (nombre fletero/proveedor) |
| Adel | Texto | "SI" si es cheque de adelanto, "NO" si es nuevo |

### Estados posibles

| Estado | Significado |
|--------|-------------|
| **Pendiente** | Emitido pero no acreditado por el banco. Estado inicial. |
| **Acreditado** | El banco debito el cheque de la cuenta. Estado final. |

### Diagrama de transiciones

```
CREACION (3 vias)                   ACREDITACION
===================================  =====================================
LiquidoProducto.frm (CodComp=1)     AcreditaCH.frm
  → "Pendiente"                        → "Acreditado" + FAcred
  + CtaCteBco (Haber)                  + CtaCteBco (Haber)

NuevaOrdenPAgo.frm (CodComp=11)
  → "Pendiente"
  + CtaCteBco (Haber)

IngCHCartera.frm (CodComp=1)
  → "Pendiente"
```

### Como se crea un cheque propio

#### En Liquido Producto (LiquidoProducto.frm)

| Campo | Valor |
|-------|-------|
| Fecha | Fecha de vencimiento |
| CtaCte | Cuenta bancaria seleccionada |
| CodComp | 1 |
| NroComp | Numero del cheque |
| NroMov | Numero del LP |
| Haber | Importe |
| Estado | "Pendiente" |
| FEmision | Fecha del LP |
| Dado | Nombre del fletero |
| Adel | "SI" si era adelanto, "NO" si es nuevo |

Ademas se crea movimiento en **CtaCteBco** (Haber = importe) y en **DetLPCHPropios**.

#### En Orden de Pago (NuevaOrdenPAgo.frm)

Identico pero con `CodComp = 11` y se registra en `DetOPCHPropios`.

### Acreditacion (AcreditaCH.frm)

Cuando el banco debita el cheque de la cuenta:

1. El usuario selecciona una cuenta bancaria
2. Se cargan cheques con Estado = "Pendiente" de esa cuenta
3. Doble-click para seleccionar cheques a acreditar
4. Al presionar "Acreditar":
   - `ChEmitidos.Estado = "Acreditado"`
   - `ChEmitidos.FAcred = fecha`
   - Se crea movimiento en `CtaCteBco` (Haber)

---

## Mutuos de cheques (CambCh.frm)

Operacion de intercambio de cheques con una empresa.

### Flujo

1. Se muestran cheques "En Cartera" a la izquierda
2. El usuario selecciona cheques para entregar (doble-click → pasan a "seleccionados")
3. El usuario carga cheques nuevos que recibe (manualmente: empresa, banco, nro, vto, importe)
4. Puede agregar comision ganada por el canje
5. **Validacion**: `Total Entregados = Total Recibidos + Comision`

### Tablas escritas

| Tabla | Operacion |
|-------|-----------|
| ChequesTerc (entregados) | Estado → "Mutuo", Dado = empresa |
| ChequesTerc (recibidos) | INSERT con Estado = "En Cartera", Entregado = empresa |
| EncabMutuo | Encabezado: Nro, Fecha, CodEmpresa, totales, comision |
| CHRecMutuo | Detalle cheques recibidos |
| CHEntMutuo | Detalle cheques entregados |

### Comision

La comision es la diferencia entre lo entregado y lo recibido:
```
Total Entregados = Total Recibidos + Comision Ganada
```

Trans-Magg entrega cheques por un valor mayor al que recibe, y la diferencia es la ganancia.

---

## Deposito bancario (IngMovBanco.frm)

### Flujo

1. Seleccionar cuenta bancaria y tipo "Deposito"
2. Puede depositar efectivo Y/O cheques de cartera
3. Si elige cheques: se cargan "En Cartera", doble-click para seleccionar
4. Al grabar:
   - `ChequesTerc.Estado = "Depositado Cta" + nroCuenta`
   - `CtaCteBco`: movimiento Debe (ingreso a la cuenta)
   - `DetMovBco`: detalle por cada cheque
   - Asiento contable (Debe: cuenta banco, Haber: cuenta cheques en cartera 1101050)

**Cuenta contable de cheques en cartera**: 1101050 (hardcodeada)

---

## Conciliacion bancaria (ConciliacionBancaria.frm)

Los cheques emitidos aparecen en CtaCteBco como movimientos de Haber. La conciliacion tiene 3 pestanas:

1. **General**: todos los movimientos
2. **Conciliado**: Conciliado = True
3. **Pendiente**: Conciliado = False, con checkboxes para marcar

Al grabar conciliacion: `Conciliado = True` para los seleccionados.

Boton "Imprime Cheques Pendientes": genera reporte de cheques emitidos no conciliados.

---

## Consultas

### ConsChequesTer.frm — Cheques de terceros

**Filtro**: Estado (combo: "En Cartera", "Liquido Producto", "Orden de Pago", "Otro", "Depositado CtaXXXX")

**Columnas**: Banco, Numero, F. Vto, Importe, Recibido de, Entregado a

**Total** al pie.

### ConsultaCH.frm — Cheques emitidos

**Filtros**: Fecha desde/hasta, Estado ("Pendiente" / "Acreditado")

**Genera**: Reporte Crystal Reports (CHEmitidos.rpt)

---

## Impresion de cheques fisicos

4 funciones en Funciones.bas para imprimir cheques en papel pre-impreso:

| Funcion | Contexto | Filtro |
|---------|----------|--------|
| ImprimeCH | OP (formato Sta Fe) | CHEmitidos WHERE NroMov = X AND Adel = 'NO' AND CodComp = 11 |
| ImprimeCHMacro | LP (formato Macro) | CHEmitidos WHERE NroMov = X AND Adel = 'NO' |
| ImprimeCHOP | OP (variante) | Similar a ImprimeCH |
| ImprimeCHAdel | Adelantos | DetAdelCHP directamente |

Cada funcion imprime en posiciones absolutas (mm) sobre papel de cheque:
- Importe numerico
- Fecha de emision (dia, mes en letras, año)
- Fecha de vencimiento
- Destinatario (nombre del fletero/proveedor)
- Importe en letras (clase clsNum2Let)

Soporta multiples cheques por hoja con paginacion configurable.

---

## Tablas de detalle de cheques por operacion

| Tabla | Operacion | Campos principales |
|-------|-----------|-------------------|
| DetLPCHPropios | Cheques propios en LP | NroLP, CtaCte, Importe, Vto, NroCH |
| DetLPCHTerc | Cheques terceros en LP | NroLP, CodBanco, Vto, Importe, NroCH |
| DetOPCHPropios | Cheques propios en OP | NroOP, Cuenta, Importe, Vto, NroCH |
| DetOPCHT | Cheques terceros en OP | NroOP, CodBco, Vto, Importe, NroCH |
| DetAdelCHP | Cheques propios en Adelanto | NroAdel, Cuenta, Importe, Vto, NroCH, Descontado, CodProv |
| DetAdelCHT | Cheques terceros en Adelanto | NroAdel, CodBco, Vto, Importe, NroCH, Descontado, CodProv |
| CHRecMutuo | Cheques recibidos en Mutuo | NroMutuo, CodBco, NroCH, FechaVto, Importe |
| CHEntMutuo | Cheques entregados en Mutuo | NroMutuo, CodBco, NroCH, FechaVto, Importe |
| DetMovBco | Detalle movimiento bancario | NroMov, NroCH, Bco, FVto, Importe |

---

## Reglas de negocio criticas

1. **Los cheques nunca se borran** — solo cambian de estado.
2. **Solo se pueden usar cheques "En Cartera"** — las grillas de seleccion filtran por ese estado.
3. **Reversion solo por anulacion** — AnulaFact devuelve cheques terceros a "En Cartera". No hay mecanismo manual para revertir estado.
4. **Cheques propios tienen 2 estados**: Pendiente → Acreditado. No hay reversion.
5. **El estado "Depositado" es un string dinamico** — se concatena con el numero de cuenta. Ej: "Depositado Cta2552/08".
6. **Cheques propios de adelanto no se registran en CHEmitidos al crear** — solo al descontar en OP/LP.
7. **Cheques de adelanto tienen campo Descontado** (SI/NO) para evitar doble descuento.
8. **Mutuos requieren que Total Entregado = Total Recibido + Comision**.
9. **Cheques terceros no tienen ID propio** — se identifican por CodBanco + NroCH (puede haber colisiones).
10. **Impresion fisica de cheques** — funciones especializadas para cheques de banco con posiciones absolutas en papel pre-impreso.
