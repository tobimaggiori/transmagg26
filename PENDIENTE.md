# Estado del proyecto Transmagg

## Estado actual

**Última actualización:** 2026-04-01

**Prompts ejecutados en sesiones recientes:**
1. Cupo opcional en viajes + provincias fijas en edición de LP
2. Flota propia de Transmagg en Mi Flota (camiones propios, pólizas de seguro, toggle en viajes)
3. Panel del chofer de Transmagg (dashboard personal solo lectura)
4. Configuración ARCA en ABM (modelo singleton, APIs GET/PATCH/verificar, UI con 5 cards)
5. Revisión general: seed corregido, sidebar actualizado, README actualizado
6. Orden de Pago a Fleteros (modelo OrdenPago, auto-creación en pago de LP, HTML imprimible, APIs pdf/email, UI en modal y tabla)
7. Pago a fleteros: gastos disponibles como medio de pago, UI con dos paneles fijos, nro de cheque obligatorio

**Estado actual del build:**
- `npm run build` ✅ sin errores
- `npm run lint` ✅ sin warnings
- `npx tsc --noEmit` ✅ sin errores de tipos
- `npm test` ✅ 251 tests pasando en 15 suites
- `npx prisma validate` ✅ schema válido
- `npx prisma migrate status` ✅ 21 migraciones aplicadas
- Seed idempotente ✅ (corregido cleanup de ResumenBancario, HistorialPago, NotaCreditoDebito)

**Falta implementar (próximas sesiones):**
- Integración real ARCA (WSAA, FECAESolicitar, CAE)
- PDF de liquidaciones y facturas (preview existe, generación no)
- Deploy a producción

---

## Hecho

### Core del sistema
- Autenticación passwordless con OTP numérico por email (NextAuth v5 + bcrypt)
- Sistema RBAC con roles: ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG, FLETERO, CHOFER, ADMIN_EMPRESA, OPERADOR_EMPRESA
- Schema Prisma SQLite/libsql con adaptador LibSQL explícito (Prisma 7)

### Gestión de transporte
- CRUD completo de Viajes (con estados independientes de liquidación y facturación)
- CRUD completo de Fleteros (con usuario asociado, dirección, condición IVA)
- CRUD completo de Camiones (con soft delete, filtrado por fletero)
- CRUD completo de Empresas clientes (con soft delete)
- CRUD completo de Usuarios (ADMIN_TRANSMAGG gestiona todos los roles)
- CRUD completo de Proveedores

### Liquidaciones a fleteros
- Creación de liquidaciones ("Cuenta de Venta y Líquido Producto") con viajes incluidos
- Cálculo automático: subtotal bruto, comisión, neto, IVA, total final
- Estados del documento: EMITIDA → PAGADA / ANULADA
- Al anular: viajes vuelven a PENDIENTE_LIQUIDAR independientemente
- Numeración correlativa con nroComprobante + ptoVenta + tipoCbte para ARCA
- Asientos IIBB automáticos por provincia de origen

### Facturas emitidas a empresas
- Creación de facturas con viajes incluidos (tipos A/B/C/M/X)
- Cálculo automático: neto, IVA, total
- Estados del documento: EMITIDA → COBRADA / ANULADA
- Al anular: viajes vuelven a PENDIENTE_FACTURAR independientemente
- Asientos IVA y IIBB automáticos

### Módulo financiero
- CRUD de Cuentas bancarias/billeteras/brokers con métricas calculadas
- CRUD de FCI (Fondos Comunes de Inversión) por cuenta
- CRUD de Movimientos FCI (suscripciones/rescates)
- CRUD de Saldos FCI (actualizaciones periódicas)
- CRUD de Brokers
- CRUD de Empleados
- CRUD de Movimientos sin factura (tipo INGRESO/EGRESO + categoria; reemplaza MovimientoBancario) — página /contabilidad/movimientos con filtros, paginación y export Excel
- ResumenBancario por cuenta: modelo + API CRUD + tab Resúmenes en /contabilidad/cuentas con UploadPDF/ViewPDF
- CRUD de Cheques recibidos (de clientes)
- CRUD de Cheques emitidos (a fleteros/proveedores) + registro de depósito
- Planillas de emisión masiva Banco Galicia (generación Excel con exceljs)
- Tarjetas prepagas de choferes con control de gastos
- Adelantos a fleteros con descuentos en liquidaciones
- Dashboard financiero con 6 sub-endpoints (saldos, deudas, pendientes)

### Notas de Crédito y Débito (NC/ND)
- Modelos NotaCreditoDebito y ViajeEnNotaCD en schema con migración aplicada
- 4 tipos: NC_EMITIDA | ND_EMITIDA | NC_RECIBIDA | ND_RECIBIDA
- API GET/POST /api/notas-credito-debito con lógica de negocio completa en transacciones
- Página /notas-credito-debito con filtros, tabla y modal de detalle
- Integración en modal de factura: botones "Emitir NC" / "Emitir ND"
- Cuentas corrientes ajustan saldo con NC/ND
- Campos ARCA precalculados (tipoCbte 2/3/7/8 por condicionIva del receptor)

### Gestión de flota (choferes + camiones por fletero)
- Campo `fleteroId` en `Usuario` para vincular CHOFER con su fletero empleador
- Asignación atómica chofer↔camión con historial (CamionChofer)
- ABM integrado en tab "Fleteros": camiones + choferes por fletero
- Página `/mi-flota` para FLETERO: vista de su flota con estado del chofer por camión
- Choferes filtrados por fletero en formulario de nuevo viaje

### Flota propia de Transmagg
- Schema `Camion.esPropio Boolean`, `Camion.fleteroId` optional, modelo `PolizaSeguro`, `Viaje.esCamionPropio Boolean` (migración flota_propia_transmagg)
- APIs `GET/POST /api/camiones/propios`, `POST/PATCH/DELETE /api/camiones/[id]/polizas/[polizaId]`
- Página `/mi-flota` bifurcada: roles internos → FlotaPropiaClient (ABM camiones propios, asignación choferes empleados, pólizas con alertas); FLETERO → MiFlotaClient
- Modal de nuevo viaje con toggle "camión propio / fletero externo"
- Viajes con camión propio excluidos del tab "Pend. liquidar"

### Panel del chofer de Transmagg
- Dashboard personalizado (`/dashboard`) para CHOFER empleado (no fletero)
- Cards: camión asignado, póliza de seguro con alertas, tarjeta corporativa, datos personales
- Tabs: viajes (sin tarifas), gastos de tarjeta, adelantos (empty state)
- Sidebar minimalista con solo "Mi Panel"
- Sin exposición de tarifas ni saldos monetarios

### Configuración ARCA en ABM
- Modelo `ConfiguracionArca` (singleton id="unico") con migración aplicada
- APIs `GET /api/configuracion-arca` (sin certificado), `PATCH /api/configuracion-arca`, `POST /api/configuracion-arca/verificar`
- Tab "ARCA" en `/abm` con 5 cards: datos emisor, certificado digital, puntos de venta por tipo comprobante, config MiPyMEs (CBU + modalidad SCA/ADC), ambiente con confirmación para PRODUCCIÓN
- Indicador amarillo en sidebar para ADMIN_TRANSMAGG cuando `activa = false`

### Módulo Chequeras
- Página /contabilidad/chequeras con tabs "ECheq Emitidos" y "Cartera Recibidos"
- Tab Emitidos: alertas vencimiento, filtros, tabla completa, acciones depositar/rechazar
- Tab Recibidos: alertas, filtros, acciones depositar/endosar/descontar/confirmar broker
- Integración con Cuentas: tab "Broker Pendiente"

### Contabilidad completa
- Libro IVA Compras y Ventas con exportación PDF/Excel (4 tabs)
- Reportes IIBB por provincia y período
- Detalle de Gastos por Concepto
- Reporte LP vs Facturas
- Reporte Viajes Facturados sin LP
- Página /contabilidad/movimientos con movimientos sin factura
- Módulo Tarjetas unificado (corporativas + prepagas)

### Pagos y cuentas corrientes
- Pagos a fleteros: multi-liquidación, multi-medio, pago parcial, distribución proporcional
- Pagos a proveedores: 8 tipos de pago, comprobante PDF en R2, efectos secundarios atómicos
- Anular/modificar pagos: preview de impacto, historial inmutable (HistorialPago)
- Cuentas corrientes de empresas y fleteros con NC/ND integradas

### Calidad del código
- LCC documentation en todas las funciones exportadas de lib/
- 15 test suites, 251 tests unitarios, todos pasando
- TypeScript sin errores (npx tsc --noEmit limpio)
- ESLint sin warnings (npm run lint limpio)
- Error handling completo en todos los API endpoints
- Seed idempotente con cleanup completo de todos los modelos

### Cloudflare R2 (almacenamiento)
- `liquidaciones/`, `facturas-emitidas/`, `facturas-proveedor/`, `comprobantes-pago-proveedor/`, `comprobantes-pago-fletero/`, `resumenes-bancarios/`, `resumenes-tarjeta/`, `cartas-de-porte/`

---

## Pendiente ARCA (integración real)

- [ ] Implementar autenticación WSAA con certificado digital X.509 + clave privada RSA
- [ ] Generar TRA (Ticket de Requerimiento de Acceso) y obtener Token + Sign (válidos 12 horas)
- [ ] Implementar `FECompUltimoAutorizado` para sincronizar numeración con ARCA
- [ ] Implementar `FECAESolicitar` para autorizar liquidaciones (tipoCbte 186 o 187)
- [ ] Implementar `FECAESolicitar` para autorizar NC/ND (tipoCbte 2/3/7/8 con campo CmpAsoc)
- [ ] Guardar CAE (14 dígitos) + CAEFchVto en BD al autorizar
- [ ] Actualizar `arcaEstado` a AUTORIZADA/RECHAZADA según respuesta
- [ ] Generar QR según RG 4291 (JSON base64) y guardar en `qrData`
- [ ] Endpoint POST /api/liquidaciones/[id]/autorizar-arca
- [ ] Endpoint POST /api/notas-credito-debito/[id]/autorizar-arca
- [ ] ARCA para viajes propios: ptoVenta diferente al de liquidaciones a fleteros
- [ ] URLs: homologación `wswhomo.afip.gov.ar` / producción `servicios1.afip.gov.ar`

## Pendiente general

- [ ] Generación de PDF para liquidaciones y facturas (preview modal existe en UI, generación no implementada)
- [ ] Generación de PDF para NC/ND
- [ ] Envío real de emails OTP (requiere SMTP de producción configurado)
- [ ] Conciliación bancaria automática
- [ ] Deploy a producción (configurar variables de entorno, dominio, DB en Turso)
