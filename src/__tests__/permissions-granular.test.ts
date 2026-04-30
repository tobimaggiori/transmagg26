/**
 * Tests de los helpers `tienePermiso` y `getPermisosUsuario` — funciones
 * que consultan `PermisoUsuario` para validar permisos granulares del
 * operador. Usan mock de prisma para aislar lógica.
 */

const mockFindUnique = jest.fn()
const mockFindMany = jest.fn()

jest.mock("@/lib/prisma", () => ({
  prisma: {
    permisoUsuario: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
    },
  },
}))

import { tienePermiso, getPermisosUsuario } from "@/lib/permissions"

beforeEach(() => {
  mockFindUnique.mockReset()
  mockFindMany.mockReset()
})

describe("tienePermiso", () => {
  it("ADMIN_TRANSMAGG: siempre true sin consultar DB", async () => {
    const r = await tienePermiso("u1", "ADMIN_TRANSMAGG", "cuentas")
    expect(r).toBe(true)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it("OPERADOR_TRANSMAGG: true si la fila existe y habilitado=true", async () => {
    mockFindUnique.mockResolvedValue({ habilitado: true })
    const r = await tienePermiso("u2", "OPERADOR_TRANSMAGG", "cuentas")
    expect(r).toBe(true)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { usuarioId_seccion: { usuarioId: "u2", seccion: "cuentas" } },
    })
  })

  it("OPERADOR_TRANSMAGG: false si la fila existe y habilitado=false", async () => {
    mockFindUnique.mockResolvedValue({ habilitado: false })
    const r = await tienePermiso("u2", "OPERADOR_TRANSMAGG", "cuentas")
    expect(r).toBe(false)
  })

  it("OPERADOR_TRANSMAGG: false si la fila no existe", async () => {
    mockFindUnique.mockResolvedValue(null)
    const r = await tienePermiso("u2", "OPERADOR_TRANSMAGG", "cuentas")
    expect(r).toBe(false)
  })

  it("FLETERO: false si no tiene fila en PermisoUsuario", async () => {
    mockFindUnique.mockResolvedValue(null)
    const r = await tienePermiso("u3", "FLETERO", "cuentas")
    expect(r).toBe(false)
  })
})

describe("getPermisosUsuario", () => {
  it("ADMIN_TRANSMAGG: devuelve todas las SECCIONES sin consultar DB", async () => {
    const r = await getPermisosUsuario("u1", "ADMIN_TRANSMAGG")
    expect(r.length).toBeGreaterThan(0)
    expect(r).toContain("cuentas")
    expect(r).toContain("abm")
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it("OPERADOR_TRANSMAGG: devuelve únicamente las secciones habilitadas", async () => {
    mockFindMany.mockResolvedValue([
      { seccion: "dashboard" },
      { seccion: "fleteros.viajes" },
    ])
    const r = await getPermisosUsuario("u2", "OPERADOR_TRANSMAGG")
    expect(r).toEqual(["dashboard", "fleteros.viajes"])
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { usuarioId: "u2", habilitado: true },
      select: { seccion: true },
    })
  })

  it("FLETERO: consulta DB aunque la función no aplica granular, devuelve lo que haya", async () => {
    mockFindMany.mockResolvedValue([])
    const r = await getPermisosUsuario("u3", "FLETERO")
    expect(r).toEqual([])
  })
})
