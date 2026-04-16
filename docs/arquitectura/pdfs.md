# PDFs

Generación, fusión y servido de PDFs en Transmagg.

## Reglas no negociables

- **SIEMPRE usar `pdfkit`** para generar. Nunca HTML-to-PDF, nunca puppeteer,
  nunca librería que requiera headless browser.
- **SIEMPRE usar `src/lib/pdf-merge.ts`** para fusionar. Nunca importar
  `pdf-lib` directo.
- Los generators viven en `src/lib/pdf-*.ts` y exportan funciones que retornan
  `Promise<Buffer>`.
- Datos del emisor vienen de `obtenerDatosEmisor()` en `src/lib/pdf-common.ts`.
- Formato monetario en PDFs: punto para miles, coma para decimales (estándar
  argentino).

## Generators existentes

| Archivo | Genera |
|---|---|
| `pdf-factura.ts` | Facturas A/B/C emitidas a empresa |
| `pdf-liquidacion.ts` | Líquido Producto (LP) a fletero |
| `pdf-nota-cd.ts` | Nota de crédito o débito |
| `pdf-orden-pago.ts` | Orden de pago a fletero (no fiscal) |
| `pdf-recibo-cobranza.ts` | Recibo de cobranza |
| `pdf-libro-iva.ts` | Libro IVA |
| `pdf-libro-iibb.ts` | Libro IIBB |
| `pdf-libro-percepciones.ts` | Libro de percepciones |
| `pdf-common.ts` | Helpers compartidos (datos del emisor, logos) |
| `pdf-merge.ts` | **Fusión** de PDFs |

## Estética

Comprobantes fiscales (factura, LP, NC/ND) usan el diseño oficial ARCA. Ver
[arca/implementacion.md](../arca/implementacion.md) para el detalle del
encabezado, totales y pie obligatorios (QR, CAE, "Comprobante Autorizado").

OP es no fiscal: misma paleta navy/celeste pero sin letra A/B/C, sin QR, sin
CAE, sin firma. La estructura está en
[negocio/ordenes-pago.md](../negocio/ordenes-pago.md).

### Caja del receptor

Padding superior e inferior simétricos (`padY`) y texto centrado verticalmente
en cada renglón con `(lineH − fontSize) / 2`. Esto garantiza que la caja se
vea balanceada y aplica a TODOS los generators de comprobante. Si modificás
una caja receptor en algún generator, mantené esta convención.

## Fusión: `pdf-merge.ts`

Cuatro funciones públicas. Falla rápido: si una key no existe en R2 o el
contenido no es PDF válido, se lanza Error nombrando qué falló. El orden del
PDF resultante respeta el orden de los inputs (primero buffers, después keys).

```typescript
import {
  mergePDFs,
  mergePDFsDesdeR2,
  mergePDFsMixto,
  mergeYSubirAR2,
} from "@/lib/pdf-merge"

// Merge in-memory
await mergePDFs([bufA, bufB])

// Merge desde R2 (orden = orden del array)
await mergePDFsDesdeR2(["liquidaciones/2026/04/x.pdf", "..."])

// Mixto: buffers primero, después keys
await mergePDFsMixto({ buffers: [opBuffer], keys: ["adj/x.pdf"] })

// Merge + subir a R2
const key = await mergeYSubirAR2({
  buffers: [opBuffer],
  keys: [...],
  prefijo: "comprobantes-pago-fletero",
  nombreArchivo: "OP-1-2026-con-adjuntos.pdf",
})
```

Caso típico: PDF de OP + comprobantes adjuntos (cheques, transferencias) ya
en R2 — usar `mergePDFsMixto`.

## Servido vía API

### Comprobantes fiscales (factura, LP, NC/ND)

`GET /api/<tipo>/[id]/pdf` devuelve **JSON con URL firmada** apuntando a R2.
El cliente debe hacer fetch y abrir la URL:

```typescript
const res = await fetch(`/api/liquidaciones/${id}/pdf`)
const { url } = await res.json()
window.open(url, "_blank")
```

El endpoint sirve desde cache R2 si existe `pdfS3Key`. Si no, regenera con el
generator, sube a R2, guarda la key y devuelve la URL.

### Orden de pago

`GET /api/ordenes-pago/[id]/pdf` devuelve **el PDF binario directo**
(`application/pdf`). Se puede usar con `<a href>`:

```tsx
<a href={`/api/ordenes-pago/${id}/pdf`} target="_blank">Ver OP</a>
```

Sirve desde cache R2 si existe; si no, regenera (incluye merge con adjuntos)
y sube. Cache se invalida al modificar o anular un pago de la OP.

### Comprobantes adjuntos sueltos (subidos por el usuario)

Para PDFs subidos a R2 (comprobante de transferencia, cheque, etc.) que NO
tienen un endpoint propio:

```typescript
const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(key)}`)
const { url } = await res.json()
window.open(url, "_blank")
```

NUNCA usar `<a href={`/api/storage/${key}`}>` — ese endpoint no existe.

## Subida a R2

Generadores que persisten su PDF deben subirlo con `subirPDF` y guardar la
key en el campo `pdfS3Key` del modelo correspondiente:

```typescript
import { subirPDF } from "@/lib/storage"

const buffer = await generarPDFLiquidacion(liqId)
const key = await subirPDF(buffer, "liquidaciones", `LP-${nro}.pdf`)
await prisma.liquidacion.update({ where: { id: liqId }, data: { pdfS3Key: key } })
```

Ver [storage-r2.md](./storage-r2.md) para detalles del bucket, prefijos y
URLs firmadas.

## Visor común

`/comprobantes/visor?tipo=factura&id=<id>` muestra el PDF inline con botones
de volver, imprimir, enviar email y descargar. Los links "Ver PDF" en general
deberían navegar a esta página, no abrir window.open directo. Algunos flujos
usan window.open por simplicidad — está OK para casos puntuales.
