# Facturación a empresa

> **Nota**: este documento describe reglas de dominio y criterios operativos.
> Para implementación técnica ver:
> - Catálogo de comprobantes: [../arca/matriz.md](../arca/matriz.md)
> - IVA en NC/ND: [../reglas-fiscales/nc-nd-iva.md](../reglas-fiscales/nc-nd-iva.md)
> - Cuenta corriente y saldo pendiente: [./cuenta-corriente.md](./cuenta-corriente.md)
>
> **Inconsistencia conocida**: este doc describe estados derivados de viaje
> (`PENDIENTE_FACTURACION`, `FACTURADO_VIGENTE`, `FACTURADO_AJUSTADO_PARCIAL`)
> que probablemente NO estén implementados así en el código (los flags reales
> son más simples). Ver [../INCONSISTENCIAS-DETECTADAS.md](../INCONSISTENCIAS-DETECTADAS.md).

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

Para el circuito empresa, el estado operativo del viaje debe derivarse de la situación económica vigente, no de la mera existencia de una factura histórica.

### Estados propuestos

#### `PENDIENTE_FACTURACION`

El viaje no tiene actualmente cargo facturado vigente.

Casos típicos:

* nunca fue facturado
* fue facturado y luego totalmente revertido por NC

---

#### `FACTURADO_VIGENTE`

El viaje tiene cargo facturado vigente completo.

Casos típicos:

* factura emitida sin correcciones
* factura emitida y luego ND
* factura original revertida y luego refactura vigente

---

#### `FACTURADO_AJUSTADO_PARCIAL`

El viaje sigue facturado, pero con ajuste parcial por NC.

Casos típicos:

* factura emitida y luego NC parcial
* hubo corrección parcial sin liberar completamente el viaje para una nueva facturación total

---

## 6. Reglas de negocio por documento

### 6.1 Emisión de factura

Cuando se emite una factura a empresa:

* se genera un comprobante de factura
* se registra el cargo en cuenta corriente empresa
* se genera IVA ventas según corresponda
* los viajes incluidos pasan a estado `FACTURADO_VIGENTE`

No debe considerarse suficiente un simple booleano de “facturado”; la factura debe quedar trazada documentalmente.

---

### 6.2 Emisión de NC total

Cuando se emite una NC que revierte totalmente la facturación de un viaje:

* la factura original sigue existiendo
* la NC queda asociada a la factura origen
* se revierte totalmente el efecto económico e impositivo de ese viaje
* el viaje pasa a `PENDIENTE_FACTURACION`
* el viaje queda habilitado para refacturación completa, si operativamente corresponde

Esto aplica por viaje afectado, no solo por cabecera de factura.

---

### 6.3 Emisión de NC parcial

Cuando se emite una NC parcial sobre un viaje:

* la factura original sigue existiendo
* la NC queda asociada a la factura origen
* el efecto económico vigente se reduce solo parcialmente
* el viaje sigue estando facturado
* el viaje pasa a `FACTURADO_AJUSTADO_PARCIAL`

La NC parcial no debe liberar automáticamente al viaje como pendiente de facturación total.

---

### 6.4 Emisión de ND

Cuando se emite una ND sobre una factura:

* la factura original sigue existiendo
* la ND queda asociada a la factura origen
* aumenta el cargo económico vigente
* aumenta el IVA ventas según corresponda
* el viaje se mantiene facturado

En términos operativos:

* si estaba `FACTURADO_VIGENTE`, permanece así
* si estaba `FACTURADO_AJUSTADO_PARCIAL`, una ND posterior puede compensar total o parcialmente ese ajuste, pero no “borra” historial

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

## 10.1 Cuándo un viaje es refacturable completo

Un viaje es refacturable completo cuando:

* su facturación vigente fue revertida totalmente
* no queda cargo neto vigente asociado a ese viaje
* no existe otra factura vigente cubriéndolo

En ese caso el viaje queda en `PENDIENTE_FACTURACION`.

---

## 10.2 Cuándo un viaje NO es refacturable completo

Un viaje no debe quedar liberado para refacturación total cuando:

* existe una factura vigente sin reversión total
* solo hubo NC parcial
* ya existe una nueva factura vigente asociada

---

## 10.3 Refacturación parcial

Como regla inicial, la NC parcial no debe habilitar automáticamente una nueva facturación libre.

Si más adelante se soporta refacturación parcial, deberá existir una regla explícita para controlar:

* qué parte fue acreditada
* qué parte puede volver a facturarse
* que nunca se duplique cargo neto sobre el mismo viaje

Hasta que eso esté bien cerrado, la lógica recomendada es:

* NC parcial => viaje sigue facturado con ajuste parcial
* no se libera para refacturación total automática

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
* viaje queda `FACTURADO_VIGENTE`

### Caso 2

Factura + recibo total:

* factura sigue histórica
* saldo pendiente queda en cero
* viaje sigue `FACTURADO_VIGENTE`

### Caso 3

Factura + NC total:

* factura sigue histórica
* NC asociada visible
* viaje pasa a `PENDIENTE_FACTURACION`
* queda refacturable completo

### Caso 4

Factura + NC parcial:

* viaje pasa a `FACTURADO_AJUSTADO_PARCIAL`
* no queda pendiente total
* no se libera refacturación total automática

### Caso 5

Factura + recibo total + NC total:

* recibo sigue histórico
* NC genera saldo a favor/crédito de empresa
* viaje queda `PENDIENTE_FACTURACION`

### Caso 6

Factura + recibo parcial + NC parcial:

* no se borra el recibo
* se recalcula neto de cuenta corriente
* viaje queda `FACTURADO_AJUSTADO_PARCIAL`

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

NC total solo sobre parte de una factura con múltiples viajes:

* evaluar por viaje
* solo los viajes totalmente revertidos pasan a `PENDIENTE_FACTURACION`
* los demás conservan su estado vigente

### Caso 10

No permitir neto negativo por viaje:

* una NC no debe exceder el cargo vigente del viaje que corrige

---

## 13. Decisiones abiertas a confirmar más adelante

Estas decisiones todavía pueden necesitar validación fina contra operatoria real:

1. si se permitirá refacturación parcial automática o no
2. cómo se representará técnicamente el vínculo por viaje entre factura y NC/ND
3. si habrá un estado explícito separado para “refacturable parcial” o si eso será solo una regla derivada

Mientras no se cierre eso, la regla segura es:

* NC total libera completamente
* NC parcial ajusta pero no libera totalmente
* ND incrementa cargo y no libera

---

## 14. Criterio final de diseño

Para Transmagg nuevo, la lógica correcta de facturación empresa debe basarse en:

* comprobantes históricos inmutables
* correcciones mediante nuevos comprobantes asociados
* cuenta corriente como reflejo del neto vigente
* estado del viaje derivado del neto por viaje
* prohibición de simplificar todo a un único booleano `facturado`
