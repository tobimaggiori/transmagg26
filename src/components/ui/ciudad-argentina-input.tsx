"use client"

import { useState, useEffect, useRef } from "react"

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
      return
    }

    const timer = setTimeout(async () => {
      setCargando(true)
      try {
        const res = await fetch(
          `https://apis.datos.gob.ar/georef/api/municipios?nombre=${encodeURIComponent(busqueda)}&max=8&campos=nombre,provincia.nombre`
        )
        const data = await res.json()
        setSugerencias(
          (data.municipios ?? []).map((m: { nombre: string; provincia: { nombre: string } }) => ({
            nombre: m.nombre.toUpperCase(),
            provincia: m.provincia.nombre.toUpperCase(),
          }))
        )
        setAbierto(true)
      } catch {
        setSugerencias([])
      } finally {
        setCargando(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [busqueda])

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
            // If user edits text, clear provincia so they must re-select
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
                }}
              >
                <span className="font-medium">{s.nombre}</span>
                <span className="text-muted-foreground ml-2 text-xs">{s.provincia}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {provincia && (
        <p className="text-xs text-muted-foreground mt-1">
          Provincia: <span className="font-medium">{provincia}</span>
        </p>
      )}
    </div>
  )
}
