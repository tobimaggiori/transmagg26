/**
 * Script de migración de datos — ejecutar UNA SOLA VEZ en producción.
 * Crea AsientoIva de tipo VENTA para los LPs que ya están en estado EMITIDA
 * y aún no tienen un AsientoIva asociado.
 *
 * Ejecutar con:
 *   npx ts-node prisma/fix-asiento-iva-liquidaciones.ts
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  const liquidaciones = await prisma.liquidacion.findMany({
    where: {
      estado: "EMITIDA",
      asientoIva: null,
    },
    select: {
      id: true,
      neto: true,
      ivaMonto: true,
      ivaPct: true,
      grabadaEn: true,
    },
  })

  console.log(`LPs emitidos sin AsientoIva: ${liquidaciones.length}`)

  let creados = 0
  for (const liq of liquidaciones) {
    await prisma.asientoIva.create({
      data: {
        tipo: "VENTA",
        tipoReferencia: "LIQUIDACION",
        periodo: liq.grabadaEn.toISOString().slice(0, 7),
        baseImponible: liq.neto,
        alicuota: liq.ivaPct,
        montoIva: liq.ivaMonto,
        liquidacionId: liq.id,
      },
    })
    creados++
  }

  console.log(`✅ AsientoIva creados: ${creados}`)
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
