/**
 * Fachada pública del módulo padron-arca (servicio `ws_sr_constancia_inscripcion`).
 *
 * `consultarPadronArca(cuit)` obtiene los datos del contribuyente y devuelve
 * un resultado normalizado (razón social, dirección formateada, condición IVA
 * derivada de los impuestos).
 */

import { cargarConfigArca } from "@/lib/arca/config"
import { obtenerTicketPadron } from "./wsaa"
import { llamarGetPersona } from "./soap"
import { urlPadronArca, type ModoPadron } from "./urls"
import { PadronArcaError, PadronArcaCuitInvalidoError } from "./errors"
import type {
  PersonaPadronArca,
  ResultadoPadronArca,
  DomicilioFiscalArca,
  CondicionIvaDerivada,
} from "./types"

/**
 * consultarPadronArca: string -> Promise<ResultadoPadronArca>
 *
 * Dado un CUIT (con o sin guiones/espacios), devuelve los datos del
 * contribuyente normalizados para autocompletar formularios. Toma cert
 * y modo desde la `ConfiguracionArca` activa (no la modifica).
 *
 * Lanza:
 *  - PadronArcaCuitInvalidoError si el CUIT no es 11 dígitos.
 *  - PadronArcaNoEncontradoError si AFIP no encuentra la persona.
 *  - PadronArcaError en errores de red/SOAP.
 */
export async function consultarPadronArca(cuit: string): Promise<ResultadoPadronArca> {
  const cuitLimpio = cuit.replace(/\D/g, "")
  if (cuitLimpio.length !== 11) {
    throw new PadronArcaCuitInvalidoError(cuit)
  }

  const config = await cargarConfigArca()
  if (config.modo === "simulacion") {
    throw new PadronArcaError(
      "ARCA está en modo simulación — el padrón requiere certificado real (homologación o producción)",
      false
    )
  }
  const modo: ModoPadron = config.modo

  const ticket = await obtenerTicketPadron({
    modo,
    certificadoB64: config.certificadoB64,
    certificadoPass: config.certificadoPass,
  })

  const persona = await llamarGetPersona({
    url: urlPadronArca(modo),
    token: ticket.token,
    sign: ticket.sign,
    cuitRepresentada: config.cuit,
    cuitConsultado: cuitLimpio,
  })

  return normalizarResultado(persona, cuitLimpio)
}

/**
 * normalizarResultado: PersonaPadronArca string -> ResultadoPadronArca
 *
 * Para personas físicas el padrón usa nombre/apellido en vez de razonSocial.
 *
 * Ejemplos:
 * normalizarResultado({ razonSocial: "Acme SA", domicilioFiscal: { direccion: "Calle 1", localidad: "CABA", descripcionProvincia: "BUENOS AIRES", codPostal: "1000" }, impuestos: [], categorias: [], ... }, "30709381683")
 *   // => { razonSocial: "ACME SA", direccion: "Calle 1 — CABA, BUENOS AIRES (CP 1000)", ... }
 */
export function normalizarResultado(p: PersonaPadronArca, cuit: string): ResultadoPadronArca {
  const razonSocial = (p.razonSocial?.trim() ||
    [p.apellido?.trim(), p.nombre?.trim()].filter(Boolean).join(", ") ||
    "").toUpperCase()

  return {
    cuit,
    razonSocial,
    direccion: formatearDireccion(p.domicilioFiscal),
    condicionIva: derivarCondicionIva(p),
    estadoClave: p.estadoClave,
    tipoPersona: p.tipoPersona,
  }
}

/**
 * derivarCondicionIva: PersonaPadronArca -> CondicionIvaDerivada | null
 *
 * Usa el régimen detectado por el parser (presencia de `<datosMonotributo>`
 * o `<datosRegimenGeneral>` en la respuesta de A5):
 *  - regimen MONOTRIBUTO → MONOTRIBUTISTA
 *  - regimen REGIMEN_GENERAL con impuesto 30 (IVA) activo → RESPONSABLE_INSCRIPTO
 *  - regimen REGIMEN_GENERAL con impuesto 33/34 activo → EXENTO
 *  - sino → null (operador completa manual)
 *
 * "Activo" en A5 viene como "AC". Tolera también "ACTIVO" por compatibilidad.
 *
 * Ejemplos:
 * derivarCondicionIva({ regimen: "MONOTRIBUTO", impuestos: [], ... }) === "MONOTRIBUTISTA"
 * derivarCondicionIva({ regimen: "REGIMEN_GENERAL", impuestos: [{ idImpuesto: 30, estado: "AC", ... }], ... }) === "RESPONSABLE_INSCRIPTO"
 * derivarCondicionIva({ regimen: null, impuestos: [], ... }) === null
 */
export function derivarCondicionIva(p: Pick<PersonaPadronArca, "regimen" | "impuestos">): CondicionIvaDerivada | null {
  if (p.regimen === "MONOTRIBUTO") return "MONOTRIBUTISTA"
  if (p.regimen === "REGIMEN_GENERAL") {
    const activo = (id: number) =>
      p.impuestos.some((i) => i.idImpuesto === id && (i.estado === "AC" || i.estado === "ACTIVO"))
    if (activo(30)) return "RESPONSABLE_INSCRIPTO"
    if (activo(33) || activo(34)) return "EXENTO"
  }
  return null
}

/**
 * abreviarProvincia: string | null | undefined -> string
 *
 * Normaliza la descripción de provincia devuelta por ARCA. Hoy sólo abrevia
 * "CIUDAD AUTONOMA [DE] BUENOS AIRES" (con o sin tilde, sin distinguir caso)
 * a "CABA"; el resto se devuelve tal cual (tras trim).
 *
 * Ejemplos:
 * abreviarProvincia("CIUDAD AUTONOMA BUENOS AIRES") === "CABA"
 * abreviarProvincia("Ciudad Autónoma de Buenos Aires") === "CABA"
 * abreviarProvincia("BUENOS AIRES") === "BUENOS AIRES"
 * abreviarProvincia(null) === ""
 */
export function abreviarProvincia(provincia: string | null | undefined): string {
  const p = provincia?.trim() ?? ""
  if (/^ciudad aut[oó]noma (de )?buenos aires$/i.test(p)) return "CABA"
  return p
}

/**
 * formatearDireccion: DomicilioFiscalArca | null -> string
 *
 * Formato: "<dirección> — <localidad>, <provincia> (CP <cp>)".
 * Omite las partes vacías. Devuelve "" si no hay datos.
 * La provincia se abrevia vía {@link abreviarProvincia} (CABA).
 *
 * Ejemplos:
 * formatearDireccion({ direccion: "Av. Siempreviva 742", localidad: "Springfield", descripcionProvincia: "BUENOS AIRES", codPostal: "1900" })
 *   // => "Av. Siempreviva 742 — Springfield, BUENOS AIRES (CP 1900)"
 * formatearDireccion({ direccion: "Av. Corrientes 1234", localidad: "CABA", descripcionProvincia: "CIUDAD AUTONOMA BUENOS AIRES", codPostal: "1043" })
 *   // => "Av. Corrientes 1234 — CABA, CABA (CP 1043)"
 * formatearDireccion(null) // => ""
 */
export function formatearDireccion(dom: DomicilioFiscalArca | null): string {
  if (!dom) return ""
  const partes: string[] = []
  const direccion = dom.direccion?.trim()
  const localidad = dom.localidad?.trim()
  const provincia = abreviarProvincia(dom.descripcionProvincia)
  const cp = dom.codPostal?.trim()

  if (direccion) partes.push(direccion)
  const ubicacion = [localidad, provincia].filter(Boolean).join(", ")
  if (ubicacion) partes.push(ubicacion)
  let resultado = partes.join(" — ")
  if (cp) resultado = resultado ? `${resultado} (CP ${cp})` : `CP ${cp}`
  return resultado
}
