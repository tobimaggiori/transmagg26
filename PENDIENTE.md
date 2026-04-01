# Estado del proyecto Transmagg

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
- Estados del documento: BORRADOR → EMITIDA → PAGADA / ANULADA
- Al anular: viajes vuelven a PENDIENTE_LIQUIDAR independientemente
- Numeración correlativa con nroComprobante + ptoVenta + tipoCbte para ARCA
- Asientos IIBB automáticos por provincia de origen

### Facturas emitidas a empresas
- Creación de facturas con viajes incluidos (tipos A/B/C/M/X)
- Cálculo automático: neto, IVA, total
- Estados del documento: BORRADOR → EMITIDA → COBRADA / ANULADA
- Al anular: viajes vuelven a PENDIENTE_FACTURAR independientemente
- Asientos IVA y IIBB automáticos

### Módulo financiero
- CRUD de Cuentas bancarias/billeteras/brokers con métricas calculadas
- CRUD de FCI (Fondos Comunes de Inversión) por cuenta
- CRUD de Movimientos FCI (suscripciones/rescates)
- CRUD de Saldos FCI (actualizaciones periódicas)
- CRUD de Brokers
- CRUD de Empleados
- CRUD de Movimientos sin factura (tipo INGRESO/EGRESO + categoria; reemplaza MovimientoBancario) — inline en tab Movimientos de /contabilidad/cuentas con saldo running, filtros, paginación y export Excel
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
- 10 subtipos documentados (ANULACION_TOTAL, ANULACION_PARCIAL, CORRECCION_IMPORTE, DIFERENCIA_TARIFA, COSTO_ADICIONAL, AJUSTE, PENALIDAD, CORRECCION_ADMINISTRATIVA, ANULACION_LIQUIDACION, CHEQUE_RECHAZADO)
- API GET/POST /api/notas-credito-debito con lógica de negocio completa en transacciones
- API GET/PATCH /api/notas-credito-debito/[id]
- Utilidades en src/lib/nota-cd-utils.ts (labelTipoNotaCD, labelSubtipoNotaCD, esEmitida, tipoCbteArcaParaNotaCD, calcularTotalesNotaCD)
- Schema Zod crearNotaCDSchema en financial-schemas.ts
- Página /notas-credito-debito con filtros por tipo, tabla y modal de detalle con viajes afectados
- Sidebar con entrada "NC / ND" con icono FileMinus
- Integración en modal de factura: sección NC/ND + botones "Emitir NC" / "Emitir ND"
- Cuentas corrientes empresas y fleteros ajustan saldo con NC/ND (excluyendo estado ANULADA)
- Campos ARCA precalculados (tipoCbte 2/3/7/8 por condicionIva del receptor)

### Gestión de flota (choferes + camiones por fletero)
- Campo `fleteroId` en `Usuario` para vincular CHOFER con su fletero empleador (migración aplicada)
- Relación inversa `Fletero.choferes []` para acceder a todos los choferes del fletero
- `POST /api/camiones/[id]/asignar-chofer`: asignación atómica chofer↔camión (cierra asignación previa, crea CamionChofer, vincula fleteroId en usuario)
- `GET /api/fleteros/[id]/flota`: devuelve camiones activos con chofer actual + choferes sin camión
- `POST /api/usuarios` soporta rol CHOFER con `fleteroId` + `camionId` obligatorios; crea CamionChofer inicial en transacción
- `PATCH /api/usuarios/[id]` soporta `camionId` para reasignación de camión (cierra asignación previa, abre nueva)
- ABM eliminó tab "Choferes" independiente; flota integrada en tab "Fleteros" con subsección expandible por fletero
- FloterosAbm muestra camiones con chofer asignado (verde) o sin chofer (ámbar) + choferes sin camión
- FloterosAbm permite: agregar camión, editar camión, desactivar camión, nuevo chofer (con camión inicial), asignar chofer a camión
- Página `/mi-flota` exclusiva para rol FLETERO: vista de su flota con tarjetas por camión y estado del chofer
- Sidebar: ítem "Mi Flota" con icono Warehouse, visible solo para FLETERO
- `puedeGestionarFlota(rol)` en `permissions.ts`: true solo para FLETERO
- Choferes filtrados por fletero en formulario de nuevo viaje y modal editar viaje
- 218 tests unitarios (4 nuevos para `puedeGestionarFlota`)

### Calidad del código
- LCC documentation en todas las funciones exportadas de lib/
- 14 test suites, 237 tests unitarios, todos pasando
- TypeScript sin errores (npx tsc --noEmit limpio)
- Error handling completo en todos los API endpoints (try/catch + detail en 500)
- Componente compartido FiltroPeriodo para todas las páginas de contabilidad

## Estado de tests
Tests: 237 passed, 237 total (as of 2026-03-31 — Refactorización Cuentas fusionada con Movimientos)

## Módulo Chequeras (implementado 2026-03-31)
- [x] Corrección cheque rechazado: reversión de CC del proveedor y fletero incluida en la transacción atómica — CCs calculadas dinámicamente filtran `anulado: false` en todos los endpoints (calcularSaldoCCFletero, CC historia fletero, CC proveedor)
- [x] Chequeras: consulta ECheq emitidos (generados desde pagos), cartera recibidos con flujo correcto, endoso a brokers con seguimiento de depósito
- [x] Página /contabilidad/chequeras con tabs "ECheq Emitidos" y "Cartera Recibidos"
- [x] Tab Emitidos: alertas vencimiento, filtros (estado/cuenta/beneficiario/período), tabla completa con CUIT/motivo/vinculado a, acciones PATCH (depositar/rechazar), modal detalle
- [x] Tab Recibidos: 3 alertas (próximos a cobrar/vencidos/broker pendientes), alta de adelantos sin factura, filtros (tipo/estado/empresa/factura/período), tabla con Tipo badge + Factura, acciones depositar/endosar/descontar/confirmar broker
- [x] APIs: adelanto, depositar, endosar-broker, confirmar-deposito-broker, endosar-proveedor, endosar-fletero, descontar-banco
- [x] Integración Cuentas: tab "Broker Pendiente" con cheques endosados pendientes de confirmación, filas rojas >30 días, modal confirmar depósito

## Pendiente ARCA

- [ ] Implementar autenticación WSAA con certificado digital X.509 + clave privada RSA
- [ ] Generar TRA (Ticket de Requerimiento de Acceso) y obtener Token + Sign (válidos 12 horas)
- [ ] Implementar `FECompUltimoAutorizado` para sincronizar numeración con ARCA
- [ ] Implementar `FECAESolicitar` para autorizar liquidaciones (tipoCbte 186 o 187)
- [ ] Implementar `FECAESolicitar` para autorizar NC/ND (tipoCbte 2/3/7/8 con campo CmpAsoc)
- [ ] Guardar CAE (14 dígitos) + CAEFchVto en BD al autorizar
- [ ] Actualizar `arcaEstado` a AUTORIZADA/RECHAZADA según respuesta
- [ ] Guardar observaciones de rechazo en `arcaObservaciones`
- [ ] Generar QR según RG 4291 (JSON base64) y guardar en `qrData`
- [ ] Determinar tipoCbte (186 vs 187) por `condicionIva` del fletero al momento de autorizar
- [ ] Variables de entorno: `ARCA_CUIT`, `ARCA_PTO_VENTA`, `ARCA_CERT`, `ARCA_KEY`, `ARCA_MODO`
- [ ] Endpoint POST /api/liquidaciones/[id]/autorizar-arca
- [ ] Endpoint POST /api/notas-credito-debito/[id]/autorizar-arca
- [ ] Homologación: https://wswhomo.afip.gov.ar/wsr/service.asmx
- [ ] Producción: https://servicios1.afip.gov.ar/wsr/service.asmx

### Contabilidad
- [x] Libro IVA Compras y Ventas con exportación PDF/Excel — dos tabs (IVA Ventas / IVA Compras) en formato de libro contable real con totales, 6 endpoints bajo /api/contabilidad/
- [x] IVA por Tipo de Comprobante y Alícuota — dos tabs adicionales (Ventas por Alícuota / Compras por Alícuota) en /contabilidad/iva, agrupados por tipoCbte → alícuota, con PDF y Excel (4 nuevos endpoints)
- [x] Detalle de Gastos por Concepto — nueva página /contabilidad/gastos con filtro de período, tabla agrupada por rubro (FacturaProveedor por concepto + Liquidaciones EMITIDA como "VIAJES CONTRATADOS"), PDF y Excel. Campo concepto agregado a FacturaProveedor con migración y select en formulario de carga.
- [x] Reporte LP vs Facturas (comparación) — página /contabilidad/lp-vs-facturas con tabla agrupada por provincia mostrando subtotal LP vs subtotal factura y diferencia por viaje, con exportación PDF y Excel.
- [x] Reporte Viajes Facturados sin LP — página /contabilidad/viajes-sin-lp con viajes que tienen factura emitida pero no tienen liquidación activa, agrupado por provincia, con exportación PDF y Excel.
- [x] Módulo de Contabilidad completo: IVA (4 tabs), IIBB, Gastos, LP vs Facturas, Viajes sin LP — con exportación PDF/Excel en todas las secciones, página índice /contabilidad, componente FiltroPeriodo compartido, sidebar con 7 ítems.

- [x] Anular/modificar pagos: preview de impacto (`GET /api/pagos-fletero/[id]/impacto-modificacion`, `GET /api/pagos-proveedor/[id]/impacto-modificacion`), anulación atómica con reversión de estado LP/factura y CC (`POST /api/pagos-fletero/[id]/anular`, `POST /api/pagos-proveedor/[id]/anular`), edición con reasignación (`PATCH /api/pagos-fletero/[id]`, `PATCH /api/pagos-proveedor/[id]`), historial inmutable de cambios (`HistorialPago` model + endpoints GET), botón Anular en modal de detalle LP y factura proveedor con modal de preview

## Pendiente general

- [ ] Envío real de emails OTP (actualmente el flujo OTP está implementado pero el transporte de email puede necesitar configuración en producción)
- [ ] Generación de PDF para liquidaciones y facturas (preview modal existe en UI)
- [ ] Generación de PDF para NC/ND (botón "Descargar PDF" actualmente muestra alerta)
- [x] Módulo de pagos a fleteros — Registrar Pago: multi-liquidación, multi-medio (transferencia/ECheq propio/cheque tercero/efectivo), pago parcial, distribución proporcional, impacto en MovimientoSinFactura + chequera + endoso cheques
- [x] Pago a Proveedores: Registrar Pago con comprobante PDF en S3, historial de pagos, Consultar Facturas con filtros y comprobantes — modelo PagoProveedor con 8 tipos de pago, efectos secundarios atómicos (MovimientoSinFactura, ChequeEmitido, endoso de ChequeRecibido, GastoTarjeta + ResumenTarjeta automático), estadoPago en FacturaProveedor, modal de detalle con historial
- [x] Reportes de IIBB por provincia y período — Implementado: tabla agrupada por provincia con fechas/empresa/mercadería/procedencia/subtotal, PDF y Excel
- [x] Cheques físicos vs electrónicos diferenciados en schema, formularios y dashboard — campo `esElectronico` en `ChequeRecibido` (default false) y `ChequeEmitido` (default true, siempre ECheq); separación visual en cartera; badge ECheq en emitidos; distinción físico/ECheq en card del dashboard financiero
- [x] Menú Fleteros renombrado: Líquido Producto, Consultar Liq. Prod., Registrar Pago — labels actualizados en sidebar y títulos h2 en páginas correspondientes
- [x] Separación Líquido Producto / Consultar Liq. Prod.: liquidar-client.tsx (solo creación), consultar-lp-client.tsx (solo consulta con filtros por fletero/estado/período), pages actualizados para cargar solo los datos necesarios
- [x] Módulo unificado de Tarjetas (Contabilidad): modelos Tarjeta/ResumenTarjeta/GastoTarjeta, migración, APIs CRUD completas, página /contabilidad/tarjetas con tabs Corporativas/Prepagas, sidebar actualizado, TabTarjetasPrepagas reemplazado por nota de navegación en CuentasClient
- [x] Módulo Movimientos: MovimientoBancario reemplazado por MovimientoSinFactura (tipo INGRESO/EGRESO + categoria, monto siempre positivo); APIs CRUD /api/movimientos-sin-factura; página /contabilidad/movimientos con filtros, tabla, exportación Excel; TabMovimientos en cuentas simplificado a link; saldo contable y métricas broker actualizadas; todos los side-effects de pago migrados
- [x] Cloudflare R2 configurado: subida de PDFs, URLs firmadas temporales, componentes UploadPDF y ViewPDF reutilizables
  - `liquidaciones/` → PDFs de Líquidos Productos (liquidaciones a fleteros)
  - `facturas-emitidas/` → PDFs de facturas emitidas a empresas
  - `facturas-proveedor/` → PDFs de facturas de proveedores
  - `comprobantes-pago-proveedor/` → Comprobantes de pago a proveedores
  - `comprobantes-pago-fletero/` → Comprobantes de pago de LP a fleteros
  - `resumenes-bancarios/` → Resúmenes mensuales bancarios
  - `resumenes-tarjeta/` → Resúmenes mensuales de tarjetas
- [x] Ingresar Factura de Proveedor mejorado: ítems con alícuota IVA por ítem, regla B/C/X sin discriminación IVA, PDF obligatorio en R2, desglose de ítems en modal de Consultar Facturas
- [x] Pago opcional al ingresar factura de proveedor: registro en un solo paso con transacción atómica; lógica de pago extraída a src/lib/pago-proveedor.ts y compartida con /api/proveedores/[id]/pago
- [x] Gastos por cuenta de fletero: factura proveedor al fletero pagada por Transmagg, CC proveedor con dos secciones, pago desde Registrar Pago identificando factura de fletero, descuento manual en LP con detalle, CC fletero muestra deuda y descuentos
- [x] Módulo Gastos Fleteros: submenú en Fleteros con "Ingresar Gasto" (/fleteros/gastos/ingresar) y "Consultar Gastos" (/fleteros/gastos); formulario sin PDF crea FacturaProveedor + GastoFletero en transacción; eliminado checkbox de proveedores; API GET/POST /api/fleteros/gastos
- [x] Bloqueo de facturación a empresa sin LP con CAE en ARCA: helper viajeEsFacturable(), filtro en facturar-client, validación 422 en POST /api/facturas, badge LP/CAE en viajes, contadores listos/bloqueados en dashboard
- [x] Viajes: provincias de Argentina como select fijo (24 provincias canónicas), carta de porte obligatoria al crear viaje (nro único + PDF en R2 en carpeta cartas-de-porte/), validación de unicidad del nro, filtro por carta de porte en tabla de viajes
- [x] Seed de datos de prueba: 4 empresas, 5 fleteros, 15 viajes, 4 LPs (2 con CAE, 1 sin CAE, 1 borrador), 2 facturas emitidas, 4 facturas proveedor (2 por cuenta de fletero con GastoFletero), 2 cheques emitidos, 3 movimientos sin factura — seed idempotente con cleanup de nuevos modelos (FK enforcement LibSQL)
- [ ] Conciliación bancaria automática
- [ ] Deploy a producción (configurar variables de entorno, dominio, DB en Turso)
