-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fletero_id" TEXT,
    CONSTRAINT "usuarios_fletero_id_fkey" FOREIGN KEY ("fletero_id") REFERENCES "fleteros" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_usuarios" ("activo", "apellido", "creado_en", "email", "id", "nombre", "rol", "telefono") SELECT "activo", "apellido", "creado_en", "email", "id", "nombre", "rol", "telefono" FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
