"use client"

/**
 * Componente cliente para la vista Mi Flota del rol FLETERO.
 * Muestra los camiones del fletero con su chofer asignado y los choferes sin camión.
 */

import { Truck, User, UserX } from "lucide-react"

interface ChoferFlota {
  id: string
  nombre: string
  apellido: string
  email: string | null
}

interface CamionFlota {
  id: string
  patenteChasis: string
  patenteAcoplado: string | null
  choferActual: ChoferFlota | null
}

interface MiFlotaClientProps {
  camiones: CamionFlota[]
  choferesSinCamion: ChoferFlota[]
  razonSocial: string
}

/**
 * MiFlotaClient: MiFlotaClientProps -> JSX.Element
 *
 * Dado el listado de camiones (con chofer actual) y choferes sin camión del fletero,
 * renderiza la vista de flota propia con el estado de cada camión y sus choferes.
 * Existe para que el usuario con rol FLETERO pueda ver el estado de su flota
 * sin acceder al ABM general del sistema.
 *
 * Ejemplos:
 * <MiFlotaClient camiones={[{ id:"c1", patenteChasis:"ABC123", choferActual:{ nombre:"Carlos", apellido:"Díaz" } }]} choferesSinCamion={[]} razonSocial="JP SRL" />
 * // => tarjeta con "ABC123" y chofer "Díaz, Carlos"
 * <MiFlotaClient camiones={[]} choferesSinCamion={[]} razonSocial="JP SRL" />
 * // => mensaje "Sin camiones registrados"
 */
export function MiFlotaClient({ camiones, choferesSinCamion, razonSocial }: MiFlotaClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mi Flota</h2>
        <p className="text-muted-foreground">{razonSocial}</p>
      </div>

      {/* Camiones */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4" /> Camiones ({camiones.length})
        </h3>
        {camiones.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center border rounded-lg">Sin camiones registrados.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {camiones.map((c) => (
              <div key={c.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{c.patenteChasis}</span>
                  {c.patenteAcoplado && <span className="text-sm text-muted-foreground">/ {c.patenteAcoplado}</span>}
                </div>
                {c.choferActual ? (
                  <div className="flex items-center gap-1.5 text-sm text-green-700">
                    <User className="h-3.5 w-3.5" />
                    <span>{c.choferActual.apellido}, {c.choferActual.nombre}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-amber-600">
                    <UserX className="h-3.5 w-3.5" />
                    <span>Sin chofer asignado</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Choferes sin camión */}
      {choferesSinCamion.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <UserX className="h-4 w-4" /> Choferes sin camión ({choferesSinCamion.length})
          </h3>
          <div className="border rounded-lg divide-y">
            {choferesSinCamion.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{c.apellido}, {c.nombre}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
