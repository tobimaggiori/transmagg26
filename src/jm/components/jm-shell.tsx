"use client"

import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { JmSidebar } from "@/jm/components/jm-sidebar"

const STORAGE_KEY = "transmagg-sidebar-collapsed"

interface Props {
  children: React.ReactNode
  nombreUsuario?: string
  emailUsuario?: string
}

export function JmShell({ children, nombreUsuario, emailUsuario }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "true") setCollapsed(true)
    } catch { /* SSR */ }
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch {}
      return next
    })
  }

  return (
    <div className="theme-jm flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 transition-all duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex md:flex-shrink-0
      `}>
        <JmSidebar
          nombreUsuario={nombreUsuario}
          emailUsuario={emailUsuario}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="md:hidden flex items-center h-14 px-4 border-b border-border bg-card shrink-0 gap-3 shadow-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md border border-border hover:bg-accent transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <span className="font-semibold text-sm text-primary">Javier Maggiori</span>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:px-8 md:py-6 max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
