import { prisma } from "@/lib/prisma"

interface DatosEmisor {
  razonSocial: string
  domicilio: string
  condicionIva: string
  cuit: string
  iibb: string
  fechaInicioActividades: string
  logoComprobante: Buffer | null
  logoArca: Buffer | null
}

export async function obtenerDatosEmisor(): Promise<DatosEmisor> {
  let config: { cuit: string; razonSocial: string; logoComprobanteB64?: string | null; logoArcaB64?: string | null } | null
  try {
    config = await prisma.configuracionArca.findUnique({
      where: { id: "unico" },
      select: { cuit: true, razonSocial: true, logoComprobanteB64: true, logoArcaB64: true },
    })
  } catch {
    // Logo columns may not exist if migration not applied
    config = await prisma.configuracionArca.findUnique({
      where: { id: "unico" },
      select: { cuit: true, razonSocial: true },
    })
  }
  const cuit = config?.cuit || "30709381683"
  return {
    razonSocial: config?.razonSocial || "Trans-Magg S.R.L.",
    domicilio: "Belgrano 184, Acebal, Santa Fe.",
    condicionIva: "Responsable Inscripto",
    cuit,
    iibb: `Convenio Multilateral - ${cuit}`,
    fechaInicioActividades: "18/10/2005",
    logoComprobante: config && "logoComprobanteB64" in config && config.logoComprobanteB64 ? Buffer.from(config.logoComprobanteB64, "base64") : null,
    logoArca: config && "logoArcaB64" in config && config.logoArcaB64 ? Buffer.from(config.logoArcaB64, "base64") : null,
  }
}
