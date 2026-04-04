# Política monetaria de Transmagg

## Objetivo

Definir una política única, explícita y obligatoria para todo manejo de importes monetarios en el proyecto, de modo que:

- no se introduzcan errores de precisión por cálculos con flotantes,
- frontend y backend usen las mismas reglas,
- las nuevas implementaciones sean consistentes con la arquitectura monetaria actual,
- y toda lógica monetaria sea fácil de auditar, testear y mantener.

---

## Fuente de verdad

La fuente de verdad para toda lógica monetaria del sistema es:

- `src/lib/money.ts`

Toda operación monetaria nueva o modificada debe reutilizar o extender ese módulo.

No se debe reimplementar lógica monetaria en:
- componentes React,
- páginas,
- routes,
- helpers sueltos,
- generadores PDF,
- reportes,
- ni utilidades ad hoc.

---

## Qué se considera monetario

Se considera monetario todo valor que represente o participe en el cálculo de:

- importe
- neto
- IVA
- total
- subtotal
- saldo
- comisión
- pago
- cobro
- debe / haber
- retención
- percepción
- descuento
- adelanto
- diferencia monetaria
- posición fiscal
- cualquier acumulación o comparación de dinero

También se considera monetaria cualquier operación que:
- sume importes,
- reste importes,
- multiplique un importe por una alícuota o porcentaje,
- divida importes,
- redondee dinero,
- compare importes,
- o formatee importes para mostrar al usuario.

---

## Qué NO se considera monetario

No son monetarios, salvo que se mezclen con dinero en una fórmula:

- kilogramos
- toneladas
- cantidades de ítems
- días
- fechas
- porcentajes o alícuotas por sí mismos
- números de orden
- métricas genéricas sin importe

Aun así, si un valor no monetario participa en una fórmula cuyo resultado sí es monetario, la operación completa debe pasar por `money.ts`.

---

## Reglas obligatorias

### 1. No usar `number` como fuente de verdad monetaria
Los importes no deben modelarse conceptualmente como un número cualquiera.

Si un dato monetario entra o sale como `number`, eso debe considerarse una frontera técnica, no una licencia para calcular “a mano”.

### 2. Toda lógica monetaria debe usar `src/lib/money.ts`
Está prohibido introducir cálculos monetarios inline fuera del módulo monetario o de helpers de dominio que deleguen explícitamente en él.

### 3. No usar cálculos monetarios crudos
Está prohibido para dinero:

- `a + b`
- `a - b`
- `a * b`
- `a / b`
- `reduce((acc, x) => acc + x, 0)`
- `Math.round(x * 100) / 100`
- comparaciones directas con `===`
- tolerancias hardcodeadas
- `parseFloat(...)` como base de cálculo monetario

En su lugar, usar helpers monetarios explícitos.

### 4. No duplicar fórmulas de negocio
Cálculos como:
- neto
- IVA
- total
- comisiones
- saldos
- diferencias
- estados de pago
- acumulados por alícuota

deben tener una sola implementación de referencia o una delegación clara a helpers compartidos.

### 5. Frontend y backend deben usar la misma lógica
El frontend puede mostrar previews, pero no debe inventar reglas propias.
Si hay preview monetario, debe derivarse de la misma lógica usada por backend o por helpers compartidos.

### 6. Toda función monetaria nueva debe documentarse y testearse
Aplicar la receta de HTDP en toda función monetaria nueva o modificada.

---

## Receta de HTDP obligatoria

Para cada función monetaria relevante:

1. **Diseño de datos**  
   Explicar cómo se representan los datos involucrados.

2. **Signatura y declaración de propósito**  
   Indicar qué recibe, qué devuelve y qué hace.

3. **Ejemplos**  
   Dar ejemplos de entradas y salidas esperadas.

4. **Definición**  
   Implementar la función.

5. **Testing**  
   Escribir tests basados en los ejemplos y ejecutarlos.

6. **Debugging**  
   Corregir la implementación si los tests fallan.

### Ubicación esperada

En el archivo fuente:
- diseño de datos
- signatura
- propósito
- ejemplos

En el archivo de tests:
- tests derivados de esos ejemplos
- casos borde adicionales

---

## Helpers monetarios permitidos

Toda lógica monetaria debe pasar por helpers como estos, o equivalentes definidos en `src/lib/money.ts`:

- `parsearImporte`
- `sumarImportes`
- `restarImportes`
- `multiplicarImporte`
- `dividirImporte`
- `aplicarPorcentaje`
- `calcularIva`
- `calcularNetoMasIva`
- `importesIguales`
- `maxMonetario`
- `formatearMoneda`

Si una necesidad nueva no está cubierta, primero se debe extender `money.ts`, y recién después usar esa nueva función en el resto del sistema.

---

## Política de redondeo

La política monetaria del sistema debe estar centralizada en `money.ts`.

Reglas generales:

- Los importes finales se redondean según la política central definida en `money.ts`.
- No se deben esconder redondeos en componentes, páginas, APIs o PDFs.
- Si una operación requiere precisión intermedia, esa precisión debe mantenerse dentro del helper monetario y recién redondearse en el punto correcto.
- Las comparaciones monetarias deben usar helpers explícitos, no tolerancias dispersas.

---

## Política de parseo de inputs monetarios

### Regla general
No usar `parseFloat(...)` inline para lógica monetaria.

### Inputs de UI
En campos monetarios de formularios:
- el valor puede mantenerse temporalmente como `string` durante escritura,
- o como estado intermedio de UI cuidadosamente controlado,
- pero el valor que se usa para calcular, persistir, validar o enviar debe pasar por helpers monetarios.

### Importante
No redondear prematuramente en cada keystroke si eso empeora la experiencia de edición.
Pero tampoco usar el valor crudo del input como fuente final de verdad.

---

## Política para frontend

En frontend:

- no hacer sumas monetarias crudas,
- no hacer restas monetarias crudas,
- no calcular IVA inline,
- no calcular totales inline,
- no comparar importes inline,
- no acumular importes con `reduce` crudo.

Si una vista solo muestra valores ya calculados, puede formatearlos.
Si además calcula subtotales, diferencias o acumulados, debe usar helpers monetarios.

---

## Política para backend y API routes

En backend y API routes:

- toda lógica monetaria debe pasar por `money.ts` o helpers de dominio que deleguen en él,
- no se deben aceptar tolerancias hardcodeadas,
- no se deben usar sumas/restas directas para importes,
- no se deben recalcular fórmulas de negocio en múltiples lugares,
- toda mutación con dinero debe quedar respaldada por tests.

---

## Política para reportes, dashboards, PDFs y exports

Aunque un módulo sea read-only, si:
- suma importes,
- arma subtotales,
- calcula posiciones,
- agrupa montos,
- o produce diferencias monetarias,

también debe usar helpers monetarios.

No se permite justificar como “solo display” un cálculo que en realidad acumula dinero.

### Formateo
Se recomienda unificar el formateo monetario con helpers compartidos.
Los helpers locales de display solo se aceptan si:
- están claramente encapsulados,
- no recalculan dinero,
- y no introducen reglas monetarias nuevas.

---

## Política de base de datos

Los campos monetarios deben modelarse conforme a la política monetaria definida por el proyecto.

### Nota importante sobre SQLite / Turso / libSQL
Aunque Prisma use `Decimal`, en motores compatibles con SQLite la garantía de precisión en almacenamiento no es equivalente a un `NUMERIC/DECIMAL` real de PostgreSQL.

Por eso:

- la exactitud monetaria del sistema depende principalmente de la lógica central de `money.ts`,
- no del motor de base de datos por sí solo.

Esto no habilita a hacer cálculos monetarios con flotantes.
Al contrario: obliga a ser más estrictos en la capa de aplicación.

---

## Checklist obligatoria para toda tarea que toque dinero

Antes de cerrar una implementación que toque dinero, verificar:

- [ ] ¿La lógica monetaria usa `src/lib/money.ts`?
- [ ] ¿Se evitó `parseFloat` como base de cálculo monetario?
- [ ] ¿Se evitó `Math.round(...*100)/100` para importes?
- [ ] ¿Se evitaron sumas/restas monetarias directas?
- [ ] ¿Se evitó `reduce` crudo para acumular importes?
- [ ] ¿Se evitó duplicar fórmulas de neto/IVA/total/saldo?
- [ ] ¿Frontend y backend usan la misma regla?
- [ ] ¿Se aplicó HTDP?
- [ ] ¿Se agregaron o actualizaron tests?
- [ ] ¿Se verificó que no quedaron patrones monetarios crudos en los archivos tocados?

---

## Patrones prohibidos a revisar al final

En cualquier tarea monetaria, revisar si quedaron patrones como:

- `parseFloat(`
- `Math.round(`
- `.reduce(`
- `+ monto`
- `- monto`
- `+ total`
- `- total`
- `+ neto`
- `- neto`
- `+ iva`
- `- iva`

Esto no significa que toda coincidencia sea un error, pero toda coincidencia debe revisarse y justificarse.

---

## Criterio de aceptación para cambios monetarios

Una implementación monetaria nueva o modificada se considera aceptable solo si:

1. usa la política central,
2. no introduce cálculos monetarios inline,
3. no duplica reglas de negocio,
4. aplica HTDP,
5. tiene tests suficientes,
6. compila,
7. y no deja restos monetarios crudos en los archivos tocados.

---

## Regla práctica para desarrollo asistido por IA

Si una tarea toca dinero, el orden correcto de implementación es:

1. extender o reutilizar `src/lib/money.ts`
2. documentar con HTDP
3. agregar tests
4. recién después conectar frontend/backend
5. verificar patrones prohibidos
6. correr TypeScript y tests

No implementar primero en el componente o en la route “para salir del paso”.

---

## Instrucción corta reutilizable

Podés copiar esta regla en prompts de trabajo:

> Si la tarea toca importes monetarios, usar exclusivamente los helpers de `src/lib/money.ts`. No introducir cálculos monetarios inline con `number`, `parseFloat`, `Math.round(...*100)/100`, sumas/restas directas ni reducciones crudas sobre importes. Aplicar la receta de HTDP, agregar tests y verificar al final que no queden patrones monetarios crudos.

---

## Estado esperado del proyecto

El estado buscado para Transmagg es:

- una sola política monetaria,
- un solo punto de entrada para cálculos monetarios,
- reglas explícitas,
- tests de regresión,
- y cero ambigüedad sobre cómo tratar importes nuevos.

Cualquier implementación que se aparte de esto debe considerarse deuda técnica y corregirse.