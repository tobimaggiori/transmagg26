"use client"

import { useState, useEffect } from "react"

type ContactoEmail = {
  id: string
  email: string
  nombre: string | null
}

type Props = {
  parentId: string
  parentType: "empresa" | "fletero"
  value: string
  onChange: (email: string) => void
  disabled?: boolean
}

/**
 * SelectContactoEmail: Props -> JSX.Element
 *
 * Carga los contactos de email de una empresa o fletero y los muestra en un select.
 * Pre-selecciona automáticamente si hay exactamente uno.
 * Muestra mensaje si no hay contactos.
 */
export function SelectContactoEmail({ parentId, parentType, value, onChange, disabled }: Props) {
  const [contactos, setContactos] = useState<ContactoEmail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!parentId) return
    const url = parentType === "empresa"
      ? `/api/empresas/${parentId}/contactos-email`
      : `/api/fleteros/${parentId}/contactos-email`
    fetch(url)
      .then((r) => r.json())
      .then((data: ContactoEmail[]) => {
        setContactos(data)
        if (data.length === 1 && !value) {
          onChange(data[0].email)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId, parentType])

  if (loading) {
    return <p className="text-xs text-muted-foreground py-1">Cargando contactos...</p>
  }

  if (contactos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground mt-1">
        No hay contactos de email cargados. Agregá uno desde ABM → {parentType === "empresa" ? "Empresas" : "Fleteros"}.
      </p>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
    >
      {contactos.length > 1 && <option value="">Seleccionar destinatario...</option>}
      {contactos.map((c) => (
        <option key={c.id} value={c.email}>
          {c.email}{c.nombre ? ` — ${c.nombre}` : ""}
        </option>
      ))}
    </select>
  )
}
