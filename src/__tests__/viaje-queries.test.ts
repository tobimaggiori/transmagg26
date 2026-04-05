/**
 * Propósito: Tests de seguridad para construirWhereViajes.
 * Verifica que el filtrado por rol genera las restricciones correctas
 * a nivel de query Prisma, previniendo acceso cruzado entre usuarios.
 */

const mockPrisma = {
  empresaUsuario: { findFirst: jest.fn() },
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { construirWhereViajes } from "@/lib/viaje-queries"

beforeEach(() => jest.clearAllMocks())

// ─── FLETERO: solo ve viajes propios ─────────────────────────────────────────

describe("construirWhereViajes — FLETERO", () => {
  it("restringe por fletero.usuario.email", async () => {
    const r = await construirWhereViajes("FLETERO", "flet@x.com", {})
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).toEqual({ fletero: { usuario: { email: "flet@x.com" } } })
  })

  it("ignora filtro fleteroId de query params (no puede filtrar por otro fletero)", async () => {
    const r = await construirWhereViajes("FLETERO", "flet@x.com", { fleteroId: "otro-fletero" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).toEqual({ fletero: { usuario: { email: "flet@x.com" } } })
    expect(r.where).not.toHaveProperty("fleteroId")
  })

  it("ignora filtro empresaId de query params", async () => {
    const r = await construirWhereViajes("FLETERO", "flet@x.com", { empresaId: "emp-ajena" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).not.toHaveProperty("empresaId")
  })
})

// ─── CHOFER: solo ve viajes donde es chofer ──────────────────────────────────

describe("construirWhereViajes — CHOFER", () => {
  it("restringe por chofer.email", async () => {
    const r = await construirWhereViajes("CHOFER", "chofer@x.com", {})
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).toEqual({ chofer: { email: "chofer@x.com" } })
  })
})

// ─── ADMIN_EMPRESA / OPERADOR_EMPRESA: solo viajes de su empresa ─────────────

describe("construirWhereViajes — roles empresa", () => {
  it("ADMIN_EMPRESA restringe por empresaId resuelto del email", async () => {
    mockPrisma.empresaUsuario.findFirst.mockResolvedValue({ empresaId: "emp-1" })
    const r = await construirWhereViajes("ADMIN_EMPRESA", "admin@empresa.com", {})
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).toEqual({ empresaId: "emp-1" })
  })

  it("OPERADOR_EMPRESA restringe por empresaId resuelto del email", async () => {
    mockPrisma.empresaUsuario.findFirst.mockResolvedValue({ empresaId: "emp-2" })
    const r = await construirWhereViajes("OPERADOR_EMPRESA", "op@empresa.com", {})
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).toEqual({ empresaId: "emp-2" })
  })

  it("empresa sin vinculación → devuelve where imposible (sin viajes)", async () => {
    mockPrisma.empresaUsuario.findFirst.mockResolvedValue(null)
    const r = await construirWhereViajes("ADMIN_EMPRESA", "sin-empresa@x.com", {})
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).toEqual({ id: "__none__" })
  })

  it("ADMIN_EMPRESA no puede inyectar filtro de otra empresa", async () => {
    mockPrisma.empresaUsuario.findFirst.mockResolvedValue({ empresaId: "emp-1" })
    const r = await construirWhereViajes("ADMIN_EMPRESA", "admin@empresa.com", {
      empresaId: "emp-ajena",
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where.empresaId).toBe("emp-1")
  })
})

// ─── Roles internos: acceso total con filtros opcionales ─────────────────────

describe("construirWhereViajes — roles internos", () => {
  it("ADMIN_TRANSMAGG sin filtros → where vacío (ve todo)", async () => {
    const r = await construirWhereViajes("ADMIN_TRANSMAGG", "admin@t.com", {})
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).toEqual({})
  })

  it("OPERADOR_TRANSMAGG puede filtrar por fleteroId", async () => {
    const r = await construirWhereViajes("OPERADOR_TRANSMAGG", "op@t.com", {
      fleteroId: "f1",
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).toEqual({ fleteroId: "f1" })
  })

  it("ADMIN_TRANSMAGG puede filtrar por empresaId", async () => {
    const r = await construirWhereViajes("ADMIN_TRANSMAGG", "admin@t.com", {
      empresaId: "e1",
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).toEqual({ empresaId: "e1" })
  })
})

// ─── Rol desconocido → 403 ──────────────────────────────────────────────────

describe("construirWhereViajes — rol no reconocido", () => {
  it("devuelve 403 para un rol inventado", async () => {
    const r = await construirWhereViajes("SUPERUSER" as never, "x@x.com", {})
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.status).toBe(403)
  })
})

// ─── Filtros de fecha disponibles para todos los roles ───────────────────────

describe("construirWhereViajes — filtros de fecha", () => {
  it("FLETERO puede filtrar por rango de fechas", async () => {
    const r = await construirWhereViajes("FLETERO", "f@x.com", {
      desde: "2026-01-01",
      hasta: "2026-01-31",
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.where).toHaveProperty("fechaViaje")
    const fechaWhere = r.where.fechaViaje as { gte: Date; lte: Date }
    expect(fechaWhere.gte).toEqual(new Date("2026-01-01"))
    expect(fechaWhere.lte.getMonth()).toBe(0) // enero
  })
})
