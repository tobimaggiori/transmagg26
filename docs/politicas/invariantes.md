# Invariantes y tests

## Objetivo

Consolidar las reglas transversales que no deben romperse en Transmagg y enumerar los escenarios mínimos que deben cubrir los tests al implementar o ajustar la lógica de:

* facturación empresa
* liquidación fletero
* notas de crédito (NC)
* notas de débito (ND)
* recibos por cobranza
* órdenes de pago
* cuenta corriente
* estados de viaje

Este documento sirve como referencia de control para cualquier refactor o nueva implementación.

---

## 1. Principios transversales

### 1.1 Dos circuitos económicos independientes

Cada viaje participa en dos circuitos distintos e independientes:

* circuito de facturación a empresa
* circuito de liquidación al fletero

Regla:

Un cambio en un circuito no debe alterar implícitamente el otro, salvo que exista una regla de negocio explícita que lo indique.

---

### 1.2 Historial documental inmutable

Los comprobantes emitidos deben conservarse históricamente.

Regla:

No modelar correcciones mediante borrado lógico destructivo de comprobantes principales.

Aplicación:

* la factura original no desaparece por una NC
* el LP original no desaparece por una NC
* un recibo no desaparece por una NC o ND posterior
* una OP no desaparece por una NC o ND posterior

---

### 1.3 Correcciones por nuevos comprobantes

Las correcciones deben modelarse mediante nuevos comprobantes asociados al documento origen.

Aplicación:

* NC corrige/revierte hacia abajo
* ND corrige/incrementa hacia arriba
* recibos y OP aplican pagos/cobros, pero no reescriben el historial del comprobante original

---

### 1.4 Cuenta corriente como reflejo del neto vigente

La cuenta corriente debe reflejar el efecto económico vigente de los comprobantes emitidos y pagos/cobranzas aplicados.

Regla:

La situación vigente no debe depender solo de un booleano o de una pantalla. Debe poder reconstruirse desde comprobantes, aplicaciones y saldos.

---

### 1.5 Estado del viaje derivado del neto

El estado del viaje en cada circuito debe derivarse de la situación económica vigente por viaje.

No debe depender únicamente de:

* existencia de un documento histórico
* flags aislados no reconciliados con comprobantes reales

---

### 1.6 Evaluación por viaje

Las correcciones parciales deben poder evaluarse por viaje, no solo por cabecera de comprobante.

Regla:

En documentos que agrupen varios viajes, una NC/ND puede afectar total o parcialmente solo algunos de ellos. El sistema debe preservar esa granularidad o al menos comportarse coherentemente con ella.

---

### 1.7 Un solo efecto principal vigente por circuito y por viaje

Para cada viaje y para cada circuito:

* puede haber múltiples documentos históricos
* pero no deben quedar múltiples efectos principales vigentes e inconsistentes al mismo tiempo

Aplicación:

* no duplicar facturación vigente sobre un mismo viaje sin respaldo explícito
* no duplicar liquidación vigente sobre un mismo viaje sin respaldo explícito

---

## 2. Invariantes de dominio

## 2.1 Invariantes del circuito empresa

### I-E1

Un viaje puede tener múltiples documentos históricos de facturación, pero como máximo un cargo principal vigente coherente en el circuito empresa.

### I-E2

Una factura emitida a empresa genera deuda en cuenta corriente empresa.

### I-E3

Una NC de empresa no borra la factura origen; la corrige mediante un nuevo comprobante asociado.

### I-E4

Una ND de empresa no reemplaza la factura origen; incrementa el cargo mediante un nuevo comprobante asociado.

### I-E5

Un recibo por cobranza no debe borrar ni reescribir retrospectivamente la factura o ND aplicada.

### I-E6

Una NC posterior a un recibo no debe borrar el recibo; debe reflejarse como crédito/saldo a favor o ajuste de saldo vigente.

### I-E7

Una ND posterior a un recibo no debe borrar el recibo; debe reflejarse como nueva deuda abierta.

### I-E8

Un viaje completamente revertido por NC total debe quedar pendiente de facturación.

### I-E9

Un viaje con NC parcial no debe pasar automáticamente a pendiente de facturación total.

### I-E10

No permitir neto facturado negativo por viaje.

---

## 2.2 Invariantes del circuito fletero

### I-F1

Un viaje puede tener múltiples documentos históricos de liquidación, pero como máximo un reconocimiento principal vigente coherente en el circuito fletero.

### I-F2

Un LP genera deuda de Transmagg hacia el fletero en cuenta corriente proveedor/fletero.

### I-F3

Una NC del lado fletero no borra el LP o comprobante origen; lo corrige mediante un nuevo comprobante asociado.

### I-F4

Una ND del lado fletero no reemplaza el LP o comprobante origen; incrementa el reconocimiento mediante un nuevo comprobante asociado.

### I-F5

Una OP no debe borrar ni reescribir retrospectivamente el LP o comprobantes aplicados.

### I-F6

Una NC posterior a una OP no debe borrar la OP; debe reflejar nuevo neto/saldo o diferencia pendiente de compensación.

### I-F7

Una ND posterior a una OP no debe borrar la OP; debe reflejar nueva diferencia pendiente.

### I-F8

Un viaje completamente revertido por NC total debe quedar pendiente de liquidación.

### I-F9

Un viaje con NC parcial no debe pasar automáticamente a pendiente de liquidación total.

### I-F10

No permitir neto liquidado negativo por viaje.

---

## 2.3 Invariantes de trazabilidad

### I-T1

Todo comprobante correctivo debe poder vincularse al comprobante origen.

### I-T2

Debe poder reconstruirse la historia documental completa de un viaje en ambos circuitos.

### I-T3

Debe poder distinguirse entre:

* documento histórico
* saldo vigente
* pago/cobranza aplicada
* estado operativo del viaje

### I-T4

No mezclar conceptos de negocio distintos bajo una misma abstracción confusa, por ejemplo:

* liquidación principal del viaje
* descuentos/consumos del fletero
* cobro de empresa
* corrección documental

---

## 2.4 Invariantes de seguridad lógica

### I-S1

No permitir asociar viajes ajenos o no autorizados a documentos.

### I-S2

No permitir corregir con NC/ND documentos fuera del alcance/ownership correspondiente.

### I-S3

No permitir transiciones de estado incompatibles con el saldo/documentación real.

### I-S4

No permitir que la UI o API presenten como “pendiente” algo que todavía mantiene efecto económico vigente.

---

## 3. Estados de viaje por circuito

## 3.1 Empresa

Flag `Viaje.estadoFactura`:

* `PENDIENTE_FACTURAR`: el viaje no está tomado por una factura vigente
* `FACTURADO`: el viaje está tomado por al menos una factura vigente

## 3.2 Fletero

Flag `Viaje.estadoLiquidacion`:

* `PENDIENTE_LIQUIDAR`: el viaje no está tomado por una liquidación vigente
* `LIQUIDADO`: el viaje está tomado por al menos una liquidación vigente

Regla:

Los flags indican únicamente si el viaje está tomado por algún comprobante.
El neto económico vigente (parcialidades por NC, IVA, saldo) se reconstruye
desde los comprobantes, no desde estos flags.

---

## 4. Matriz mínima de escenarios para tests

## 4.1 Facturación empresa

### T-E1 Factura simple

Dado un viaje pendiente de facturación,
cuando se emite una factura,
entonces:

* el viaje queda `FACTURADO`
* existe comprobante histórico
* existe impacto en cuenta corriente empresa

### T-E2 Factura con múltiples viajes

Dada una factura con varios viajes,
cuando se emite,
entonces todos los viajes incluidos quedan facturados de forma consistente.

### T-E3 Factura + recibo total

Dada una factura emitida,
cuando se registra recibo total,
entonces:

* la factura sigue histórica
* el saldo pendiente queda en cero
* el viaje sigue `FACTURADO`

### T-E4 Factura + recibo parcial

Dada una factura emitida,
cuando se registra recibo parcial,
entonces:

* el comprobante sigue abierto parcialmente
* el viaje sigue `FACTURADO`

### T-E5 Factura + NC con liberación de viaje

Dada una factura emitida,
cuando se emite NC que libera el viaje (`viajesALiberar`),
entonces:

* la factura sigue histórica
* la NC queda asociada
* el viaje pasa a `PENDIENTE_FACTURAR`
* el viaje queda refacturable

### T-E6 Factura + NC parcial sin liberación de viaje

Dada una factura emitida,
cuando se emite NC parcial que no libera el viaje,
entonces:

* el viaje sigue en `FACTURADO`
* el saldo de cuenta corriente y el IVA ventas se ajustan
* no se habilita refacturación

### T-E7 Factura + ND

Dada una factura emitida,
cuando se emite ND,
entonces:

* la factura sigue histórica
* la ND queda asociada
* aumenta el cargo vigente
* el viaje sigue facturado

### T-E8 Factura + recibo total + NC con liberación de viaje

Dada una factura totalmente cobrada,
cuando se emite NC que libera el viaje,
entonces:

* el recibo sigue histórico
* la NC genera crédito o saldo a favor
* el viaje queda `PENDIENTE_FACTURAR`

### T-E9 Factura + recibo total + ND

Dada una factura totalmente cobrada,
cuando se emite ND,
entonces:

* el recibo sigue histórico
* la ND genera nueva deuda abierta

### T-E10 NC libera solo parte de los viajes en factura multi-viaje

Dada una factura con varios viajes,
cuando la NC libera solo uno (lista `viajesALiberar`),
entonces:

* ese viaje pasa a `PENDIENTE_FACTURAR`
* los demás siguen en `FACTURADO`

### T-E11 Bloqueo de sobrecrédito

No debe permitirse NC que exceda el neto facturado vigente del viaje.

### T-E12 No doble facturación vigente

No debe permitirse emitir nueva factura vigente sobre viaje que todavía mantiene efecto económico vigente no revertido.

---

## 4.2 Liquidación fletero

### T-F1 LP simple

Dado un viaje pendiente de liquidación,
cuando se emite LP,
entonces:

* el viaje queda `LIQUIDADO`
* existe impacto en cuenta corriente fletero

### T-F2 LP con múltiples viajes

Dado un LP con varios viajes,
cuando se emite,
entonces todos los viajes incluidos quedan liquidados de forma consistente.

### T-F3 LP + OP total

Dado un LP emitido,
cuando se registra OP total,
entonces:

* el LP sigue histórico
* el saldo pendiente queda en cero
* el viaje sigue `LIQUIDADO`

### T-F4 LP + OP parcial

Dado un LP emitido,
cuando se registra OP parcial,
entonces:

* el comprobante sigue parcialmente abierto
* el viaje sigue `LIQUIDADO`

### T-F5 LP + NC con liberación de viaje

Dado un LP emitido,
cuando se emite NC que libera el viaje (`viajesALiberar`),
entonces:

* el LP sigue histórico
* la NC queda asociada
* el viaje pasa a `PENDIENTE_LIQUIDAR`
* el viaje queda reliquidable

### T-F6 LP + NC parcial sin liberación de viaje

Dado un LP emitido,
cuando se emite NC parcial que no libera el viaje,
entonces:

* el viaje sigue en `LIQUIDADO`
* el saldo de cuenta corriente fletero y el IVA Compras se ajustan
* no se habilita reliquidación

### T-F7 LP + ND

Dado un LP emitido,
cuando se emite ND,
entonces:

* aumenta el reconocimiento vigente a favor del fletero
* el viaje sigue liquidado

### T-F8 LP + OP total + NC con liberación de viaje

Dado un LP totalmente pagado,
cuando se emite NC que libera el viaje,
entonces:

* la OP sigue histórica
* la corrección no borra el pago
* el viaje queda `PENDIENTE_LIQUIDAR`

### T-F9 LP + OP total + ND

Dado un LP totalmente pagado,
cuando se emite ND,
entonces:

* la OP sigue histórica
* la ND genera nueva diferencia pendiente

### T-F10 NC libera solo parte de los viajes en LP multi-viaje

Dado un LP con varios viajes,
cuando la NC libera solo uno (lista `viajesALiberar`),
entonces:

* ese viaje pasa a `PENDIENTE_LIQUIDAR`
* los demás siguen en `LIQUIDADO`

### T-F11 Bloqueo de sobrecrédito

No debe permitirse NC que exceda el neto liquidado vigente del viaje.

### T-F12 No doble liquidación vigente

No debe permitirse nueva liquidación vigente sobre viaje que todavía mantiene efecto económico vigente no revertido.

---

## 4.3 Descuentos / consumos del fletero

### T-D1 Consumo imputable coexistiendo con LP

Debe preservarse la separación entre:

* principal liquidado por viaje
* descuentos/consumos imputables al fletero

### T-D2 Consumo impactando neto de pago

El consumo debe impactar el neto a pagar sin alterar falsamente el principal histórico del viaje.

### T-D3 Trazabilidad separada

Debe poder distinguirse qué parte del neto surge de viajes liquidados y qué parte surge de consumos/descuentos.

---

## 4.4 Seguridad / ownership / consistencia API

### T-S1 Ownership de documentos

No debe poder emitirse NC/ND/recibo/OP sobre documentos ajenos o fuera de alcance.

### T-S2 Ownership de viajes

No debe poder asociarse un viaje ajeno a una factura o LP.

### T-S3 Transiciones inválidas

No deben permitirse transiciones de estado incompatibles con la situación documental vigente.

### T-S4 PDFs / vistas / endpoints

La visibilidad de comprobantes y documentos asociados debe respetar ownership y rol.

---

## 5. Preguntas que los tests ayudan a congelar

Antes de implementar, cualquier cambio relevante debería poder responder estas preguntas con tests:

1. ¿el documento histórico sigue existiendo después de una corrección?
2. ¿el viaje quedó pendiente o sigue vigente parcialmente?
3. ¿el saldo neto en cuenta corriente coincide con la documentación?
4. ¿un pago/cobranza anterior se conserva y no se “borra” por magia?
5. ¿se evita duplicar efecto económico vigente sobre el mismo viaje?
6. ¿la corrección se evalúa correctamente por viaje y no solo por cabecera?

---

## 6. Criterio de aceptación para implementaciones futuras

Una implementación se considera correcta solo si cumple simultáneamente:

* preserva trazabilidad documental
* respeta independencia entre circuito empresa y circuito fletero
* mantiene cuenta corriente consistente con comprobantes y aplicaciones
* deriva correctamente el estado operativo del viaje
* no permite duplicaciones ni netos imposibles
* conserva ownership, permisos y restricciones de seguridad ya implementadas

---

## 7. Criterio final

Este documento debe funcionar como checklist mínimo antes de:

* tocar lógica de facturación
* tocar lógica de liquidación
* introducir NC/ND
* alterar estados del viaje
* modificar reglas de recibos u órdenes de pago

Si una propuesta de implementación rompe alguno de estos invariantes, debe considerarse incorrecta aunque compile o pase pruebas parciales aisladas.
