# PENDIENTE

## Hecho

- Se amplió [`prisma/schema.prisma`](prisma/schema.prisma) con las tablas y relaciones base del módulo financiero.
- Se generó y aplicó la migración [`prisma/migrations/20260330070956_financial_module_part1/migration.sql`](prisma/migrations/20260330070956_financial_module_part1/migration.sql).
- Se reescribió el seed base en [`prisma/seed.ts`](prisma/seed.ts) para incluir:
  - 8 cuentas preconfiguradas
  - 2 brokers
  - 4 FCI
  - 3 movimientos FCI
  - 3 saldos FCI
  - 1 empleado
  - 5 movimientos bancarios
  - 3 cheques recibidos
  - 1 planilla Galicia con 2 cheques emitidos
  - 2 tarjetas prepagas y 5 gastos
  - 2 adelantos a fleteros y 1 descuento de adelanto

## Bloqueo actual

El cliente de Prisma generado en `node_modules` quedó desactualizado respecto del nuevo schema.

Cuando se intentó correr el seed, TypeScript falló porque el cliente actual todavía no expone delegates como `prisma.cuenta`, `prisma.fci`, `prisma.broker`, etc.

Para destrabar el proyecto hace falta regenerar el cliente Prisma con:

- `npx prisma generate`

Ese paso quedó bloqueado porque la ejecución del comando fue rechazada por el flujo de aprobación del entorno.

## Falta hacer exactamente

1. Regenerar Prisma Client.
2. Volver a correr [`prisma/seed.ts`](prisma/seed.ts) y corregir cualquier incompatibilidad residual.
3. Implementar utilidades financieras nuevas con documentación LCC estricta y tests Jest.
4. Implementar CRUDs y endpoints de:
   - `/api/cuentas`
   - `/api/fci`
   - `/api/movimientos-fci`
   - `/api/saldos-fci`
   - `/api/brokers`
   - `/api/empleados`
   - `/api/movimientos-bancarios`
   - `/api/cheques-recibidos`
   - `/api/cheques-emitidos`
   - `/api/cheques-emitidos/registrar-deposito`
   - `/api/planillas-galicia`
   - `/api/planillas-galicia/[id]/generar-excel`
   - `/api/tarjetas-prepagas`
   - `/api/gastos-tarjeta-prepaga`
   - `/api/adelantos-fleteros`
   - `/api/adelanto-descuentos`
5. Agregar generación de Excel Galicia con `exceljs`.
6. Agregar tests Jest para cada función nueva.
7. Ejecutar tests y confirmar cantidad de casos pasando.

## Observación importante

Sin regenerar Prisma Client, cualquier código nuevo que use los modelos financieros desde [`src/lib/prisma.ts`](src/lib/prisma.ts) también va a quedar bloqueado por tipos y, potencialmente, por runtime.
