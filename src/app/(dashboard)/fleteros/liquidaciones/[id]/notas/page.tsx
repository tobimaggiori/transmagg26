/**
 * Página de detalle NC/ND por liquidacion (/fleteros/liquidaciones/[id]/notas).
 * Server wrapper: verifica auth y permisos, renderiza client component.
 */
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { NotasLPClient } from "./notas-lp-client"
import type { Rol } from "@/types"

export default async function NotasLPPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")
  const { id } = await params
  return <NotasLPClient liquidacionId={id} />
}
