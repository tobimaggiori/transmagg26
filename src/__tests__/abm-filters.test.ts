/**
 * Propósito: Tests unitarios para las funciones de filtrado de los componentes ABM.
 * Cubre calcularFiltroEmpresa, calcularFiltroFletero,
 * calcularFiltroUsuario, calcularFiltroProveedor y calcularFiltroProveedorOp.
 */

import { calcularFiltroEmpresa } from "@/components/abm/empresas-abm"
import { calcularFiltroFletero } from "@/components/abm/fleteros-abm"
import { calcularFiltroUsuario } from "@/components/abm/usuarios-abm"
import { calcularFiltroProveedor } from "@/components/abm/proveedores-abm"
import { calcularFiltroProveedorOp } from "@/components/proveedores-client"

// ─── calcularFiltroEmpresa ─────────────────────────────────────────────────────
describe("calcularFiltroEmpresa", () => {
  const empresa = { id: "e1", razonSocial: "Alimentos del Sur SA", cuit: "30714295698", condicionIva: "RESPONSABLE_INSCRIPTO", direccion: null, activa: true, puedeEliminar: false, contactosEmail: [] }

  it("retorna true cuando la búsqueda coincide con razón social (case insensitive)", () => {
    expect(calcularFiltroEmpresa(empresa, "alimentos")).toBe(true)
  })

  it("retorna true cuando la búsqueda coincide con CUIT parcialmente", () => {
    expect(calcularFiltroEmpresa(empresa, "307")).toBe(true)
  })

  it("retorna false cuando no coincide ni razón social ni CUIT", () => {
    expect(calcularFiltroEmpresa(empresa, "xyz999")).toBe(false)
  })
})

// ─── calcularFiltroFletero ─────────────────────────────────────────────────────
describe("calcularFiltroFletero", () => {
  const fletero = {
    id: "f1",
    razonSocial: "JP Transportes SRL",
    cuit: "20123456789",
    condicionIva: "RESPONSABLE_INSCRIPTO",
    comisionDefault: 10,
    activo: true,
    puedeEliminar: false,
    usuario: { nombre: "Juan", apellido: "Pérez", email: "juan.perez@fletero.com" },
    camiones: [],
    choferes: [],
    contactosEmail: [],
  }

  it("retorna true cuando coincide con razón social", () => {
    expect(calcularFiltroFletero(fletero, "jp")).toBe(true)
  })

  it("retorna true cuando coincide con CUIT", () => {
    expect(calcularFiltroFletero(fletero, "20123")).toBe(true)
  })

  it("retorna true cuando coincide con email del usuario", () => {
    expect(calcularFiltroFletero(fletero, "juan.perez")).toBe(true)
  })

  it("retorna false cuando no coincide nada", () => {
    expect(calcularFiltroFletero(fletero, "garcia")).toBe(false)
  })
})

// ─── calcularFiltroUsuario ─────────────────────────────────────────────────────
describe("calcularFiltroUsuario", () => {
  const usuario = {
    id: "u1",
    nombre: "Ana",
    apellido: "García",
    email: "ana@transmagg.com.ar",
    telefono: null,
    rol: "OPERADOR_TRANSMAGG",
    activo: true,
    fleteroId: null,
    smtpHost: null,
    smtpPuerto: null,
    smtpUsuario: null,
    smtpSsl: true,
    smtpActivo: false,
    smtpTienePassword: false,
    fleteroPropio: null,
    empresaUsuarios: [],
  }

  it("retorna true cuando coincide con nombre", () => {
    expect(calcularFiltroUsuario(usuario, "ana")).toBe(true)
  })

  it("retorna true cuando coincide con apellido", () => {
    expect(calcularFiltroUsuario(usuario, "garc")).toBe(true)
  })

  it("retorna true cuando coincide con rol (case insensitive)", () => {
    expect(calcularFiltroUsuario(usuario, "operador")).toBe(true)
  })

  it("retorna false cuando no coincide nada", () => {
    expect(calcularFiltroUsuario(usuario, "fletero")).toBe(false)
  })
})

// ─── calcularFiltroProveedor (ABM) ────────────────────────────────────────────
describe("calcularFiltroProveedor", () => {
    const proveedor = { id: "p1", razonSocial: "Gas del Sur SA", cuit: "30111222333", condicionIva: "RESPONSABLE_INSCRIPTO", rubro: "Combustible", tipo: "GENERAL", activo: true, puedeEliminar: false }

  it("retorna true cuando coincide con razón social", () => {
    expect(calcularFiltroProveedor(proveedor, "gas")).toBe(true)
  })

  it("retorna true cuando coincide con CUIT", () => {
    expect(calcularFiltroProveedor(proveedor, "301")).toBe(true)
  })

  it("retorna false cuando no coincide nada", () => {
    expect(calcularFiltroProveedor(proveedor, "xyzabc")).toBe(false)
  })
})

// ─── calcularFiltroProveedorOp (operatoria) ───────────────────────────────────
describe("calcularFiltroProveedorOp", () => {
  const proveedor = { razonSocial: "Peajes del Norte SA", cuit: "33999888777" }

  it("retorna true cuando coincide con razón social", () => {
    expect(calcularFiltroProveedorOp(proveedor, "peajes")).toBe(true)
  })

  it("retorna true cuando coincide con CUIT", () => {
    expect(calcularFiltroProveedorOp(proveedor, "339")).toBe(true)
  })

  it("retorna false cuando no coincide nada", () => {
    expect(calcularFiltroProveedorOp(proveedor, "abc")).toBe(false)
  })
})
