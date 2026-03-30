-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "otp_codigos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "codigo_hash" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "expira_en" DATETIME NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "otp_codigos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "condicion_iva" TEXT NOT NULL,
    "direccion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "empresa_usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nivel_acceso" TEXT NOT NULL,
    CONSTRAINT "empresa_usuarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "empresa_usuarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fleteros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "condicion_iva" TEXT NOT NULL,
    "comision_default" REAL NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "fleteros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "camiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "patente_chasis" TEXT NOT NULL,
    "patente_acoplado" TEXT,
    "tipo_camion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "camiones_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "camion_chofer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "camion_id" TEXT NOT NULL,
    "chofer_id" TEXT NOT NULL,
    "desde" DATETIME NOT NULL,
    "hasta" DATETIME,
    CONSTRAINT "camion_chofer_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "camion_chofer_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "viajes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "camion_id" TEXT NOT NULL,
    "chofer_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "fecha_viaje" DATETIME NOT NULL,
    "remito" TEXT,
    "cupo" TEXT,
    "mercaderia" TEXT,
    "procedencia" TEXT,
    "provincia_origen" TEXT,
    "destino" TEXT,
    "provincia_destino" TEXT,
    "kilos" REAL,
    "tarifa_base" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "viajes_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "viajes_en_liquidacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viaje_id" TEXT NOT NULL,
    "liquidacion_id" TEXT NOT NULL,
    "tarifa_fletero" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "viajes_en_liquidacion_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_en_liquidacion_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "viajes_en_factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viaje_id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "tarifa_empresa" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "viajes_en_factura_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viajes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viajes_en_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "liquidaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "comision_pct" REAL NOT NULL,
    "subtotal_bruto" REAL NOT NULL,
    "comision_monto" REAL NOT NULL,
    "neto" REAL NOT NULL,
    "iva_monto" REAL NOT NULL,
    "total" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "pdf_s3_key" TEXT,
    "grabada_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "liquidaciones_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "liquidaciones_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "facturas_emitidas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "operador_id" TEXT NOT NULL,
    "nro_comprobante" TEXT,
    "tipo_cbte" TEXT NOT NULL,
    "neto" REAL NOT NULL,
    "iva_monto" REAL NOT NULL,
    "total" REAL NOT NULL,
    "estado_arca" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "pdf_s3_key" TEXT,
    "emitida_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "facturas_emitidas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_emitidas_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagos_a_fleteros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fletero_id" TEXT NOT NULL,
    "liquidacion_id" TEXT NOT NULL,
    "tipo_pago" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "referencia" TEXT,
    "fecha_pago" DATETIME NOT NULL,
    "comprobante_s3_key" TEXT,
    CONSTRAINT "pagos_a_fleteros_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_a_fleteros_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagos_de_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "tipo_pago" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "referencia" TEXT,
    "fecha_pago" DATETIME NOT NULL,
    "comprobante_s3_key" TEXT,
    CONSTRAINT "pagos_de_empresas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagos_de_empresas_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_emitidas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "condicion_iva" TEXT NOT NULL,
    "rubro" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "facturas_proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proveedor_id" TEXT NOT NULL,
    "nro_comprobante" TEXT NOT NULL,
    "tipo_cbte" TEXT NOT NULL,
    "neto" REAL NOT NULL,
    "iva_monto" REAL NOT NULL,
    "total" REAL NOT NULL,
    "fecha_cbte" DATETIME NOT NULL,
    "pdf_s3_key" TEXT,
    CONSTRAINT "facturas_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagos_a_proveedores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_proveedor_id" TEXT NOT NULL,
    "tipo_pago" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "referencia" TEXT,
    "fecha_pago" DATETIME NOT NULL,
    CONSTRAINT "pagos_a_proveedores_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asientos_iva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factura_emitida_id" TEXT,
    "factura_proveedor_id" TEXT,
    "tipo_referencia" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "base_imponible" REAL NOT NULL,
    "alicuota" REAL NOT NULL,
    "monto_iva" REAL NOT NULL,
    "periodo" TEXT NOT NULL,
    CONSTRAINT "asientos_iva_factura_emitida_id_fkey" FOREIGN KEY ("factura_emitida_id") REFERENCES "facturas_emitidas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iva_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asientos_iibb" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viaje_en_liq_id" TEXT,
    "viaje_en_fact_id" TEXT,
    "tabla_origen" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "monto_ingreso" REAL NOT NULL,
    "periodo" TEXT NOT NULL,
    CONSTRAINT "asientos_iibb_viaje_en_liq_id_fkey" FOREIGN KEY ("viaje_en_liq_id") REFERENCES "viajes_en_liquidacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asientos_iibb_viaje_en_fact_id_fkey" FOREIGN KEY ("viaje_en_fact_id") REFERENCES "viajes_en_factura" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "nextauth_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "nextauth_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nextauth_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "email_verified" DATETIME,
    "image" TEXT
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cuit_key" ON "empresas"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "empresa_usuarios_empresa_id_usuario_id_key" ON "empresa_usuarios"("empresa_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "fleteros_usuario_id_key" ON "fleteros"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "fleteros_cuit_key" ON "fleteros"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "camiones_patente_chasis_key" ON "camiones"("patente_chasis");

-- CreateIndex
CREATE UNIQUE INDEX "viajes_en_liquidacion_viaje_id_liquidacion_id_key" ON "viajes_en_liquidacion"("viaje_id", "liquidacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "viajes_en_factura_viaje_id_factura_id_key" ON "viajes_en_factura"("viaje_id", "factura_id");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_cuit_key" ON "proveedores"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "nextauth_users_email_key" ON "nextauth_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

