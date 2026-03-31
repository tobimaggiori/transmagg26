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
- CRUD de Movimientos bancarios (con sugerencia automática de impuesto débito/crédito)
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

### Calidad del código
- LCC documentation en todas las funciones exportadas de lib/
- 12 test suites, 208 tests unitarios, todos pasando
- TypeScript sin errores (npx tsc --noEmit limpio)
- Error handling completo en todos los API endpoints (try/catch + detail en 500)

## Estado de tests
Tests: 208 passed, 208 total (as of 2026-03-31)

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

## Pendiente general

- [ ] Envío real de emails OTP (actualmente el flujo OTP está implementado pero el transporte de email puede necesitar configuración en producción)
- [ ] Generación de PDF para liquidaciones y facturas (preview modal existe en UI)
- [ ] Generación de PDF para NC/ND (botón "Descargar PDF" actualmente muestra alerta)
- [ ] Módulo de pagos a fleteros (la tabla `PagoLiquidacion` existe en schema pero no hay CRUD completo)
- [ ] Módulo de cobros de facturas (la tabla `PagoFactura` existe en schema pero no hay CRUD completo)
- [ ] Reportes de IIBB por provincia y período
- [ ] Conciliación bancaria automática
- [ ] Deploy a producción (configurar variables de entorno, dominio, DB en Turso)
