-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camiones" (
    "id" TEXT NOT NULL,
    "patente_chasis" TEXT NOT NULL,
    "patente_acoplado" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "camiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viajes" (
    "id" TEXT NOT NULL,
    "fecha_viaje" TIMESTAMP(3) NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "camion_id" TEXT NOT NULL,
    "chofer_id" TEXT NOT NULL,
    "operador_email" TEXT NOT NULL,
    "remito" TEXT,
    "remito_s3_key" TEXT,
    "tiene_ctg" BOOLEAN NOT NULL DEFAULT false,
    "nro_ctg" TEXT,
    "ctg_s3_key" TEXT,
    "cpe" TEXT,
    "tiene_cupo" BOOLEAN NOT NULL DEFAULT false,
    "cupo" TEXT,
    "mercaderia" TEXT NOT NULL,
    "procedencia" TEXT,
    "provincia_origen" TEXT,
    "destino" TEXT,
    "provincia_destino" TEXT,
    "kilos" INTEGER,
    "tarifa" DECIMAL(65,30) NOT NULL,
    "historial_cambios" TEXT DEFAULT '[]',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viajes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cuit_key" ON "empresas"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "camiones_patente_chasis_key" ON "camiones"("patente_chasis");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_email_key" ON "empleados"("email");

-- CreateIndex
CREATE INDEX "viajes_nro_ctg_idx" ON "viajes"("nro_ctg");

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "camiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
