# CLAUDE.md — Contrato operativo

Reglas no negociables y guía de lectura para agentes IA trabajando en este
repo. Esto es un **índice de obligaciones**, no documentación. Los detalles
viven en [`docs/`](./docs/).

## Reglas que no se rompen

1. **Nunca borrar datos sin confirmar**. No ejecutar migraciones destructivas,
   `DELETE` masivos, ni `git reset --hard` sin pedir confirmación explícita.
2. **Build verde antes de push**. `npm run build` debe pasar; si falla,
   corregir y re-buildear.
3. **Tests verdes después de tocar `src/lib/`**. `npm test`.
4. **Antes de tocar dinero**, leer [`docs/politicas/money.md`](./docs/politicas/money.md).
   Usar siempre helpers de `src/lib/money.ts`. NUNCA `parseFloat`,
   `Math.round(...*100)/100`, sumas/restas crudas, ni `reduce` sobre importes.
5. **Antes de tocar comprobantes / emisión fiscal**, leer
   [`docs/arca/matriz.md`](./docs/arca/matriz.md). Si el código contradice la
   matriz, corregir el código.
6. **Toda función nueva o refactor relevante** sigue
   [HTDP](./docs/politicas/htdp.md): signatura + propósito + ejemplos en el
   JSDoc, tests basados en esos ejemplos.
7. **Toda fusión de PDFs** pasa por `src/lib/pdf-merge.ts`. NUNCA importar
   `pdf-lib` directo.
8. **Generación de PDFs** usa `pdfkit`. NUNCA HTML-to-PDF, NUNCA puppeteer.
   - **API**: rutas `*/pdf/route.ts` devuelven `Content-Type: application/pdf`
     con `Content-Disposition: inline; filename="..."`. NUNCA devolver HTML
     con `<script>window.print()</script>`. NUNCA `attachment` (forzaría
     descarga; queremos visualización).
   - **UI**: los links que abren PDFs (generados o de R2 vía URL firmada)
     navegan en la **misma ventana** del operador (`<a href={url}>` sin
     `target`, o `window.location.href = url`). NUNCA `target="_blank"` ni
     `window.open(url, "_blank")`. El visor PDF nativo del navegador le
     da al operador opciones de guardar/imprimir/cerrar; no abrimos
     páginas intermedias ni HTML wrappers.
   - **Estilo**: importar tamaños y colores de `src/lib/pdf-style.ts`
     (`PDF_FONT`, `PDF_COLOR`, `PDF_MARGIN`). NO inventar números mágicos
     de fontSize. Mínimos: TABLE_BODY 9pt, FOOTER 8pt — debajo de eso un
     contador no puede leerlo. Si un caso particular se desvía, dejar un
     comentario explicando la razón.
9. **Visibilidad de tarifas** (regla de seguridad crítica):
   - `tarifa` (fletero) NUNCA visible para roles empresa o chofer.
   - `tarifaEmpresa` NUNCA visible para roles fletero o chofer.
10. **UI sin copy instructivo**. Salvo que el dueño del proyecto lo pida
    expresamente, NO agregar hints, descripciones de diálogos
    (`DialogDescription`), placeholders narrativos ni textos muted
    explicando cómo usar el formulario. Los operadores ya conocen el flujo;
    la interfaz no los tiene que guiar paso a paso. Si hace falta guiar:
    labels claros, estado `disabled` y placeholders mínimos — nunca
    párrafos explicativos.
11. **Separación entre tenants (Transmagg / Javier Maggiori / futuros)**.
    El proyecto está evolucionando hacia un sistema multi-empresa. Cada
    tenant es **independiente**: tiene su propia base de datos, su propio
    schema Prisma, sus propias entidades, sus propias rutas, su propia UI.
    Lo único que comparten es la **autenticación** (mismos usuarios y
    sesión) y primitivas neutras de UI (botones, inputs, combobox).
    - **JM = Transmagg − Fletero**. El sistema "Javier Maggiori" replica
      Transmagg eliminando todo lo que tenga que ver con la identidad
      Fletero: no hay sección Fleteros, ni Liquidaciones (LP), ni gastos
      o adelantos a fleteros, ni CC fleteros, ni viajes con fletero
      externo, ni NC/ND sobre LP. Todo el resto (Empresas, Proveedores,
      Contabilidad, Mi Flota, ABM, Configuración, ARCA) se replica con
      la misma lógica/UI, adaptado para que JM tenga su propia DB y su
      propio cliente Prisma.
    - **No mezclar imports**: en código JM se usa `prismaJm`, `@/jm/lib/...`,
      `@/jm/components/...`. En código Transmagg se usa `prisma`,
      `@/lib/...`, `@/components/...`. Cruzar es bug (lint lo bloquea
      para `prisma`, otros cruces se permiten para primitivas neutras
      como `money`, `storage`, `auth`).
    - **No crear FKs entre DBs**. Si un tenant necesita referenciar un
      usuario, guarda `email` o `id` como string sin FK.
    - **Duplicar lógica está bien** cuando el flujo es parecido — los
      tenants pueden divergir y queremos esa libertad. No abstraer "porque
      es igual".
    - Detalle por tenant: [`docs/jm/README.md`](./docs/jm/README.md).

## Cómo cerrar una tarea

Al terminar de implementar algo:

1. Build pasa (`npm run build`).
2. Tests pasan (`npm test`), si tocaste `src/lib/`.
3. Reportar honestamente cualquier pendiente o riesgo no resuelto.
4. Si la app está corriendo en PM2, recordar al usuario que tras
   `pm2 reload` necesita hard-refresh del navegador.

No cerrar una tarea solo con explicación. Modificar el código real, agregar
o actualizar tests, correr verificación final.

## Qué leer cuándo

| Si vas a tocar... | Leé primero... |
|---|---|
| Importes monetarios | [`docs/politicas/money.md`](./docs/politicas/money.md) |
| Comprobantes / emisión / NC/ND | [`docs/arca/matriz.md`](./docs/arca/matriz.md) + [`docs/reglas-fiscales/nc-nd-iva.md`](./docs/reglas-fiscales/nc-nd-iva.md) |
| Configuración ARCA / WSAA / WSFEv1 | [`docs/arca/`](./docs/arca/) (los 4 archivos) |
| Cuenta corriente / saldos | [`docs/negocio/cuenta-corriente.md`](./docs/negocio/cuenta-corriente.md) |
| Órdenes de pago | [`docs/negocio/ordenes-pago.md`](./docs/negocio/ordenes-pago.md) |
| Adelantos a fleteros | [`docs/negocio/adelantos.md`](./docs/negocio/adelantos.md) |
| Cheques (propios o tercero) | [`docs/negocio/cheques.md`](./docs/negocio/cheques.md) |
| Viajes con cupo / hermanos | [`docs/negocio/cupo.md`](./docs/negocio/cupo.md) |
| Liquidación o facturación | [`docs/negocio/liquidacion.md`](./docs/negocio/liquidacion.md) o [`docs/negocio/facturacion.md`](./docs/negocio/facturacion.md) |
| PDFs (generar o fusionar) | [`docs/arquitectura/pdfs.md`](./docs/arquitectura/pdfs.md) |
| Subida o descarga R2 | [`docs/arquitectura/storage-r2.md`](./docs/arquitectura/storage-r2.md) |
| Auth, roles, permisos | [`docs/arquitectura/auth-rbac.md`](./docs/arquitectura/auth-rbac.md) |
| Patrón de API route, conventions | [`docs/arquitectura/stack.md`](./docs/arquitectura/stack.md) |
| Tests | [`docs/politicas/tests.md`](./docs/politicas/tests.md) |
| Invariantes generales | [`docs/politicas/invariantes.md`](./docs/politicas/invariantes.md) |
| Sistema "Javier Maggiori" (tenant aparte) | [`docs/jm/README.md`](./docs/jm/README.md) |

Índice maestro: [`docs/README.md`](./docs/README.md).

## Convención al consultar el sistema viejo

`sistemaviejo/` contiene documentación del sistema VB6 anterior. Es contexto
histórico, no especificación vigente. Cuando aparezca "comparar con el
viejo" o "cómo lo hacía antes", leer los `.md` de esa carpeta — NUNCA leer
los `.frm`/`.bas` directos.

## Inconsistencias conocidas

[`docs/INCONSISTENCIAS-DETECTADAS.md`](./docs/INCONSISTENCIAS-DETECTADAS.md)
lista divergencias detectadas entre doc y código. Si encontrás una nueva,
agregala ahí en lugar de arreglarla silenciosamente — el dueño del proyecto
tiene que decidir caso por caso.
