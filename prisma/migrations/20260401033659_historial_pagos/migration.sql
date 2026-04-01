-- CreateTable
CREATE TABLE "historial_pagos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pago_fletero_id" TEXT,
    "pago_proveedor_id" TEXT,
    "tipo_evento" TEXT NOT NULL,
    "justificacion" TEXT NOT NULL,
    "estado_anterior" TEXT,
    "operador_id" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historial_pagos_pago_fletero_id_fkey" FOREIGN KEY ("pago_fletero_id") REFERENCES "pagos_a_fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "historial_pagos_pago_proveedor_id_fkey" FOREIGN KEY ("pago_proveedor_id") REFERENCES "pagos_proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "historial_pagos_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
