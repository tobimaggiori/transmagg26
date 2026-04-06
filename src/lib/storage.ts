/**
 * Propósito: Servicio de almacenamiento en Cloudflare R2 (compatible con S3).
 * Centraliza toda operación de subida, descarga y eliminación de archivos.
 *
 * Estructura de carpetas en el bucket "transmagg":
 *   liquidaciones/                → PDFs de Líquidos Productos (liquidaciones a fleteros)
 *   facturas-emitidas/            → PDFs de facturas emitidas a empresas
 *   facturas-proveedor/           → PDFs de facturas de proveedores
 *   comprobantes-pago-proveedor/  → Comprobantes de pago a proveedores (asignados a factura)
 *   comprobantes-pago-fletero/    → Comprobantes de pago de LP a fleteros
 *   resumenes-bancarios/          → Resúmenes mensuales bancarios
 *   resumenes-tarjeta/            → Resúmenes mensuales de tarjetas
 *   cartas-de-porte/              → PDFs de cartas de porte de viajes
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"

export type StoragePrefijo =
  | "liquidaciones"
  | "facturas-emitidas"
  | "facturas-proveedor"
  | "comprobantes-pago-proveedor"
  | "comprobantes-pago-fletero"
  | "resumenes-bancarios"
  | "resumenes-tarjeta"
  | "cartas-de-porte"
  | "polizas"
  | "recibos-cobranza"
  | "comprobantes-impuestos"
  | "comprobantes-infracciones"
  | "libros-iva"
  | "libros-iibb"
  | "libros-percepciones"
  | "cierres-resumen"

export const PREFIJOS_VALIDOS: StoragePrefijo[] = [
  "liquidaciones",
  "facturas-emitidas",
  "facturas-proveedor",
  "comprobantes-pago-proveedor",
  "comprobantes-pago-fletero",
  "resumenes-bancarios",
  "resumenes-tarjeta",
  "cartas-de-porte",
  "polizas",
  "recibos-cobranza",
  "comprobantes-impuestos",
  "comprobantes-infracciones",
  "libros-iva",
  "libros-iibb",
  "libros-percepciones",
  "cierres-resumen",
]

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET!

/**
 * subirPDF: (buffer, prefijo, nombreArchivo?) -> Promise<string>
 *
 * Dado un buffer PDF y un prefijo de carpeta, sube el archivo a R2 y devuelve la key.
 * El nombre de archivo en el bucket es siempre un UUID para evitar colisiones.
 * Existe para centralizar la subida de PDFs desde API routes del servidor.
 *
 * Ejemplos:
 * subirPDF(buf, "liquidaciones") === "liquidaciones/550e8400-e29b-41d4-a716-446655440000.pdf"
 * subirPDF(buf, "facturas-proveedor", "FAC-001.pdf") === "facturas-proveedor/uuid.pdf"
 */
export async function subirPDF(
  buffer: Buffer,
  prefijo: StoragePrefijo,
  nombreArchivo?: string
): Promise<string> {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const key = `${prefijo}/${yyyy}/${mm}/${randomUUID()}.pdf`
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
      ContentDisposition: nombreArchivo
        ? `inline; filename="${nombreArchivo}"`
        : "inline",
    })
  )
  return key
}

/**
 * obtenerUrlFirmada: (key, expiresInSeconds?) -> Promise<string>
 *
 * Dado la key de un archivo en R2, genera una URL temporal firmada para visualizarlo.
 * Solo usar en server components o API routes — nunca exponer la URL en el cliente directamente.
 * La URL expira a los 15 minutos por defecto.
 * Existe para permitir que el navegador descargue PDFs sin exponer las credenciales de R2.
 *
 * Ejemplos:
 * obtenerUrlFirmada("liquidaciones/uuid.pdf") === "https://.../?X-Amz-Signature=..."
 * obtenerUrlFirmada("liquidaciones/uuid.pdf", 3600) === URL válida por 1 hora
 */
export async function obtenerUrlFirmada(
  key: string,
  expiresInSeconds = 900
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds })
}

/**
 * eliminarArchivo: (key) -> Promise<void>
 *
 * Dado la key de un archivo en R2, lo elimina permanentemente.
 * Operación irreversible — solo usar al anular documentos.
 * Existe para limpiar el almacenamiento cuando un documento queda obsoleto.
 *
 * Ejemplos:
 * eliminarArchivo("liquidaciones/uuid.pdf") === void (archivo eliminado)
 */
export async function eliminarArchivo(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

/**
 * storageConfigurado: () -> boolean
 *
 * Devuelve true si todas las variables de entorno de R2 están presentes.
 * Útil para mostrar warnings en desarrollo si falta configuración
 * y para que los endpoints respondan 503 en lugar de lanzar excepciones.
 *
 * Ejemplos:
 * storageConfigurado() === true  // variables presentes
 * storageConfigurado() === false // falta R2_ENDPOINT o credenciales
 */
export async function listarArchivos(prefijo: string): Promise<string[]> {
  const keys: string[] = []
  let continuationToken: string | undefined
  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefijo,
        ContinuationToken: continuationToken,
      })
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key)
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)
  return keys
}

export async function eliminarArchivos(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0
  let eliminados = 0
  for (let i = 0; i < keys.length; i += 1000) {
    const lote = keys.slice(i, i + 1000)
    const res = await r2.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: lote.map((k) => ({ Key: k })) },
      })
    )
    eliminados += res.Deleted?.length ?? 0
  }
  return eliminados
}

export async function obtenerArchivo(key: string): Promise<Buffer> {
  const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const stream = res.Body as NodeJS.ReadableStream
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export function storageConfigurado(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  )
}
