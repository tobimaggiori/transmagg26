"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import type { Rol } from "@/types"

interface DashboardShellProps {
  children: React.ReactNode
  rol: Rol
  nombreUsuario?: string
  emailUsuario?: string
  esChoferTransmagg?: boolean
  arcaActiva?: boolean
  permisos: string[]
}

export function DashboardShell({
  children, rol, nombreUsuario, emailUsuario, esChoferTransmagg, arcaActiva, permisos
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden off-screen on mobile, fixed on desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex md:flex-shrink-0
      `}>
        <Sidebar
          rol={rol}
          nombreUsuario={nombreUsuario}
          emailUsuario={emailUsuario}
          esChoferTransmagg={esChoferTransmagg}
          arcaActiva={arcaActiva}
          permisos={permisos}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center h-14 px-4 border-b bg-background shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md border hover:bg-muted transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm text-primary">Transmagg</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
