# AGENTS.md

## Reglas generales del proyecto

- Antes de implementar cualquier cambio, leer y respetar `docs/money-policy.md` si la tarea toca importes monetarios.
- Toda lógica monetaria nueva o modificada debe usar exclusivamente `src/lib/money.ts`.
- No introducir cálculos monetarios inline con `number`, `parseFloat`, `Math.round(...*100)/100`, sumas/restas directas ni reducciones crudas sobre importes.
- No duplicar reglas de negocio de neto, IVA, total, saldo, comisiones, retenciones o percepciones entre frontend y backend.
- Si una tarea toca dinero, primero extender o reutilizar `money.ts`, después testear, y recién al final conectar frontend/backend.
- Antes de cerrar una tarea que toque dinero, verificar que no queden patrones monetarios crudos en los archivos modificados.

## Receta de HTDP

Cuando en este proyecto se diga “aplicar la receta de HTDP”, significa hacer esto para cada función relevante:

1. **Diseño de datos**  
   Explicar cómo se representan los datos involucrados.

2. **Signatura y declaración de propósito**  
   Indicar cuántos datos recibe la función, de qué tipo son, qué devuelve y qué hace.

3. **Ejemplos de entradas y salidas esperadas**  
   Dar ejemplos concretos de uso con sus resultados esperados.

4. **Definir la función**  
   Implementar la función.

5. **Definir los tests con los ejemplos y evaluarlos**  
   Escribir tests derivados de los ejemplos y ejecutarlos.

6. **Realizar las modificaciones correspondientes en el caso de errores en los tests**  
   Corregir la implementación si los tests fallan.

## Cómo aplicar HTDP en este proyecto

Para funciones nuevas o refactorizadas:

- En el archivo fuente:
  - diseño de datos
  - signatura
  - declaración de propósito
  - ejemplos
  - implementación

- En el archivo de tests correspondiente:
  - tests basados en esos ejemplos
  - casos borde relevantes cuando corresponda

## Regla de calidad final

No cerrar una tarea solo con explicación.
Siempre que corresponda:
- modificar el código real,
- agregar o actualizar tests,
- correr verificación final,
- y reportar cualquier pendiente con honestidad.