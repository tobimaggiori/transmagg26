/**
 * Propósito: Tests unitarios para las funciones de storage.ts que no requieren R2.
 * Cubre storageConfigurado() con distintas combinaciones de variables de entorno.
 */

import { storageConfigurado } from "@/lib/storage"

const ENV_VARS = ["R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]

function setEnvVars(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) {
      delete process.env[k]
    } else {
      process.env[k] = v
    }
  }
}

afterEach(() => {
  // Limpiar para no contaminar otros tests
  for (const v of ENV_VARS) delete process.env[v]
})

describe("storageConfigurado", () => {
  it("devuelve true cuando todas las variables de entorno están presentes", () => {
    setEnvVars({
      R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
      R2_ACCESS_KEY_ID: "access-key",
      R2_SECRET_ACCESS_KEY: "secret-key",
      R2_BUCKET: "transmagg",
    })
    expect(storageConfigurado()).toBe(true)
  })

  it("devuelve false cuando falta R2_ENDPOINT", () => {
    setEnvVars({
      R2_ENDPOINT: undefined,
      R2_ACCESS_KEY_ID: "access-key",
      R2_SECRET_ACCESS_KEY: "secret-key",
      R2_BUCKET: "transmagg",
    })
    expect(storageConfigurado()).toBe(false)
  })

  it("devuelve false cuando falta R2_BUCKET", () => {
    setEnvVars({
      R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
      R2_ACCESS_KEY_ID: "access-key",
      R2_SECRET_ACCESS_KEY: "secret-key",
      R2_BUCKET: undefined,
    })
    expect(storageConfigurado()).toBe(false)
  })

  it("devuelve false cuando ninguna variable está configurada", () => {
    for (const v of ENV_VARS) delete process.env[v]
    expect(storageConfigurado()).toBe(false)
  })
})
