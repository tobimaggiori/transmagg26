import { SearchCombobox } from "@/components/ui/search-combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { type Proveedor, TIPOS_CBTE, CONCEPTOS, SELECT_CLS } from "./types"

type HeaderSectionProps = {
  proveedores: Proveedor[]
  proveedorId: string
  onProveedorChange: (id: string) => void
  proveedor: Proveedor | undefined
  tipoCbte: string
  onTipoCbteChange: (v: string) => void
  discriminaIVA: boolean
  ptoVenta: string
  onPtoVentaChange: (v: string) => void
  nroComprobante: string
  onNroComprobanteChange: (v: string) => void
  fechaComprobante: string
  onFechaComprobanteChange: (v: string) => void
  concepto: string
  onConceptoChange: (v: string) => void
}

export function HeaderSection({
  proveedores,
  proveedorId,
  onProveedorChange,
  proveedor,
  tipoCbte,
  onTipoCbteChange,
  discriminaIVA,
  ptoVenta,
  onPtoVentaChange,
  nroComprobante,
  onNroComprobanteChange,
  fechaComprobante,
  onFechaComprobanteChange,
  concepto,
  onConceptoChange,
}: HeaderSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Datos del comprobante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fila 1: Proveedor + Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
          <div className="space-y-1.5">
            <Label>Proveedor *</Label>
            <SearchCombobox
              items={proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))}
              value={proveedorId}
              onChange={onProveedorChange}
              placeholder="Buscar proveedor..."
            />
            {proveedor && (
              <p className="text-xs text-muted-foreground">CUIT: {proveedor.cuit}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fechaComprobante">Fecha *</Label>
            <Input
              id="fechaComprobante"
              type="date"
              value={fechaComprobante}
              onChange={(e) => onFechaComprobanteChange(e.target.value)}
            />
          </div>
        </div>

        {/* Fila 2: Tipo + Pto. Venta + Nro. Comprobante */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tipoCbte">Tipo *</Label>
            <select
              id="tipoCbte"
              value={tipoCbte}
              onChange={(e) => onTipoCbteChange(e.target.value)}
              className={SELECT_CLS}
            >
              {TIPOS_CBTE.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {!discriminaIVA && (
              <p className="text-xs text-amber-600">Tipo {tipoCbte}: no discrimina IVA</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ptoVenta">Pto. Venta *</Label>
            <Input
              id="ptoVenta"
              value={ptoVenta}
              onChange={(e) => onPtoVentaChange(e.target.value)}
              placeholder="0001"
              maxLength={5}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nroComprobante">Nro. Comprobante *</Label>
            <Input
              id="nroComprobante"
              value={nroComprobante}
              onChange={(e) => onNroComprobanteChange(e.target.value)}
              placeholder="00000123"
              maxLength={8}
            />
          </div>
        </div>

        {/* Fila 3: Concepto */}
        <div className="space-y-1.5">
          <Label htmlFor="concepto">Concepto / Rubro de gasto</Label>
          <select
            id="concepto"
            value={concepto}
            onChange={(e) => onConceptoChange(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">— Sin clasificar —</option>
            {CONCEPTOS.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  )
}
