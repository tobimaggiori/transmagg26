/**
 * Tests para POST /api/configuracion-arca/consultar-ultimo-autorizado
 *
 * Cubre:
 * 1. Admin autenticado → consulta exitosa
 * 2. No admin → 403
 * 3. Modo simulación → error claro
 * 4. Input inválido → 400
 * 5. Error ARCA tipado → response con retryable/status
 */

const mockAuth = jest.fn()
const mockCargarConfig = jest.fn()
const mockResolverUrls = jest.fn()
const mockObtenerTicket = jest.fn()
const mockFeCompUltimo = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: mockAuth }))
jest.mock("@/lib/arca/config", () => ({
  cargarConfigArca: mockCargarConfig,
  resolverUrls: mockResolverUrls,
}))
jest.mock("@/lib/arca/wsaa", () => ({ obtenerTicketWsaa: mockObtenerTicket }))
jest.mock("@/lib/arca/wsfev1", () => ({ feCompUltimoAutorizado: mockFeCompUltimo }))

import { POST } from "@/app/api/configuracion-arca/consultar-ultimo-autorizado/route"
import { Wsfev1Error } from "@/lib/arca/errors"
import { NextRequest } from "next/server"

function mkReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/configuracion-arca/consultar-ultimo-autorizado", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const ADMIN_SESSION = { user: { email: "admin@test.com", rol: "ADMIN_TRANSMAGG" } }
const OPER_SESSION = { user: { email: "oper@test.com", rol: "OPERADOR_TRANSMAGG" } }

const CONFIG_HOMO = {
  cuit: "30709381683",
  modo: "homologacion",
  activa: true,
  certificadoB64: "cert",
  certificadoPass: "pass",
  puntosVenta: { FACTURA_A: 4 },
  comprobantesHabilitados: [1, 6],
}

const CONFIG_SIMU = { ...CONFIG_HOMO, modo: "simulacion" }

beforeEach(() => {
  jest.clearAllMocks()
  mockResolverUrls.mockReturnValue({ wsaaUrl: "https://wsaa.test", wsfev1Url: "https://wsfev1.test" })
  mockObtenerTicket.mockResolvedValue({ token: "t", sign: "s", expiresAt: new Date() })
})

describe("POST /api/configuracion-arca/consultar-ultimo-autorizado", () => {
  it("admin autenticado → consulta exitosa", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION)
    mockCargarConfig.mockResolvedValue(CONFIG_HOMO)
    mockFeCompUltimo.mockResolvedValue({ PtoVta: 4, CbteTipo: 1, CbteNro: 42 })

    const res = await POST(mkReq({ ptoVenta: 4, tipoCbte: 1 }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.resultado.ptoVenta).toBe(4)
    expect(data.resultado.tipoCbte).toBe(1)
    expect(data.resultado.ultimoNro).toBe(42)
    expect(data.tiempoMs).toBeDefined()
  })

  it("usuario no admin → 403", async () => {
    mockAuth.mockResolvedValue(OPER_SESSION)

    const res = await POST(mkReq({ ptoVenta: 4, tipoCbte: 1 }))
    expect(res.status).toBe(403)
  })

  it("sin sesión → 401", async () => {
    mockAuth.mockResolvedValue(null)

    const res = await POST(mkReq({ ptoVenta: 4, tipoCbte: 1 }))
    expect(res.status).toBe(401)
  })

  it("modo simulación → error claro 422", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION)
    mockCargarConfig.mockResolvedValue(CONFIG_SIMU)

    const res = await POST(mkReq({ ptoVenta: 4, tipoCbte: 1 }))
    const data = await res.json()

    expect(res.status).toBe(422)
    expect(data.ok).toBe(false)
    expect(data.mensaje).toContain("simulación")
  })

  it("input inválido (ptoVenta negativo) → 400", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION)

    const res = await POST(mkReq({ ptoVenta: -1, tipoCbte: 1 }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.ok).toBe(false)
  })

  it("input inválido (faltan campos) → 400", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION)

    const res = await POST(mkReq({}))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.ok).toBe(false)
  })

  it("input inválido (tipoCbte string) → 400", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION)

    const res = await POST(mkReq({ ptoVenta: 4, tipoCbte: "abc" }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.ok).toBe(false)
  })

  it("error ARCA tipado → response con retryable y status correcto", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION)
    mockCargarConfig.mockResolvedValue(CONFIG_HOMO)
    mockFeCompUltimo.mockRejectedValue(new Wsfev1Error("PtoVta no autorizado", false))

    const res = await POST(mkReq({ ptoVenta: 99, tipoCbte: 1 }))
    const data = await res.json()

    expect(res.status).toBe(502)
    expect(data.ok).toBe(false)
    expect(data.mensaje).toContain("PtoVta no autorizado")
    expect(data.retryable).toBe(false)
    expect(data.tiempoMs).toBeDefined()
  })

  it("error ARCA transitorio → retryable true", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION)
    mockCargarConfig.mockResolvedValue(CONFIG_HOMO)
    mockFeCompUltimo.mockRejectedValue(new Wsfev1Error("ECONNREFUSED", true))

    const res = await POST(mkReq({ ptoVenta: 4, tipoCbte: 1 }))
    const data = await res.json()

    expect(data.ok).toBe(false)
    expect(data.retryable).toBe(true)
  })
})
