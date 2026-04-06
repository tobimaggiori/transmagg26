# Plan de Integración ARCA — Transmagg

## Situación actual (auditoría 2026-04-03)

### Modelos y campos ARCA existentes

| Campo | Liquidacion | FacturaEmitida | NotaCreditoDebito |
|-------|:-----------:|:--------------:|:-----------------:|
| nroComprobante | Int? | String? | Int? |
| ptoVenta | Int? (default 1) | **FALTA** | Int? (default 1) |
| tipoCbte | Int? (default 60) | Int (default 1) | Int? |
| cae | String? | **FALTA** | String? |
| caeVto | DateTime? | **FALTA** | DateTime? |
| qrData | String? | **FALTA** | String? |
| arcaEstado / estadoArca | String? "PENDIENTE" | String "PENDIENTE" | String? "PENDIENTE" |
| arcaObservaciones | String? | **FALTA** | String? |
| pdfS3Key | String? | String? | String? |
| requestArcaJson | **FALTA** | **FALTA** | **FALTA** |
| responseArcaJson | **FALTA** | **FALTA** | **FALTA** |
| autorizadaEn | **FALTA** | **FALTA** | **FALTA** |
| idempotencyKey | **FALTA** | **FALTA** | **FALTA** |

### Infraestructura existente
- **ConfiguracionArca**: Singleton en DB con CUIT, certificado base64, password, modo (homo/prod), puntosVenta JSON, cbuMiPymes, activa.
- **ABM UI**: 5 cards (datos emisor, certificado, puntos de venta, MiPyMEs, ambiente). GET/PATCH API con verificador.
- **Campos ARCA en modelos**: Liquidacion y NotaCreditoDebito tienen la mayoría. FacturaEmitida solo tiene estadoArca.
- **Botones UI**: Existen "Marcar como emitida en ARCA" / "Autorizar en ARCA" (deshabilitados, sin backend).

### Lo que NO existe
- Capa WSAA (autenticación con certificado digital)
- Cliente WSFEv1 (FECAESolicitar, FECompUltimoAutorizado)
- Mappers modelo interno → payload ARCA
- QR fiscal RG 4291
- Validaciones pre-envío
- Endpoints de autorización
- Protección contra doble emisión
- Persistencia de request/response ARCA
- Cache de ticket WSAA
- Tests de la capa ARCA

### Riesgos detectados

1. **Race condition en numeración**: `calcularProximoNroComprobante()` lee MAX sin lock. Dos requests concurrentes pueden obtener el mismo número. No hay unique constraint en (ptoVenta, nroComprobante, tipoCbte).

2. **No hay protección contra doble emisión**: Sin idempotency key ni estado de procesamiento. Un doble click o reintento puede autorizar dos veces en ARCA.

3. **PDF antes de CAE**: Liquidaciones generan PDF sin CAE. El PDF muestra "CAE: Pendiente" y un QR que no es fiscal (es solo un link HMAC).

4. **FacturaEmitida incompleta**: Le faltan ptoVenta, cae, caeVto, qrData, arcaObservaciones. Tiene nroComprobante como String? en vez de Int?.

5. **Inconsistencia de nombres**: FacturaEmitida usa `estadoArca`, los otros usan `arcaEstado`. Se mantiene por backward compatibility.

6. **Certificado en DB sin cifrar**: certificadoB64 y certificadoPass se almacenan en texto plano en Turso. Se documenta como limitación; cifrado a futuro con ENCRYPTION_KEY.

---

## Decisiones de diseño

### 1. SOAP sin librería pesada
AFIP usa SOAP/XML. Las librerías `node-soap` y `soap` dependen de `xmldom` y hacen parsing WSDL pesado, incompatible con cold starts de Vercel.

**Decisión**: Construir XML a mano + `fast-xml-parser` para parsear respuestas. Los envelopes SOAP de WSAA y WSFEv1 son estables y bien documentados.

### 2. CMS/PKCS#7 con node-forge
WSAA requiere firmar el TRA con CMS (Cryptographic Message Syntax). Node.js built-in `crypto` no soporta CMS directamente.

**Decisión**: Usar `node-forge` (pure JS, sin dependencias nativas, Vercel compatible). Soporta PKCS#12 parsing y CMS signing.

### 3. Cache de ticket WSAA en DB
Vercel es stateless: la memoria no persiste entre invocaciones. El ticket WSAA dura 12 horas; pedir uno por cada comprobante es innecesario y lento.

**Decisión**: Modelo `TicketWsaa` en Prisma/Turso. Antes de cada operación, leer ticket vigente de DB. Si expiró o no existe, solicitar uno nuevo y guardarlo.

### 4. Idempotencia con idempotencyKey + estado de procesamiento
Turso/SQLite no soporta `SELECT FOR UPDATE`. No se puede hacer locking pesimista.

**Decisión**: 
- Campo `idempotencyKey` (UUID) generado al iniciar autorización.
- Campo `arcaEstado` con transición: PENDIENTE → EN_PROCESO → AUTORIZADA/RECHAZADA.
- Antes de autorizar: verificar que `arcaEstado` no sea EN_PROCESO ni AUTORIZADA.
- Si se detecta estado EN_PROCESO: releer después de breve espera y verificar si ya se completó.

### 5. Numeración sincronizada con ARCA
La numeración local es orientativa. Al autorizar en ARCA:
1. Llamar `FECompUltimoAutorizado` para obtener el último número real de ARCA.
2. Usar último + 1 como número definitivo.
3. Actualizar el registro local con el número definitivo.
4. Unique constraint en DB previene colisiones locales.

### 6. PDF solo después de CAE
El PDF fiscal se genera SOLO después de autorización exitosa. Si ya existe un PDF previo (borrador), se regenera sobreescribiendo pdfS3Key.

### 7. Unique constraints de numeración
Agregar `@@unique([ptoVenta, nroComprobante, tipoCbte])` donde corresponda. Esto previene duplicados a nivel DB incluso con race conditions.

### 8. Compatibilidad con Turso/LibSQL
- No usar JSON column type (SQLite no lo soporta nativamente). Usar `String` + helpers de serialización.
- No usar `SELECT FOR UPDATE`. Usar optimistic concurrency con `arcaEstado` como guard.
- Transacciones Turso son serializables por defecto, lo cual ayuda.

---

## Estrategia de implementación

### Fase 1: Schema + Infraestructura
1. Agregar campos faltantes a FacturaEmitida
2. Agregar campos de trazabilidad a los 3 modelos
3. Crear modelo TicketWsaa
4. Agregar unique constraints de numeración
5. Migración Prisma segura (solo cambios aditivos)

### Fase 2: Capa ARCA desacoplada
1. `src/lib/arca/types.ts` — Tipos TypeScript
2. `src/lib/arca/errors.ts` — Errores tipados
3. `src/lib/arca/config.ts` — Carga de configuración
4. `src/lib/arca/wsaa.ts` — Autenticación WSAA
5. `src/lib/arca/wsfev1.ts` — Cliente WSFEv1
6. `src/lib/arca/mappers.ts` — Modelo interno → payload ARCA
7. `src/lib/arca/qr.ts` — QR fiscal RG 4291
8. `src/lib/arca/validators.ts` — Validaciones pre-envío
9. `src/lib/arca/service.ts` — Servicio central de autorización

### Fase 3: Endpoints
1. `POST /api/liquidaciones/[id]/autorizar-arca`
2. `POST /api/facturas/[id]/autorizar-arca`
3. `POST /api/notas-credito-debito/[id]/autorizar-arca`

### Fase 4: Tests
1. Unit tests para mappers, validators, QR, errores
2. Integration tests con mocks para flujo completo

---

## Hardening (implementado)

### Seguridad de secretos
- **Cifrado en reposo**: `certificadoB64` y `certificadoPass` se cifran con AES-256-GCM usando `ENCRYPTION_KEY` como master key al guardar desde la API de configuración.
- **Backward compatible**: Si un valor no tiene prefijo `enc:v1:`, se trata como plaintext legacy. La migración es progresiva: al re-guardar la config, se cifra automáticamente.
- **Nunca expuestos**: GET de config ya stripeaba cert/pass. Los logs nunca incluyen token, sign, certificado ni password.
- **Sanitización de errores**: Los mensajes de error no incluyen IDs internos, detalles de forge ni paths de certificado.

### Estrategia WSAA
- **Cache en DB**: Ticket WSAA (token + sign) persiste en `tickets_wsaa` con `expiresAt`. Cada invocación lee de DB primero.
- **Margen de expiración**: 10 minutos (antes era 5). Cubre emisiones que tardan en completarse.
- **Validación de integridad**: Verifica que token/sign no estén vacíos ni sean demasiado cortos antes de reusar.
- **Renovación concurrente**: Dos invocaciones simultáneas que ven ticket vencido pueden ambas llamar a WSAA. No hay corrupción (upsert idempotente). WSAA tolera loginCms duplicados con el mismo certificado.
- **Retry**: 1 reintento con 2s de delay para errores transitorios de red/timeout. No reintenta errores de certificado (permanentes).

### Política de retries
| Capa | Retry | Delay | Errores reintentables |
|------|-------|-------|-----------------------|
| WSAA | 1 | 2s | Red, timeout, HTTP 5xx |
| WSFEv1 | 1 | 2s (backoff) | Red, timeout, HTTP 5xx |
| WSAA | 0 | — | Certificado inválido, HTTP 4xx |
| WSFEv1 | 0 | — | Rechazo fiscal, error funcional |

### Clasificación de errores
Todos los `ArcaError` tienen un campo `retryable: boolean`:
- `WsaaError`: retryable=true por default (red), false si certificado inválido
- `Wsfev1Error`: retryable=true por default (red), false si error funcional ARCA
- `ArcaRechazoError`: retryable=false (rechazo fiscal permanente)
- `ArcaValidacionError`: retryable=false (datos incorrectos)
- `DocumentoEnProcesoError`: retryable=true (esperar y reintentar)
- `DocumentoYaAutorizadoError`: retryable=false
- `ArcaNoConfiguradaError`: retryable=false

### Logging
Cada entrada de log incluye: `{ ts, nivel, modulo: "ARCA", etapa, mensaje, ...meta }`.
Etapas: inicio, lock, wsaa, numeracion, validacion, autorizacion, persistencia, pdf, completado, error.
Soporte puede rastrear en qué punto exacto falló una emisión.

---

## Limitaciones conocidas

1. **Cold start de Vercel**: La primera invocación de WSAA puede tardar 2-3 segundos por parsing PKCS#12. Subsiguientes usan cache en DB.

2. **Concurrencia de renovación WSAA**: Dos invocaciones simultáneas pueden ambas renovar el ticket. No hay corrupción ni impacto funcional, solo una llamada extra a WSAA. Aceptable para el volumen esperado.

3. **Tipos de comprobante soportados**: Factura A/B (1/6), Factura A MiPyme (201), CVLP A/B (60/61), NC A/B (3/8), ND A/B (2/7), NC/ND FCE (203/202). Catálogo cerrado según `arca-matriz-comprobantes.md`. No se soportan comprobantes C, M ni E.

---

## Variables de entorno necesarias

```env
# Ya existentes (no cambiar)
ENCRYPTION_KEY=            # Master key para cifrado de cert/pass ARCA + HMAC de QR internos (ya existe)

# Opcionales — las URLs se determinan por el campo `modo` de ConfiguracionArca
# Solo necesarias si se quieren override los defaults
ARCA_WSAA_URL=             # Override URL WSAA (default: según modo homo/prod)
ARCA_WSFEV1_URL=           # Override URL WSFEv1 (default: según modo homo/prod)
```

La configuración principal (CUIT, certificado, puntos de venta, modo) se gestiona desde `/configuracion/arca`.

---

## Pasos para configurar ARCA en producción

1. Obtener certificado digital desde ARCA (Clave Fiscal → Administración de Certificados Digitales)
2. En `/configuracion/arca`:
   - Cargar CUIT y razón social
   - Subir certificado (.pfx o .p12) con su password
   - Configurar puntos de venta por tipo de comprobante
   - Cambiar ambiente a "Producción"
   - Activar
   - Verificar configuración
3. Autorizar el primer comprobante desde el sistema

---

## Cómo verificar manualmente el flujo

1. Configurar ARCA en modo homologación con certificado de testing
2. Crear una liquidación con viajes
3. Desde Consultar LP, click "Autorizar en ARCA"
4. Verificar:
   - arcaEstado cambia a AUTORIZADA
   - CAE de 14 dígitos guardado
   - caeVto guardado
   - qrData generado
   - PDF regenerado con CAE, QR fiscal, número definitivo
5. Intentar autorizar de nuevo: debe rechazar con "ya autorizada"
