# Política de tests

## Cuándo testear

- **Toda función nueva o refactor relevante** sigue [HTDP](./htdp.md): los
  ejemplos del JSDoc se traducen 1:1 a tests.
- **Helpers monetarios**: tests obligatorios. Los importes con decimales
  rompen sin tests.
- **API routes**: si tienen lógica de negocio (no son sólo CRUD), test del
  comando subyacente con mock de Prisma.
- **Comandos transaccionales**: tests con mock de `prisma.$transaction` o
  helpers puros extraídos.

## Dónde van los tests

- Todos en `src/__tests__/<feature>.test.ts`.
- Un archivo por archivo de `src/lib/` que sea testable.
- Para lógica compleja en API routes, testear el comando extraído (no la
  ruta directamente).

## Cómo testear

### Funciones puras

Sin mocks. Datos in-memory, asserts directos.

```typescript
import { sumarImportes } from "@/lib/money"

describe("sumarImportes", () => {
  it("suma sin errores de float", () => {
    expect(sumarImportes([0.1, 0.2])).toBe(0.3)
  })
})
```

### Funciones con Prisma

Mockear `@/lib/prisma` antes del import del módulo bajo test.

```typescript
const mockPrisma = {
  liquidacion: { findUnique: jest.fn(), findMany: jest.fn() },
}
jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { calcularSaldoPendienteLiquidacion } from "@/lib/cuenta-corriente"

beforeEach(() => jest.clearAllMocks())

it("...", async () => {
  mockPrisma.liquidacion.findUnique.mockResolvedValue({ ... })
  expect(await calcularSaldoPendienteLiquidacion("liq1")).toBe(...)
})
```

### Tests de invariantes

Cuando una regla de negocio NO debe romperse (ej: "una OP cancela los LPs en
su totalidad"), agregar tests específicos del invariante. Ver
[invariantes.md](./invariantes.md) para la lista vigente y
`src/__tests__/orden-pago-distribucion.test.ts` como ejemplo.

## Comandos

```bash
npm test                       # toda la suite
npx jest <pattern>             # filtra por nombre de archivo
npx jest --watch               # modo watch
```

Antes de cerrar una tarea: `npm test` en verde + `npm run build` en verde.
