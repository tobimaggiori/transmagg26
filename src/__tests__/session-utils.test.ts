/**
 * Propósito: Tests de seguridad para las funciones de ownership en session-utils.
 * Verifica que los checks de propiedad bloquean acceso a recursos ajenos
 * y que la resolución de IDs por email funciona correctamente.
 */

const mockPrisma = {
  usuario: { findUnique: jest.fn() },
  empresaUsuario: { findFirst: jest.fn() },
  fletero: { findFirst: jest.fn() },
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import {
  resolverOperadorId,
  resolverEmpresaIdPorEmail,
  resolverFleteroIdPorEmail,
  verificarPropietarioFletero,
  verificarPropietarioEmpresa,
} from "@/lib/session-utils"

beforeEach(() => jest.clearAllMocks())

// ─── resolverOperadorId ──────────────────────────────────────────────────────

describe("resolverOperadorId", () => {
  it("devuelve id cuando existe por id", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValueOnce({ id: "u1" })
    const id = await resolverOperadorId({ id: "u1", email: "a@x.com" })
    expect(id).toBe("u1")
  })

  it("fallback a email cuando id no existe", async () => {
    mockPrisma.usuario.findUnique
      .mockResolvedValueOnce(null)   // por id
      .mockResolvedValueOnce({ id: "u-nuevo" })  // por email
    const id = await resolverOperadorId({ id: "obsoleto", email: "a@x.com" })
    expect(id).toBe("u-nuevo")
  })

  it("lanza error cuando ni id ni email encuentran usuario", async () => {
    mockPrisma.usuario.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
    await expect(resolverOperadorId({ id: "x", email: "no@existe.com" }))
      .rejects.toThrow("Operador no encontrado")
  })

  it("lanza error cuando no hay email y el id no existe", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValueOnce(null)
    await expect(resolverOperadorId({ id: "x" }))
      .rejects.toThrow("Operador no encontrado")
  })
})

// ─── resolverEmpresaIdPorEmail ───────────────────────────────────────────────

describe("resolverEmpresaIdPorEmail", () => {
  it("devuelve empresaId cuando el usuario tiene empresa", async () => {
    mockPrisma.empresaUsuario.findFirst.mockResolvedValue({ empresaId: "emp-1" })
    const id = await resolverEmpresaIdPorEmail("admin@empresa.com")
    expect(id).toBe("emp-1")
    expect(mockPrisma.empresaUsuario.findFirst).toHaveBeenCalledWith({
      where: { usuario: { email: "admin@empresa.com" } },
      select: { empresaId: true },
    })
  })

  it("devuelve null cuando el usuario no tiene empresa", async () => {
    mockPrisma.empresaUsuario.findFirst.mockResolvedValue(null)
    const id = await resolverEmpresaIdPorEmail("fletero@x.com")
    expect(id).toBeNull()
  })
})

// ─── resolverFleteroIdPorEmail ───────────────────────────────────────────────

describe("resolverFleteroIdPorEmail", () => {
  it("devuelve fleteroId cuando el usuario es fletero", async () => {
    mockPrisma.fletero.findFirst.mockResolvedValue({ id: "f-1" })
    const id = await resolverFleteroIdPorEmail("fletero@x.com")
    expect(id).toBe("f-1")
    expect(mockPrisma.fletero.findFirst).toHaveBeenCalledWith({
      where: { usuario: { email: "fletero@x.com" } },
      select: { id: true },
    })
  })

  it("devuelve null cuando el usuario no es fletero", async () => {
    mockPrisma.fletero.findFirst.mockResolvedValue(null)
    const id = await resolverFleteroIdPorEmail("admin@empresa.com")
    expect(id).toBeNull()
  })
})

// ─── verificarPropietarioFletero ─────────────────────────────────────────────

describe("verificarPropietarioFletero", () => {
  it("true cuando el fletero pertenece al email", async () => {
    mockPrisma.fletero.findFirst.mockResolvedValue({ id: "f-1" })
    const es = await verificarPropietarioFletero("f-1", "fletero@x.com")
    expect(es).toBe(true)
    expect(mockPrisma.fletero.findFirst).toHaveBeenCalledWith({
      where: { id: "f-1", usuario: { email: "fletero@x.com" } },
      select: { id: true },
    })
  })

  it("false cuando el fletero NO pertenece al email (acceso ajeno)", async () => {
    mockPrisma.fletero.findFirst.mockResolvedValue(null)
    const es = await verificarPropietarioFletero("f-1", "intruso@x.com")
    expect(es).toBe(false)
  })

  it("false con fleteroId inexistente", async () => {
    mockPrisma.fletero.findFirst.mockResolvedValue(null)
    const es = await verificarPropietarioFletero("no-existe", "fletero@x.com")
    expect(es).toBe(false)
  })
})

// ─── verificarPropietarioEmpresa ─────────────────────────────────────────────

describe("verificarPropietarioEmpresa", () => {
  it("true cuando el usuario pertenece a la empresa", async () => {
    mockPrisma.empresaUsuario.findFirst.mockResolvedValue({ empresaId: "emp-1" })
    const es = await verificarPropietarioEmpresa("emp-1", "admin@empresa.com")
    expect(es).toBe(true)
    expect(mockPrisma.empresaUsuario.findFirst).toHaveBeenCalledWith({
      where: { usuario: { email: "admin@empresa.com" }, empresaId: "emp-1" },
      select: { empresaId: true },
    })
  })

  it("false cuando el usuario NO pertenece a la empresa (acceso ajeno)", async () => {
    mockPrisma.empresaUsuario.findFirst.mockResolvedValue(null)
    const es = await verificarPropietarioEmpresa("emp-1", "intruso@x.com")
    expect(es).toBe(false)
  })

  it("false con empresaId inexistente", async () => {
    mockPrisma.empresaUsuario.findFirst.mockResolvedValue(null)
    const es = await verificarPropietarioEmpresa("no-existe", "admin@empresa.com")
    expect(es).toBe(false)
  })
})
