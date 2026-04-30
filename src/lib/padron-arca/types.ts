/**
 * Tipos del servicio ARCA `ws_sr_constancia_inscripcion` (consulta de padrón
 * con constancia de inscripción — incluye impuestos y categorías siempre).
 * Servicio independiente de WSFEv1 — no comparte URLs ni cliente SOAP.
 */

export type DomicilioFiscalArca = {
  direccion: string | null
  codPostal: string | null
  localidad: string | null
  descripcionProvincia: string | null
}

export type ImpuestoArca = {
  idImpuesto: number
  descripcionImpuesto: string | null
  estado: string | null
}

export type CategoriaArca = {
  idImpuesto: number
  descripcionImpuesto: string | null
  idCategoria: number | null
  descripcionCategoria: string | null
  estado: string | null
}

export type RegimenArca = "MONOTRIBUTO" | "REGIMEN_GENERAL" | null

/** Datos crudos del padrón tal como los devuelve ARCA. */
export type PersonaPadronArca = {
  cuit: string
  tipoPersona: "FISICA" | "JURIDICA" | string | null
  estadoClave: string | null
  razonSocial: string | null
  nombre: string | null
  apellido: string | null
  domicilioFiscal: DomicilioFiscalArca | null
  /** Régimen detectado por presencia de <datosMonotributo> / <datosRegimenGeneral>. */
  regimen: RegimenArca
  impuestos: ImpuestoArca[]
  categorias: CategoriaArca[]
}

export type CondicionIvaDerivada =
  | "RESPONSABLE_INSCRIPTO"
  | "MONOTRIBUTISTA"
  | "EXENTO"
  | "CONSUMIDOR_FINAL"

/** Resultado normalizado para uso de la app — razón social + dirección formateada en un único string. */
export type ResultadoPadronArca = {
  cuit: string
  razonSocial: string
  direccion: string
  condicionIva: CondicionIvaDerivada | null
  estadoClave: string | null
  tipoPersona: "FISICA" | "JURIDICA" | string | null
}
