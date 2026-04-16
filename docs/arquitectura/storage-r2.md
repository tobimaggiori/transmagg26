# Storage en Cloudflare R2

R2 es S3-compatible. Configuración vía AWS SDK v3.

## Variables de entorno

```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=transmagg
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
```

`storageConfigurado()` en `src/lib/storage.ts` chequea que estén todas. Los
flujos que toleren ausencia de storage la usan para no romper en dev.

## Estructura de carpetas (prefijos)

Cada tipo de PDF va a su prefijo. La key tiene formato
`{prefijo}/{YYYY}/{MM}/{UUID}.pdf`.

| Prefijo | Contenido |
|---|---|
| `liquidaciones` | PDFs de LP a fleteros |
| `facturas-emitidas` | Facturas emitidas a empresas |
| `facturas-proveedor` | Facturas recibidas de proveedores (subidas por usuario) |
| `comprobantes-pago-proveedor` | Comprobantes de pago a proveedor |
| `comprobantes-pago-fletero` | OPs y comprobantes de medios de pago a fletero |
| `resumenes-bancarios` | Resúmenes mensuales bancarios |
| `resumenes-tarjeta` | Resúmenes mensuales de tarjetas |
| `cartas-de-porte` | Cartas de porte de viajes |
| `remitos` | Remitos asociados |
| `polizas` | Pólizas de seguros |
| `recibos-cobranza` | Recibos de cobranza |
| `comprobantes-impuestos` | Comprobantes de pago de impuestos |
| `comprobantes-infracciones` | Comprobantes de pago de infracciones |
| `libros-iva` | Libros IVA generados |
| `libros-iibb` | Libros IIBB generados |
| `libros-percepciones` | Libros de percepciones generados |
| `cierres-resumen` | Cierres mensuales de tarjeta |
| `logos` | Logos del emisor (subidos en config ARCA) |

El tipo `StoragePrefijo` en `src/lib/storage.ts` es la fuente de verdad.

## Helpers (`src/lib/storage.ts`)

| Función | Uso |
|---|---|
| `subirPDF(buffer, prefijo, nombreArchivo?)` | Sube y devuelve la key |
| `obtenerArchivo(key)` | Descarga buffer (server-side) |
| `obtenerUrlFirmada(key, expires?)` | URL temporal (default 15 min) para visualizar |
| `eliminarArchivo(key)` | Borra del bucket (irreversible) |
| `eliminarArchivos(keys)` | Borra en lote (hasta 1000 por request) |
| `listarArchivos(prefijo)` | Lista keys bajo un prefijo (paginado) |
| `storageConfigurado()` | Chequea env vars |

## Patrón de subida

1. Generar el buffer (PDF, exportación, lo que sea).
2. `await subirPDF(buf, prefijo, nombreArchivo)` → `key`.
3. Guardar la key en el campo `pdfS3Key` (o nombre análogo) del modelo.

```typescript
const buf = await generarPDFLiquidacion(liqId)
const key = await subirPDF(buf, "liquidaciones", `LP-${nro}.pdf`)
await prisma.liquidacion.update({ where: { id: liqId }, data: { pdfS3Key: key } })
```

## Patrón de descarga (cliente)

NUNCA exponer credenciales R2 al cliente. Para que el navegador acceda a un
PDF, generar URL firmada en server y devolverla.

Endpoint utilitario `GET /api/storage/signed-url?key=...` ya disponible:

```typescript
const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(key)}`)
const { url } = await res.json()
window.open(url, "_blank")
```

## Cache invalidation

Cuando un PDF se regenera (por cambio de datos), la práctica es:

1. Setear `pdfS3Key = null` en el modelo (invalida el cache lógico).
2. La próxima vez que se pida el PDF vía endpoint, se regenera y sube a R2,
   obteniendo una key nueva (UUID nuevo).
3. La key vieja queda **huérfana en R2**. No se borra automáticamente — puede
   acumularse basura.

Si se quiere limpiar las huérfanas, usar `eliminarArchivos` con un script
batch. No hay job programado para esto hoy.

## Exportación masiva

`/contabilidad/comprobantes` permite listar y exportar (ZIP) PDFs de R2 por
tipo y rango de fecha. Implementación en `src/lib/comprobantes-queries.ts`.

Cuando agregues un nuevo tipo de PDF que se persista en R2, agregá el prefijo
también a `comprobantes-queries.ts` para que aparezca en la exportación.
