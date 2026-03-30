/**
 * Propósito: Tests unitarios para las funciones de OTP (One-Time Password).
 * Cada caso usa exactamente los mismos ejemplos del JSDoc de otp.ts.
 */

import {
  generarCodigoOtp,
  hashearCodigoOtp,
  verificarCodigoOtp,
  calcularExpiracionOtp,
  estaExpirado,
} from "@/lib/otp"

describe("generarCodigoOtp", () => {
  it("generarCodigoOtp().length === 6", () => {
    expect(generarCodigoOtp().length).toBe(6)
  })

  it("/^\\d{6}$/.test(generarCodigoOtp()) === true", () => {
    expect(/^\d{6}$/.test(generarCodigoOtp())).toBe(true)
  })

  it('generarCodigoOtp() siempre produce 6 dígitos numéricos (100 iteraciones)', () => {
    for (let i = 0; i < 100; i++) {
      expect(/^\d{6}$/.test(generarCodigoOtp())).toBe(true)
    }
  })
})

describe("hashearCodigoOtp", () => {
  it('(await hashearCodigoOtp("042891")).startsWith("$2") === true', async () => {
    expect((await hashearCodigoOtp("042891")).startsWith("$2")).toBe(true)
  })

  it('await hashearCodigoOtp("042891") !== "042891" === true', async () => {
    expect(await hashearCodigoOtp("042891")).not.toBe("042891")
  })

  it('await hashearCodigoOtp("000000") !== "000000" === true', async () => {
    expect(await hashearCodigoOtp("000000")).not.toBe("000000")
  })
})

describe("verificarCodigoOtp", () => {
  it('await verificarCodigoOtp("042891", await hashearCodigoOtp("042891")) === true', async () => {
    expect(await verificarCodigoOtp("042891", await hashearCodigoOtp("042891"))).toBe(true)
  })

  it('await verificarCodigoOtp("999999", await hashearCodigoOtp("042891")) === false', async () => {
    expect(await verificarCodigoOtp("999999", await hashearCodigoOtp("042891"))).toBe(false)
  })

  it('await verificarCodigoOtp("000000", await hashearCodigoOtp("000000")) === true', async () => {
    expect(await verificarCodigoOtp("000000", await hashearCodigoOtp("000000"))).toBe(true)
  })
})

describe("calcularExpiracionOtp", () => {
  it("calcularExpiracionOtp() > new Date() === true", () => {
    expect(calcularExpiracionOtp() > new Date()).toBe(true)
  })

  it("calcularExpiracionOtp().getTime() > Date.now() === true", () => {
    expect(calcularExpiracionOtp().getTime() > Date.now()).toBe(true)
  })

  it("calcularExpiracionOtp().getTime() - Date.now() <= 10 * 60000 === true", () => {
    expect(calcularExpiracionOtp().getTime() - Date.now() <= 10 * 60000).toBe(true)
  })
})

describe("estaExpirado", () => {
  it('estaExpirado(new Date("2020-01-01")) === true', () => {
    expect(estaExpirado(new Date("2020-01-01"))).toBe(true)
  })

  it("estaExpirado(new Date(Date.now() + 600000)) === false", () => {
    expect(estaExpirado(new Date(Date.now() + 600000))).toBe(false)
  })

  it("estaExpirado(new Date(Date.now() - 1)) === true", () => {
    expect(estaExpirado(new Date(Date.now() - 1))).toBe(true)
  })
})
