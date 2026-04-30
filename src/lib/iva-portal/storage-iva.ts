/**
 * storage-iva.ts — Helper para subir archivos arbitrarios (TXT, ZIP) a R2.
 *
 * El helper estándar `subirPDF` solo acepta extensión .pdf. Acá usamos
 * directamente el cliente S3 con ContentType configurable.
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

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
 * subirArchivoArbitrario: Buffer string string -> Promise<string>
 *
 * Sube un buffer a R2 con la key exacta indicada (sin agregar fecha/UUID).
 * Devuelve la key.
 *
 * Útil para archivos del Portal IVA que se generan en lote y queremos
 * organizar bajo `libros-iva-arca/YYYY/MM/<timestamp>/...`.
 */
export async function subirArchivoArbitrario(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  return key
}

/**
 * obtenerUrlFirmadaArchivo: string number -> Promise<string>
 *
 * Devuelve URL presignada para descargar archivo (default 15 min).
 */
export async function obtenerUrlFirmadaArchivo(
  key: string,
  expiresInSeconds = 900,
): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  )
}
