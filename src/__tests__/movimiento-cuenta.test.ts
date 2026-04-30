/**
 * Tests de los helpers del libro de movimientos de cuenta y conciliación.
 *
 * Cubre:
 *  - Utilidades puras: aDiaUtc, rangoMesUtc.
 *  - registrarMovimiento: validaciones, asignación de orden, bloqueos por sellado/cierre.
 *  - calcularSaldoAFecha: base + movimientos, respeto de fechaSaldoInicial.
 *  - sellarDia / desellarDia: upsert, idempotencia, bloqueo por cierre.
 *  - cerrarMes / reabrirMes: precondiciones.
 *  - estadoMesCuenta: derivación correcta de los 5 estados.
 *  - cuentasActivasConMesAbierto / mesCerradoParaTodasLasCuentas.
 */

const mockTx = {
  movimientoCuenta: {
    aggregate: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  conciliacionDia: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  cierreMesCuenta: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  cuenta: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
}

const mockPrisma = {
  ...mockTx,
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import {
  aDiaUtc,
  rangoMesUtc,
  registrarMovimiento,
  registrarMovimientoManualConImpuestos,
  esCategoriaImpuestoAutogenerado,
  calcularSaldoAFecha,
  calcularSaldoActual,
} from "@/lib/movimiento-cuenta"
import {
  sellarDia,
  desellarDia,
  cerrarMes,
  reabrirMes,
  estadoMesCuenta,
  cuentasActivasConMesAbierto,
  mesCerradoParaTodasLasCuentas,
  diasConMovimientosPendientesDeSellar,
} from "@/lib/conciliacion"

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── Puros ──────────────────────────────────────────────────────────────────

describe("aDiaUtc", () => {
  it("trunca hora de un Date ISO con hora", () => {
    expect(aDiaUtc(new Date("2026-04-15T10:30:00Z")).toISOString()).toBe(
      "2026-04-15T00:00:00.000Z"
    )
  })

  it("deja un Date ya truncado igual", () => {
    expect(aDiaUtc(new Date("2026-04-15T00:00:00Z")).toISOString()).toBe(
      "2026-04-15T00:00:00.000Z"
    )
  })
})

describe("rangoMesUtc", () => {
  it("abril 2026", () => {
    const r = rangoMesUtc(4, 2026)
    expect(r.desde.toISOString()).toBe("2026-04-01T00:00:00.000Z")
    expect(r.hasta.toISOString()).toBe("2026-05-01T00:00:00.000Z")
  })

  it("diciembre cruza al año siguiente", () => {
    const r = rangoMesUtc(12, 2026)
    expect(r.desde.toISOString()).toBe("2026-12-01T00:00:00.000Z")
    expect(r.hasta.toISOString()).toBe("2027-01-01T00:00:00.000Z")
  })
})

// ─── registrarMovimiento ───────────────────────────────────────────────────

describe("registrarMovimiento", () => {
  const base = {
    cuentaId: "c1",
    fecha: new Date("2026-04-15T12:00:00Z"),
    tipo: "EGRESO" as const,
    categoria: "CHEQUE_EMITIDO_DEBITADO",
    monto: 1000,
    descripcion: "Cheque #1",
    operadorCreacionId: "u1",
  }

  it("rechaza monto no positivo", async () => {
    await expect(
      registrarMovimiento(mockTx as never, { ...base, monto: 0, chequeEmitidoId: "ch1" })
    ).rejects.toThrow(/positivo/)
  })

  it("rechaza si no hay ninguna referencia ni esManual", async () => {
    await expect(registrarMovimiento(mockTx as never, base)).rejects.toThrow(
      /referencia/
    )
  })

  it("rechaza si hay más de una referencia", async () => {
    await expect(
      registrarMovimiento(mockTx as never, {
        ...base,
        chequeEmitidoId: "ch1",
        pagoAFleteroId: "p1",
      })
    ).rejects.toThrow(/referencia/)
  })

  it("rechaza si el día está sellado", async () => {
    mockTx.conciliacionDia.findUnique.mockResolvedValue({ id: "s1" })
    mockTx.cierreMesCuenta.findUnique.mockResolvedValue(null)
    await expect(
      registrarMovimiento(mockTx as never, { ...base, chequeEmitidoId: "ch1" })
    ).rejects.toThrow(/conciliado/i)
  })

  it("rechaza si el mes está cerrado", async () => {
    mockTx.conciliacionDia.findUnique.mockResolvedValue(null)
    mockTx.cierreMesCuenta.findUnique.mockResolvedValue({ id: "cm1" })
    await expect(
      registrarMovimiento(mockTx as never, { ...base, chequeEmitidoId: "ch1" })
    ).rejects.toThrow(/cerrado/i)
  })

  it("asigna orden = max+1 dentro del día", async () => {
    mockTx.conciliacionDia.findUnique.mockResolvedValue(null)
    mockTx.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockTx.movimientoCuenta.aggregate.mockResolvedValue({ _max: { orden: 3 } })
    mockTx.movimientoCuenta.create.mockResolvedValue({ id: "m1", orden: 4 })

    const r = await registrarMovimiento(mockTx as never, { ...base, chequeEmitidoId: "ch1" })

    expect(r.orden).toBe(4)
    const arg = mockTx.movimientoCuenta.create.mock.calls[0][0]
    expect(arg.data.orden).toBe(4)
    expect(arg.data.chequeEmitidoId).toBe("ch1")
    expect((arg.data.fecha as Date).toISOString()).toBe("2026-04-15T00:00:00.000Z")
  })

  it("asigna orden = 1 si no hay movimientos previos ese día", async () => {
    mockTx.conciliacionDia.findUnique.mockResolvedValue(null)
    mockTx.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockTx.movimientoCuenta.aggregate.mockResolvedValue({ _max: { orden: null } })
    mockTx.movimientoCuenta.create.mockResolvedValue({ id: "m1", orden: 1 })

    const r = await registrarMovimiento(mockTx as never, {
      ...base,
      esManual: true,
    })

    expect(r.orden).toBe(1)
  })
})

// ─── registrarMovimientoManualConImpuestos ─────────────────────────────────

describe("registrarMovimientoManualConImpuestos", () => {
  const baseManual = {
    cuentaId: "c1",
    fecha: new Date("2026-04-15T12:00:00Z"),
    tipo: "EGRESO" as const,
    categoria: "TRANSFERENCIA_ENVIADA",
    monto: 1000,
    descripcion: "Pago varios",
    operadorCreacionId: "u1",
    esManual: true,
  }

  beforeEach(() => {
    mockTx.conciliacionDia.findUnique.mockResolvedValue(null)
    mockTx.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockTx.movimientoCuenta.aggregate.mockResolvedValue({ _max: { orden: null } })
  })

  it("rechaza si esManual no es true", async () => {
    await expect(
      registrarMovimientoManualConImpuestos(mockTx as never, { ...baseManual, esManual: false }, {})
    ).rejects.toThrow(/esManual/)
  })

  it("sin impuestos: crea solo el padre y no asigna grupo", async () => {
    mockTx.movimientoCuenta.create.mockResolvedValue({ id: "m1", orden: 1 })
    const r = await registrarMovimientoManualConImpuestos(mockTx as never, baseManual, {})
    expect(r.id).toBe("m1")
    expect(r.impuestoIds).toEqual([])
    expect(mockTx.movimientoCuenta.create).toHaveBeenCalledTimes(1)
    const arg = mockTx.movimientoCuenta.create.mock.calls[0][0]
    expect(arg.data.movimientoGrupoId).toBeNull()
  })

  it("con debcred: crea padre + hijo IMPUESTO_DEBCRED en mismo grupo", async () => {
    mockTx.movimientoCuenta.create
      .mockResolvedValueOnce({ id: "padre", orden: 1 })
      .mockResolvedValueOnce({ id: "imp", orden: 2 })

    const r = await registrarMovimientoManualConImpuestos(
      mockTx as never,
      baseManual,
      { debcred: { aplica: true, alicuota: 0.006 } }
    )

    expect(r.id).toBe("padre")
    expect(r.impuestoIds).toEqual(["imp"])
    expect(mockTx.movimientoCuenta.create).toHaveBeenCalledTimes(2)

    const argPadre = mockTx.movimientoCuenta.create.mock.calls[0][0]
    const argHijo = mockTx.movimientoCuenta.create.mock.calls[1][0]
    expect(argPadre.data.movimientoGrupoId).toBe(argHijo.data.movimientoGrupoId)
    expect(argPadre.data.movimientoGrupoId).toBeTruthy()
    expect(argHijo.data.tipo).toBe("EGRESO")
    expect(argHijo.data.categoria).toBe("IMPUESTO_DEBCRED")
    expect(argHijo.data.monto).toBe(6)
    expect(argHijo.data.esManual).toBe(true)
  })

  it("con iibb sircreb: crea hijo IIBB_SIRCREB_TUCUMAN", async () => {
    mockTx.movimientoCuenta.create
      .mockResolvedValueOnce({ id: "padre", orden: 1 })
      .mockResolvedValueOnce({ id: "iibb", orden: 2 })

    const r = await registrarMovimientoManualConImpuestos(
      mockTx as never,
      baseManual,
      { iibbSircreb: { aplica: true, alicuota: 0.0006 } }
    )

    expect(r.impuestoIds).toEqual(["iibb"])
    const argHijo = mockTx.movimientoCuenta.create.mock.calls[1][0]
    expect(argHijo.data.categoria).toBe("IIBB_SIRCREB_TUCUMAN")
    expect(argHijo.data.monto).toBe(0.6)
  })

  it("con ambos impuestos: crea padre + 2 hijos en el mismo grupo", async () => {
    mockTx.movimientoCuenta.create
      .mockResolvedValueOnce({ id: "padre", orden: 1 })
      .mockResolvedValueOnce({ id: "deb", orden: 2 })
      .mockResolvedValueOnce({ id: "iibb", orden: 3 })

    const r = await registrarMovimientoManualConImpuestos(
      mockTx as never,
      baseManual,
      {
        debcred: { aplica: true, alicuota: 0.006 },
        iibbSircreb: { aplica: true, alicuota: 0.0006 },
      }
    )

    expect(r.impuestoIds).toEqual(["deb", "iibb"])
    const grupos = mockTx.movimientoCuenta.create.mock.calls.map(
      (c: unknown[]) => (c[0] as { data: { movimientoGrupoId: string } }).data.movimientoGrupoId
    )
    expect(new Set(grupos).size).toBe(1)
  })

  it("alícuota 0 no genera hijo", async () => {
    mockTx.movimientoCuenta.create.mockResolvedValueOnce({ id: "padre", orden: 1 })
    const r = await registrarMovimientoManualConImpuestos(
      mockTx as never,
      baseManual,
      { debcred: { aplica: true, alicuota: 0 } }
    )
    expect(r.impuestoIds).toEqual([])
    expect(mockTx.movimientoCuenta.create).toHaveBeenCalledTimes(1)
  })

  it("aplica:false no genera hijo", async () => {
    mockTx.movimientoCuenta.create.mockResolvedValueOnce({ id: "padre", orden: 1 })
    await registrarMovimientoManualConImpuestos(
      mockTx as never,
      baseManual,
      { debcred: { aplica: false, alicuota: 0.006 } }
    )
    expect(mockTx.movimientoCuenta.create).toHaveBeenCalledTimes(1)
  })
})

// ─── esCategoriaImpuestoAutogenerado ───────────────────────────────────────

describe("esCategoriaImpuestoAutogenerado", () => {
  it("reconoce IMPUESTO_DEBCRED", () => {
    expect(esCategoriaImpuestoAutogenerado("IMPUESTO_DEBCRED")).toBe(true)
  })
  it("reconoce IIBB_SIRCREB_TUCUMAN", () => {
    expect(esCategoriaImpuestoAutogenerado("IIBB_SIRCREB_TUCUMAN")).toBe(true)
  })
  it("rechaza otras categorías", () => {
    expect(esCategoriaImpuestoAutogenerado("TRANSFERENCIA_ENVIADA")).toBe(false)
    expect(esCategoriaImpuestoAutogenerado("AJUSTE_MANUAL")).toBe(false)
    expect(esCategoriaImpuestoAutogenerado("PAGO_IMPUESTO")).toBe(false)
  })
})

// ─── calcularSaldoAFecha ────────────────────────────────────────────────────

describe("calcularSaldoAFecha / calcularSaldoActual", () => {
  it("suma saldoInicial + ingresos − egresos cuando fechaSaldoInicial <= corte", async () => {
    mockPrisma.cuenta.findUnique.mockResolvedValue({
      saldoInicial: 1000,
      fechaSaldoInicial: new Date("2026-01-01T00:00:00Z"),
    })
    mockPrisma.movimientoCuenta.aggregate
      .mockResolvedValueOnce({ _sum: { monto: 500 } }) // ingresos
      .mockResolvedValueOnce({ _sum: { monto: 200 } }) // egresos

    const saldo = await calcularSaldoAFecha("c1", new Date("2026-04-15"))
    expect(saldo).toBe(1300)
  })

  it("omite saldoInicial si fechaSaldoInicial > corte", async () => {
    mockPrisma.cuenta.findUnique.mockResolvedValue({
      saldoInicial: 1000,
      fechaSaldoInicial: new Date("2026-05-01T00:00:00Z"),
    })
    mockPrisma.movimientoCuenta.aggregate
      .mockResolvedValueOnce({ _sum: { monto: 500 } })
      .mockResolvedValueOnce({ _sum: { monto: 200 } })

    const saldo = await calcularSaldoAFecha("c1", new Date("2026-04-15"))
    expect(saldo).toBe(300)
  })

  it("omite saldoInicial si fechaSaldoInicial es null", async () => {
    mockPrisma.cuenta.findUnique.mockResolvedValue({
      saldoInicial: 1000,
      fechaSaldoInicial: null,
    })
    mockPrisma.movimientoCuenta.aggregate
      .mockResolvedValueOnce({ _sum: { monto: 0 } })
      .mockResolvedValueOnce({ _sum: { monto: 0 } })

    const saldo = await calcularSaldoAFecha("c1", new Date("2026-04-15"))
    expect(saldo).toBe(0)
  })

  it("lanza si la cuenta no existe", async () => {
    mockPrisma.cuenta.findUnique.mockResolvedValue(null)
    await expect(calcularSaldoAFecha("cx", new Date())).rejects.toThrow(/Cuenta/)
  })

  it("calcularSaldoActual suma todo sin filtro de fecha", async () => {
    mockPrisma.cuenta.findUnique.mockResolvedValue({ saldoInicial: 100 })
    mockPrisma.movimientoCuenta.aggregate
      .mockResolvedValueOnce({ _sum: { monto: 50 } })
      .mockResolvedValueOnce({ _sum: { monto: 30 } })

    expect(await calcularSaldoActual("c1")).toBe(120)
  })
})

// ─── sellarDia ──────────────────────────────────────────────────────────────

describe("sellarDia", () => {
  it("crea si no existía", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockPrisma.conciliacionDia.findUnique.mockResolvedValue(null)
    mockPrisma.conciliacionDia.create.mockResolvedValue({ id: "s1" })

    const r = await sellarDia({
      cuentaId: "c1",
      fecha: new Date("2026-04-15"),
      saldoExtracto: 12500,
      operadorId: "u1",
    })
    expect(r).toEqual({ id: "s1", creado: true })
  })

  it("actualiza si ya existía", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockPrisma.conciliacionDia.findUnique.mockResolvedValue({ id: "s1" })
    mockPrisma.conciliacionDia.update.mockResolvedValue({ id: "s1" })

    const r = await sellarDia({
      cuentaId: "c1",
      fecha: new Date("2026-04-15"),
      saldoExtracto: 9999,
      operadorId: "u1",
    })
    expect(r).toEqual({ id: "s1", creado: false })
  })

  it("rechaza si el mes está cerrado", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue({ id: "cm1" })

    await expect(
      sellarDia({
        cuentaId: "c1",
        fecha: new Date("2026-04-15"),
        saldoExtracto: 1,
        operadorId: "u1",
      })
    ).rejects.toThrow(/cerrado/i)
  })
})

// ─── desellarDia ────────────────────────────────────────────────────────────

describe("desellarDia", () => {
  it("elimina y devuelve true si había sello", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockPrisma.conciliacionDia.deleteMany.mockResolvedValue({ count: 1 })

    expect(
      await desellarDia({ cuentaId: "c1", fecha: new Date("2026-04-15") })
    ).toBe(true)
  })

  it("devuelve false si no había sello", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockPrisma.conciliacionDia.deleteMany.mockResolvedValue({ count: 0 })

    expect(
      await desellarDia({ cuentaId: "c1", fecha: new Date("2026-04-15") })
    ).toBe(false)
  })

  it("rechaza si el mes está cerrado", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue({ id: "cm1" })
    await expect(
      desellarDia({ cuentaId: "c1", fecha: new Date("2026-04-15") })
    ).rejects.toThrow(/cerrado/i)
  })
})

// ─── cerrarMes ──────────────────────────────────────────────────────────────

describe("cerrarMes / reabrirMes", () => {
  it("cierra cuando no faltan días pendientes", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    // diasConMovimientosPendientesDeSellar: movs distinct fechas y sellos
    mockPrisma.movimientoCuenta.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-10T00:00:00Z") },
      { fecha: new Date("2026-04-15T00:00:00Z") },
    ])
    mockPrisma.conciliacionDia.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-10T00:00:00Z") },
      { fecha: new Date("2026-04-15T00:00:00Z") },
    ])
    mockPrisma.cierreMesCuenta.create.mockResolvedValue({ id: "cm1" })

    const r = await cerrarMes({ cuentaId: "c1", mes: 4, anio: 2026, operadorId: "u1" })
    expect(r).toEqual({ id: "cm1" })
  })

  it("rechaza si faltan días con movimientos por sellar", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockPrisma.movimientoCuenta.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-10T00:00:00Z") },
      { fecha: new Date("2026-04-15T00:00:00Z") },
    ])
    mockPrisma.conciliacionDia.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-10T00:00:00Z") },
    ])

    await expect(
      cerrarMes({ cuentaId: "c1", mes: 4, anio: 2026, operadorId: "u1" })
    ).rejects.toThrow(/1 día/)
  })

  it("rechaza si el mes ya está cerrado", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue({ id: "cm1" })
    await expect(
      cerrarMes({ cuentaId: "c1", mes: 4, anio: 2026, operadorId: "u1" })
    ).rejects.toThrow(/ya está cerrado/i)
  })

  it("permite cerrar mes sin movimientos", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockPrisma.movimientoCuenta.findMany.mockResolvedValue([])
    mockPrisma.conciliacionDia.findMany.mockResolvedValue([])
    mockPrisma.cierreMesCuenta.create.mockResolvedValue({ id: "cm1" })

    const r = await cerrarMes({ cuentaId: "c1", mes: 4, anio: 2026, operadorId: "u1" })
    expect(r).toEqual({ id: "cm1" })
  })

  it("reabrirMes devuelve true cuando había cierre", async () => {
    mockPrisma.cierreMesCuenta.deleteMany.mockResolvedValue({ count: 1 })
    expect(await reabrirMes({ cuentaId: "c1", mes: 4, anio: 2026 })).toBe(true)
  })

  it("reabrirMes devuelve false cuando no había cierre", async () => {
    mockPrisma.cierreMesCuenta.deleteMany.mockResolvedValue({ count: 0 })
    expect(await reabrirMes({ cuentaId: "c1", mes: 4, anio: 2026 })).toBe(false)
  })
})

// ─── diasConMovimientosPendientesDeSellar ──────────────────────────────────

describe("diasConMovimientosPendientesDeSellar", () => {
  it("devuelve días con movs sin sello", async () => {
    mockPrisma.movimientoCuenta.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-05T00:00:00Z") },
      { fecha: new Date("2026-04-10T00:00:00Z") },
      { fecha: new Date("2026-04-20T00:00:00Z") },
    ])
    mockPrisma.conciliacionDia.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-10T00:00:00Z") },
    ])

    const pendientes = await diasConMovimientosPendientesDeSellar("c1", 4, 2026)
    expect(pendientes.map((d) => d.toISOString())).toEqual([
      "2026-04-05T00:00:00.000Z",
      "2026-04-20T00:00:00.000Z",
    ])
  })
})

// ─── estadoMesCuenta ────────────────────────────────────────────────────────

describe("estadoMesCuenta", () => {
  it("CERRADO cuando existe CierreMesCuenta", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue({ id: "cm1" })
    expect(await estadoMesCuenta("c1", 4, 2026)).toBe("CERRADO")
  })

  it("SIN_MOVIMIENTOS cuando no hay movs ni sellos", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockPrisma.movimientoCuenta.count.mockResolvedValue(0)
    mockPrisma.conciliacionDia.count.mockResolvedValue(0)
    expect(await estadoMesCuenta("c1", 4, 2026)).toBe("SIN_MOVIMIENTOS")
  })

  it("PENDIENTE cuando hay movs pero ningún sello", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockPrisma.movimientoCuenta.count.mockResolvedValue(3)
    mockPrisma.conciliacionDia.count.mockResolvedValue(0)
    mockPrisma.movimientoCuenta.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-05T00:00:00Z") },
    ])
    mockPrisma.conciliacionDia.findMany.mockResolvedValue([])
    expect(await estadoMesCuenta("c1", 4, 2026)).toBe("PENDIENTE")
  })

  it("EN_CURSO cuando hay movs, al menos un sello y faltan días", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockPrisma.movimientoCuenta.count.mockResolvedValue(3)
    mockPrisma.conciliacionDia.count.mockResolvedValue(1)
    mockPrisma.movimientoCuenta.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-05T00:00:00Z") },
      { fecha: new Date("2026-04-06T00:00:00Z") },
    ])
    mockPrisma.conciliacionDia.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-05T00:00:00Z") },
    ])
    expect(await estadoMesCuenta("c1", 4, 2026)).toBe("EN_CURSO")
  })

  it("LISTO_PARA_CERRAR cuando todos los días con movs están sellados", async () => {
    mockPrisma.cierreMesCuenta.findUnique.mockResolvedValue(null)
    mockPrisma.movimientoCuenta.count.mockResolvedValue(3)
    mockPrisma.conciliacionDia.count.mockResolvedValue(2)
    mockPrisma.movimientoCuenta.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-05T00:00:00Z") },
      { fecha: new Date("2026-04-06T00:00:00Z") },
    ])
    mockPrisma.conciliacionDia.findMany.mockResolvedValue([
      { fecha: new Date("2026-04-05T00:00:00Z") },
      { fecha: new Date("2026-04-06T00:00:00Z") },
    ])
    expect(await estadoMesCuenta("c1", 4, 2026)).toBe("LISTO_PARA_CERRAR")
  })
})

// ─── cuentasActivasConMesAbierto / mesCerradoParaTodasLasCuentas ─────────────

describe("cuentasActivasConMesAbierto", () => {
  it("devuelve cuentas activas sin CierreMesCuenta para (mes, anio)", async () => {
    mockPrisma.cuenta.findMany.mockResolvedValue([
      { id: "c1", nombre: "Galicia" },
      { id: "c2", nombre: "Santander" },
      { id: "c3", nombre: "Mercado Pago" },
    ])
    mockPrisma.cierreMesCuenta.findMany.mockResolvedValue([{ cuentaId: "c1" }])

    const abiertas = await cuentasActivasConMesAbierto(4, 2026)
    expect(abiertas.map((c) => c.id).sort()).toEqual(["c2", "c3"])
  })

  it("devuelve [] si todas cerraron", async () => {
    mockPrisma.cuenta.findMany.mockResolvedValue([{ id: "c1", nombre: "Galicia" }])
    mockPrisma.cierreMesCuenta.findMany.mockResolvedValue([{ cuentaId: "c1" }])

    expect(await cuentasActivasConMesAbierto(4, 2026)).toEqual([])
  })
})

describe("mesCerradoParaTodasLasCuentas", () => {
  it("true si no quedan abiertas", async () => {
    mockPrisma.cuenta.findMany.mockResolvedValue([{ id: "c1", nombre: "Galicia" }])
    mockPrisma.cierreMesCuenta.findMany.mockResolvedValue([{ cuentaId: "c1" }])

    expect(await mesCerradoParaTodasLasCuentas(4, 2026)).toBe(true)
  })

  it("false si queda al menos una abierta", async () => {
    mockPrisma.cuenta.findMany.mockResolvedValue([
      { id: "c1", nombre: "Galicia" },
      { id: "c2", nombre: "Santander" },
    ])
    mockPrisma.cierreMesCuenta.findMany.mockResolvedValue([{ cuentaId: "c1" }])

    expect(await mesCerradoParaTodasLasCuentas(4, 2026)).toBe(false)
  })
})
