# Trans-Magg

Sistema de gestión operativa y financiera para empresa de transporte de cargas.

Stack: **Next.js 14 (App Router) + TypeScript + Prisma 7 + PostgreSQL +
NextAuth v5 + shadcn/ui + Tailwind**. Storage en **Cloudflare R2**, PDFs con
**pdfkit + pdf-lib**, integración fiscal con **ARCA** (WSAA + WSFEv1).

## Setup

### Requisitos
- Node 20+
- PostgreSQL local o accesible
- npm

### Instalación

```bash
npm install
cp .env.example .env   # completar variables
npx prisma db push     # aplicar schema
npm run db:seed        # cargar datos de prueba
```

### Variables de entorno mínimas

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | PostgreSQL (`postgresql://user:pass@host:port/db`) |
| `NEXTAUTH_SECRET` | Secret de NextAuth (cualquier string en dev) |
| `NEXTAUTH_URL` | URL base de la app (default `http://localhost:3000`) |
| `EMAIL_*` | SMTP para envío de OTP (Ethereal en dev, real en prod) |
| `R2_*` | Cloudflare R2 (account, bucket, credentials) — sin esto las funciones de archivos fallan |
| `ENCRYPTION_KEY` | Encripta certificado ARCA y firma tokens internos |

### Comandos

```bash
npm run dev            # dev server con hot reload
npm run build          # build de producción (corre prisma generate)
npm test               # Jest suite completa
npm run lint           # ESLint
npm run db:push        # aplica cambios de schema
npm run db:migrate     # genera migración (dev)
npm run db:studio      # Prisma Studio
npm run db:seed        # carga datos de prueba
```

### Usuarios de prueba (seed)

| Email | Rol |
|---|---|
| `admin@transmagg.com.ar` | ADMIN_TRANSMAGG |
| `operador@transmagg.com.ar` | OPERADOR_TRANSMAGG |
| `juan.perez@fletero.com` | FLETERO |
| `admin@alimentosdelsur.com.ar` | ADMIN_EMPRESA |
| `chofer.rodriguez@transmagg.com.ar` | CHOFER (empleado) |

Login: ingresá email en `/login`, recibís OTP por email (en dev se loguea en
consola si no hay SMTP).

### Producción (PM2)

App corre con PM2 (`ecosystem.config.js`). Tras cambiar código:

```bash
npm run build && pm2 reload transmagg
```

Después de rebuild + reload, hacer **hard refresh en el navegador**
(Ctrl+Shift+R) para que descargue el bundle JS nuevo. Sin eso aparecen
errores de Server Actions desconocidas.

## Documentación

Toda la documentación vive en [`docs/`](./docs/). Empezá por
[`docs/README.md`](./docs/README.md) para el índice y guía de lectura.

Para agentes IA: leer primero [`CLAUDE.md`](./CLAUDE.md).

## Estado actual

### Implementado
- Operaciones: viajes, fleteros, flota propia, choferes, panel chofer
- Documentos fiscales: facturas A/B/C, liquidaciones (LP), notas C/D, todo
  con integración ARCA real (WSAA, FECAESolicitar, CAE, QR fiscal)
- Cobros y pagos: pagos a fleteros (multi-LP, multi-medio), pagos a
  proveedores, recibos de cobranza, cheques (propios y tercero), adelantos a
  fleteros (incluye cheque propio/tercero como adelanto)
- Órdenes de pago: aplicaciones (NC, gastos, adelantos), distribución
  oldest-first entre LPs, PDF con merge de comprobantes adjuntos, cache R2
- Cuenta corriente con modelo unificado (saldoPendiente y crédito disponible)
- Contabilidad: libros IVA, IIBB, percepciones; movimientos sin factura;
  exportación PDF/Excel
- Tarjetas (corporativas y prepagas), chequeras (cartera propia y tercero),
  planillas Galicia
- ABM completo, configuración ARCA, RBAC con 6 roles
- 49 test suites, ~1030 tests verdes

### En curso / próximo
- Documentación de features pendientes (tarjetas, flota, panel chofer,
  contabilidad, chequeras): scope definido pero sin doc dedicado todavía.
  Ver [`docs/INCONSISTENCIAS-DETECTADAS.md`](./docs/INCONSISTENCIAS-DETECTADAS.md).
- ARCA para viajes propios: punto de venta diferenciado.
- Conciliación bancaria automática.
- Deploy productivo (configuración de dominio, secrets, monitoreo).
