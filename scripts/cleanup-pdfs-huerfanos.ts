/**
 * Borra PDFs huérfanos en R2 bajo los prefijos `ctg/` y `remitos/`.
 *
 * Un PDF se considera huérfano cuando:
 *   - No está referenciado en `viajes.ctg_s3_key` ni en `viajes.remito_s3_key`.
 *   - Tiene más de N horas de antigüedad (default 24h, ajustable con --grace=H).
 *     El grace period evita borrar archivos recién subidos cuyo viaje aún
 *     no fue persistido (operador llenando el formulario).
 *
 * Diseñado para correrse periódicamente vía cron. Idempotente: si no hay
 * huérfanos, sale con código 0 y no toca nada.
 *
 * Uso:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/cleanup-pdfs-huerfanos.ts --dry-run
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/cleanup-pdfs-huerfanos.ts --apply
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/cleanup-pdfs-huerfanos.ts --apply --grace=48
 */

import "dotenv/config"
import {
  listarArchivosConMeta,
  eliminarArchivos,
  storageConfigurado,
} from "../src/lib/storage"
import { prisma } from "../src/lib/prisma"

const PREFIJOS = ["ctg/", "remitos/"] as const

function parseGraceHours(): number {
  const arg = process.argv.find((a) => a.startsWith("--grace="))
  if (!arg) return 24
  const n = parseInt(arg.slice("--grace=".length), 10)
  return Number.isFinite(n) && n >= 0 ? n : 24
}

async function main() {
  const apply = process.argv.includes("--apply")
  const dryRun = !apply
  const graceHours = parseGraceHours()
  const cutoff = new Date(Date.now() - graceHours * 60 * 60 * 1000)

  if (!storageConfigurado()) {
    console.error("R2 no configurado. Verificá variables R2_*.")
    process.exit(1)
  }

  console.log(`[cleanup-huérfanos] modo: ${dryRun ? "DRY-RUN" : "APPLY"} · grace: ${graceHours}h · cutoff: ${cutoff.toISOString()}`)

  // 1. Cargar todas las keys referenciadas en DB.
  const referenciados = await prisma.viaje.findMany({
    where: {
      OR: [
        { ctgS3Key: { not: null } },
        { remitoS3Key: { not: null } },
      ],
    },
    select: { ctgS3Key: true, remitoS3Key: true },
  })
  const refSet = new Set<string>()
  for (const v of referenciados) {
    if (v.ctgS3Key) refSet.add(v.ctgS3Key)
    if (v.remitoS3Key) refSet.add(v.remitoS3Key)
  }
  console.log(`Referenciadas en DB: ${refSet.size} keys`)

  // 2. Listar R2 y filtrar huérfanos.
  const huerfanos: string[] = []
  let totalR2 = 0
  let recientes = 0
  for (const prefijo of PREFIJOS) {
    const items = await listarArchivosConMeta(prefijo)
    totalR2 += items.length
    for (const { key, lastModified } of items) {
      if (refSet.has(key)) continue
      if (lastModified && lastModified > cutoff) {
        recientes++
        continue
      }
      huerfanos.push(key)
    }
  }
  console.log(`Total en R2 (${PREFIJOS.join(", ")}): ${totalR2}`)
  console.log(`Recientes (dentro del grace period): ${recientes}`)
  console.log(`Huérfanos a borrar: ${huerfanos.length}`)

  if (huerfanos.length === 0) {
    console.log("Nada que hacer.")
    return
  }

  if (dryRun) {
    for (const k of huerfanos.slice(0, 20)) console.log(`  [borraría] ${k}`)
    if (huerfanos.length > 20) console.log(`  ... +${huerfanos.length - 20} más`)
    console.log("\nPara borrar, correr nuevamente con --apply")
    return
  }

  const borrados = await eliminarArchivos(huerfanos)
  console.log(`Borrados: ${borrados}`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
