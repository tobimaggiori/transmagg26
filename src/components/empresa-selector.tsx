"use client"

/**
 * Selector de empresa en el footer del sidebar.
 * Los operadores internos pueden alternar entre Transmagg y Javier Maggiori.
 * La empresa activa se infiere del pathname (rutas /jm/* corresponden a JM).
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const EMPRESAS = [
  { id: "transmagg", label: "Transmagg", href: "/dashboard" },
  { id: "jm", label: "Javier Maggiori", href: "/jm" },
] as const

type Props = { collapsed?: boolean }

export function EmpresaSelector({ collapsed }: Props) {
  const pathname = usePathname()
  const activa = pathname.startsWith("/jm") ? "jm" : "transmagg"
  const empresaActiva = EMPRESAS.find((e) => e.id === activa) ?? EMPRESAS[0]

  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    if (abierto) document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [abierto])

  if (collapsed) {
    return (
      <Link
        href={activa === "transmagg" ? "/jm" : "/dashboard"}
        title={`Empresa actual: ${empresaActiva.label}`}
        className="flex items-center justify-center rounded-lg px-2 py-1.5 text-xs text-sidebar-muted hover:bg-sidebar-accent hover:text-white transition-colors"
      >
        <Building2 className="h-4 w-4" />
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-sidebar-muted hover:bg-sidebar-accent hover:text-white transition-colors"
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">{empresaActiva.label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>

      {abierto && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg bg-sidebar-accent border border-sidebar-border overflow-hidden shadow-lg">
          {EMPRESAS.map((e) => (
            <Link
              key={e.id}
              href={e.href}
              onClick={() => setAbierto(false)}
              className={`block px-3 py-2 text-xs transition-colors ${
                e.id === activa
                  ? "bg-sidebar-primary/30 text-white font-medium"
                  : "text-sidebar-muted hover:bg-sidebar-primary/10 hover:text-white"
              }`}
            >
              {e.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
