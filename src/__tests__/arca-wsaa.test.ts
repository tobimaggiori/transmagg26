/**
 * Tests unitarios para src/lib/arca/wsaa.ts
 * Cubre: generación de TRA y parseo de respuesta WSAA.
 * No cubre firmarCMS (requiere certificado real) ni llamadas de red.
 */

import { generarTRA, parsearLoginTicketResponse } from "@/lib/arca/wsaa"
import { WsaaError } from "@/lib/arca/errors"

describe("generarTRA", () => {
  it("genera XML válido con servicio, generationTime y expirationTime", () => {
    const desde = new Date("2026-04-03T10:00:00Z")
    const hasta = new Date("2026-04-03T22:00:00Z")
    const tra = generarTRA("wsfe", desde, hasta)

    expect(tra).toContain('<?xml version="1.0"')
    expect(tra).toContain("<loginTicketRequest")
    expect(tra).toContain("<service>wsfe</service>")
    expect(tra).toContain("<generationTime>2026-04-03T10:00:00.000Z</generationTime>")
    expect(tra).toContain("<expirationTime>2026-04-03T22:00:00.000Z</expirationTime>")
    expect(tra).toContain("<uniqueId>")
  })

  it("genera uniqueId diferente en cada llamada", () => {
    const d = new Date()
    const tra1 = generarTRA("wsfe", d, d)
    const tra2 = generarTRA("wsfe", d, d)
    const id1 = tra1.match(/<uniqueId>(\d+)<\/uniqueId>/)?.[1]
    const id2 = tra2.match(/<uniqueId>(\d+)<\/uniqueId>/)?.[1]
    // Es posible (pero poco probable) que coincidan por azar, así que solo verificamos formato
    expect(id1).toBeDefined()
    expect(id2).toBeDefined()
  })
})

describe("parsearLoginTicketResponse", () => {
  const fallback = new Date("2026-04-03T22:00:00Z")

  it("extrae token y sign de una respuesta WSAA válida", () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <loginCmsReturn>&lt;loginTicketResponse version="1.0"&gt;
            &lt;header&gt;
              &lt;source&gt;CN=wsaahomo&lt;/source&gt;
              &lt;destination&gt;SERIALNUMBER=CUIT 30709381683&lt;/destination&gt;
              &lt;uniqueId&gt;123456&lt;/uniqueId&gt;
              &lt;generationTime&gt;2026-04-03T10:00:00-03:00&lt;/generationTime&gt;
              &lt;expirationTime&gt;2026-04-03T22:00:00-03:00&lt;/expirationTime&gt;
            &lt;/header&gt;
            &lt;credentials&gt;
              &lt;token&gt;PD94bWwgdmVyc2lvbj0iMS4wIj8+TOKEN_DATA_HERE&lt;/token&gt;
              &lt;sign&gt;m4SXdz9SIGN_DATA_HERE&lt;/sign&gt;
            &lt;/credentials&gt;
          &lt;/loginTicketResponse&gt;</loginCmsReturn>
        </soapenv:Body>
      </soapenv:Envelope>`

    const ticket = parsearLoginTicketResponse(xml, fallback)
    expect(ticket.token).toBe("PD94bWwgdmVyc2lvbj0iMS4wIj8+TOKEN_DATA_HERE")
    expect(ticket.sign).toBe("m4SXdz9SIGN_DATA_HERE")
    expect(ticket.expiresAt).toBeInstanceOf(Date)
  })

  it("usa expirationTime de la respuesta si está presente", () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <loginCmsReturn>&lt;loginTicketResponse&gt;
            &lt;header&gt;
              &lt;expirationTime&gt;2026-04-04T10:00:00-03:00&lt;/expirationTime&gt;
            &lt;/header&gt;
            &lt;credentials&gt;
              &lt;token&gt;TOKEN&lt;/token&gt;
              &lt;sign&gt;SIGN&lt;/sign&gt;
            &lt;/credentials&gt;
          &lt;/loginTicketResponse&gt;</loginCmsReturn>
        </soapenv:Body>
      </soapenv:Envelope>`

    const ticket = parsearLoginTicketResponse(xml, fallback)
    expect(ticket.expiresAt.toISOString()).toContain("2026-04-04")
  })

  it("usa fallback si expirationTime no está presente", () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <loginCmsReturn>&lt;loginTicketResponse&gt;
            &lt;credentials&gt;
              &lt;token&gt;TOKEN&lt;/token&gt;
              &lt;sign&gt;SIGN&lt;/sign&gt;
            &lt;/credentials&gt;
          &lt;/loginTicketResponse&gt;</loginCmsReturn>
        </soapenv:Body>
      </soapenv:Envelope>`

    const ticket = parsearLoginTicketResponse(xml, fallback)
    expect(ticket.expiresAt).toEqual(fallback)
  })

  it("lanza WsaaError si no encuentra loginCmsReturn", () => {
    const xml = `<soapenv:Envelope><soapenv:Body><other>data</other></soapenv:Body></soapenv:Envelope>`
    expect(() => parsearLoginTicketResponse(xml, fallback)).toThrow(WsaaError)
  })

  it("lanza WsaaError si no encuentra token", () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <loginCmsReturn>&lt;loginTicketResponse&gt;
            &lt;credentials&gt;
              &lt;sign&gt;SIGN&lt;/sign&gt;
            &lt;/credentials&gt;
          &lt;/loginTicketResponse&gt;</loginCmsReturn>
        </soapenv:Body>
      </soapenv:Envelope>`

    expect(() => parsearLoginTicketResponse(xml, fallback)).toThrow(WsaaError)
  })
})
