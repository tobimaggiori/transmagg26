"use client"

import { useState, useRef, useEffect } from "react"
import { coincideConBusqueda } from "@/lib/search-utils"

export type SearchComboboxItem = {
  id: string
  label: string
  sublabel?: string
}

type SearchComboboxProps = {
  items: SearchComboboxItem[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

/**
 * SearchCombobox: SearchComboboxProps -> JSX.Element
 *
 * Dado una lista de items con id/label/sublabel, un valor seleccionado y un onChange,
 * devuelve un input buscable que filtra la lista en tiempo real y permite seleccionar un item.
 * Esta función existe para reemplazar los <select> de Fletero y Empresa con una experiencia
 * de búsqueda por razón social o CUIT sin necesidad de hacer requests al servidor.
 *
 * Ejemplos:
 * <SearchCombobox items={[{ id: "1", label: "Juan SRL", sublabel: "20-12345678-9" }]} value="" onChange={setId} />
 * // => input vacío, al escribir "juan" muestra "Juan SRL" en el dropdown
 * <SearchCombobox items={[...]} value="1" onChange={setId} />
 * // => input muestra "Juan SRL — 20-12345678-9"
 */
export function SearchCombobox({
  items,
  value,
  onChange,
  placeholder = "Buscar...",
  required,
  disabled,
}: SearchComboboxProps) {
  const selectedItem = items.find((i) => i.id === value) ?? null
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [])

  const filtered =
    query.trim() === ""
      ? items
      : items.filter((item) => coincideConBusqueda(item, query))

  // Texto que se muestra en el input cuando hay un item seleccionado y no está abierto
  const displayValue =
    selectedItem
      ? `${selectedItem.label}${selectedItem.sublabel ? ` — ${selectedItem.sublabel}` : ""}`
      : ""

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setOpen(true)
    // Si el operador borró todo el texto, limpiar la selección
    if (e.target.value === "") {
      onChange("")
    }
  }

  function handleFocus() {
    setQuery("")
    setOpen(true)
  }

  function handleSelect(item: SearchComboboxItem) {
    onChange(item.id)
    setQuery("")
    setOpen(false)
  }

  // Comparador para resaltar el item seleccionado en el listado
  function esSeleccionado(item: SearchComboboxItem) {
    return item.id === value
  }

  // Texto visible en el input: si está abierto mostramos la búsqueda, sino el displayValue
  const inputValue = open ? query : displayValue

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={open ? placeholder : (displayValue || placeholder)}
        required={required && !value}
        disabled={disabled}
        autoComplete="off"
        className="h-9 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-background shadow-md">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(item)
                }}
                className={`w-full px-3 py-2 text-left cursor-pointer hover:bg-muted/60 ${
                  esSeleccionado(item) ? "bg-muted/40" : ""
                }`}
              >
                <div className="text-sm">{item.label}</div>
                {item.sublabel && (
                  <div className="text-xs text-muted-foreground">{item.sublabel}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Input hidden para que el required nativo funcione */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        />
      )}
    </div>
  )
}
