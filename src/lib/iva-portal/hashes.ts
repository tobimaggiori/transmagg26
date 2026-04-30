/**
 * hashes.ts — SHA256 para trazabilidad de archivos exportados.
 */

import { createHash } from "crypto"

/**
 * sha256: Buffer | string -> string (hex 64 chars)
 *
 * Devuelve el hash SHA256 en hex lowercase.
 *
 * Ejemplos:
 * sha256("") === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
 * sha256("hola").length === 64
 */
export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex")
}
