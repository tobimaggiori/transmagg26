/**
 * Tests de generación de XML para FECAESolicitar.
 * Verifica que el tag CondicionIVAReceptorId se incluye/omite
 * correctamente según el payload (RG 5616).
 */

import type { FECAERequest } from "@/lib/arca/types"

// Mock fetch para capturar el XML enviado
let capturedBody = ""
global.fetch = jest.fn(async (_url: string, init?: RequestInit) => {
  capturedBody = (init?.body as string) ?? ""
  // Respuesta SOAP mínima válida
  return new Response(`<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <FECAESolicitarResponse>
          <FECAESolicitarResult>
            <FeCabResp><Cuit>30709381683</Cuit><PtoVta>1</PtoVta><CbteTipo>1</CbteTipo><FchProceso>20260406</FchProceso><CantReg>1</CantReg><Resultado>A</Resultado></FeCabResp>
            <FeDetResp><FECAEDetResponse><Concepto>2</Concepto><DocTipo>80</DocTipo><DocNro>20123456789</DocNro><CbteDesde>1</CbteDesde><CbteHasta>1</CbteHasta><CbteFch>20260406</CbteFch><Resultado>A</Resultado><CAE>71234567890123</CAE><CAEFchVto>20260416</CAEFchVto></FECAEDetResponse></FeDetResp>
          </FECAESolicitarResult>
        </FECAESolicitarResponse>
      </soap:Body>
    </soap:Envelope>`, { status: 200, headers: { "Content-Type": "text/xml" } })
}) as jest.Mock

import { feCAESolicitar } from "@/lib/arca/wsfev1"

const auth = { Token: "tok", Sign: "sig", Cuit: "30709381683" }

function makeReq(condicionIVAReceptorId?: number): FECAERequest {
  return {
    FeCabReq: { CantReg: 1, PtoVta: 1, CbteTipo: 1 },
    FeDetReq: {
      FECAEDetRequest: [{
        Concepto: 2, DocTipo: 80, DocNro: 20123456789,
        CbteDesde: 1, CbteHasta: 1, CbteFch: "20260406",
        ImpTotal: 121000, ImpTotConc: 0, ImpNeto: 100000,
        ImpOpEx: 0, ImpTrib: 0, ImpIVA: 21000,
        MonId: "PES", MonCotiz: 1,
        ...(condicionIVAReceptorId != null ? { CondicionIVAReceptorId: condicionIVAReceptorId } : {}),
      }],
    },
  }
}

describe("FECAESolicitar XML — CondicionIVAReceptorId", () => {
  beforeEach(() => {
    capturedBody = ""
  })

  it("incluye tag <CondicionIVAReceptorId> cuando se pasa el campo", async () => {
    await feCAESolicitar("http://localhost", auth, makeReq(1))
    expect(capturedBody).toContain("<CondicionIVAReceptorId>1</CondicionIVAReceptorId>")
  })

  it("no incluye tag <CondicionIVAReceptorId> cuando no se pasa", async () => {
    await feCAESolicitar("http://localhost", auth, makeReq())
    expect(capturedBody).not.toContain("CondicionIVAReceptorId")
  })
})
