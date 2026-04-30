# Facturación a empresa

> **Nota**: este documento describe reglas de dominio y criterios operativos.
> Para implementación técnica ver:
> - Catálogo de comprobantes: [../arca/matriz.md](../arca/matriz.md)
> - IVA en NC/ND: [../reglas-fiscales/nc-nd-iva.md](../reglas-fiscales/nc-nd-iva.md)
> - Cuenta corriente y saldo pendiente: [./cuenta-corriente.md](./cuenta-corriente.md)
> - Viajes con cupo (auto-selección de hermanos al facturar, validación
>   de tarifa, agrupamiento en el PDF): [./cupo.md](./cupo.md)

## Objetivo

Definir la lógica de negocio del circuito de facturación a empresa en
Transmagg, preservando la lógica operativa del sistema actual y evitando
interpretaciones destructivas del tipo "la factura desaparece".

---

## 1. Alcance

Este documento cubre:

* factura a empresa
* nota de crédito (NC)
* nota de débito (ND)
* recibo por cobranza
* efecto sobre viajes
* efecto sobre cuenta corriente empresa
* refacturación
* invariantes y criterios de consistencia

No cubre en detalle:

* liquidación al fletero
* orden de pago al fletero
* descuentos/consumos del fletero

Eso va en un documento separado.

---

## 2. Principio general

En el circuito de facturación empresa hay que separar siempre:

1. **historial documental**
2. **estado económico vigente**
3. **estado operativo del viaje**
4. **estado de cobranza**

La factura original nunca debe considerarse “inexistente” por el hecho de que luego se emita una NC.

La lógica correcta es:

* la factura original sigue existiendo como documento histórico
* la NC o ND se emite como comprobante propio, asociado al comprobante origen
* el efecto económico vigente resulta del conjunto de comprobantes emitidos y cobranzas aplicadas

---

## 3. Documentos del circuito

### 3.1 Factura

La factura:

* es un comprobante emitido a una empresa
* puede incluir uno o más viajes
* genera deuda en cuenta corriente empresa
* genera IVA ventas según corresponda
* deja trazabilidad documental permanente

Efecto de negocio:

* crea cargo económico a la empresa
* deja los viajes incluidos como facturados desde el punto de vista operativo

---

### 3.2 Nota de crédito (NC)

La NC:

* es un comprobante nuevo
* referencia una factura origen
* corrige o revierte total o parcialmente una factura ya emitida
* reduce el efecto económico e impositivo de la factura original

La NC no debe:

* borrar la factura original
* eliminar trazabilidad
* interpretarse como “la factura nunca existió”

---

### 3.3 Nota de débito (ND)

La ND:

* es un comprobante nuevo
* referencia una factura origen
* incrementa el cargo económico sobre la empresa
* incrementa el IVA ventas en la medida que corresponda

La ND no reemplaza la factura. La complementa/corrige hacia arriba.

---

### 3.4 Recibo por cobranza

El recibo por cobranza:

* es un comprobante nuevo
* registra cobro recibido de la empresa
* puede aplicarse total o parcialmente a comprobantes abiertos
* no altera el historial de facturación
* altera el saldo pendiente en cuenta corriente empresa

---

## 4. Relación entre viaje y facturación

## 4.1 Regla base

Cada viaje pertenece a un circuito de facturación independiente del circuito de liquidación al fletero.

Para facturación empresa:

* un viaje puede haber aparecido en varios comprobantes históricos a lo largo del tiempo
* pero solo puede tener **un efecto de facturación vigente neto**
* ese efecto puede estar completo, ajustado parcialmente o totalmente revertido

---

## 4.2 Regla documental

Un viaje puede estar vinculado históricamente a:

* una factura original
* una o más NC/ND asociadas a esa factura
* una refactura posterior

Eso no implica múltiples facturas vigentes simultáneas sobre el mismo viaje como cargo económico principal.

---

## 5. Estado de facturación del viaje

El estado operativo del viaje en el circuito empresa se modela con un flag
binario sobre el viaje base (`Viaje.estadoFactura` en `prisma/schema.prisma`,
resuelto en `src/lib/viaje-workflow.ts`):

### Estados implementados

#### `PENDIENTE_FACTURAR`

El viaje no está tomado por una factura vigente. Casos típicos:

* nunca fue facturado
* fue facturado y luego liberado por NC (total o parcial que libera el viaje)

---

#### `FACTURADO`

El viaje está tomado por al menos una factura vigente. Casos típicos:

* factura emitida sin correcciones
* factura emitida y luego ND (la ND complementa, no libera)
* factura emitida y luego NC parcial que NO libera el viaje (corrección
  monetaria sin reversión operativa)

---

> **Nota sobre el granular**: la "vigencia económica" de un viaje no se modela
> como un tercer estado del viaje. Lo único que decide qué deuda neta queda
> abierta son los comprobantes asociados (factura + NC/ND) y la cuenta
> corriente. Una NC parcial sin liberación de viaje afecta el saldo y el
> efecto IVA, pero el viaje sigue contando como `FACTURADO`.

---

## 6. Reglas de negocio por documento

### 6.1 Emisión de factura

Cuando se emite una factura a empresa:

* se genera un comprobante de factura
* se registra el cargo en cuenta corriente empresa
* se genera IVA ventas según corresponda
* los viajes incluidos pasan a estado `FACTURADO`

El flag `estadoFactura` en el viaje no es la fuente de verdad económica: solo
indica si el viaje está tomado por alguna factura vigente. La trazabilidad y
el neto vivo se reconstruyen desde el comprobante y sus NC/ND asociadas.

---

### 6.2 Emisión de NC total

Cuando se emite una NC que libera un viaje (revierte totalmente su
facturación):

* la factura original sigue existiendo
* la NC queda asociada a la factura origen
* se revierte totalmente el efecto económico e impositivo de ese viaje
* el viaje pasa a `PENDIENTE_FACTURAR`
* el viaje queda habilitado para refacturación

La liberación se decide por viaje (lista `viajesALiberar` en
`src/lib/nota-cd-commands.ts`), no por cabecera de factura: una NC puede
liberar solo parte de los viajes incluidos en la factura origen.

---

### 6.3 Emisión de NC parcial sin liberación de viaje

Cuando se emite una NC que reduce monto pero NO libera el viaje:

* la factura original sigue existiendo
* la NC queda asociada a la factura origen
* el efecto económico vigente se reduce parcialmente (afecta saldo de cuenta
  corriente e IVA ventas)
* el viaje sigue en `FACTURADO`
* el viaje NO queda habilitado para refacturación

La decisión de liberar o no es del operador al emitir la NC; el sistema no
asume liberación automática por importe parcial.

---

### 6.4 Emisión de ND

Cuando se emite una ND sobre una factura:

* la factura original sigue existiendo
* la ND queda asociada a la factura origen
* aumenta el cargo económico vigente
* aumenta el IVA ventas según corresponda
* el viaje se mantiene facturado

En términos operativos el viaje sigue en `FACTURADO`. La ND no cambia el
estado del viaje; solo aumenta el saldo de cuenta corriente y el IVA ventas
asociados.

---

## 7. IVA ventas

### Factura

La factura genera débito fiscal de IVA ventas según la alícuota aplicable.

### NC

La NC revierte total o parcialmente el IVA ventas generado por la factura original, en proporción al monto acreditado.

### ND

La ND incrementa el IVA ventas en proporción al importe debitado.

Regla de modelado:

* nunca tratar la NC como borrado de la factura
* tratar siempre NC/ND como comprobantes correctivos que modifican el efecto neto vigente

---

## 8. Cuenta corriente empresa

## 8.1 Factura

La factura genera deuda abierta en cuenta corriente empresa.

---

## 8.2 Recibo

El recibo de cobranza:

* no borra la factura
* no cambia el historial documental
* aplica pagos sobre saldo abierto
* reduce el saldo pendiente de los comprobantes aplicados

---

## 8.3 NC posterior a factura ya cobrada

Siguiendo la lógica del sistema actual:

* la cobranza ya registrada no se deshace automáticamente
* la NC se registra como nuevo comprobante de crédito
* si la factura ya estaba cobrada total o parcialmente, la NC genera crédito/saldo a favor de la empresa en cuenta corriente

---

## 8.4 ND posterior a factura ya cobrada

Siguiendo la lógica del sistema actual:

* la cobranza previa no se deshace automáticamente
* la ND se registra como nuevo comprobante de débito
* la empresa queda con nueva deuda abierta por la diferencia

---

## 9. Recibo por cobranza y consistencia posterior

El recibo por cobranza no debe reinterpretarse como “estado final inmutable” del documento original.

Si luego se emite una NC o ND:

* el recibo sigue existiendo históricamente
* la cuenta corriente debe reflejar el nuevo neto
* la situación final puede ser:

  * saldo pendiente
  * saldo en cero
  * saldo a favor de la empresa

Regla importante:

El sistema no debe intentar borrar o reescribir retrospectivamente los comprobantes ya emitidos. Debe reflejar el nuevo neto mediante nuevos comprobantes y saldos.

---

## 10. Refacturación

## 10.1 Cuándo un viaje es refacturable

Un viaje es refacturable cuando está en `PENDIENTE_FACTURAR`. Esto ocurre si:

* nunca fue facturado, o
* fue facturado y la NC posterior lo liberó (ver 6.2)

---

## 10.2 Cuándo un viaje NO es refacturable

Un viaje en `FACTURADO` no es refacturable. Para volver a facturarlo hay
que liberarlo primero emitiendo una NC que lo incluya en la lista de viajes
a liberar.

---

## 11. Reglas de consistencia

### 11.1 Trazabilidad documental

Siempre debe poder reconstruirse:

* factura original
* NC/ND asociadas
* recibos aplicados
* estado neto vigente del viaje

---

### 11.2 No borrado lógico destructivo

No modelar la corrección de facturas mediante:

* borrado de factura
* desaparición de vínculos históricos
* reseteo ciego del viaje como si nunca hubiera sido facturado

---

### 11.3 Estado del viaje derivado de la situación neta

El estado de facturación del viaje debe derivarse de la situación económica vigente por viaje, no de la mera existencia de un documento histórico.

---

### 11.4 Un solo efecto vigente principal por viaje

Puede haber múltiples documentos históricos, pero no múltiples cargos principales vigentes simultáneos e inconsistentes sobre el mismo viaje.

---

### 11.5 Cobranza posterior a correcciones

Una NC o ND posterior a un recibo no debe borrar el recibo. Debe alterar el saldo neto mediante nuevos comprobantes y movimientos de cuenta corriente.

---

## 12. Casos obligatorios para tests

### Caso 1

Factura simple sin recibo:

* se crea deuda
* viaje queda `FACTURADO`

### Caso 2

Factura + recibo total:

* factura sigue histórica
* saldo pendiente queda en cero
* viaje sigue `FACTURADO`

### Caso 3

Factura + NC que libera viaje:

* factura sigue histórica
* NC asociada visible
* viaje pasa a `PENDIENTE_FACTURAR`
* queda refacturable

### Caso 4

Factura + NC parcial sin liberar viaje:

* viaje sigue en `FACTURADO`
* saldo de cuenta corriente y IVA ventas se ajustan
* no se habilita refacturación

### Caso 5

Factura + recibo total + NC que libera viaje:

* recibo sigue histórico
* NC genera saldo a favor/crédito de empresa
* viaje queda `PENDIENTE_FACTURAR`

### Caso 6

Factura + recibo parcial + NC parcial sin liberar viaje:

* no se borra el recibo
* se recalcula neto de cuenta corriente
* viaje sigue en `FACTURADO`

### Caso 7

Factura + ND:

* aumenta deuda vigente
* viaje sigue facturado

### Caso 8

Factura + recibo total + ND:

* recibo histórico intacto
* ND genera nueva deuda abierta
* no se altera retrospectivamente la cobranza ya registrada

### Caso 9

NC que libera solo parte de los viajes de una factura con múltiples viajes:

* evaluar por viaje (lista `viajesALiberar`)
* solo los viajes liberados pasan a `PENDIENTE_FACTURAR`
* los demás siguen en `FACTURADO`

### Caso 10

No permitir neto negativo por viaje:

* una NC no debe exceder el cargo vigente del viaje que corrige

---

## 13. Reglas resumidas

* NC con liberación de viaje → viaje a `PENDIENTE_FACTURAR`
* NC parcial sin liberación → viaje sigue `FACTURADO`, ajusta saldo e IVA
* ND → viaje sigue `FACTURADO`, incrementa saldo e IVA

---

## 14. Criterio final de diseño

La lógica de facturación empresa se apoya en:

* comprobantes históricos inmutables (factura, NC, ND, recibos)
* correcciones mediante nuevos comprobantes asociados
* cuenta corriente como reflejo del neto vigente
* flag binario en el viaje (`PENDIENTE_FACTURAR` / `FACTURADO`) que indica
  solo si el viaje está tomado por alguna factura vigente; el detalle
  económico se reconstruye desde los comprobantes
