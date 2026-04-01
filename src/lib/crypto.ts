import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error("ENCRYPTION_KEY no está configurada")
  const buf = Buffer.from(key, "hex")
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY debe ser 64 caracteres hex (256 bits)")
  return buf
}

/**
 * encrypt: (plaintext: string) -> string
 *
 * Cifra un texto con AES-256-GCM usando ENCRYPTION_KEY del entorno.
 * Devuelve "<iv_hex>:<tag_hex>:<ciphertext_hex>" — todo en hex para
 * almacenamiento seguro en base de datos.
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

/**
 * decrypt: (ciphertext: string) -> string
 *
 * Descifra un string en formato "<iv_hex>:<tag_hex>:<ciphertext_hex>"
 * producido por encrypt(). Lanza si la clave o los datos son inválidos.
 */
export function decrypt(ciphertext: string): string {
  const key = getKey()
  const parts = ciphertext.split(":")
  if (parts.length !== 3) throw new Error("Formato de ciphertext inválido")
  const [ivHex, tagHex, encHex] = parts
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const encrypted = Buffer.from(encHex, "hex")
  if (iv.length !== IV_LENGTH) throw new Error("IV inválido")
  if (tag.length !== TAG_LENGTH) throw new Error("Tag inválido")
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final("utf8")
}
