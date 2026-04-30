# Sistema "Javier Maggiori" (JM)

> ⚠️ **Principio fundamental**: JM y Transmagg son **dos sistemas independientes**.
> Lo único que comparten es la **autenticación** (mismos usuarios y roles internos
> de Transmagg pueden entrar a `/jm`). Todo lo demás — base de datos, schema,
> entidades, lógica de negocio, UI, código — es separado y debe permanecer así.

## Regla maestra: JM = Transmagg − Fletero

JM es un clon completo de Transmagg eliminando **todo lo que tenga que ver con la
identidad Fletero**. El producto está pensado como sistema de gestión para una
empresa transportista con flota propia (lo que en Transmagg sería un fletero del
sistema Maggiori — pero acá es **el dueño** del sistema, no un proveedor de él).

**NO existe en JM:**
- Sección "Fleteros" (todo el menú).
- Liquidaciones / Líquidos Productos (LP).
- Gastos y adelantos a fleteros.
- Cuentas corrientes con fleteros.
- Viajes con fletero externo (todos los viajes son propios).
- Notas de crédito/débito sobre LP.
- Permisos `fleteros.*` (los suprimimos del rol).

**SÍ existe en JM (igual que Transmagg, adaptado):**
- Dashboard.
- Viajes (solo propios).
- Empresas (Facturar, Facturas, NC/ND, Recibos por cobranza, CC empresas).
- Proveedores (Facturas, Aseguradoras, Pagos, CC proveedores).
- Contabilidad (Chequeras, Cuentas y tarjetas, FCI, Impuestos, Reportes).
- Mi Flota (camiones propios + pólizas + infracciones).
- ABM (Empresas, Empleados, Cuentas, Proveedores, Usuarios, FCI).
- Configuración (ARCA, Envío, Permisos).
- Integración ARCA (CUIT y certificado propios de JM).

Cuando se porte una feature de Transmagg a JM, se mantiene **misma lógica, misma
UI**, eliminando cualquier campo, columna, ruta, componente o validación que
mencione Fletero.

## Decisiones por defecto cuando hay ambigüedad

Estas decisiones fueron tomadas autónomamente al diseñar JM. Si el usuario las
contradice, prevalece su criterio.

- **ARCA**: JM tiene su propia configuración (CUIT, certificado, puntos de venta,
  comprobantes habilitados). Modelo `ConfiguracionArca` clonado en `prisma-jm`.
  No comparte nada con la config de Transmagg.
- **Numeración de comprobantes**: arranca en 1 por (tipoCbte, ptoVenta).
  Transmagg lo coordina con el último autorizado por ARCA — JM hace lo mismo.
- **Cuentas, bancos, cheques, movimientos bancarios**: portados completos.
  El libro de banco aplica a JM como a cualquier empresa.
- **IIBB / IVA / Percepciones**: portados completos. Asientos por viaje en
  factura emitida; libros generables.
- **NC/ND**: tanto emitidas (sobre facturas propias) como recibidas (de
  proveedores). No hay NC/ND sobre LP porque no hay LP.
- **Email**: provider Resend del sistema (no SMTP por usuario en la primera
  versión). Se puede sumar después.
- **Branding/logo**: en `ConfiguracionArca` JM (`logoComprobanteB64`,
  `logoArcaB64`).
- **Roles**: solo entran roles internos de Transmagg (ADMIN_TRANSMAGG,
  OPERADOR_TRANSMAGG). No hay rol "empresa" ni "fletero" en JM.
- **R2 Storage**: mismo bucket, prefijos namespaced con `jm/` para no mezclar
  con Transmagg en el bucket (ej: `jm/facturas-emitidas`, `jm/recibos-cobranza`).
- **Helpers neutros reutilizables**: `@/lib/money`, `@/lib/storage`,
  `@/lib/auth`, `@/lib/permissions`, `@/lib/provincias`, `@/lib/date-local`,
  `@/lib/utils`, `@/lib/use-case-result`, `@/lib/email`, `@/lib/fecha-emision`,
  `@/lib/pdf-merge`, `@/lib/pdf-common` (si no toca Prisma directo).
- **Helpers que se duplican** (porque tocan Prisma): commands de negocio
  (`factura-commands`, `recibo-cobranza-commands`, `nota-cd-commands`, etc.),
  queries (`viaje-queries`, `comprobantes-queries`, `cuenta-corriente`),
  PDFs que leen DB (`pdf-factura`, `pdf-recibo-cobranza`, etc.).

## Qué se comparte (lo único)

- **Auth/usuarios**: la sesión NextAuth y la tabla `usuarios` de Transmagg.
  Roles `ADMIN_TRANSMAGG` y `OPERADOR_TRANSMAGG` tienen acceso a `/jm`.
- **R2 storage** (bucket único): mismos prefijos (`remitos`, `ctg`); colisión
  imposible porque los archivos se nombran con UUID.

**Nada más.** Si te encontrás importando algo de Transmagg en JM (o viceversa),
parar y revisar — probablemente está mal salvo que sea genuinamente compartido
(auth helper, lib utilitaria sin estado de negocio, UI primitiva tipo botón).

## Qué NO se comparte

- **Base de datos**: postgres `javiermaggiori` (env `JM_DATABASE_URL`).
  Las tablas viven en otra DB físicamente separada — no hay FKs cruzadas.
- **Schema Prisma**: `prisma-jm/schema.prisma`. Migraciones en
  `prisma-jm/migrations/`.
- **Cliente Prisma**: `src/lib/prisma-jm.ts` (`prismaJm`), generado en
  `node_modules/.prisma/jm-client`. **Nunca usar `prisma` (el de Transmagg) en
  código JM, ni `prismaJm` en código Transmagg**.
- **Entidades de negocio**: aunque se llamen igual (Empresa, Camion, Empleado,
  Viaje), son tablas distintas en bases distintas, con esquemas que pueden
  divergir. No reutilizar tipos de Transmagg en JM.
- **Lógica de negocio**: queries, validaciones, schemas Zod, helpers — todo
  separado en `src/lib/jm/...`.
- **API routes**: `/api/jm/...` para JM, `/api/...` (sin prefijo) para Transmagg.
- **Pages**: `src/app/(jm)/...` para JM, `src/app/(dashboard)/...` para Transmagg.
- **Componentes**: `src/components/jm/...`. No reusar componentes de Transmagg
  que tengan lógica de negocio. Solo se pueden reusar primitivas neutras
  (`SearchCombobox`, `FormError`, `UploadPDF`, `ActionCard`, etc.).
- **Theming**: clase `theme-jm` en `globals.css` aplica colores propios
  (negro/blanco) al shell JM para que el operador vea visualmente en qué
  sistema está.

## Modelo de datos JM

Modelo simplificado vs. Transmagg:
- Solo viajes propios — **no hay fleteros** (todos los camiones y choferes
  son propios).
- **Sin liquidaciones** ni facturación todavía (se sumará después).
- Operador del viaje se guarda como `operadorEmail` (string), **no como FK** —
  porque los usuarios viven en la DB de Transmagg.

Tablas: `empresas`, `camiones`, `empleados`, `viajes`. Ver
[`prisma-jm/schema.prisma`](../../prisma-jm/schema.prisma).

## Mapa de archivos JM

```
prisma-jm/
├── schema.prisma                 Schema independiente
└── migrations/                   Migraciones independientes

src/
├── app/
│   ├── (jm)/                     Layout y pages JM (Next.js requiere src/app/)
│   │   ├── layout.tsx            Gateado a roles internos de Transmagg
│   │   └── jm/
│   │       └── viajes/...
│   └── api/jm/...                API routes JM (Next.js requiere src/app/api/)
└── jm/                           Todo el código JM no-routing
    ├── components/               (jm-shell, jm-sidebar, etc.)
    ├── lib/                      Queries, helpers de negocio
    ├── prisma.ts                 Cliente Prisma JM (`prismaJm`)
    └── theme.css                 Override de variables CSS (theme-jm)
```

> Nota: `src/app/(jm)/...` y `src/app/api/jm/...` están bajo `src/app/` porque
> es donde Next.js descubre routes/pages — no se pueden mover. El resto del
> código JM vive consolidado en `src/jm/`.

## Garantía de aislamiento (ESLint)

`.eslintrc.json` tiene reglas que **prohíben imports cruzados**:
- Código JM (`src/jm/**`, `src/app/(jm)/**`, `src/app/api/jm/**`) **no puede**
  importar `@/lib/prisma` (el cliente de Transmagg). Tiene que usar `@/jm/prisma`.
- Código Transmagg **no puede** importar nada de `@/jm/*`.

Las primitivas neutras (`@/components/ui/*`, helpers de auth, money, fecha,
provincias) siguen siendo libres. La idea es prevenir cruces de lógica de
negocio o cliente Prisma cruzado, no ahogar a quien escribe código.

## Theming

Para que el operador vea visualmente en qué sistema está, JM aplica la clase
`theme-jm` en su shell raíz (`src/components/jm/jm-shell.tsx`).

`theme-jm` (definida en `src/app/globals.css`) sobreescribe variables CSS:
- `--primary` → negro (botones primarios).
- `--sidebar` → casi negro (menú lateral).
- `--ring` → negro (foco).
- Hovers/highlights del sidebar en grises.

El resto del tema (background, foreground, success, warning, error, etc.) se
hereda sin cambios. Ajustar dentro de `.theme-jm` si querés cambiar el tono;
está scopeado y no afecta a Transmagg.

## Comandos útiles

```bash
# Migrar JM (crear nueva migración + aplicar)
npm run db:migrate:jm -- --name <nombre>

# Generar solo el cliente JM
npm run db:generate:jm

# Abrir Prisma Studio contra JM
npx prisma studio --config prisma-jm.config.ts

# Aplicar migración no-interactiva (cuando hay warnings que bloquean migrate dev)
npx prisma migrate diff --from-config-datasource --to-schema prisma-jm/schema.prisma --config prisma-jm.config.ts --script -o prisma-jm/migrations/<timestamp>_<name>/migration.sql
npx prisma migrate deploy --config prisma-jm.config.ts
npx prisma generate --config prisma-jm.config.ts
```

## Estado actual del port (2026-04-30)

### ✅ Hecho

- **Schema completo** (`prisma-jm/schema.prisma`): 32 modelos (todo Transmagg
  menos lo de Fletero/LP/gastos-adelantos/órdenes-pago).
- **Migración inicial aplicada** (`20260430010000_add_full_modules`).
- **Estructura `src/jm/`** consolidada: `components/`, `lib/`, `prisma.ts`,
  `theme.css`. ESLint bloquea cruces de `prisma` entre tenants.
- **Sidebar JM** con grupos colapsables (Dashboard, Viajes, Empresas,
  Proveedores, Contabilidad, ABM, Mi Flota, Configuración), idéntico al
  de Transmagg menos Fleteros.
- **Theme JM**: variables CSS negro/blanco scopeadas con `.theme-jm`.
- **Storage prefijos JM**: `jm/facturas-emitidas`, `jm/recibos-cobranza`,
  etc. en `src/lib/storage.ts`.
- **Viajes** completo: nuevo, consultar, modal detalle (sin fletero).
- **ABMs funcionales**:
  - **Empresas**: CRUD completo, sin BotonBuscarPadron ni ContactosEmail
    (TODO).
  - **Empleados**: CRUD completo, con email (sin usuarioId — auth en Transmagg).
  - **Camiones / Mi Flota**: CRUD básico (sin pólizas ni infracciones aún).
  - **Proveedores**: CRUD completo, con tipo GENERAL/ASEGURADORA.
  - **Cuentas + Bancos + Billeteras + Brokers**: CRUD con tabs
    (sin libro de banco / conciliación / cierre mensual).
  - **FCI**: CRUD básico (sin movimientos ni saldos aún).
- **Configuración ARCA**: form mínimo (CUIT, razón social, modo, JSON
  de puntos de venta y comprobantes habilitados). Sin upload de
  certificado ni tester WSAA — TODO.
- **Empresas/Facturar**: emisión funcional sin ARCA (numeración
  interna correlativa por tipoCbte/ptoVenta). Calcula IVA + total,
  crea snapshots ViajeEnFactura, asientos IVA y IIBB, marca viajes
  como FACTURADO. Sin PDF (TODO) ni autorización ARCA (TODO).
- **Empresas/Facturas/consultar**: listado básico con filtros
  (empresa, fecha, estado cobro).
- **Pages portadas (landings con `ActionCard`)**:
  - `/jm/empresas/facturas`, `/jm/empresas/recibos`
  - `/jm/abm/base-de-datos`, `/jm/abm/contabilidad`
  - `/jm/contabilidad/cuentas`, `/jm/contabilidad/impuestos`,
    `/jm/contabilidad/reportes`
  - `/jm/aseguradoras/facturas`, `/jm/proveedores/facturas`
- **Redirects**: `/jm/empresas` → `/jm/abm/empresas`;
  `/jm/proveedores` → `/jm/abm/proveedores`.

### Estado de las secciones (2026-04-30 — segunda iteración)

**Empresas — completo funcional**
- ✅ Facturar (emisión funcional sin ARCA, numeración interna)
- ✅ Facturas/consultar (filtros y listado)
- ✅ Facturas/[id]/notas (NC/ND emisión + listado, sin ARCA)
- ✅ Recibos/nuevo (multi-step con facturas, NCs, retenciones, medios pago)
- ✅ Recibos/consultar (listado con filtros)
- ✅ CC empresas (movimientos cronológicos con saldo corrido)

**Proveedores — completo funcional**
- ✅ Factura (ingresar) — form con neto, IVA, percepciones, asiento IVA Compra
- ✅ Facturas/consultar (filtros, saldo pendiente)
- ✅ Pago (registrar) — selector factura + medios
- ✅ CC proveedores (movimientos)

**Aseguradoras — completo funcional**
- ✅ Facturas/nueva (con período de vigencia, contado/cuotas)
- ✅ Facturas/consultar

**Contabilidad — listados funcionales**
- ✅ Chequeras (recibidos + emitidos en tabs)
- ✅ Cuentas y Tarjetas → Libro de cuentas (movimientos por cuenta con saldo
  corrido), Conciliación tarjetas (resúmenes)
- ✅ FCI (listado de fondos con saldo)
- ✅ Impuestos/nuevo + consultar
- ✅ Reportes:
  - Libro IVA (ventas + compras + saldo)
  - Libro IIBB (resumen por provincia)
  - Libro Percepciones (resumen por tipo)
  - Libro de Gastos (proveedor + seguro + impuestos consolidados)
  - Notas C/D (listado completo)
  - Comprobantes (resumen R2)

**ABM — completo funcional**
- ✅ Empresas (sin BotonBuscarPadron — TODO ARCA padrón)
- ✅ Empleados (con email)
- ✅ Camiones / Mi Flota
- ✅ Proveedores
- ✅ Cuentas + Bancos + Billeteras + Brokers (con tabs)
- ✅ FCI

**Configuración**
- ✅ ARCA (form mínimo — sin upload .p12 ni tester WSAA)
- ✅ Envío (reply-to)

**Viajes**
- ✅ Nuevo, Consultar, Modal detalle (sin fletero)

### ⏳ Lo que aún queda pendiente

Estos items están registrados pero la UI base ya funciona sin ellos:

1. **Generación de PDFs**: factura (`src/jm/lib/pdf-factura.ts`),
   recibo, nota CD, CC empresa/proveedor. Hoy las facturas emitidas
   son solo registros internos sin PDF descargable.

2. **Integración ARCA real**: WSAA + WSFEv1 para autorización fiscal.
   Hoy todo va con `estadoArca = PENDIENTE` y numeración interna. Para
   activar: completar ConfiguracionArca con CUIT/cert/password reales,
   y sumar el flow de autorización.

3. **Email**: envío de facturas/recibos/NC vía Resend. La librería
   `@/lib/email` lee de Prisma de Transmagg → habrá que portar/refactorizar.

4. **Mi Flota — extender**: pólizas + infracciones (hoy solo CRUD camiones).

5. **Cuentas — extender**: conciliación de día, cierre mensual, libro de
   tarjeta detallado, alta de cheques sueltos (hoy se crean indirectamente
   vía recibos / pagos).

6. **FCI — extender**: alta de movimientos (suscripción/rescate) y de
   saldos informados con rendimiento.

7. **Tarjetas** (UI ABM completo) y **Tarjetas Prepagas** + Gastos: tablas
   listas, falta UI.

8. **Contactos email**: subsección expandible en Empresas/Proveedores.

9. **Carga de comprobantes (PDFs) en formularios**: hoy los formularios
   de facturas/proveedor/seguro no tienen UploadPDF — TODO sumar.

10. **Padrón ARCA lookup** en alta de Empresa/Proveedor: requiere
    integración con servicio Padrón.

11. **NotaCDForm/NotaCDPDF para facturas proveedor**: hoy la UI de
    NC/ND está solo del lado emisión sobre factura empresa.

12. **Tests automatizados** del lado JM (commands de factura, recibo, NC).

### Para continuar el port

- Convención de nombres: clases idénticas al original con sufijo `Jm`
  (`EmpresasAbmJm`, `FacturarJmClient`, etc.).
- Convención de paths: `/api/jm/<recurso>`, `src/jm/components/<x>`,
  `src/jm/lib/<x>`.
- Auth/permisos: con `esRolInterno(rol)` (no chequear permisos granulares
  porque JM no tiene una tabla de permisos propia — todos los roles
  internos de Transmagg ven todo en JM).
- Storage: usar prefijos `jm/*`.
- ARCA: hasta que `ConfiguracionArca` JM tenga datos válidos, marcar
  `estadoArca = "PENDIENTE"` y dejar autorización para después.

## Reglas para agentes IA

1. **No mezclar imports**: si estás en código JM, importás de `@/lib/jm/...`,
   `@/components/jm/...`, `prismaJm`. Si estás en código Transmagg, importás
   de `@/lib/...`, `@/components/...`, `prisma`. Cualquier cruce es bug.
2. **No copiar lógica de negocio "porque es igual"**: aunque la UI o el flujo
   sean parecidos, son sistemas distintos. Duplicar es la respuesta correcta —
   los sistemas pueden divergir y queremos esa libertad.
3. **No crear FKs cruzadas entre las DBs**. Si necesitás referenciar un usuario
   de Transmagg desde JM, guardá email o id como string sin FK.
4. **Antes de tocar JM**, asegurate de que el schema vigente está aplicado
   (`npm run db:migrate:jm`).
