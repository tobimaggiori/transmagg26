/**
 * Propósito: Cifrado simétrico para datos sensibles de ARCA almacenados en DB.
 * Usa AES-256-GCM con la master key de ENCRYPTION_KEY (ya existente en el proyecto).
 *
 * Formato cifrado: "enc:v1:{iv_base64}:{authTag_base64}:{ciphertext_base64}"
 * Si un valor NO empieza con "enc:v1:", se trata como texto plano (legacy/migración).
 *
 * Esto permite migración progresiva: los datos existentes sin cifrar siguen funcionando.
 * Al guardar, siempre se cifra. Al leer, se descifra o se devuelve tal cual si es legacy.
 */

import crypto from "crypto"

const CIFRADO_PREFIJO = "enc:v1:"
const ALGORITMO = "aes-256-gcm"
const IV_BYTES = 16
const AUTH_TAG_BYTES = 16

/**
 * obtenerMasterKey: () -> Buffer | null
 *
 * Obtiene la master key de la variable de entorno ENCRYPTION_KEY.
 * Devuelve null si no está configurada (cifrado deshabilitado).
 * La key se hashea con SHA-256 para garantizar 32 bytes exactos.
 */
function obtenerMasterKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) return null
  return crypto.createHash("sha256").update(raw).digest()
}

/**
 * cifrarValor: (plaintext: string) -> string
 *
 * Cifra un valor sensible con AES-256-GCM usando ENCRYPTION_KEY.
 * Si ENCRYPTION_KEY no está configurada, devuelve el valor sin cifrar.
 *
 * @param plaintext — Valor a cifrar.
 * @returns Valor cifrado con prefijo "enc:v1:" o el valor original si no hay key.
 *
 * Ejemplos:
 * cifrarValor("mi-password-secreto") === "enc:v1:abc...:def...:ghi..."
 * cifrarValor("x") sin ENCRYPTION_KEY === "x" (sin cifrar)
 */
export function cifrarValor(plaintext: string): string {
  const key = obtenerMasterKey()
  if (!key) return plaintext

  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITMO, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${CIFRADO_PREFIJO}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`
}

/**
 * descifrarValor: (valor: string) -> string
 *
 * Descifra un valor cifrado con cifrarValor. Si el valor no tiene el prefijo
 * "enc:v1:", lo devuelve tal cual (legacy/texto plano). Si la descifración falla,
 * también devuelve el valor original (backward compatible).
 *
 * @param valor — Valor cifrado o texto plano.
 * @returns Texto descifrado o el valor original si no está cifrado.
 *
 * Ejemplos:
 * descifrarValor("enc:v1:abc...:def...:ghi...") === "mi-password-secreto"
 * descifrarValor("texto-plano-legacy") === "texto-plano-legacy"
 */
export function descifrarValor(valor: string): string {
  if (!valor.startsWith(CIFRADO_PREFIJO)) return valor

  const key = obtenerMasterKey()
  if (!key) return valor

  try {
    const parts = valor.slice(CIFRADO_PREFIJO.length).split(":")
    if (parts.length !== 3) return valor

    const iv = Buffer.from(parts[0], "base64")
    const authTag = Buffer.from(parts[1], "base64")
    const encrypted = Buffer.from(parts[2], "base64")

    if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) return valor

    const decipher = crypto.createDecipheriv(ALGORITMO, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString("utf8")
  } catch {
    // Descifrado falló — devolver valor original (puede ser legacy o key incorrecta)
    return valor
  }
}

/**
 * estaCifrado: (valor: string) -> boolean
 *
 * Verifica si un valor tiene el formato de cifrado "enc:v1:".
 */
export function estaCifrado(valor: string): boolean {
  return valor.startsWith(CIFRADO_PREFIJO)
}
