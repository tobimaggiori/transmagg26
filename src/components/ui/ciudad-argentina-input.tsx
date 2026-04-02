"use client"

import { useState, useEffect, useRef } from "react"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"

interface CiudadArgentinaInputProps {
  label: string
  value: string
  provincia: string
  onSelect: (ciudad: string, provincia: string) => void
  required?: boolean
  className?: string
}

export function CiudadArgentinaInput({
  label,
  value,
  provincia,
  onSelect,
  required,
  className,
}: CiudadArgentinaInputProps) {
  const [busqueda, setBusqueda] = useState(value)
  const [sugerencias, setSugerencias] = useState<Array<{ nombre: string; provincia: string }>>([])
  const [cargando, setCargando] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [buscaTerminada, setBuscaTerminada] = useState(false)
  const prevValueRef = useRef(value)

  // Sync external value changes (e.g. edit mode loading)
  useEffect(() => {
    if (value !== prevValueRef.current) {
      setBusqueda(value)
      prevValueRef.current = value
    }
  }, [value])

  useEffect(() => {
    if (busqueda.length < 2) {
      setSugerencias([])
      setBuscaTerminada(false)
      return
    }

    const timer = setTimeout(async () => {
      setCargando(true)
      setBuscaTerminada(false)
      try {
        const res = await fetch(
          `https://apis.datos.gob.ar/georef/api/municipios?nombre=${encodeURIComponent(busqueda)}&max=8&campos=nombre,provincia.nombre`
        )
        const data = await res.json()
        const resultados = (data.municipios ?? []).map((m: { nombre: string; provincia: { nombre: string } }) => ({
          nombre: m.nombre.toUpperCase(),
          provincia: m.provincia.nombre.toUpperCase(),
        }))
        setSugerencias(resultados)
        setBuscaTerminada(true)
        if (resultados.length > 0) setAbierto(true)
      } catch {
        setSugerencias([])
        setBuscaTerminada(true)
      } finally {
        setCargando(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [busqueda])

  const mostrarManual = buscaTerminada && sugerencias.length === 0 && busqueda.length >= 2 && !provincia

  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        {label} {required && "*"}
      </label>
      <div className="relative">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => {
            const val = e.target.value.toUpperCase()
            setBusqueda(val)
            onSelect(val, "")
          }}
          style={{ textTransform: "uppercase" }}
          placeholder="Escribí la ciudad..."
          className="w-full h-9 rounded-md border bg-background px-2 text-sm"
          onFocus={() => sugerencias.length > 0 && setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 200)}
        />

        {cargando && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            Buscando...
          </span>
        )}

        {abierto && sugerencias.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {sugerencias.map((s, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm"
                onMouseDown={() => {
                  onSelect(s.nombre, s.provincia)
                  setBusqueda(s.nombre)
                  setAbierto(false)
                  setBuscaTerminada(false)
                }}
              >
                <span className="font-medium">{s.nombre}</span>
                <span className="text-muted-foreground ml-2 text-xs">{s.provincia}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Provincia autocompletada */}
      {provincia && !mostrarManual && (
        <p className="text-xs text-muted-foreground mt-1">
          Provincia: <span className="font-medium">{provincia}</span>
        </p>
      )}

      {/* Fallback: seleccionar provincia manualmente */}
      {mostrarManual && (
        <div className="mt-1">
          <label className="text-[11px] text-muted-foreground">
            No encontramos esa ciudad. Seleccioná la provincia manualmente:
          </label>
          <select
            className="w-full h-8 rounded-md border bg-background px-2 text-sm mt-1"
            value=""
            onChange={(e) => {
              onSelect(busqueda, e.target.value)
            }}
          >
            <option value="">Seleccioná provincia...</option>
            {PROVINCIAS_ARGENTINA.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
