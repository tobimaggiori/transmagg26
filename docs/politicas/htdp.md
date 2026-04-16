# Receta HTDP

Proceso obligatorio para toda función nueva o refactor relevante en Transmagg.
Esta es la **única fuente** de la receta — cualquier otro doc que la mencione debe
linkear acá, no copiar.

## Pasos

1. **Diseño de datos**. Explicar cómo se representan los datos involucrados (qué
   tipos, qué shape, qué invariantes implícitos).
2. **Signatura y propósito**. Indicar qué recibe la función, qué devuelve, y qué
   hace en una oración.
3. **Ejemplos**. Dar 3+ ejemplos concretos de entradas y salidas esperadas.
   Cubrir caso típico, caso vacío y un caso borde relevante.
4. **Implementación**. Definir la función.
5. **Tests**. Escribir tests basados en los ejemplos del paso 3 y ejecutarlos.
6. **Corrección**. Si los tests fallan, corregir la implementación, no los
   ejemplos.

## Dónde va cada cosa

### En el archivo fuente (encima de la función)

```typescript
/**
 * sumarImportes: number[] -> number
 *
 * Suma una lista de importes monetarios usando precisión decimal.js.
 *
 * Ejemplos:
 * sumarImportes([10, 20.5, 0.3]) === 30.8
 * sumarImportes([]) === 0
 * sumarImportes([0.1, 0.2]) === 0.3   // sin error de float
 */
export function sumarImportes(importes: number[]): number { ... }
```

### En el archivo de tests (`src/__tests__/`)

- Un `it()` por ejemplo del JSDoc.
- Casos borde adicionales si los hay (overflow, null, undefined, etc.).
- Sin mocks innecesarios — funciones puras se testean directo.

## Reglas adicionales

- **No cerrar tareas solo con explicación**. Modificar el código real, agregar o
  actualizar tests, correr `npm test`, y reportar cualquier pendiente con
  honestidad.
- **Funciones impuras** (con Prisma o I/O): mockear las dependencias en el test
  pero seguir la receta igual.
- **Helpers monetarios**: además de HTDP, se aplican las reglas de
  [money.md](./money.md).
