# ARCA - Matriz de Comprobantes de Transmagg

## Objetivo

Este documento define la **matriz fiscal cerrada de comprobantes ARCA** que puede usar Transmagg.

Su objetivo es evitar ambigüedades en:

- tipos de comprobante permitidos
- códigos ARCA válidos
- reglas de emisión
- reglas de corrección
- menús y submenús correctos
- configuración habilitada por código
- alcance actual y funcionalidades explícitamente no implementadas

Este documento es **normativo** para el proyecto.

---

## Regla de prioridad

Si el código actual, una implementación previa, una devolución de otra IA, un test existente o una propuesta futura contradicen este documento, **prevalece este documento**.

No deben implementarse comportamientos que contradigan estas reglas aunque hayan existido antes en el sistema o en iteraciones previas.

---

## Catálogo cerrado de comprobantes ARCA

Transmagg solo debe contemplar los siguientes comprobantes:

## Facturación empresa

- **1** = Factura A
- **2** = Nota de Débito A
- **3** = Nota de Crédito A
- **6** = Factura B
- **7** = Nota de Débito B
- **8** = Nota de Crédito B
- **201** = Factura de Crédito Electrónica MiPyMEs A
- **202** = Nota de Débito a Factura de Crédito Electrónica MiPyMEs A
- **203** = Nota de Crédito a Factura de Crédito Electrónica MiPyMEs A

## Liquidación fletero

- **60** = Cuenta de Venta y Líquido Producto A
- **61** = Cuenta de Venta y Líquido Producto B

Las NC/ND sobre LP usan los mismos códigos que las de facturas:
- LP A (60) → NC **3**, ND **2**
- LP B (61) → NC **8**, ND **7**

---

## Regla de cierre del catálogo

Fuera de los códigos listados en este documento, **no debe existir ningún otro comprobante operativo** en Transmagg.

Esto implica:

- no ofrecer otros tipos en UI
- no aceptar otros tipos por API
- no mantener mapeos heredados a otros códigos ARCA
- no dejar código “genérico” que permita emitir comprobantes fuera de esta matriz

---

## Comprobantes operativos en esta etapa

En la etapa actual, los comprobantes operativos son:

### Empresa
- **1** Factura A
- **2** Nota de Débito A
- **3** Nota de Crédito A
- **6** Factura B
- **7** Nota de Débito B
- **8** Nota de Crédito B
- **201** Factura de Crédito Electrónica MiPyMEs A
- **202** Nota de Débito a Factura de Crédito Electrónica MiPyMEs A
- **203** Nota de Crédito a Factura de Crédito Electrónica MiPyMEs A

### Fletero
- **60** Cuenta de Venta y Líquido Producto A
- **61** Cuenta de Venta y Líquido Producto B

---

## NC/ND sobre Liquidaciones de Producto

Las NC/ND sobre LP usan los mismos códigos ARCA que las de facturas:

| LP origen | NC | ND |
|-----------|----|----|
| 60 (LP A) | 3 (NC A) | 2 (ND A) |
| 61 (LP B) | 8 (NC B) | 7 (ND B) |

No se usa un código especial para NC/ND de LP. Los códigos 2, 3, 7, 8 son compatibles tanto con facturas como con liquidaciones.

Eso significa:

- no debe aparecer en menús
- no debe aparecer en modales
- no debe mostrarse como acción posible
- no debe poder emitirse por API
- no debe existir flujo de corrección de LP con NC/ND en esta etapa

Podrá reservarse para implementación futura, pero no debe quedar activo ahora.

---

## Reglas por receptor

## Factura A (1)

Solo puede emitirse a:

- **Responsables Inscriptos**

## Factura B (6)

Solo puede emitirse a:

- **Monotributistas**
- **Consumidor Final**

## Factura de Crédito Electrónica MiPyMEs A (201)

Solo puede emitirse cuando:

- el receptor corresponde al circuito de FCE MiPyMEs A
- y el comprobante **201** está habilitado en Configuración ARCA

---

## Regla general de visibilidad al emitir facturas

Cuando el operador va a emitir una factura a una empresa, solo pueden aparecer estas opciones:

- **Factura A (1)**
- **Factura B (6)**
- **Factura de Crédito Electrónica MiPyMEs A (201)**

Y deben filtrarse por:

- condición fiscal / tipo de receptor
- configuración ARCA del punto de venta
- reglas particulares del circuito FCE cuando correspondan

No deben ofrecerse comprobantes incompatibles con el receptor.

---

## Matriz cerrada de corrección de facturas

La corrección de facturas debe realizarse **desde Consultar Facturas**, nunca desde un submódulo global principal.

La nota permitida depende del tipo de comprobante origen.

## Si la factura original es **1** (Factura A)

Se permite emitir:

- **2** Nota de Débito A
- **3** Nota de Crédito A

## Si la factura original es **6** (Factura B)

Se permite emitir:

- **7** Nota de Débito B
- **8** Nota de Crédito B

## Si la factura original es **201** (Factura de Crédito Electrónica MiPyMEs A)

Se permite emitir:

- **202** Nota de Débito a Factura de Crédito Electrónica MiPyMEs A
- **203** Nota de Crédito a Factura de Crédito Electrónica MiPyMEs A

---

## Regla cerrada de notas sobre facturas

No debe existir selector libre de tipo de nota.

El sistema debe derivar automáticamente qué tipos de nota están permitidos según el comprobante origen.

Por lo tanto:

- una factura **1** no puede corregirse con **7**, **8**, **202** o **203**
- una factura **6** no puede corregirse con **2**, **3**, **202** o **203**
- una factura **201** no puede corregirse con **2**, **3**, **7** o **8**

Backend y frontend deben validar exactamente la misma matriz.

---

## Reglas de Líquidos Productos

## Emisión de LP

Los Líquidos Productos deben emitirse únicamente como:

- **60** Cuenta de Venta y Líquido Producto A
- **61** Cuenta de Venta y Líquido Producto B

## Corrección de LP

La corrección de LP se realiza con los mismos códigos NC/ND que las facturas:
- LP A (60) → NC **3**, ND **2**
- LP B (61) → NC **8**, ND **7**

---

## Códigos válidos para LP

Los códigos válidos para el circuito de liquidación fletero son:

- **60** = CVLP A (base)
- **61** = CVLP B (base)
- **2** / **3** = ND A / NC A (notas sobre LP A)
- **7** / **8** = ND B / NC B (notas sobre LP B)

---

## Menú y submenú correctos

## Empresas

### Facturación → Emitir
Deben aparecer únicamente estas opciones, según receptor + configuración:

- Factura A
- Factura B
- Factura de Crédito Electrónica MiPyMEs A

### Facturación → Consultar
Desde una factura emitida se debe poder:

- consultar
- auditar
- reimprimir
- emitir la NC/ND compatible con su tipo original

---

## Fleteros

### Líquidos Productos → Emitir
Deben poder emitirse:

- Cuenta de Venta y Líquido Producto A (60)
- Cuenta de Venta y Líquido Producto B (61)

### Líquidos Productos → Consultar
Desde una liquidación emitida se debe poder:

- consultar
- reimprimir
- emitir NC/ND (códigos 2/3 o 7/8 según tipo de LP)

---

## Contabilidad

### Notas C/D
Debe ser solo para:

- consulta
- filtros
- auditoría
- reimpresión
- visualización de estado ARCA
- visualización del comprobante asociado

No debe ser el lugar principal de emisión de NC/ND.

---

## Configuración ARCA

La configuración ARCA no debe limitarse solo a punto de venta.

Debe incluir:

- **punto de venta**
- **lista de códigos ARCA habilitados**

Ejemplo de comprobantes configurables:

- 1, 2, 3
- 6, 7, 8
- 60, 61
- 201, 202, 203

---

## Reglas de configuración

- Si un comprobante no está habilitado en Configuración ARCA, **no debe aparecer en UI**
- Tampoco debe poder emitirse forzando la API
- La validación debe existir en frontend y backend
- La configuración debe ser **explícita por código**
- No debe inferirse por categorías vagas como “tipo A” o “tipo empresa”

---

## Reglas de backend

La API debe rechazar:

- tipos de comprobante fuera del catálogo cerrado
- comprobantes deshabilitados en Configuración ARCA
- comprobantes incompatibles con la condición fiscal del receptor
- notas incompatibles con el comprobante origen
- emisión de NC/ND sobre LP si los códigos correspondientes no están habilitados en Configuración ARCA

---

## Reglas de frontend

La UI debe mostrar solo lo permitido para cada caso.

El operador no debe tener que elegir entre códigos fiscales ambiguos o incompatibles.

La UI debe:

- mostrar solo comprobantes válidos según contexto
- esconder comprobantes deshabilitados
- ofrecer notas correctas según comprobante origen
- no mostrar flujos de LP que no estén operativos

---

## Reglas de integración ARCA

El código enviado a ARCA debe corresponder exactamente al comprobante elegido.

### Empresa
- **1**, **6**, **201** para facturas
- **2**, **3**, **7**, **8**, **202**, **203** para notas

### Fletero
- **60**, **61** para LP
- **2**, **3** para NC/ND sobre LP A (mismos códigos que facturas A)
- **7**, **8** para NC/ND sobre LP B (mismos códigos que facturas B)

### Regla cerrada
No deben quedar mapeos a otros códigos fuera de esta matriz fiscal cerrada.

---

## Invariantes del sistema

Se consideran invariantes obligatorios:

1. El catálogo de comprobantes es cerrado.
2. No se emite ningún comprobante fuera de esta matriz.
3. Las opciones visibles en UI dependen de:
   - contexto
   - receptor
   - comprobante origen
   - configuración ARCA
4. Las notas sobre facturas dependen siempre del tipo de comprobante original.
5. Los LP base se emiten como **60** o **61**. NC/ND sobre LP usan los mismos códigos que facturas (2/3 para A, 7/8 para B).
6. Los códigos 2, 3, 7, 8 son compatibles tanto con facturas como con liquidaciones.
7. Contabilidad / Notas C-D es solo consulta global.
8. Backend y frontend deben validar exactamente la misma matriz.
9. Si existe una contradicción con código heredado, prevalece este documento.

---

## Qué no debe hacer ninguna IA en este proyecto

Ninguna IA debe:

- proponer comprobantes fuera del catálogo cerrado
- habilitar emisión genérica de notas incompatibles
- emitir NC/ND sobre LP sin que los códigos correspondientes estén habilitados en Configuración ARCA
- mover la emisión principal de NC/ND a Contabilidad
- introducir mapeos ARCA alternativos que contradigan esta matriz
- dejar soluciones “preparadas” pero visibles en UI si no están operativas

---

## Uso obligatorio de este documento

Toda tarea que toque:

- facturación
- notas de crédito / débito
- LP
- configuración ARCA
- validaciones fiscales
- rutas de emisión
- UI de comprobantes
- tests de comprobantes

debe respetar obligatoriamente este documento.