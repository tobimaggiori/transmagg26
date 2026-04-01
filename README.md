# Transmagg — Sistema de Gestión de Transporte

Sistema de gestión operativa y financiera para una empresa de transporte de cargas. Desarrollado con Next.js 14 App Router, TypeScript, Prisma 7 + LibSQL/SQLite y shadcn/ui.

## Módulos implementados

### Transporte y operaciones
- **Viajes** — CRUD completo con estados de liquidación y facturación independientes, carta de porte obligatoria, cupo, provincias canónicas
- **Fleteros** — CRUD con usuario asociado, condición IVA, gestión de flota (camiones + choferes)
- **Flota propia** — Camiones propios de Transmagg con pólizas de seguro y alertas de vencimiento, asignación de choferes empleados

### Documentos financieros
- **Liquidaciones (LP)** — "Cuenta de Venta y Líquido Producto" con estados, numeración ARCA, asientos IIBB
- **Facturas emitidas** — A empresas clientes, tipos A/B/C/M/X, asientos IVA e IIBB
- **Notas de Crédito/Débito** — NC/ND emitidas y recibidas (4 tipos, 10 subtipos), integradas en CC
- **Facturas de proveedores** — Ítems con alícuota IVA, pago integrado o diferido

### Cobros y pagos
- **Pagos a fleteros** — Multi-liquidación, multi-medio, pago parcial, historial
- **Pagos a proveedores** — 8 tipos de pago, comprobante PDF, efectos secundarios atómicos
- **Cheques** — ECheq emitidos + cartera recibida, endoso, descuento, broker
- **Adelantos a fleteros** — Con descuento automático en liquidaciones

### Contabilidad
- **Cuentas bancarias** — Saldos, FCI, movimientos sin factura, resúmenes bancarios
- **Tarjetas** — Corporativas y prepagas con control de gastos
- **IVA** — Libro IVA Compras/Ventas con exportación PDF/Excel
- **IIBB** — Por provincia y período con exportación
- **Chequeras** — ECheq emitidos y cartera recibida con flujo completo
- **Reportes** — Gastos por concepto, LP vs Facturas, Viajes sin LP, Movimientos

### Configuración
- **ABM** — Alta, baja, modificación de todas las entidades (solo ADMIN_TRANSMAGG)
- **ARCA** — Configuración del emisor, certificado digital, puntos de venta, ambiente (homologación/producción)

### Usuarios y roles
- Autenticación passwordless con OTP por email
- Roles: ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG, FLETERO, CHOFER, ADMIN_EMPRESA, OPERADOR_EMPRESA
- Panel personalizado para CHOFER empleado de Transmagg (solo lectura, sin tarifas)

---

## Setup de desarrollo

### Requisitos
- Node.js 20+
- npm

### Instalación

```bash
npm install
```

### Variables de entorno

Copiar `.env.example` a `.env` y completar:

```bash
cp .env.example .env
```

Las variables mínimas para desarrollo:
- `DATABASE_URL` — ruta al archivo SQLite (por defecto `file:./prisma/dev.db`)
- `NEXTAUTH_SECRET` — clave secreta para NextAuth (cualquier string en desarrollo)
- `NEXTAUTH_URL` — URL base (por defecto `http://localhost:3000`)
- `EMAIL_*` — configuración SMTP (usar Ethereal.email para desarrollo)

Las variables de R2 (Cloudflare) son necesarias para subir/bajar archivos PDF. Sin ellas el sistema funciona pero las funciones de archivos fallan.

### Base de datos y seed

```bash
# Aplicar migraciones
npx prisma migrate dev

# Cargar datos de prueba
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

Usuarios de prueba creados por el seed:
| Email | Rol |
|-------|-----|
| admin@transmagg.com.ar | ADMIN_TRANSMAGG |
| operador@transmagg.com.ar | OPERADOR_TRANSMAGG |
| juan.perez@fletero.com | FLETERO |
| garcia.cargas@fletero.com | FLETERO |
| admin@alimentosdelsur.com.ar | ADMIN_EMPRESA |
| chofer.rodriguez@transmagg.com.ar | CHOFER |

El login usa OTP por email. En desarrollo, el código OTP se loguea en la consola del servidor.

### Desarrollo

```bash
npm run dev
```

### Verificación

```bash
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript
npm test           # Jest (251 tests)
npm run build      # Build de producción
```

---

## Stack técnico

- **Framework**: Next.js 14 App Router (SSR + Server Actions)
- **Lenguaje**: TypeScript strict
- **Base de datos**: SQLite en desarrollo, Turso/LibSQL en producción
- **ORM**: Prisma 7 con adaptador LibSQL
- **UI**: shadcn/ui + Tailwind CSS
- **Autenticación**: NextAuth v5 con OTP personalizado
- **Almacenamiento**: Cloudflare R2 (PDFs y comprobantes)
- **Tests**: Jest con ts-jest
- **Excel**: exceljs
- **Validación**: Zod

---

## Lo que falta

Ver `PENDIENTE.md` para el detalle completo. En resumen:

- **Integración ARCA real**: WSAA (autenticación con certificado), FECAESolicitar (obtención de CAE), QR RG 4291
- **Generación de PDFs**: las liquidaciones y facturas tienen preview en UI pero la generación del archivo PDF no está implementada
- **Deploy a producción**: configurar Turso, dominio, variables de entorno de producción
