# ARCA - Configuración y Validaciones de Comprobantes

## Objetivo

Este documento baja a nivel técnico las reglas definidas en `arca-matriz-comprobantes.md`.

Su objetivo es dejar documentado cómo deben implementarse en Transmagg:

- la configuración ARCA
- la selección de comprobantes
- las validaciones de backend
- las validaciones de frontend
- la integración ARCA
- la limpieza de legado
- los tests obligatorios

Este documento complementa al documento rector y debe respetarlo en todo momento.

---

## Relación con el documento rector

Este documento depende de:

- `arca-matriz-comprobantes.md`

Si existiera contradicción entre ambos, **prevalece `arca-matriz-comprobantes.md`**.

---

## Alcance técnico

Este documento aplica a toda pieza de código relacionada con:

- emisión de facturas
- emisión de notas de crédito / débito
- emisión de líquidos productos
- configuración ARCA
- validaciones fiscales
- catálogo de tipos de comprobante
- selección de comprobantes en UI
- rutas API de comprobantes
- tests fiscales

---

## Fuente única de verdad del catálogo

Debe existir una definición centralizada del catálogo de comprobantes ARCA permitidos por Transmagg.

No se debe dispersar esta lógica en múltiples `if`, `switch` o constantes duplicadas.

## El catálogo centralizado debe incluir, como mínimo, para cada comprobante:

- código ARCA
- nombre visible
- circuito
- si es comprobante base o nota
- si está operativo en esta etapa
- tipos de comprobante origen compatibles
- condiciones fiscales compatibles
- si requiere habilitación por Configuración ARCA
- si se puede emitir desde UI
- desde qué módulo / submódulo se emite

---

## Catálogo técnico esperado

## Circuito empresa

### Comprobantes base
- **1** Factura A
- **6** Factura B
- **201** Factura de Crédito Electrónica MiPyMEs A

### Notas
- **2** Nota de Débito A
- **3** Nota de Crédito A
- **7** Nota de Débito B
- **8** Nota de Crédito B
- **202** Nota de Débito a Factura de Crédito Electrónica MiPyMEs A
- **203** Nota de Crédito a Factura de Crédito Electrónica MiPyMEs A

## Circuito fletero

### Comprobantes base
- **60** Cuenta de Venta y Líquido Producto A
- **61** Cuenta de Venta y Líquido Producto B

### Nota contemplada pero no operativa
- **65** Nota de Crédito a Cuenta de Venta y Líquido Producto A

---

## Regla de operatividad

El catálogo técnico puede contemplar el código **65** como registro normativo, pero en esta etapa debe marcarse como:

- no operativo
- no visible en UI
- no emitible por API
- no seleccionable desde ningún flujo

---

## Configuración ARCA

## Objetivo

La configuración ARCA debe dejar de ser solamente un punto de venta.

Debe permitir controlar qué comprobantes están habilitados o deshabilitados para emitir.

## La configuración debe contemplar al menos:

- punto de venta
- lista de códigos de comprobante habilitados
- estado activo/inactivo de esa configuración si el modelo lo requiere

---

## Reglas de configuración

### Regla 1
Si un comprobante no está habilitado en Configuración ARCA:

- no debe aparecer en frontend
- no debe poder emitirse por backend
- no debe poder seleccionarse indirectamente por flujos contextuales

### Regla 2
La habilitación debe ser **explícita por código de comprobante**.

No debe inferirse de forma vaga por:

- clase A/B
- circuito empresa/fletero
- tipo de cliente
- tipo de documento base

### Regla 3
Las validaciones deben ser consistentes entre frontend y backend.

Frontend puede ocultar opciones, pero backend debe validar siempre.

---

## Configuración mínima esperada por código

La configuración debe poder manejar individualmente estos códigos:

- 1
- 2
- 3
- 6
- 7
- 8
- 60
- 61
- 65
- 201
- 202
- 203

Aunque **65** no quede operativo, puede existir como valor configurable reservado a futuro.

Si se lo deja configurable en esta etapa, igual debe seguir bloqueado operativamente.

---

## Selección de comprobantes en UI

## Emisión de facturas a empresa

Cuando el operador va a emitir una factura, la UI solo debe evaluar como candidatas:

- **1**
- **6**
- **201**

Luego debe filtrar esas candidatas por:

- condición fiscal / tipo de receptor
- compatibilidad fiscal del comprobante
- configuración ARCA
- operatividad vigente
- reglas del circuito FCE

---

## Reglas de visibilidad en UI de empresa

### Factura A (1)
Visible solo si:
- receptor = Responsable Inscripto
- código 1 habilitado
- flujo permitido

### Factura B (6)
Visible solo si:
- receptor = Monotributista o Consumidor Final
- código 6 habilitado
- flujo permitido

### FCE MiPyMEs A (201)
Visible solo si:
- receptor elegible para FCE MiPyMEs A
- código 201 habilitado
- flujo permitido

---

## Regla de ausencia de opciones

Si, luego de aplicar filtros, no hay ningún comprobante válido disponible, la UI debe mostrar un mensaje claro.

Ejemplos de causa:

- comprobantes no habilitados en Configuración ARCA
- condición fiscal incompatible
- circuito FCE no aplicable

No debe dejar selectores vacíos sin explicación.

---

## Emisión contextual de notas sobre facturas

Las notas deben emitirse desde:

- **Facturación → Consultar**
- detalle o contexto de la factura origen

No debe existir un selector libre y global de tipo de nota para corregir facturas.

---

## Matriz técnica de compatibilidad de notas

### Si el comprobante origen es 1
Solo se permite:
- 2
- 3

### Si el comprobante origen es 6
Solo se permite:
- 7
- 8

### Si el comprobante origen es 201
Solo se permite:
- 202
- 203

### Regla cerrada
Toda otra combinación debe ser rechazada por frontend y backend.

---

## Emisión de líquidos productos

En la UI de emisión de LP, solo se deben considerar:

- **60**
- **61**

Luego se deben filtrar por:

- configuración ARCA
- operatividad vigente
- reglas fiscales aplicables al receptor del LP si correspondieran

---

## Consulta de líquidos productos

En esta etapa, la vista de consulta de LP debe ser únicamente para:

- consultar
- auditar
- reimprimir
- ver estado ARCA
- ver datos asociados

No debe permitir:

- emitir NC sobre LP
- emitir ND sobre LP
- corregir LP por notas
- acceder a flujos “próximamente”
- ver botones deshabilitados confusos

---

## Backend - Validaciones obligatorias

Toda route o command que emita comprobantes debe validar como mínimo:

### 1. Código dentro del catálogo cerrado
El código solicitado debe pertenecer a:

- 1, 2, 3, 6, 7, 8, 60, 61, 65, 201, 202, 203

Todo código fuera de esa lista debe rechazarse.

### 2. Código operativo en esta etapa
Aunque pertenezca al catálogo, debe verificarse si está operativo.

Ejemplo:
- **65** pertenece al catálogo
- pero en esta etapa debe rechazarse

### 3. Código habilitado en Configuración ARCA
Si el código no está habilitado para el punto de venta/configuración vigente, debe rechazarse.

### 4. Compatibilidad con el contexto
Debe validarse si el código corresponde al contexto de uso:

- empresa
- fletero
- factura base
- nota
- LP

### 5. Compatibilidad fiscal del receptor
Debe validarse contra la condición fiscal del receptor según las reglas del documento rector.

### 6. Compatibilidad con comprobante origen
En el caso de notas, debe validarse la matriz de compatibilidad según el tipo del comprobante base.

---

## Backend - Reglas específicas por tipo

## Facturas empresa
Solo se deben poder emitir:
- 1
- 6
- 201

## Notas empresa
Solo se deben poder emitir:
- 2, 3 sobre 1
- 7, 8 sobre 6
- 202, 203 sobre 201

## LP
Solo se deben poder emitir:
- 60
- 61

## LP - prohibición actual
No debe emitirse:
- 65

No debe existir ningún flujo backend operativo para corregir LP con notas en esta etapa.

---

## Integración ARCA

## Regla general

El código ARCA enviado al servicio de emisión debe coincidir exactamente con el comprobante seleccionado y validado.

No debe haber traducciones ambiguas, mapeos genéricos ni reinterpretaciones tardías.

---

## Mapeo esperado hacia ARCA

### Empresa
- Factura A -> **1**
- Nota de Débito A -> **2**
- Nota de Crédito A -> **3**
- Factura B -> **6**
- Nota de Débito B -> **7**
- Nota de Crédito B -> **8**
- FCE MiPyMEs A -> **201**
- ND FCE MiPyMEs A -> **202**
- NC FCE MiPyMEs A -> **203**

### Fletero
- CVLP A -> **60**
- CVLP B -> **61**

---

## Prohibiciones de integración

No deben quedar mapeos activos a:

- códigos distintos para LP
- códigos heredados ajenos a esta matriz
- catálogos amplios “por si acaso”
- lógica que permita emitir cualquier tipo informado por UI/API sin pasar por la matriz cerrada

Especialmente, deben eliminarse o neutralizarse mapeos heredados incorrectos para LP.

---

## Limpieza de legado

Si existe código legado que haga alguna de estas cosas, debe corregirse:

- mostrar comprobantes fuera de la matriz cerrada
- aceptar emisión de comprobantes fuera del catálogo
- tratar LP con códigos distintos de 60/61
- permitir NC/ND sobre LP en esta etapa
- ofrecer botones deshabilitados o “próximamente” de flujos prohibidos
- saltear la validación de Configuración ARCA
- derivar mal la compatibilidad de notas según el comprobante origen

---

## Consistencia entre capas

Las reglas deben ser consistentes en todas estas capas:

- catálogo central
- backend
- frontend
- integración ARCA
- tests

No debe pasar que:

- frontend oculte algo pero backend lo acepte
- backend rechace algo que frontend ofrece como válido
- tests congelen una lógica distinta a la del documento rector

---

## Tests obligatorios

## Configuración ARCA
Deben existir tests que verifiquen:

- comprobante habilitado -> visible/emitible
- comprobante deshabilitado -> no visible / rechazado
- backend rechaza emisión de código deshabilitado

## Emisión empresa
Deben existir tests que verifiquen:

- Responsable Inscripto -> puede ver/emitir 1 cuando está habilitado
- Responsable Inscripto -> no ve 6
- Monotributista -> puede ver/emitir 6 cuando está habilitado
- Consumidor Final -> puede ver/emitir 6 cuando está habilitado
- Monotributista / Consumidor Final -> no ven 1
- 201 solo aparece cuando corresponde y está habilitado

## Corrección empresa
Deben existir tests que verifiquen:

- origen 1 -> solo 2 y 3
- origen 6 -> solo 7 y 8
- origen 201 -> solo 202 y 203
- backend rechaza combinaciones incompatibles

## LP
Deben existir tests que verifiquen:

- emisión permitida de 60
- emisión permitida de 61
- rechazo backend de 65 en esta etapa
- ausencia de acciones NC/ND en Consultar LP

## Catálogo cerrado
Deben existir tests que verifiquen:

- rechazo de cualquier código fuera del catálogo
- persistencia de la restricción aun si UI o payload intentan forzarlo

## Integración ARCA
Deben existir tests que verifiquen:

- envío del código correcto a ARCA
- ausencia de mapeos incorrectos heredados
- no uso de códigos alternativos para LP

---

## Criterios de aceptación técnicos

La implementación se considera correcta solo si:

1. Existe una fuente centralizada del catálogo de comprobantes.
2. Configuración ARCA permite habilitar/deshabilitar por código.
3. Frontend ofrece solo tipos válidos según contexto, receptor y configuración.
4. Backend valida la misma matriz cerrada.
5. Notas empresa respetan estrictamente la compatibilidad por comprobante origen.
6. LP solo se emite como 60 o 61.
7. 65 no queda operativo.
8. No quedan flujos activos de NC/ND sobre LP.
9. Integración ARCA usa exactamente los códigos correctos.
10. Tests cubren la matriz funcional y técnica.

---

## Qué no debe hacer ninguna implementación futura

No debe:

- volver a una lógica genérica de “tipo de comprobante libre”
- permitir que la UI elija notas incompatibles
- reabrir NC/ND sobre LP sin una decisión funcional explícita
- dejar 65 operativo por accidente
- aceptar comprobantes sólo porque estén en un enum amplio
- mantener compatibilidad silenciosa con códigos heredados fuera de la matriz

---

## Uso de este documento

Este documento debe citarse explícitamente en cualquier prompt o tarea que involucre:

- configuración ARCA
- emisión
- catálogo de comprobantes
- validaciones fiscales
- UI de emisión/corrección
- routes API fiscales
- tests fiscales

Siempre debe usarse junto con:

- `arca-matriz-comprobantes.md`