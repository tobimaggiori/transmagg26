# Liquidación a fletero (LP)

> **Nota**: este documento describe reglas de dominio y criterios operativos.
> Para implementación técnica ver:
> - Catálogo y emisión: [../arca/matriz.md](../arca/matriz.md) +
>   [../arca/implementacion.md](../arca/implementacion.md)
> - IVA en NC/ND sobre LP: [../reglas-fiscales/nc-nd-iva.md](../reglas-fiscales/nc-nd-iva.md)
> - Cuenta corriente, saldo pendiente, descuentos en OP:
>   [./cuenta-corriente.md](./cuenta-corriente.md) +
>   [./ordenes-pago.md](./ordenes-pago.md)
> - Adelantos y gastos descontables en OP: [./adelantos.md](./adelantos.md)
> - Viajes con cupo (auto-selección de hermanos al liquidar, validación
>   de tarifa, agrupamiento en el PDF): [./cupo.md](./cupo.md)

## Objetivo

Definir la lógica de negocio del circuito de liquidación al fletero en
Transmagg, preservando la operatoria del sistema actual y separando
correctamente:

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

El estado operativo del viaje en el circuito del fletero se modela con un
flag binario sobre el viaje base (`Viaje.estadoLiquidacion` en
`prisma/schema.prisma`, resuelto en `src/lib/viaje-workflow.ts`):

### Estados implementados

#### `PENDIENTE_LIQUIDAR`

El viaje no está tomado por una liquidación vigente. Casos típicos:

* nunca fue liquidado
* fue liquidado y luego liberado por NC (la NC incluyó el viaje en
  `viajesALiberar`)

---

#### `LIQUIDADO`

El viaje está tomado por al menos una liquidación vigente. Casos típicos:

* LP emitido sin correcciones
* LP emitido y luego ND (la ND complementa, no libera)
* LP emitido y luego NC parcial que NO libera el viaje (corrección
  monetaria sin reversión operativa)

---

> **Nota sobre el granular**: la "vigencia económica" de un viaje no se modela
> como un tercer estado del viaje. Lo único que decide qué neto queda
> reconocido al fletero son los comprobantes asociados (LP + NC/ND) y la
> cuenta corriente del fletero. Una NC parcial sin liberación de viaje afecta
> el saldo y el IVA Compras, pero el viaje sigue contando como `LIQUIDADO`.

---

## 6. Reglas de negocio por documento

### 6.1 Emisión de LP

Cuando se emite un LP:

* se genera comprobante de liquidación
* se registra la deuda correspondiente en cuenta corriente del fletero
* se determinan descuentos, retenciones y neto
* los viajes incluidos pasan a `LIQUIDADO`

El flag `estadoLiquidacion` en el viaje no es la fuente de verdad económica:
solo indica si el viaje está tomado por alguna liquidación vigente. La
trazabilidad y el neto vivo se reconstruyen desde el LP y sus NC/ND
asociadas.

---

### 6.2 Emisión de NC con liberación de viaje

Cuando se emite una NC que libera un viaje (revierte totalmente su
liquidación):

* el LP original sigue existiendo
* la NC queda asociada al comprobante origen
* se revierte totalmente el efecto económico vigente de ese viaje
* el viaje pasa a `PENDIENTE_LIQUIDAR`
* el viaje queda habilitado para reliquidación

La liberación se decide por viaje (lista `viajesALiberar` en
`src/lib/nota-cd-commands.ts`), no por cabecera de LP: una NC puede liberar
solo parte de los viajes incluidos en el LP origen.

---

### 6.3 Emisión de NC parcial sin liberación de viaje

Cuando se emite una NC que reduce el monto reconocido al fletero pero NO
libera el viaje:

* el LP original sigue existiendo
* la NC queda asociada al origen
* el efecto económico vigente se reduce parcialmente (afecta saldo de
  cuenta corriente fletero e IVA Compras)
* el viaje sigue en `LIQUIDADO`
* el viaje NO queda habilitado para reliquidación

La decisión de liberar o no es del operador al emitir la NC; el sistema no
asume liberación automática por importe parcial.

---

### 6.4 Emisión de ND

Cuando se emite una ND del lado fletero:

* el comprobante original sigue existiendo
* la ND queda asociada al origen
* aumenta el importe vigente a favor del fletero
* el viaje se mantiene liquidado

En términos operativos el viaje sigue en `LIQUIDADO`. La ND no cambia el
estado del viaje; solo aumenta el saldo de cuenta corriente del fletero y el
IVA Compras asociados.

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

## 9.1 Cuándo un viaje es reliquidable

Un viaje es reliquidable cuando está en `PENDIENTE_LIQUIDAR`. Esto ocurre si:

* nunca fue liquidado, o
* fue liquidado y la NC posterior lo liberó (ver 6.2)

---

## 9.2 Cuándo un viaje NO es reliquidable

Un viaje en `LIQUIDADO` no es reliquidable. Para volver a liquidarlo hay
que liberarlo primero emitiendo una NC que lo incluya en la lista de viajes
a liberar.

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
* viaje queda `LIQUIDADO`

### Caso 2

LP + OP total:

* LP sigue histórico
* saldo pendiente queda en cero
* viaje sigue `LIQUIDADO`

### Caso 3

LP + NC que libera viaje:

* LP sigue histórico
* NC asociada visible
* viaje pasa a `PENDIENTE_LIQUIDAR`
* queda reliquidable

### Caso 4

LP + NC parcial sin liberar viaje:

* viaje sigue en `LIQUIDADO`
* saldo de cuenta corriente fletero e IVA Compras se ajustan
* no se habilita reliquidación

### Caso 5

LP + OP total + NC que libera viaje:

* OP sigue histórica
* la corrección no borra el pago
* debe reflejarse el nuevo neto/saldo resultante
* viaje queda `PENDIENTE_LIQUIDAR`

### Caso 6

LP + OP parcial + NC parcial sin liberar viaje:

* no se borra la OP
* se recalcula neto de cuenta corriente
* viaje sigue en `LIQUIDADO`

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

NC que libera solo parte de los viajes de un LP con múltiples viajes:

* evaluar por viaje (lista `viajesALiberar`)
* solo los viajes liberados pasan a `PENDIENTE_LIQUIDAR`
* los demás siguen en `LIQUIDADO`

### Caso 10

No permitir neto negativo por viaje:

* una NC no debe exceder el importe vigente del viaje que corrige

### Caso 11

Descuentos/consumos coexistiendo con LP y OP:

* no deben confundirse con el principal del viaje
* deben impactar correctamente en el neto del fletero
* deben mantener trazabilidad separada

---

## 12. Reglas resumidas

* NC con liberación de viaje → viaje a `PENDIENTE_LIQUIDAR`
* NC parcial sin liberación → viaje sigue `LIQUIDADO`, ajusta saldo e IVA
  Compras
* ND → viaje sigue `LIQUIDADO`, incrementa saldo e IVA Compras
* OP no se borra por correcciones posteriores

---

## 13. Criterio final de diseño

La lógica de liquidación al fletero se apoya en:

* comprobantes históricos inmutables (LP, NC, ND, OP)
* correcciones mediante nuevos comprobantes asociados
* cuenta corriente como reflejo del neto vigente
* separación conceptual entre liquidación, descuentos/consumos y pago
* flag binario en el viaje (`PENDIENTE_LIQUIDAR` / `LIQUIDADO`) que indica
  solo si el viaje está tomado por alguna liquidación vigente; el detalle
  económico se reconstruye desde los comprobantes
