/**
 * Tests de los schemas de creación/actualización de Banco y Cuenta tras el refactor
 * que introdujo la tabla `Banco` y el campo `bancoId` en `Cuenta`.
 *
 * Invariantes:
 *  - Cuenta.tipo = BANCO exige bancoId.
 *  - Cuenta.tipo != BANCO prohibe bancoId.
 *  - Banco.nombre es obligatorio al crear.
 */

import {
  crearBancoSchema,
  actualizarBancoSchema,
  crearBilleteraVirtualSchema,
  actualizarBilleteraVirtualSchema,
  crearBrokerSchema,
  actualizarBrokerSchema,
  crearCuentaSchema,
} from "@/lib/financial-schemas"

const cuentaBaseValida = {
  nombre: "Galicia CC ARS",
  moneda: "PESOS",
  saldoInicial: 0,
  activa: true,
  tieneImpuestoDebcred: false,
  alicuotaImpuesto: 0.006,
  tieneChequera: true,
  tieneCuentaRemunerada: false,
  tieneTarjetasPrepagasChoferes: false,
  esCuentaComitenteBroker: false,
  tieneIibbSircrebTucuman: false,
  alicuotaIibbSircrebTucuman: 0.06,
}

describe("crearBancoSchema", () => {
  it("acepta nombre válido", () => {
    expect(crearBancoSchema.safeParse({ nombre: "Banco Galicia" }).success).toBe(true)
  })

  it("rechaza nombre vacío", () => {
    expect(crearBancoSchema.safeParse({ nombre: "" }).success).toBe(false)
  })

  it("rechaza nombre faltante", () => {
    expect(crearBancoSchema.safeParse({}).success).toBe(false)
  })
})

describe("actualizarBancoSchema", () => {
  it("acepta cambio de nombre", () => {
    expect(actualizarBancoSchema.safeParse({ nombre: "BNA" }).success).toBe(true)
  })

  it("acepta desactivación", () => {
    expect(actualizarBancoSchema.safeParse({ activo: false }).success).toBe(true)
  })

  it("acepta body vacío (no-op)", () => {
    expect(actualizarBancoSchema.safeParse({}).success).toBe(true)
  })
})

describe("crearBilleteraVirtualSchema / actualizarBilleteraVirtualSchema", () => {
  it("acepta nombre válido", () => {
    expect(crearBilleteraVirtualSchema.safeParse({ nombre: "MercadoPago" }).success).toBe(true)
  })
  it("rechaza nombre vacío", () => {
    expect(crearBilleteraVirtualSchema.safeParse({ nombre: "" }).success).toBe(false)
  })
  it("acepta activa/nombre en update", () => {
    expect(actualizarBilleteraVirtualSchema.safeParse({ activa: false }).success).toBe(true)
    expect(actualizarBilleteraVirtualSchema.safeParse({ nombre: "Ualá" }).success).toBe(true)
    expect(actualizarBilleteraVirtualSchema.safeParse({}).success).toBe(true)
  })
})

describe("crearBrokerSchema / actualizarBrokerSchema", () => {
  it("acepta nombre + CUIT válido (sin cuentaId)", () => {
    expect(crearBrokerSchema.safeParse({ nombre: "Bull Market", cuit: "30712345678" }).success).toBe(true)
  })
  it("rechaza CUIT con formato inválido", () => {
    expect(crearBrokerSchema.safeParse({ nombre: "X", cuit: "123" }).success).toBe(false)
  })
  it("acepta PATCH parcial", () => {
    expect(actualizarBrokerSchema.safeParse({ activo: false }).success).toBe(true)
    expect(actualizarBrokerSchema.safeParse({ nombre: "IOL" }).success).toBe(true)
    expect(actualizarBrokerSchema.safeParse({}).success).toBe(true)
  })
})

describe("crearCuentaSchema — coherencia tipo ↔ entidad maestra", () => {
  const uuidA = "550e8400-e29b-41d4-a716-446655440000"
  const uuidB = "550e8400-e29b-41d4-a716-446655440001"

  it("BANCO: acepta con bancoId", () => {
    expect(
      crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BANCO", bancoId: uuidA }).success,
    ).toBe(true)
  })
  it("BANCO: rechaza sin bancoId", () => {
    expect(crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BANCO" }).success).toBe(false)
  })
  it("BANCO: rechaza si también trae billeteraId o brokerId", () => {
    expect(
      crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BANCO", bancoId: uuidA, billeteraId: uuidB }).success,
    ).toBe(false)
    expect(
      crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BANCO", bancoId: uuidA, brokerId: uuidB }).success,
    ).toBe(false)
  })

  it("BILLETERA_VIRTUAL: acepta con billeteraId", () => {
    expect(
      crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BILLETERA_VIRTUAL", billeteraId: uuidA }).success,
    ).toBe(true)
  })
  it("BILLETERA_VIRTUAL: rechaza sin billeteraId", () => {
    expect(
      crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BILLETERA_VIRTUAL" }).success,
    ).toBe(false)
  })
  it("BILLETERA_VIRTUAL: rechaza si también trae bancoId o brokerId", () => {
    expect(
      crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BILLETERA_VIRTUAL", billeteraId: uuidA, bancoId: uuidB }).success,
    ).toBe(false)
    expect(
      crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BILLETERA_VIRTUAL", billeteraId: uuidA, brokerId: uuidB }).success,
    ).toBe(false)
  })

  it("BROKER: acepta con brokerId", () => {
    expect(
      crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BROKER", brokerId: uuidA }).success,
    ).toBe(true)
  })
  it("BROKER: rechaza sin brokerId", () => {
    expect(crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BROKER" }).success).toBe(false)
  })
  it("BROKER: rechaza si también trae bancoId o billeteraId", () => {
    expect(
      crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BROKER", brokerId: uuidA, bancoId: uuidB }).success,
    ).toBe(false)
    expect(
      crearCuentaSchema.safeParse({ ...cuentaBaseValida, tipo: "BROKER", brokerId: uuidA, billeteraId: uuidB }).success,
    ).toBe(false)
  })
})
