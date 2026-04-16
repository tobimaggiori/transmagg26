# Stack y arquitectura general

## Tecnologías

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, server components, route handlers |
| Lenguaje | TypeScript | Strict mode |
| DB | PostgreSQL | Adapter `@prisma/adapter-pg` |
| ORM | Prisma 7 | Singleton en `src/lib/prisma.ts` con extension Decimal→number |
| Auth | NextAuth v5 (beta) | OTP numérico passwordless por email |
| UI | shadcn/ui + Tailwind | Componentes en `src/components/ui/` |
| Storage | Cloudflare R2 (S3 API) | Ver [storage-r2.md](./storage-r2.md) |
| PDFs | pdfkit + pdf-lib | Ver [pdfs.md](./pdfs.md). NUNCA puppeteer ni HTML-to-PDF |
| Email | Nodemailer | SMTP por usuario o config global |
| Cálculos monetarios | decimal.js | Vía [`money.ts`](../politicas/money.md) |
| Validación | Zod 4 | Schemas en `src/lib/financial-schemas.ts` y por feature |
| Tests | Jest + ts-jest | Suite completa con `npm test` |
| Process manager | PM2 | App `transmagg`, ver `ecosystem.config.js` |

## Estructura de directorios

```
src/
├── app/(dashboard)/    # Páginas internas (auth requerida)
├── app/(auth)/         # Login y verify OTP
├── app/api/            # API routes (route.ts handlers)
├── components/         # ui/, abm/, forms/, layout/
├── lib/                # Lógica de negocio, helpers, integraciones
├── types/              # Tipos compartidos
└── __tests__/          # Suite de tests Jest

prisma/
├── schema.prisma       # Source of truth del modelo de datos
└── seed.ts             # Datos de prueba

docs/                   # Documentación del proyecto (este árbol)
sistemaviejo/           # Contexto histórico VB6 (no tocar)
```

## Patrones obligatorios

### API routes (`src/app/api/`)

Toda ruta sigue este orden:

1. **Auth**: `const session = await auth()` + verificar rol con
   [`permissions.ts`](./auth-rbac.md).
2. **Validación**: Zod schema con `safeParse()`, retornar 400 si falla.
3. **Lógica**: extraer a un comando en `src/lib/<feature>-commands.ts` si tiene
   transacción o lógica no trivial.
4. **Errores**: try-catch con status correctos (401, 403, 404, 409, 422, 500).
5. **Response**: `NextResponse.json({ ... })` con status explícito.

```typescript
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await req.json()
  const parsed = miSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  try {
    const result = await ejecutarComando(parsed.data, operadorId)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
```

### Componentes frontend

- `page.tsx` = **server component**. Auth, fetch de datos estáticos, delega a un
  client component.
- `<feature>-client.tsx` = **client component** con `"use client"`. State,
  fetches dinámicos, interactividad.
- State: solo React hooks. No Redux, no Zustand.
- Fetch: `fetch()` directo a API routes. No SWR, no React Query.

### Convenciones de nombres

- **Modelos Prisma**: PascalCase singular (`Liquidacion`, `OrdenPago`).
- **Comandos**: `ejecutar<Accion><Entidad>` (`ejecutarCrearOrdenPago`).
- **Helpers monetarios**: verbo en infinitivo (`sumarImportes`, `aplicarPorcentaje`).
- **Endpoints**: kebab-case en path, plural cuando lista (`/api/ordenes-pago`).

### Formato

| Tipo | Helper | Salida |
|---|---|---|
| Moneda | `formatearMoneda(n)` | `"$ 1.234,56"` |
| Fecha | `formatearFecha(d)` | `"DD/MM/AAAA"` |
| CUIT | `formatearCuit(c)` | `"XX-XXXXXXXX-X"` |

## Build y deploy

```bash
npm run build          # genera .next/ y prisma client
npm test               # suite Jest
pm2 reload transmagg   # aplica nuevo build sin downtime
```

Antes de pushear: `npm run build` + `npm test` ambos en verde.

Tras un build con la app corriendo: hacer `pm2 reload` y avisar al usuario que
haga **hard refresh** (Ctrl+Shift+R). Sin eso, el bundle JS viejo en el
navegador apunta a Server Action IDs que ya no existen.
