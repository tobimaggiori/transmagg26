"use client"

import { useState, useEffect, useRef } from "react"

interface CeldaEditableProps {
  valor: number | string
  tipo?: "number" | "text"
  editable?: boolean
  onGuardar: (nuevoValor: number | string) => void
  formatear?: (v: number | string) => string
  className?: string
}

export function CeldaEditable({
  valor,
  tipo = "number",
  editable = true,
  onGuardar,
  formatear,
  className = "",
}: CeldaEditableProps) {
  const [editando, setEditando] = useState(false)
  const [valorLocal, setValorLocal] = useState(valor)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setValorLocal(valor) }, [valor])
  useEffect(() => { if (editando) inputRef.current?.select() }, [editando])

  if (!editable) {
    return <span className={`px-2 py-1 ${className}`}>{formatear ? formatear(valor) : valor}</span>
  }

  if (editando) {
    return (
      <input
        ref={inputRef}
        type={tipo}
        value={valorLocal}
        onChange={(e) => setValorLocal(tipo === "number" ? Number(e.target.value) : e.target.value)}
        onBlur={() => { onGuardar(valorLocal); setEditando(false) }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onGuardar(valorLocal); setEditando(false) }
          if (e.key === "Escape") { setValorLocal(valor); setEditando(false) }
        }}
        className={`w-full border-b border-blue-500 outline-none px-2 py-1 bg-blue-50 text-sm ${className}`}
        style={{ minWidth: 70 }}
        step={tipo === "number" ? "0.01" : undefined}
      />
    )
  }

  return (
    <span
      className={`px-2 py-1 cursor-pointer hover:bg-blue-50 rounded block text-sm ${className}`}
      onClick={() => setEditando(true)}
      title="Click para editar"
    >
      {formatear ? formatear(valor) : valor}
    </span>
  )
}
