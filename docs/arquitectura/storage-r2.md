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
| `ctg` | PDFs de CTG de viajes |
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
| `listarArchivosConMeta(prefijo)` | Lista keys + `lastModified` (para grace periods) |
| `copiarArchivo(srcKey, destKey)` | Copia objeto dentro del bucket (CopyObject de S3) |
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
3. La key vieja queda **huérfana en R2**.

Las huérfanas se barren con el cleanup periódico (ver siguiente sección),
pero hoy ese script solo cubre `ctg/` y `remitos/`. Para extenderlo a otros
prefijos, ver el patrón abajo.

## Limpieza periódica de huérfanos

Una key se considera **huérfana** cuando vive en R2 pero ya no está
referenciada en ninguna columna de DB. Se generan principalmente por:

- Operador sube un PDF en un formulario y abandona sin guardar.
- Operador reemplaza un PDF: la key vieja queda en R2 después del UPDATE.
- PDF regenerado vía cache invalidation (ver arriba).
- Viaje/factura/etc. eliminado sin borrar su PDF asociado.

### Script y cron actuales

Script: [`scripts/cleanup-pdfs-huerfanos.ts`](../../scripts/cleanup-pdfs-huerfanos.ts).

Cubre los prefijos `ctg/` y `remitos/`. Lógica:

1. Carga todas las keys referenciadas en `viajes` (`ctgS3Key`, `remitoS3Key`).
2. Lista R2 bajo cada prefijo con `listarArchivosConMeta` (incluye
   `LastModified`).
3. Una key es huérfana si no está en DB **y** tiene más de N horas
   (default 24h; configurable con `--grace=H`). El grace evita borrar
   archivos recién subidos cuyo registro DB todavía no se persistió
   (operador llenando formulario).
4. Borra en lote con `eliminarArchivos`.

Modos:

```bash
npm run cleanup:pdfs-huerfanos -- --dry-run         # solo lista, no borra
npm run cleanup:pdfs-huerfanos -- --apply           # borra
npm run cleanup:pdfs-huerfanos -- --apply --grace=48
```

Cron instalado (crontab del usuario `tobi`):

```cron
0 4 * * * cd /home/tobi/transmagg26 && /usr/bin/npm run cleanup:pdfs-huerfanos -- --apply >> /home/tobi/transmagg26/logs/cleanup-pdfs.log 2>&1
```

### Cómo extenderlo a otros prefijos / secciones

El patrón es siempre el mismo: **prefijo de R2 ↔ columnas de DB que lo
referencian**. Para sumar un nuevo tipo de PDF a la limpieza:

1. Identificar el prefijo en R2 y las columnas (potencialmente varias)
   donde se guardan sus keys. Por ejemplo:

   | Prefijo | Columnas que lo referencian |
   |---|---|
   | `liquidaciones/` | `liquidaciones.pdfS3Key` |
   | `facturas-emitidas/` | `facturasEmitidas.pdfS3Key` |
   | `facturas-proveedor/` | `facturaProveedor.pdfS3Key` |
   | `recibos-cobranza/` | `reciboCobranza.pdfS3Key` |
   | `comprobantes-pago-fletero/` | `ordenPago.pdfS3Key` (chequear) |
   | `polizas/` | `polizaSeguro.pdfS3Key` |

2. En `cleanup-pdfs-huerfanos.ts`, agregar el prefijo al array `PREFIJOS`
   y extender la query que llena `refSet` con un `findMany` adicional
   (o un único query con `OR` por modelo). Idea:

   ```typescript
   const liqs = await prisma.liquidacion.findMany({
     where: { pdfS3Key: { not: null } },
     select: { pdfS3Key: true },
   })
   for (const l of liqs) if (l.pdfS3Key) refSet.add(l.pdfS3Key)
   ```

3. Probar con `--dry-run` antes de `--apply`. Para tipos donde la regla
   de cuándo "ya no se necesita" sea distinta (p. ej. PDFs que se
   regeneran seguido), considerar grace period más largo.

4. Si un tipo de PDF tiene reglas distintas (p. ej. mantener última
   versión aunque haya N huérfanas, o nunca borrar de cierto prefijo),
   excluirlo del script y manejarlo aparte.

### Qué evitar

- **No borrar prefijos sin DB que respalde** (ej. `logos/`): esos PDFs
  no se referencian con keys en columnas, sino que se buscan por path
  fijo. Mantener el script con allowlist explícita de prefijos seguros.
- **No bajar `--grace` a menos de unas horas**: una operadora puede
  tardar 30 min en cargar un viaje complicado. Default 24h es seguro.
- **Verificar nuevas columnas tras agregar features**: si alguien agrega
  un campo `pdfS3Key` a un modelo nuevo y lo olvida en el cleanup, esos
  PDFs nunca se borrarán y los que se reemplacen quedarán en R2.

## Exportación masiva

`/contabilidad/comprobantes` permite listar y exportar (ZIP) PDFs de R2 por
tipo y rango de fecha. Implementación en `src/lib/comprobantes-queries.ts`.

Cuando agregues un nuevo tipo de PDF que se persista en R2, agregá el prefijo
también a `comprobantes-queries.ts` para que aparezca en la exportación.
