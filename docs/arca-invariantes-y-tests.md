# Invariantes y Tests - Comprobantes ARCA en Transmagg

## Objetivo

Este documento define los **invariantes funcionales y técnicos** que deben mantenerse en todo el circuito de comprobantes ARCA de Transmagg, y detalla los **escenarios mínimos de test** que deben existir para evitar regresiones.

Complementa a:

- `arca-matriz-comprobantes.md`
- `arca-configuracion-y-validaciones.md`

Si existiera contradicción, **prevalece `arca-matriz-comprobantes.md`**.

---

## Alcance

Aplica a todo lo relacionado con:

- facturación empresa
- notas de crédito / débito empresa
- líquidos productos
- configuración ARCA
- integración ARCA
- selección de comprobantes
- validaciones de emisión
- UI de emisión y consulta
- API de comprobantes
- tests de negocio y tests técnicos

---

## Invariantes generales

### Invariante 1 — Catálogo cerrado
Transmagg no debe emitir ni ofrecer comprobantes fuera de esta lista:

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

Todo otro código debe ser rechazado.

### Invariante 2 — Operatividad actual
Aunque 65 forma parte del catálogo contemplado, **no debe estar operativo en esta etapa**.

### Invariante 3 — Configuración explícita por código
La posibilidad de emitir un comprobante depende de que su código ARCA esté explícitamente habilitado en Configuración ARCA.

### Invariante 4 — Validación en ambas capas
Frontend y backend deben validar la misma matriz de comprobantes.

### Invariante 5 — UI contextual
La UI debe mostrar solo comprobantes válidos según:

- contexto
- tipo de receptor
- comprobante origen
- configuración ARCA
- operatividad actual

### Invariante 6 — Notas derivadas del origen
No existe selector libre de tipo de nota.
Las notas válidas se derivan siempre del comprobante origen.

### Invariante 7 — LP restringido
En esta etapa, los LP solo se emiten como:

- 60
- 61

Y no se corrigen con NC/ND.

### Invariante 8 — Integración ARCA exacta
El código enviado a ARCA debe coincidir exactamente con el tipo de comprobante seleccionado y validado.

### Invariante 9 — Sin mapeos heredados alternativos
No deben quedar mapeos activos a códigos heredados que contradigan la matriz fiscal cerrada.

### Invariante 10 — Contabilidad no es el punto principal de emisión
Las notas de crédito y débito no se emiten principalmente desde Contabilidad, sino desde el comprobante origen cuando corresponde.

---

## Invariantes por circuito

## Empresa

### Invariante E1
Las únicas facturas base emitibles son:

- 1
- 6
- 201

### Invariante E2
Factura A (1) solo puede emitirse a:

- Responsables Inscriptos

### Invariante E3
Factura B (6) solo puede emitirse a:

- Monotributistas
- Consumidor Final

### Invariante E4
Factura de Crédito Electrónica MiPyMEs A (201) solo puede emitirse cuando el receptor corresponda a ese circuito y esté habilitada en configuración.

### Invariante E5
Si el origen es 1, las únicas notas permitidas son:

- 2
- 3

### Invariante E6
Si el origen es 6, las únicas notas permitidas son:

- 7
- 8

### Invariante E7
Si el origen es 201, las únicas notas permitidas son:

- 202
- 203

### Invariante E8
No deben ofrecerse ni aceptarse combinaciones cruzadas de notas incompatibles.

---

## Fletero

### Invariante F1
Los únicos LP emitibles son:

- 60
- 61

### Invariante F2
No debe emitirse 65 en esta etapa.

### Invariante F3
No debe existir emisión operativa de NC/ND sobre LP en esta etapa.

### Invariante F4
Consultar LP debe ser solo consulta, auditoría, reimpresión y visualización, sin acciones de corrección por notas.

---

## Invariantes de configuración

### Invariante C1
Un comprobante deshabilitado en Configuración ARCA no debe aparecer en UI.

### Invariante C2
Un comprobante deshabilitado en Configuración ARCA debe ser rechazado por API aunque el payload lo fuerce.

### Invariante C3
La configuración debe ser explícita por código, no por categorías vagas.

---

## Invariantes de backend

### Invariante B1
Backend debe rechazar cualquier tipo de comprobante fuera del catálogo cerrado.

### Invariante B2
Backend debe rechazar 65 en esta etapa, aunque forme parte del catálogo contemplado.

### Invariante B3
Backend debe rechazar comprobantes incompatibles con la condición fiscal del receptor.

### Invariante B4
Backend debe rechazar notas incompatibles con el comprobante origen.

### Invariante B5
Backend debe rechazar intentos de corrección por NC/ND sobre LP en esta etapa.

---

## Invariantes de frontend

### Invariante U1
La UI no debe exponer tipos fuera de la matriz cerrada.

### Invariante U2
La UI no debe mostrar opciones incompatibles con la condición fiscal del receptor.

### Invariante U3
La UI no debe mostrar notas incompatibles con el comprobante origen.

### Invariante U4
La UI no debe mostrar botones deshabilitados, “próximamente” o flujos a medio hacer para NC/ND sobre LP.

---

## Invariantes de integración ARCA

### Invariante A1
Factura A debe emitir a ARCA con código 1.

### Invariante A2
Nota de Débito A debe emitir a ARCA con código 2.

### Invariante A3
Nota de Crédito A debe emitir a ARCA con código 3.

### Invariante A4
Factura B debe emitir a ARCA con código 6.

### Invariante A5
Nota de Débito B debe emitir a ARCA con código 7.

### Invariante A6
Nota de Crédito B debe emitir a ARCA con código 8.

### Invariante A7
CVLP A debe emitir a ARCA con código 60.

### Invariante A8
CVLP B debe emitir a ARCA con código 61.

### Invariante A9
FCE MiPyMEs A debe emitir a ARCA con código 201.

### Invariante A10
ND FCE MiPyMEs A debe emitir a ARCA con código 202.

### Invariante A11
NC FCE MiPyMEs A debe emitir a ARCA con código 203.

### Invariante A12
No deben existir mapeos activos a códigos alternativos para LP ni para facturación general fuera de la matriz cerrada.

---

## Escenarios mínimos de test

## 1. Tests del catálogo cerrado

Deben existir tests que verifiquen:

- que los códigos permitidos son exactamente:
  - 1, 2, 3, 6, 7, 8, 60, 61, 65, 201, 202, 203
- que cualquier código fuera de esa lista es inválido
- que pertenecer al catálogo no implica automáticamente estar operativo

### Casos mínimos
- aceptar 1
- aceptar 60
- aceptar 201
- aceptar 65 como código contemplado
- rechazar 4
- rechazar 5
- rechazar 186
- rechazar 187
- rechazar cualquier código no documentado

---

## 2. Tests de operatividad actual

Deben existir tests que verifiquen:

- 65 pertenece al catálogo
- 65 no está operativo
- backend rechaza emisión de 65
- frontend no muestra 65
- no existen acciones de UI para 65

---

## 3. Tests de configuración ARCA

Deben existir tests que verifiquen:

- comprobante habilitado aparece en UI
- comprobante deshabilitado no aparece en UI
- backend rechaza emisión de comprobante deshabilitado
- cambios de configuración impactan correctamente en las opciones visibles

### Casos mínimos
- 1 habilitado -> visible si el receptor es RI
- 1 deshabilitado -> no visible
- 6 habilitado -> visible si el receptor es Monotributo o CF
- 201 habilitado -> visible solo si además corresponde FCE
- 60 habilitado -> visible en Emitir LP
- 61 deshabilitado -> no visible en Emitir LP

---

## 4. Tests de emisión empresa por condición fiscal

### Factura A
- RI ve 1 si está habilitado
- Monotributista no ve 1
- Consumidor Final no ve 1
- backend rechaza 1 para receptor no RI

### Factura B
- Monotributista ve 6 si está habilitado
- Consumidor Final ve 6 si está habilitado
- RI no ve 6
- backend rechaza 6 para receptor RI

### FCE MiPyMEs A
- receptor elegible + 201 habilitado -> visible
- receptor no elegible -> no visible
- 201 deshabilitado -> no visible
- backend rechaza 201 cuando no corresponde

---

## 5. Tests de matriz de notas empresa

### Origen 1
- frontend ofrece solo 2 y 3
- backend acepta 2 sobre 1
- backend acepta 3 sobre 1
- backend rechaza 7 sobre 1
- backend rechaza 8 sobre 1
- backend rechaza 202 sobre 1
- backend rechaza 203 sobre 1

### Origen 6
- frontend ofrece solo 7 y 8
- backend acepta 7 sobre 6
- backend acepta 8 sobre 6
- backend rechaza 2 sobre 6
- backend rechaza 3 sobre 6
- backend rechaza 202 sobre 6
- backend rechaza 203 sobre 6

### Origen 201
- frontend ofrece solo 202 y 203
- backend acepta 202 sobre 201
- backend acepta 203 sobre 201
- backend rechaza 2 sobre 201
- backend rechaza 3 sobre 201
- backend rechaza 7 sobre 201
- backend rechaza 8 sobre 201

---

## 6. Tests de emisión de LP

Deben existir tests que verifiquen:

- emisión permitida de 60 cuando está habilitado
- emisión permitida de 61 cuando está habilitado
- rechazo de 60 o 61 cuando están deshabilitados
- rechazo de 65 en esta etapa

### Casos mínimos
- frontend muestra 60 habilitado
- frontend muestra 61 habilitado
- frontend no muestra 65
- backend acepta 60
- backend acepta 61
- backend rechaza 65
- backend rechaza cualquier NC/ND de LP en esta etapa

---

## 7. Tests de UI de consulta

### Consultar Facturas
Deben existir tests que verifiquen:

- factura 1 muestra acciones para 2 y 3
- factura 6 muestra acciones para 7 y 8
- factura 201 muestra acciones para 202 y 203
- no aparecen acciones incompatibles

### Consultar LP
Deben existir tests que verifiquen:

- no hay botones Emitir NC
- no hay botones Emitir ND
- no hay textos “próximamente” sobre NC/ND LP
- no hay acciones deshabilitadas para corrección de LP

---

## 8. Tests de backend forzando payload inválido

Deben existir tests donde el frontend se “saltee” y el backend siga protegiendo el sistema.

### Casos mínimos
- intentar emitir código fuera del catálogo
- intentar emitir 65
- intentar emitir 1 a monotributista
- intentar emitir 6 a RI
- intentar emitir 7 sobre factura 1
- intentar emitir 203 sobre factura 6
- intentar emitir una NC/ND sobre LP

Todos deben ser rechazados por backend.

---

## 9. Tests de integración ARCA

Deben existir tests que verifiquen que el mapeo enviado a ARCA es exacto.

### Casos mínimos
- factura A -> 1
- ND A -> 2
- NC A -> 3
- factura B -> 6
- ND B -> 7
- NC B -> 8
- CVLP A -> 60
- CVLP B -> 61
- FCE A -> 201
- ND FCE A -> 202
- NC FCE A -> 203

### Además
- verificar que no existan mapeos activos a 186/187 u otros códigos heredados para LP

---

## 10. Tests de regresión de legado

Deben existir tests que eviten que una futura IA o refactor vuelva a introducir comportamientos prohibidos.

### Deben proteger contra:
- reaparición de códigos fuera del catálogo
- reactivación accidental de 65
- reintroducción de NC/ND sobre LP
- selectors genéricos de nota
- mapeos ARCA heredados incorrectos
- exposición de acciones fiscales desde módulos incorrectos

---

## Qué debe rechazarse siempre

Se considera regresión grave si el sistema permite cualquiera de estas situaciones:

- emitir un comprobante fuera de la matriz cerrada
- ofrecer notas incompatibles con el comprobante origen
- emitir LP con un código distinto de 60 o 61
- emitir 65 en esta etapa
- corregir LP con NC/ND en esta etapa
- mostrar en UI flujos fiscales no operativos
- enviar a ARCA un código distinto del definido en la matriz
- aceptar por backend algo que frontend oculta como inválido

---

## Criterio de aceptación de la suite de tests

La suite de comprobantes ARCA se considera adecuada solo si:

1. cubre catálogo cerrado
2. cubre operatividad actual
3. cubre configuración ARCA
4. cubre condición fiscal del receptor
5. cubre matriz de compatibilidad de notas
6. cubre restricción de LP
7. cubre backend ante payload inválido
8. cubre integración ARCA
9. cubre regresiones de legado

---

## Regla para futuras tareas

Toda tarea que modifique:

- tipos de comprobante
- configuración ARCA
- validaciones fiscales
- selección de comprobantes
- integración ARCA
- menús o acciones de emisión/corrección

debe revisar este documento y mantener estos invariantes y tests actualizados.