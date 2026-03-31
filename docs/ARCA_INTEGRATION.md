# Integración ARCA — Cuenta de Venta y Líquido Producto

## Tipo de comprobante

| Código | Descripción | Cuándo usar |
|--------|-------------|-------------|
| 186 | Cuenta de Venta y Líquido Producto "A" | Emisor RI → Receptor RI o Monotributo |
| 187 | Cuenta de Venta y Líquido Producto "B" | Emisor RI → Receptor Exento o Consumidor Final |

La clase (A o B) se determina por la `condicionIva` del fletero receptor al momento de autorizar.

## Web Service: WSFEv1

- **Homologación**: https://wswhomo.afip.gov.ar/wsr/service.asmx
- **Producción**: https://servicios1.afip.gov.ar/wsr/service.asmx
- **Autenticación**: WSAA — certificado digital X.509 + clave privada RSA

## Flujo de autorización completo

1. **Autenticar con WSAA**
   - Generar un TRA (Ticket de Requerimiento de Acceso) firmado con la clave privada
   - Enviarlo al WSAA → obtener Token + Sign (válidos 12 horas)

2. **Obtener próximo número de comprobante**
   - Llamar `FECompUltimoAutorizado(Auth, PtoVta, CbteTipo)`
   - Respuesta: `{ CbteNro: N }` → usar N + 1 como número del nuevo comprobante

3. **Construir y enviar el comprobante**
   - Llamar `FECAESolicitar(Auth, FeCAEReq)` con todos los campos requeridos

4. **Procesar respuesta de ARCA**
   - Si aprobado: guardar `CAE` (14 dígitos) + `CAEFchVto` (YYYYMMDD) en BD
   - Actualizar `arcaEstado = "AUTORIZADA"`
   - Si rechazado: guardar observaciones en `arcaObservaciones`, mantener `arcaEstado = "RECHAZADA"`

5. **Generar QR**
   - Construir el JSON del QR según RG 4291
   - Codificarlo en base64 para la URL del QR
   - Guardar en `qrData`

## Campos requeridos por WSFEv1 (FECAESolicitar)

| Campo ARCA | Descripción | Valor en este sistema |
|------------|-------------|----------------------|
| CbteTipo | Tipo de comprobante | 186 (RI→RI) o 187 (RI→otros) |
| PtoVta | Punto de venta habilitado en ARCA | env: ARCA_PTO_VENTA |
| CbteDesde / CbteHasta | Número del comprobante | nroComprobante |
| CbteFch | Fecha del comprobante (YYYYMMDD) | grabadaEn |
| Concepto | 1=Productos, 2=Servicios | 2 |
| DocTipo | Tipo doc del receptor | 80 (CUIT) |
| DocNro | CUIT del fletero receptor | fletero.cuit |
| ImpNeto | Base imponible | neto |
| ImpIVA | Monto IVA | ivaMonto |
| ImpTotal | Total del comprobante | total |
| FchServDesde | Inicio del período (YYYYMMDD) | fecha del viaje más antiguo de la liquidación |
| FchServHasta | Fin del período (YYYYMMDD) | fecha del viaje más reciente de la liquidación |
| FchVtoPago | Fecha estimada de pago (YYYYMMDD) | grabadaEn + 30 días |

## Campos guardados en BD (modelo Liquidacion)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| nroComprobante | Int? | Número correlativo del comprobante |
| ptoVenta | Int? | Punto de venta ARCA (default: 1) |
| tipoCbte | Int? | 186 o 187 según condición IVA del fletero |
| cae | String? | Código de Autorización Electrónica (14 dígitos) |
| caeVto | DateTime? | Fecha de vencimiento del CAE |
| qrData | String? | JSON base64 del QR según RG 4291 |
| arcaEstado | String? | PENDIENTE / AUTORIZADA / RECHAZADA |
| arcaObservaciones | String? | Errores o advertencias de ARCA |

## Variables de entorno necesarias

```env
ARCA_CUIT=          # CUIT de Transmagg (emisor)
ARCA_PTO_VENTA=     # Número del punto de venta habilitado en ARCA
ARCA_CERT=          # Certificado digital .crt (contenido en base64 o path al archivo)
ARCA_KEY=           # Clave privada .key (contenido en base64 o path al archivo)
ARCA_MODO=          # "homologacion" o "produccion"
```

## Notas importantes

- La numeración es **global por punto de venta y tipo de comprobante** — ARCA no admite huecos.
- Si ARCA rechaza el comprobante, el número NO queda consumido; se puede reintentar con el mismo número.
- El tipoCbte (186 vs 187) debe determinarse automáticamente según `fletero.condicionIva` al momento de autorizar, no al crear la liquidación internamente.
- Siempre llamar `FECompUltimoAutorizado` de ARCA justo antes de `FECAESolicitar` para evitar conflictos de numeración (la numeración interna de la BD es orientativa hasta ese momento).
- El CAE tiene fecha de vencimiento; si vence antes de imprimir/entregar el comprobante, es inválido.

## Próximos pasos (checklist)

- [ ] Obtener certificado digital de ARCA para el CUIT de Transmagg (gestión vía Clave Fiscal → Administración de Certificados Digitales)
- [ ] Configurar variables de entorno en `.env.local`
- [ ] Implementar `src/lib/arca-auth.ts` — cliente WSAA (firma TRA, obtención Token+Sign)
- [ ] Implementar `src/lib/arca-wsfev1.ts` — cliente WSFEv1 (FECompUltimoAutorizado + FECAESolicitar)
- [ ] Crear endpoint `POST /api/liquidaciones/[id]/autorizar-arca`
- [ ] Agregar botón "Autorizar en ARCA" en el modal de detalle de liquidación (visible solo si arcaEstado === "PENDIENTE")
- [ ] Mostrar CAE + fecha de vencimiento en el PDF de la liquidación
- [ ] Agregar QR al PDF (RG 4291)

## NC/ND — Tipos de comprobante ARCA

| Código | Descripción | Cuándo usar |
|--------|-------------|-------------|
| 2 | Nota de Débito "A" | Emisor RI → Receptor RI o Monotributo |
| 3 | Nota de Crédito "A" | Emisor RI → Receptor RI o Monotributo |
| 7 | Nota de Débito "B" | Emisor RI → Receptor Exento o Consumidor Final |
| 8 | Nota de Crédito "B" | Emisor RI → Receptor Exento o Consumidor Final |

## Checklist ARCA para NC/ND (pendiente)
- [ ] Implementar `FECAESolicitar` para NC/ND en `src/lib/arca-wsfev1.ts`
- [ ] Crear endpoint `POST /api/notas-credito-debito/[id]/autorizar-arca`
- [ ] Agregar botón "Autorizar en ARCA" (actualmente deshabilitado, pendiente certificado)
- [ ] NC/ND siempre deben asociarse a la factura o liquidación original en ARCA (campo CmpAsoc)
