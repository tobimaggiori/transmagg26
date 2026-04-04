/**
 * GET /api/configuracion-arca/cert-info
 *
 * Devuelve metadata del certificado cargado (fingerprint, emisor, vencimiento)
 * sin exponer el certificado en sí. Usa node-forge para parsear el PKCS#12.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { descifrarValor } from "@/lib/arca/crypto"
import forge from "node-forge"
import type { Rol } from "@/types"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const config = await prisma.configuracionArca.findFirst({
    select: { certificadoB64: true, certificadoPass: true },
  })

  if (!config?.certificadoB64 || !config?.certificadoPass) {
    return NextResponse.json({ cargado: false })
  }

  try {
    const certB64 = descifrarValor(config.certificadoB64)
    const certPass = descifrarValor(config.certificadoPass)

    const p12Der = forge.util.decode64(certB64)
    const p12Asn1 = forge.asn1.fromDer(p12Der)
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPass)

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const certBag = certBags[forge.pki.oids.certBag]
    const cert = certBag?.[0]?.cert

    if (!cert) {
      return NextResponse.json({ cargado: true, valido: false, error: "No se encontró certificado en el archivo" })
    }

    // Fingerprint SHA-256
    const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()
    const md = forge.md.sha256.create()
    md.update(derBytes)
    const fingerprint = md.digest().toHex().match(/.{2}/g)?.join(":").toUpperCase() ?? ""

    // Datos del certificado
    const notBefore = cert.validity.notBefore
    const notAfter = cert.validity.notAfter
    const ahora = new Date()

    const getAttr = (attrs: forge.pki.CertificateField[], shortName: string) =>
      attrs.find((a) => a.shortName === shortName)?.value ?? null

    const subject = {
      cn: getAttr(cert.subject.attributes, "CN"),
      o: getAttr(cert.subject.attributes, "O"),
      serialNumber: getAttr(cert.subject.attributes, "serialNumber"),
    }
    const issuer = {
      cn: getAttr(cert.issuer.attributes, "CN"),
      o: getAttr(cert.issuer.attributes, "O"),
    }

    let estado: "valido" | "proximo_a_vencer" | "vencido" = "valido"
    const diasParaVencer = Math.floor((notAfter.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
    if (ahora > notAfter) estado = "vencido"
    else if (diasParaVencer < 30) estado = "proximo_a_vencer"

    return NextResponse.json({
      cargado: true,
      valido: ahora >= notBefore && ahora <= notAfter,
      estado,
      fingerprint,
      subject,
      issuer,
      notBefore: notBefore.toISOString(),
      notAfter: notAfter.toISOString(),
      diasParaVencer,
    })
  } catch {
    return NextResponse.json({
      cargado: true,
      valido: false,
      error: "No se pudo leer el certificado. Verificar formato y contraseña.",
    })
  }
}
