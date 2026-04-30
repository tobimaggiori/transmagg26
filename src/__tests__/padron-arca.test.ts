/**
 * Tests del módulo padron-arca: parser SOAP y normalización de resultado.
 * Sin red — usa XMLs y objetos mock representativos del servicio A5.
 */

import { normalizarResultado, formatearDireccion, derivarCondicionIva, abreviarProvincia } from "@/lib/padron-arca/client"
import { parsearGetPersona } from "@/lib/padron-arca/soap"
import { PadronArcaNoEncontradoError } from "@/lib/padron-arca/errors"
import type { PersonaPadronArca } from "@/lib/padron-arca/types"

describe("formatearDireccion", () => {
  it("devuelve string vacío para domicilio nulo", () => {
    expect(formatearDireccion(null)).toBe("")
  })

  it("formatea con todas las partes", () => {
    expect(
      formatearDireccion({
        direccion: "Av. Siempreviva 742",
        localidad: "Springfield",
        descripcionProvincia: "BUENOS AIRES",
        codPostal: "1900",
      })
    ).toBe("Av. Siempreviva 742 — Springfield, BUENOS AIRES (CP 1900)")
  })

  it("omite partes vacías", () => {
    expect(
      formatearDireccion({
        direccion: "Calle 1",
        localidad: null,
        descripcionProvincia: null,
        codPostal: null,
      })
    ).toBe("Calle 1")
  })

  it("abrevia CABA cuando ARCA devuelve 'CIUDAD AUTONOMA BUENOS AIRES'", () => {
    expect(
      formatearDireccion({
        direccion: "Av. Corrientes 1234",
        localidad: "CABA",
        descripcionProvincia: "CIUDAD AUTONOMA BUENOS AIRES",
        codPostal: "1043",
      })
    ).toBe("Av. Corrientes 1234 — CABA, CABA (CP 1043)")
  })
})

describe("abreviarProvincia", () => {
  it("abrevia 'CIUDAD AUTONOMA BUENOS AIRES' (sin DE) a 'CABA'", () => {
    expect(abreviarProvincia("CIUDAD AUTONOMA BUENOS AIRES")).toBe("CABA")
  })

  it("abrevia 'CIUDAD AUTONOMA DE BUENOS AIRES' a 'CABA'", () => {
    expect(abreviarProvincia("CIUDAD AUTONOMA DE BUENOS AIRES")).toBe("CABA")
  })

  it("abrevia con tildes y casing mixto", () => {
    expect(abreviarProvincia("Ciudad Autónoma de Buenos Aires")).toBe("CABA")
  })

  it("deja el resto intacto", () => {
    expect(abreviarProvincia("BUENOS AIRES")).toBe("BUENOS AIRES")
    expect(abreviarProvincia("CÓRDOBA")).toBe("CÓRDOBA")
  })

  it("devuelve string vacío para null/undefined", () => {
    expect(abreviarProvincia(null)).toBe("")
    expect(abreviarProvincia(undefined)).toBe("")
  })
})

describe("normalizarResultado", () => {
  const base: PersonaPadronArca = {
    cuit: "30709381683",
    tipoPersona: "JURIDICA",
    estadoClave: "ACTIVO",
    razonSocial: null,
    nombre: null,
    apellido: null,
    domicilioFiscal: null,
    regimen: null,
    impuestos: [],
    categorias: [],
  }

  it("usa razonSocial si está presente, en mayúsculas", () => {
    const r = normalizarResultado({ ...base, razonSocial: "Acme S.A." }, "30709381683")
    expect(r.razonSocial).toBe("ACME S.A.")
  })

  it("para personas físicas combina apellido, nombre", () => {
    const r = normalizarResultado(
      { ...base, razonSocial: null, apellido: "Pérez", nombre: "Juan", tipoPersona: "FISICA" },
      "20111111119"
    )
    expect(r.razonSocial).toBe("PÉREZ, JUAN")
  })

  it("formatea la dirección", () => {
    const r = normalizarResultado(
      {
        ...base,
        razonSocial: "Acme",
        domicilioFiscal: {
          direccion: "Av. Mitre 1234",
          localidad: "Avellaneda",
          descripcionProvincia: "BUENOS AIRES",
          codPostal: "1870",
        },
      },
      "30709381683"
    )
    expect(r.direccion).toBe("Av. Mitre 1234 — Avellaneda, BUENOS AIRES (CP 1870)")
  })
})

describe("derivarCondicionIva", () => {
  it("regimen MONOTRIBUTO → MONOTRIBUTISTA", () => {
    expect(derivarCondicionIva({ regimen: "MONOTRIBUTO", impuestos: [] })).toBe("MONOTRIBUTISTA")
  })

  it("regimen REGIMEN_GENERAL con IVA AC → RESPONSABLE_INSCRIPTO", () => {
    expect(
      derivarCondicionIva({
        regimen: "REGIMEN_GENERAL",
        impuestos: [{ idImpuesto: 30, descripcionImpuesto: "IVA", estado: "AC" }],
      })
    ).toBe("RESPONSABLE_INSCRIPTO")
  })

  it('tolera "ACTIVO" además de "AC" para compat', () => {
    expect(
      derivarCondicionIva({
        regimen: "REGIMEN_GENERAL",
        impuestos: [{ idImpuesto: 30, descripcionImpuesto: "IVA", estado: "ACTIVO" }],
      })
    ).toBe("RESPONSABLE_INSCRIPTO")
  })

  it("REGIMEN_GENERAL con IVA Exento (33) → EXENTO", () => {
    expect(
      derivarCondicionIva({
        regimen: "REGIMEN_GENERAL",
        impuestos: [{ idImpuesto: 33, descripcionImpuesto: "IVA EXENTO", estado: "AC" }],
      })
    ).toBe("EXENTO")
  })

  it("regimen null → null", () => {
    expect(derivarCondicionIva({ regimen: null, impuestos: [] })).toBeNull()
  })

  it("REGIMEN_GENERAL sin IVA activo → null", () => {
    expect(
      derivarCondicionIva({
        regimen: "REGIMEN_GENERAL",
        impuestos: [{ idImpuesto: 20, descripcionImpuesto: "GANANCIAS", estado: "AC" }],
      })
    ).toBeNull()
  })
})

describe("parsearGetPersona (A5)", () => {
  // Caso real (monotributista, persona física) capturado del servicio.
  const xmlMonotributo = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><ns2:getPersona_v2Response xmlns:ns2="http://a5.soap.ws.server.puc.sr/"><personaReturn><datosGenerales><apellido>CIANI</apellido><domicilioFiscal><codPostal>2109</codPostal><descripcionProvincia>SANTA FE</descripcionProvincia><direccion>SIMON DE IRIONDO 493</direccion><idProvincia>12</idProvincia><localidad>ACEBAL</localidad><tipoDomicilio>FISCAL</tipoDomicilio></domicilioFiscal><estadoClave>ACTIVO</estadoClave><idPersona>27232471099</idPersona><nombre>MARISA MARIA SOL</nombre><tipoClave>CUIT</tipoClave><tipoPersona>FISICA</tipoPersona></datosGenerales><datosMonotributo><impuesto><descripcionImpuesto>MONOTRIBUTO</descripcionImpuesto><estadoImpuesto>AC</estadoImpuesto><idImpuesto>20</idImpuesto></impuesto></datosMonotributo></personaReturn></ns2:getPersona_v2Response></soap:Body></soap:Envelope>`

  it("parsea persona física monotributista con datos generales y régimen", () => {
    const p = parsearGetPersona(xmlMonotributo, "27232471099")
    expect(p.cuit).toBe("27232471099")
    expect(p.tipoPersona).toBe("FISICA")
    expect(p.apellido).toBe("CIANI")
    expect(p.nombre).toBe("MARISA MARIA SOL")
    expect(p.domicilioFiscal?.direccion).toBe("SIMON DE IRIONDO 493")
    expect(p.domicilioFiscal?.codPostal).toBe("2109")
    expect(p.domicilioFiscal?.localidad).toBe("ACEBAL")
    expect(p.domicilioFiscal?.descripcionProvincia).toBe("SANTA FE")
    expect(p.regimen).toBe("MONOTRIBUTO")
    expect(p.impuestos).toHaveLength(1)
    expect(p.impuestos[0].estado).toBe("AC")
  })

  // Caso régimen general (jurídica RI)
  const xmlRegimenGeneral = `<personaReturn>
    <datosGenerales>
      <razonSocial>TRANSMAGG SA</razonSocial>
      <idPersona>30709381683</idPersona>
      <tipoPersona>JURIDICA</tipoPersona>
      <estadoClave>ACTIVO</estadoClave>
      <domicilioFiscal>
        <direccion>AV. CORRIENTES 1234</direccion>
        <codPostal>1043</codPostal>
        <localidad>CABA</localidad>
        <descripcionProvincia>CIUDAD AUTONOMA BUENOS AIRES</descripcionProvincia>
      </domicilioFiscal>
    </datosGenerales>
    <datosRegimenGeneral>
      <impuesto>
        <descripcionImpuesto>IVA</descripcionImpuesto>
        <estadoImpuesto>AC</estadoImpuesto>
        <idImpuesto>30</idImpuesto>
      </impuesto>
    </datosRegimenGeneral>
  </personaReturn>`

  it("parsea jurídica de régimen general con IVA activo", () => {
    const p = parsearGetPersona(xmlRegimenGeneral, "30709381683")
    expect(p.razonSocial).toBe("TRANSMAGG SA")
    expect(p.regimen).toBe("REGIMEN_GENERAL")
    expect(p.impuestos[0]).toEqual({ idImpuesto: 30, descripcionImpuesto: "IVA", estado: "AC" })
    expect(p.domicilioFiscal?.codPostal).toBe("1043")
  })

  it("lanza NoEncontrado si no hay datosGenerales", () => {
    const xml = `<soap:Envelope><soap:Body><resp/></soap:Body></soap:Envelope>`
    expect(() => parsearGetPersona(xml, "20999999999")).toThrow(PadronArcaNoEncontradoError)
  })

  it("decodifica entidades XML en campos texto", () => {
    const xml = `<personaReturn><datosGenerales><idPersona>1</idPersona><razonSocial>SMITH &amp; CO</razonSocial></datosGenerales></personaReturn>`
    const p = parsearGetPersona(xml, "1")
    expect(p.razonSocial).toBe("SMITH & CO")
  })
})
