# CLAUDE.md — Trans-Magg S.R.L.

Sistema de gestión operativa y financiera para transporte de cargas.
Next.js 14 + TypeScript + Prisma 7 + PostgreSQL + pdfkit.

## Reglas críticas

### Build obligatorio antes de push
SIEMPRE ejecutá `npm run build` antes de `git push`. Si falla, corregí y volvé a buildear. Solo pushear con build exitoso.

### Nunca borrar datos sin confirmar
No ejecutar migraciones destructivas, `DELETE` masivos, ni `git reset --hard` sin confirmación explícita.

### Tests
Correr `npm test` después de cambios en archivos de `src/lib/`. Los tests están en `src/__tests__/`.

### Documentación obligatoria: Reglas fiscales
Antes de tocar CUALQUIER cosa relacionada con comprobantes, emisión ARCA, tipos de comprobante, notas de crédito/débito, o lógica fiscal: LEER `docs/arca-matriz-comprobantes.md` y `docs/README-REGLAS-FISCALES.md`. En caso de duda, prevalece lo que dice esa documentación.

---

## Receta HTDP — Obligatoria para toda función nueva o refactorizada

Toda función relevante debe documentarse y testearse siguiendo estos pasos:

1. **Diseño de datos**: Explicar cómo se representan los datos involucrados.
2. **Signatura y propósito**: Indicar qué recibe, qué devuelve y qué hace.
3. **Ejemplos**: Dar ejemplos concretos de entradas y salidas esperadas.
4. **Implementación**: Definir la función.
5. **Tests**: Escribir tests basados en los ejemplos y ejecutarlos.
6. **Corrección**: Corregir la implementación si los tests fallan.

### Dónde va cada cosa

**En el archivo fuente** (encima de la función):
```typescript
/**
 * nombreFuncion: TipoA TipoB -> TipoResultado
 *
 * Propósito: qué hace la función y por qué.
 *
 * Ejemplos:
 * nombreFuncion(10, 21) => { neto: 10, iva: 2.1, total: 12.1 }
 * nombreFuncion(0, 21) => { neto: 0, iva: 0, total: 0 }
 */
```

**En el archivo de tests** (`src/__tests__/`):
- Tests basados en esos ejemplos
- Casos borde relevantes cuando corresponda

### Regla de calidad final
No cerrar una tarea solo con explicación. Siempre que corresponda: modificar el código real, agregar o actualizar tests, correr verificación final, y reportar cualquier pendiente con honestidad.

---

## Política monetaria — OBLIGATORIA

**Fuente de verdad**: `src/lib/money.ts`. Leer `docs/money-policy.md` antes de tocar dinero.

### Reglas
- **NUNCA** hacer aritmética directa con importes (`a + b`, `a * b`, `Math.round`, `parseFloat`, `reduce` crudo)
- **SIEMPRE** usar helpers de `money.ts`: `sumarImportes`, `restarImportes`, `multiplicarImporte`, `aplicarPorcentaje`, `calcularNetoMasIva`, `formatearMoneda`, etc.
- **NO duplicar** fórmulas de neto/IVA/total/saldo/comisiones entre frontend y backend
- Si una necesidad no está cubierta, primero extender `money.ts`, testear, y recién después usar
- Aplicar receta HTDP a toda función monetaria nueva o modificada

### Orden de implementación para tareas con dinero
1. Extender o reutilizar `src/lib/money.ts`
2. Documentar con HTDP
3. Agregar tests
4. Conectar frontend/backend
5. Verificar patrones prohibidos (`parseFloat(`, `Math.round(`, `.reduce(`, `+ monto`)
6. Correr TypeScript y tests

### Checklist antes de cerrar
- [ ] ¿Usa `money.ts`? ¿Se evitó `parseFloat`/`Math.round`/reduce crudo?
- [ ] ¿No se duplican fórmulas? ¿Frontend y backend usan la misma regla?
- [ ] ¿Se aplicó HTDP? ¿Hay tests?

---

## Arquitectura del proyecto

### Stack
- **Framework**: Next.js 14 App Router (SSR)
- **DB**: Prisma 7 + PostgreSQL
- **Auth**: NextAuth v5 con OTP passwordless
- **UI**: shadcn/ui + Tailwind CSS
- **PDFs**: pdfkit (NO puppeteer, NO headless browser)
- **Storage**: Cloudflare R2 (AWS SDK v3 S3-compatible)
- **Email**: Nodemailer
- **Cálculos monetarios**: decimal.js via `src/lib/money.ts`
- **Validación**: Zod 4

### Estructura de directorios
```
src/
├── app/(dashboard)/    # 22 módulos, 96 páginas
├── app/api/            # 250+ endpoints
├── components/         # 61 componentes (ui/, abm/, forms/, layout/)
├── lib/                # 60+ archivos de lógica de negocio
├── types/              # Tipos compartidos
└── __tests__/          # 20 archivos de test
```

### Flujos canónicos de emisión (NO DUPLICAR)

**Facturas a empresa** — un solo flujo:
- Sidebar → `/empresas/facturas` (hub) → "NUEVA" → `/empresas/facturar` (creación)
- Componente: `src/app/(dashboard)/empresas/facturar/facturar-client.tsx`
- Consulta: `/empresas/facturas/consultar`
- `fechaEmision` viaja desde UI → payload → backend → ARCA
- NO reintroducir pantallas paralelas de facturación (e.g. `/facturas` fue eliminada)

**Liquidaciones a fletero** — un solo flujo:
- Sidebar → `/fleteros/liquidos-productos` (hub) → "EMITIR" → `/fleteros/liquidar` (creación)
- Componente: `src/app/(dashboard)/fleteros/liquidar/liquidar-client.tsx`
- Modal compartido: `src/app/(dashboard)/liquidaciones/_components/modal-preview-liquidacion.tsx`
- Consulta: `/fleteros/liquidaciones`
- `fechaEmision` viaja desde UI (modal preview) → payload → backend → ARCA
- NO reintroducir pantallas paralelas de liquidación (e.g. `/liquidaciones` page fue eliminada)

### Modelos Prisma principales (67 modelos)
- **Operaciones**: Viaje, Liquidacion, FacturaEmitida, NotaCreditoDebito
- **Pagos**: PagoAFletero, PagoDeEmpresa, PagoProveedor, ChequeRecibido, ChequeEmitido
- **Contabilidad**: AsientoIva, AsientoIibb, LibroIva, LibroIIBB, PercepcionImpuesto
- **Config**: ConfiguracionArca (singleton id="unico"), ConfiguracionOtp

---

## Convenciones de código

### API Routes (src/app/api/)
Patrón obligatorio en TODAS las rutas:
1. Auth: `const session = await auth()` + verificar rol
2. Validación: Zod schema con `safeParse()`, retornar 400 si falla
3. Lógica: Prisma queries con `include`/`select` explícitos
4. Errores: try-catch con status codes correctos (401, 403, 404, 409, 422, 500)
5. Response: `NextResponse.json({ ...data })` con status explícito

```typescript
// Ejemplo mínimo
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  // ... lógica
}
```

### Permisos y roles
- `esRolInterno(rol)` → ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG
- `esRolEmpresa(rol)` → ADMIN_EMPRESA, OPERADOR_EMPRESA
- `esRolFletero(rol)` → FLETERO, CHOFER
- **NUNCA** exponer tarifaFletero a roles empresa/chofer
- **NUNCA** exponer tarifaEmpresa a roles fletero/chofer

### Cálculos monetarios (src/lib/money.ts)
**NUNCA hacer aritmética directa con números.** Siempre usar las funciones de money.ts:
- `sumarImportes([a, b, c])` — suma segura
- `multiplicarImporte(importe, factor)` — cantidad x precio
- `aplicarPorcentaje(base, pct)` — comisiones, retenciones
- `calcularNetoMasIva(neto, ivaPct)` → `{ neto, iva, total }`
- `formatearMoneda(monto)` → `"$ 1.234,56"` (formato argentino)
- `parsearImporte(val)` — parsear input de formulario

### Formateo
- **Moneda**: `formatearMoneda()` → `"$ 1.234,56"` (punto miles, coma decimales)
- **Fecha**: `formatearFecha()` → `"DD/MM/AAAA"` (Intl es-AR)
- **CUIT**: `formatearCuit()` → `"XX-XXXXXXXX-X"`

### Componentes frontend
- `page.tsx` = Server component (auth + fetch datos estáticos)
- `*-client.tsx` = Client component con `"use client"` (state, fetches, interactividad)
- State management: solo React hooks (NO Redux/Zustand)
- Fetch: `fetch()` directo a API routes, no SWR/React Query

---

## PDFs — Reglas obligatorias

### Generacion
- **SIEMPRE usar pdfkit** (import pdfkit). NUNCA HTML-to-PDF, NUNCA puppeteer.
- Los generators estan en `src/lib/pdf-*.ts` y exportan funciones que retornan `Promise<Buffer>`.
- Datos del emisor: siempre usar `obtenerDatosEmisor()` de `src/lib/pdf-common.ts`.
- Formato moneda en PDFs: punto para miles, coma para decimales (formato argentino).

### Diseno de comprobantes fiscales (facturas, liquidaciones, notas CD)
Todos los comprobantes fiscales deben seguir el diseno oficial ARCA:

**ENCABEZADO** (3 columnas con borde rectangular negro y lineas verticales separadoras):
- **Izquierda**: Logo (desde ConfiguracionArca.logoComprobanteB64), razon social bold, domicilio, "Condicion IVA: Responsable Inscripto"
- **Centro**: Letra grande (A/B/C) en recuadro 40x40 + "Codigo XXX"
- **Derecha**: Tipo comprobante bold, "Punto de Venta: PPPP Comp. Nro: NNNNNNNN", fecha, CUIT, IIBB, fecha inicio actividades

**TOTALES**: Alineados a la derecha en recuadro negro. Formato montos argentino.

**PIE** (anclado al fondo de pagina A4):
- Izquierda: QR fiscal (65x65)
- Al lado del QR: Logo ARCA (desde ConfiguracionArca.logoArcaB64) + "Comprobante Autorizado" italica
- Centro: "Pag. 1/1"
- Derecha: "CAE N: XXXX" y "Fecha de Vto. de CAE: DD/MM/AAAA"
- **SIN** "Esta agencia no se responsabiliza...", **SIN** "Firma/Sello"

**Estilo**: Lineas NEGRAS (no azules). Sin filas alternadas. A4 imprimible (margenes 15mm = 42.52pt).

### Storage R2
- Los PDFs se suben a R2 con `subirPDF(buffer, prefijo, nombre)` de `src/lib/storage.ts`.
- Key format: `{prefijo}/YYYY/MM/{UUID}.pdf`
- Prefijos validos (tipo `StoragePrefijo`): liquidaciones, facturas-emitidas, facturas-proveedor, comprobantes-pago-proveedor, comprobantes-pago-fletero, resumenes-bancarios, resumenes-tarjeta, cartas-de-porte, polizas, recibos-cobranza, comprobantes-impuestos, comprobantes-infracciones, libros-iva, libros-iibb, libros-percepciones, cierres-resumen
- La key se guarda en el campo `pdfS3Key` del modelo correspondiente.
- **SIEMPRE** subir a R2 despues de generar un PDF fiscal. El campo `pdfS3Key` debe quedar seteado.

### Endpoints de PDF
Los endpoints `GET /api/{tipo}/[id]/pdf` deben:
1. Generar el PDF con pdfkit (llamando a `generarPDF*()`)
2. Servir directamente como `application/pdf` con `Content-Disposition: inline`
3. **NUNCA** retornar JSON con URL. **NUNCA** retornar HTML como fallback.
4. Si R2 tiene el PDF cacheado, servir desde R2. Si no, regenerar con pdfkit.

### Visor de PDF
Existe una pagina visor en `/comprobantes/visor?tipo=factura&id=xxx` que muestra el PDF inline con botones de volver, imprimir, enviar email, y descargar. Los botones "Ver PDF" deben navegar a esta pagina, NO `window.open()`.

---

## ARCA (integracion fiscal)

### Archivos
- `src/lib/arca/service.ts` — Autorizacion (autorizarFacturaArca, autorizarLiquidacionArca, autorizarNotaCDArca)
- `src/lib/arca/errors.ts` — Errores tipados con code, statusCode, retryable
- `src/lib/arca/config.ts` — Carga ConfiguracionArca singleton
- `src/lib/arca/wsaa.ts` — Autenticacion WSAA
- `src/lib/arca/wsfev1.ts` — Llamadas a WSFEv1

### Flujo de emision
1. `emision-directa.ts` orquesta: crear comprobante → autorizar en ARCA → generar PDF
2. Si ARCA falla con error **reintentable** (WsaaError, Wsfev1Error): el comprobante se CONSERVA con `estadoArca="PENDIENTE"`, NO se borra
3. Si ARCA falla con error **no reintentable** (rechazo, validacion, config): se REVIERTE todo
4. Los errores se clasifican con `clasificarError()` en emision-directa.ts, retornando `{ status, error, code, reintentable }`
5. service.ts tiene retry automatico con backoff (2s, 4s) para microcortes

### Reintentar ARCA
- Endpoints: `POST /api/facturas/[id]/autorizar-arca`, `/api/liquidaciones/[id]/autorizar-arca`, `/api/notas-credito-debito/[id]/autorizar-arca`
- Solo para comprobantes con `estadoArca` = PENDIENTE o RECHAZADA
- En el frontend, los comprobantes pendientes muestran badge amarillo + boton "Reintentar"

### Estados ARCA
- `PENDIENTE` — creado, sin autorizar (puede reintentar)
- `EN_PROCESO` — lock atomico tomado, autorizando
- `AUTORIZADA` — CAE obtenido exitosamente
- `RECHAZADA` — ARCA rechazo el comprobante

---

## Contabilidad → Comprobantes R2

### Exportacion de PDFs
Desde `/contabilidad/comprobantes` se pueden listar, exportar (ZIP) y eliminar PDFs de R2 por tipo y rango de fecha. Usa `src/lib/comprobantes-queries.ts`.

- `GET /api/contabilidad/comprobantes?tipo=X&desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
- `POST /api/contabilidad/comprobantes/exportar` → ZIP con PDFs del rango

### Cuando se cree un nuevo tipo de comprobante con PDF
1. Agregar un generator `src/lib/pdf-{tipo}.ts` que retorne `Promise<Buffer>`
2. Subir a R2 con `subirPDF(buffer, prefijo)` y guardar key en `pdfS3Key`
3. Crear endpoint `GET /api/{tipo}/[id]/pdf` que sirva el PDF
4. Agregar el tipo a `comprobantes-queries.ts` para que aparezca en exportacion
5. Crear endpoint `POST /api/{tipo}/[id]/enviar-email` si aplica

---

## Email

### Patron de envio
- Usar `enviarEmail()` de `src/lib/email.ts`
- Retorna `{ ok: boolean; error?: string }` — NUNCA throws
- Para adjuntar PDF: generar buffer con pdfkit, pasar en `adjuntos`
- Los endpoints de email estan en `src/app/api/{tipo}/[id]/enviar-email/route.ts`

---

## Archivos clave (referencia rapida)

| Archivo | Proposito |
|---------|-----------|
| `src/lib/money.ts` | Calculos monetarios (decimal.js) — fuente de verdad |
| `src/lib/permissions.ts` | RBAC, roles, permisos por seccion |
| `src/lib/prisma.ts` | Singleton Prisma con conversion Decimal→number |
| `src/lib/storage.ts` | R2 upload/download/list/delete |
| `src/lib/email.ts` | Envio de emails con Nodemailer |
| `src/lib/pdf-common.ts` | Datos del emisor, logos |
| `src/lib/emision-directa.ts` | Orquestador de emision ARCA |
| `src/lib/arca/service.ts` | Autorizacion ARCA (CAE) |
| `src/lib/arca/errors.ts` | Errores tipados ARCA |
| `src/lib/viaje-workflow.ts` | Maquina de estados de viajes |
| `src/lib/comprobantes-queries.ts` | Queries para exportacion de comprobantes R2 |
| `src/types/index.ts` | Tipos y constantes compartidos |

## Documentacion detallada (docs/)

| Documento | Cuando leer |
|-----------|-------------|
| `docs/money-policy.md` | Antes de tocar CUALQUIER importe monetario |
| `docs/AGENTS.md` | Reglas generales del proyecto y receta HTDP |
| `docs/arca-matriz-comprobantes.md` | Antes de tocar comprobantes/emision fiscal |
| `docs/README-REGLAS-FISCALES.md` | Referencia rapida reglas fiscales |
| `docs/arca-configuracion-y-validaciones.md` | Antes de modificar config ARCA o validaciones |
| `docs/arca-invariantes-y-tests.md` | Invariantes que deben cumplirse en ARCA |
| `docs/facturacion-empresa.md` | Logica de negocio del circuito de facturacion |
| `docs/liquidacion-fletero.md` | Logica de negocio del circuito de liquidacion |
| `docs/invariantes-y-tests.md` | Invariantes generales y escenarios de test |

## Sistema viejo (referencia de logica de negocio)

La carpeta `sistemaviejo/` contiene el codigo fuente del sistema anterior (Visual Basic 6) y documentacion extraida de su logica de negocio. **Cuando se mencione "sistema viejo", "comparar con el viejo", o se necesite entender la logica de negocio original, leer los `.md` de esa carpeta — NO leer los `.frm`/`.bas` directamente.**

| Documento | Contenido |
|-----------|-----------|
| `sistemaviejo/viajes.md` | Viajes: campos, ciclo de vida, doble tarifa con un solo campo |
| `sistemaviejo/liquidaciones-fleteros.md` | Liquidaciones: 3 pasos, comisiones, comprobante tipo 60 |
| `sistemaviejo/facturacion-empresas.md` | Facturacion a empresas: 4 formularios, integracion AFIP |
| `sistemaviejo/nc-nd.md` | Notas de credito y debito: emision, impacto en cta cte e IVA |
| `sistemaviejo/tipos-comprobante.md` | Mapeo codigos internos vs codigos AFIP |
| `sistemaviejo/recibos-cobranza.md` | Recibos: medios de pago, aplicacion contra facturas |
| `sistemaviejo/ordenes-de-pago.md` | Ordenes de pago: 6 medios de pago, descuento de adelantos |
| `sistemaviejo/cuentas-corrientes.md` | Cuentas corrientes: empresas (invertida vs fleteros), SaldoComp, aplicacion |
| `sistemaviejo/adelantos.md` | Adelantos: 4 tipos, ciclo de vida, mecanismo de descuento |
| `sistemaviejo/cheques.md` | Cheques propios y terceros: estados, transiciones, mutuos |

## Regla para desarrollo asistido por IA

Instruccion reutilizable para prompts:

> Si la tarea toca importes monetarios, usar exclusivamente los helpers de `src/lib/money.ts`. No introducir calculos monetarios inline. Aplicar la receta de HTDP, agregar tests y verificar al final que no queden patrones monetarios crudos.
>
> Si la tarea toca comprobantes o emision fiscal, leer primero `docs/arca-matriz-comprobantes.md`.
>
> Toda funcion nueva debe tener: signatura, proposito, ejemplos (en el codigo fuente) y tests (en `src/__tests__/`).
