# Auth y permisos (RBAC)

## Autenticación

NextAuth v5 con OTP numérico passwordless por email. Flujo:

1. Usuario ingresa email en `/login`.
2. Backend genera OTP, lo persiste con TTL y lo envía por email.
3. Usuario lo ingresa en `/verify`.
4. Backend valida y crea sesión JWT.

Provider: `Credentials` con lógica custom. Configuración en `src/lib/auth.ts`.

## Roles

Definidos en `src/types/index.ts` y centralizados en `src/lib/permissions.ts`.

| Rol | Audiencia | Notas |
|---|---|---|
| `ADMIN_TRANSMAGG` | Empleado interno con todo | Único que accede a `/abm` y `/admin` |
| `OPERADOR_TRANSMAGG` | Empleado interno operativo | Acceso amplio sin admin |
| `ADMIN_EMPRESA` | Cliente empresa, dueño de cuenta | Ve facturación y CC de su empresa |
| `OPERADOR_EMPRESA` | Cliente empresa, operador | Idem ADMIN_EMPRESA, sin admin |
| `FLETERO` | Fletero externo | Ve sus liquidaciones, viajes, CC |
| `CHOFER` | Chofer (empleado o de fletero) | Solo viajes asignados |

Helpers de chequeo:

```typescript
import {
  esRolInterno, esRolEmpresa, esRolFletero, esAdmin,
  puedeAcceder, puedeVerTarifaFletero, puedeVerTarifaEmpresa,
} from "@/lib/permissions"
```

## Reglas de seguridad críticas (NO romper)

1. **`tarifaFletero`** (en `ViajeEnLiquidacion`) **NUNCA** se expone a roles de
   empresa o chofer. Las empresas no deben saber cuánto cobra el fletero.
2. **`tarifaEmpresa`** (en `ViajeEnFactura`) **NUNCA** se expone a fletero o
   chofer. Los fleteros no deben saber cuánto factura Transmagg a la empresa.
3. **API routes**: el chequeo de rol va **antes** de cualquier query. Ver
   patrón obligatorio en [stack.md](./stack.md#api-routes).

## Permisos por sección

`PERMISOS_SECCION` en `src/lib/permissions.ts` mapea cada sección de la app a
los roles que pueden entrar. Para chequear desde código:

```typescript
if (!puedeAcceder(rol, "liquidaciones")) redirect("/dashboard")
```

Para servir páginas: el chequeo va en el `page.tsx` (server component) antes
de renderizar.

## Sesión y operadorId

Para registrar quién hizo qué, los comandos transaccionales reciben
`operadorId` resuelto desde la sesión:

```typescript
import { resolverOperadorId } from "@/lib/session-utils"

const operadorId = await resolverOperadorId(session.user)
```

Este `operadorId` se persiste en campos como `Liquidacion.operadorId`,
`OrdenPago.operadorId`, etc. para auditoría.

## Verificación de propietario

Para roles externos (fletero/empresa) que acceden a sus propios datos, además
del chequeo de rol hay que validar pertenencia:

```typescript
import { verificarPropietarioFletero, verificarPropietarioEmpresa } from "@/lib/session-utils"

if (esRolFletero(rol)) {
  const ok = await verificarPropietarioFletero(liq.fleteroId, session.user.email!)
  if (!ok) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
}
```

Sin esto, un fletero podría ver liquidaciones de otro pasando un id arbitrario.
