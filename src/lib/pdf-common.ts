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
  let config: Record<string, unknown> | null = null
  try {
    config = await prisma.configuracionArca.findUnique({
      where: { id: "unico" },
      select: {
        cuit: true, razonSocial: true,
        logoComprobanteR2Key: true, logoArcaR2Key: true,
        logoComprobanteB64: true, logoArcaB64: true,
      },
    })
  } catch {
    try {
      config = await prisma.configuracionArca.findUnique({
        where: { id: "unico" },
        select: { cuit: true, razonSocial: true },
      })
    } catch { /* ignore */ }
  }

  const cuit = (config?.cuit as string) || "30709381683"

  // Cargar logos: preferir R2, fallback a B64
  let logoComprobante: Buffer | null = null
  let logoArca: Buffer | null = null

  const comprobanteR2Key = config?.logoComprobanteR2Key as string | null
  const arcaR2Key = config?.logoArcaR2Key as string | null
  const comprobanteB64 = config?.logoComprobanteB64 as string | null
  const arcaB64 = config?.logoArcaB64 as string | null

  if (comprobanteR2Key) {
    try {
      const { obtenerArchivo, storageConfigurado } = await import("@/lib/storage")
      if (storageConfigurado()) logoComprobante = await obtenerArchivo(comprobanteR2Key)
    } catch { /* fallback to B64 */ }
  }
  if (!logoComprobante && comprobanteB64) {
    logoComprobante = Buffer.from(comprobanteB64, "base64")
  }

  if (arcaR2Key) {
    try {
      const { obtenerArchivo, storageConfigurado } = await import("@/lib/storage")
      if (storageConfigurado()) logoArca = await obtenerArchivo(arcaR2Key)
    } catch { /* fallback to B64 */ }
  }
  if (!logoArca && arcaB64) {
    logoArca = Buffer.from(arcaB64, "base64")
  }

  return {
    razonSocial: (config?.razonSocial as string) || "Trans-Magg S.R.L.",
    domicilio: "Belgrano 184, Acebal, Santa Fe.",
    condicionIva: "Responsable Inscripto",
    cuit,
    iibb: `Convenio Multilateral - ${cuit}`,
    fechaInicioActividades: "18/10/2005",
    logoComprobante,
    logoArca,
  }
}
