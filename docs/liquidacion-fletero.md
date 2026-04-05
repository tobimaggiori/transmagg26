# Liquidación fletero

## Objetivo

Definir la lógica de negocio del circuito de liquidación al fletero en Transmagg, preservando la operatoria del sistema actual y separando correctamente:

* liquidación de viajes
* descuentos y consumos imputables al fletero
* orden de pago
* cuenta corriente del fletero
* notas de crédito (NC)
* notas de débito (ND)

Este documento no define implementación técnica. Define reglas de negocio para luego adaptar el código del proyecto nuevo.

---

## 1. Alcance

Este documento cubre:

* líquido producto / liquidación al fletero
* orden de pago
* descuentos y consumos del fletero
* cuenta corriente proveedor/fletero
* NC y ND del lado fletero
* efecto sobre viajes
* criterios de consistencia

No cubre en detalle:

* factura a empresa
* recibo por cobranza empresa
* cuenta corriente empresa

Eso se cubre en `facturacion-empresa.md`.

---

## 2. Principio general

En el circuito del fletero también hay que separar siempre:

1. **historial documental**
2. **situación económica vigente**
3. **estado operativo de liquidación del viaje**
4. **estado de pago**

La lógica del sistema actual muestra que la verdad operativa no está solo en un flag, sino en la combinación de:

* comprobantes emitidos
* vínculos entre comprobantes
* aplicaciones
* cuenta corriente del fletero

---

## 3. Documentos del circuito

### 3.1 Líquido producto / liquidación al fletero

El líquido producto (LP):

* es el comprobante de liquidación emitido al fletero
* puede incluir uno o más viajes
* determina importes brutos, descuentos, retenciones y neto
* genera movimiento en cuenta corriente del fletero
* deja trazabilidad documental permanente

Efecto de negocio:

* reconoce deuda de Transmagg hacia el fletero por los viajes liquidados
* consolida conceptos a pagar y conceptos a descontar

---

### 3.2 Orden de pago (OP)

La orden de pago:

* es un comprobante de pago al fletero
* puede aplicarse total o parcialmente a comprobantes abiertos del fletero
* no borra la liquidación ni otros comprobantes anteriores
* reduce saldos pendientes en cuenta corriente del fletero

La OP no debe entenderse como “cierre destructivo” de la liquidación, sino como aplicación de pago sobre saldo abierto.

---

### 3.3 Descuentos / consumos del fletero

Existen comprobantes o cargos que deben descontarse al fletero, por ejemplo:

* consumos en cuentas corrientes de terceros con acuerdo comercial de Transmagg
* gastos abonados por Transmagg por cuenta y orden del fletero
* otros cargos descontables

Estos conceptos:

* no deben confundirse con la liquidación principal de viajes
* integran la cuenta corriente del fletero
* pueden impactar en el neto a pagar al emitir LP u OP

---

### 3.4 Nota de crédito (NC) lado fletero

La NC del lado fletero:

* es un comprobante nuevo
* referencia un comprobante origen del lado proveedor/fletero
* reduce el efecto económico vigente a favor del fletero
* deja trazabilidad documental

En términos de negocio:

* reduce lo que Transmagg le debe al fletero
* o revierte total/parcialmente una liquidación o comprobante previo

---

### 3.5 Nota de débito (ND) lado fletero

La ND del lado fletero:

* es un comprobante nuevo
* referencia un comprobante origen del lado proveedor/fletero
* incrementa el efecto económico vigente a favor del fletero
* deja trazabilidad documental

En términos de negocio:

* aumenta lo que Transmagg le debe al fletero
* o corrige hacia arriba una liquidación/comprobante previo

---

## 4. Relación entre viaje y liquidación

## 4.1 Regla base

Cada viaje tiene un circuito de liquidación independiente del circuito de facturación empresa.

Para liquidación fletero:

* un viaje puede haber aparecido en varios comprobantes históricos a lo largo del tiempo
* pero solo puede tener **una liquidación vigente neta principal**
* ese efecto puede estar completo, ajustado parcialmente o totalmente revertido

---

## 4.2 Regla documental

Un viaje puede estar vinculado históricamente a:

* un LP original
* una o más NC/ND asociadas
* una reliquidación posterior

Eso no debe interpretarse como múltiples liquidaciones principales vigentes simultáneas sobre el mismo viaje.

---

## 5. Estado de liquidación del viaje

El estado operativo del viaje en el circuito del fletero debe derivarse de su situación económica vigente, no solo de la existencia de un comprobante histórico.

### Estados propuestos

#### `PENDIENTE_LIQUIDACION`

El viaje no tiene actualmente liquidación vigente neta.

Casos típicos:

* nunca fue liquidado
* fue liquidado y luego totalmente revertido por NC

---

#### `LIQUIDADO_VIGENTE`

El viaje tiene liquidación vigente completa.

Casos típicos:

* LP emitido sin correcciones
* LP emitido y luego ND
* LP original revertido y luego reliquidado correctamente

---

#### `LIQUIDADO_AJUSTADO_PARCIAL`

El viaje sigue liquidado, pero con ajuste parcial por NC.

Casos típicos:

* LP emitido y luego NC parcial
* se corrigió parcialmente el importe reconocido al fletero sin liberar completamente el viaje

---

## 6. Reglas de negocio por documento

### 6.1 Emisión de LP

Cuando se emite un LP:

* se genera comprobante de liquidación
* se registra la deuda correspondiente en cuenta corriente del fletero
* se determinan descuentos, retenciones y neto
* los viajes incluidos pasan a `LIQUIDADO_VIGENTE`

El LP no debe modelarse solo como una impresión o resumen. Debe quedar trazado como documento económico principal del circuito.

---

### 6.2 Emisión de NC total sobre LP o sobre componente del viaje

Cuando se emite una NC que revierte totalmente la liquidación vigente de un viaje:

* el LP original sigue existiendo
* la NC queda asociada al comprobante origen
* se revierte totalmente el efecto económico vigente de ese viaje
* el viaje pasa a `PENDIENTE_LIQUIDACION`
* el viaje puede quedar habilitado para reliquidación completa, si operativamente corresponde

La evaluación debe ser por viaje afectado, no solo por cabecera de comprobante.

---

### 6.3 Emisión de NC parcial

Cuando se emite una NC parcial sobre una liquidación del fletero:

* el comprobante original sigue existiendo
* la NC queda asociada al origen
* el efecto económico vigente se reduce parcialmente
* el viaje sigue liquidado
* el viaje pasa a `LIQUIDADO_AJUSTADO_PARCIAL`

La NC parcial no debe liberar automáticamente al viaje para una reliquidación total.

---

### 6.4 Emisión de ND

Cuando se emite una ND del lado fletero:

* el comprobante original sigue existiendo
* la ND queda asociada al origen
* aumenta el importe vigente a favor del fletero
* el viaje se mantiene liquidado

En términos operativos:

* si estaba `LIQUIDADO_VIGENTE`, permanece así
* si estaba `LIQUIDADO_AJUSTADO_PARCIAL`, una ND puede recomponer total o parcialmente el ajuste, sin borrar historial

---

## 7. Cuenta corriente del fletero

## 7.1 LP

El LP genera un comprobante en cuenta corriente del fletero que representa deuda de Transmagg hacia él.

---

## 7.2 Descuentos y consumos

Los descuentos/consumos imputables al fletero deben reflejarse también en cuenta corriente y/o en los mecanismos de aplicación que afecten el neto a pagar.

Regla importante:

No confundir:

* deuda principal por viajes liquidados
* cargos/descuentos que deben compensarse al pagar

Ambos conviven en el circuito económico del fletero, pero conceptualmente no son la misma cosa.

---

## 7.3 Orden de pago

La OP:

* se aplica a comprobantes abiertos del fletero
* reduce saldos pendientes
* deja historial de aplicación
* no debe borrar ni reescribir retrospectivamente los comprobantes liquidados

La verdad del pago debe salir de:

* comprobante OP
* aplicaciones registradas
* saldo restante de los comprobantes afectados

---

## 7.4 NC/ND posteriores a OP

Siguiendo la lógica general observada en el sistema actual:

* una NC o ND posterior no debería borrar la OP ya emitida
* la OP debe seguir existiendo históricamente
* el nuevo neto debe reflejarse por nuevos comprobantes y saldo en cuenta corriente

Consecuencias típicas:

### NC posterior a OP

* reduce la deuda vigente hacia el fletero
* si ya se había pagado de más, puede generar saldo a compensar o inconsistencia operativa a resolver

### ND posterior a OP

* aumenta la deuda vigente hacia el fletero
* puede generar nueva diferencia pendiente de pago

---

## 8. Pago vs liquidación

Es importante no mezclar:

### Liquidación

Reconocimiento económico/documental de lo que corresponde al fletero por viajes y ajustes.

### Pago

Aplicación efectiva de cancelación total o parcial sobre comprobantes abiertos.

Un viaje puede estar:

* liquidado pero no pagado
* liquidado y parcialmente pagado
* liquidado y totalmente pagado
* liquidado, pagado y luego corregido por NC/ND

---

## 9. Reliquidación

## 9.1 Cuándo un viaje es reliquidable completo

Un viaje es reliquidable completo cuando:

* su liquidación vigente fue revertida totalmente
* no queda importe neto vigente reconocido al fletero por ese viaje
* no existe otra liquidación vigente cubriéndolo

En ese caso el viaje queda en `PENDIENTE_LIQUIDACION`.

---

## 9.2 Cuándo un viaje NO es reliquidable completo

No debe quedar liberado para reliquidación total cuando:

* existe un LP vigente sin reversión total
* solo hubo NC parcial
* ya existe una nueva liquidación vigente asociada

---

## 9.3 Reliquidación parcial

Como regla inicial, la NC parcial no debe habilitar automáticamente una reliquidación libre.

Si más adelante se soporta reliquidación parcial explícita, deberá controlarse:

* qué parte fue revertida
* qué parte puede volver a liquidarse
* que nunca se duplique reconocimiento neto sobre el mismo viaje

Hasta que eso quede bien cerrado, la regla segura es:

* NC parcial => viaje sigue liquidado con ajuste parcial
* no se libera para reliquidación total automática

---

## 10. Reglas de consistencia

### 10.1 Trazabilidad documental

Siempre debe poder reconstruirse:

* LP original
* NC/ND asociadas
* OP emitidas
* descuentos/consumos aplicados
* estado neto vigente del viaje

---

### 10.2 No borrado lógico destructivo

No modelar correcciones del circuito fletero mediante:

* borrado del LP original
* desaparición de vínculos históricos
* reseteo ciego del viaje como si nunca hubiera sido liquidado

---

### 10.3 Estado del viaje derivado de la situación neta

El estado de liquidación del viaje debe derivarse de la situación económica vigente por viaje, no de la mera existencia de un documento histórico.

---

### 10.4 Un solo efecto vigente principal por viaje

Puede haber múltiples documentos históricos, pero no múltiples reconocimientos principales vigentes e inconsistentes sobre el mismo viaje.

---

### 10.5 Pago posterior a correcciones

Una NC o ND posterior a una OP no debe borrar la OP. Debe alterar el saldo neto mediante nuevos comprobantes y movimientos de cuenta corriente.

---

## 11. Casos obligatorios para tests

### Caso 1

LP simple sin OP:

* se crea deuda al fletero
* viaje queda `LIQUIDADO_VIGENTE`

### Caso 2

LP + OP total:

* LP sigue histórico
* saldo pendiente queda en cero
* viaje sigue `LIQUIDADO_VIGENTE`

### Caso 3

LP + NC total:

* LP sigue histórico
* NC asociada visible
* viaje pasa a `PENDIENTE_LIQUIDACION`
* queda reliquidable completo

### Caso 4

LP + NC parcial:

* viaje pasa a `LIQUIDADO_AJUSTADO_PARCIAL`
* no queda pendiente total
* no se libera reliquidación total automática

### Caso 5

LP + OP total + NC total:

* OP sigue histórica
* la corrección no borra el pago
* debe reflejarse el nuevo neto/saldo resultante
* viaje queda `PENDIENTE_LIQUIDACION`

### Caso 6

LP + OP parcial + NC parcial:

* no se borra la OP
* se recalcula neto de cuenta corriente
* viaje queda `LIQUIDADO_AJUSTADO_PARCIAL`

### Caso 7

LP + ND:

* aumenta deuda vigente a favor del fletero
* viaje sigue liquidado

### Caso 8

LP + OP total + ND:

* OP histórica intacta
* ND genera nueva diferencia pendiente
* no se altera retrospectivamente el pago ya registrado

### Caso 9

NC total solo sobre parte de un comprobante con múltiples viajes:

* evaluar por viaje
* solo los viajes totalmente revertidos pasan a `PENDIENTE_LIQUIDACION`
* los demás conservan estado vigente

### Caso 10

No permitir neto negativo por viaje:

* una NC no debe exceder el importe vigente del viaje que corrige

### Caso 11

Descuentos/consumos coexistiendo con LP y OP:

* no deben confundirse con el principal del viaje
* deben impactar correctamente en el neto del fletero
* deben mantener trazabilidad separada

---

## 12. Decisiones abiertas a confirmar más adelante

Estas decisiones todavía pueden necesitar validación fina contra operatoria real:

1. cómo representar técnicamente el vínculo por viaje entre LP y NC/ND
2. si habrá reliquidación parcial explícita o solo control por saldo neto
3. cómo se resolverán exactamente los saldos a favor/diferencias cuando haya NC posterior a OP ya emitida
4. qué parte del flujo de descuentos/consumos ya está cerrada y no debe tocarse

Mientras no se cierre eso, la regla segura es:

* NC total libera completamente
* NC parcial ajusta pero no libera totalmente
* ND incrementa el reconocimiento y no libera
* OP no se borra por correcciones posteriores

---

## 13. Criterio final de diseño

Para Transmagg nuevo, la lógica correcta de liquidación al fletero debe basarse en:

* comprobantes históricos inmutables
* correcciones mediante nuevos comprobantes asociados
* cuenta corriente como reflejo del neto vigente
* separación conceptual entre liquidación, descuentos/consumos y pago
* estado del viaje derivado del neto por viaje
* prohibición de simplificar todo a un único booleano `liquidado`
