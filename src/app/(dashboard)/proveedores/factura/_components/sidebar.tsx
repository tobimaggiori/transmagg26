import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadPDF } from "@/components/upload-pdf"
import { formatearMoneda } from "@/lib/money"
import { FileText, CheckCircle2, Circle, Upload } from "lucide-react"
import { type ExitoData } from "./types"

type SidebarProps = {
  pdfS3Key: string
  onPdfUpload: (key: string) => void
  totalNeto: number
  totalIva: number
  totalPercepciones: number
  totalFinal: number
  discriminaIVA: boolean
  registrarPago: boolean
  pagoMontoNum: number
  saldoTrasPago: number
  cabeceraCompleta: boolean
  tieneItemValido: boolean
  tienePdf: boolean
  pagoValido: boolean
  puedeRegistrar: boolean
  loading: boolean
  error: string | null
  exitoData: ExitoData | null
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  )
}

export function Sidebar({
  pdfS3Key,
  onPdfUpload,
  totalNeto,
  totalIva,
  totalPercepciones,
  totalFinal,
  discriminaIVA,
  registrarPago,
  pagoMontoNum,
  saldoTrasPago,
  cabeceraCompleta,
  tieneItemValido,
  tienePdf,
  pagoValido,
  puedeRegistrar,
  loading,
  error,
  exitoData,
}: SidebarProps) {
  return (
    <div className="space-y-4">
      {/* PDF de factura */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PDF de factura *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UploadPDF
            prefijo="facturas-proveedor"
            onUpload={(key: string) => onPdfUpload(key)}
            label="Subir PDF de la factura"
          />
          {pdfS3Key ? (
            <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              PDF cargado correctamente
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Upload className="h-3.5 w-3.5" />
              Pendiente de carga
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen economico */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Neto</span>
            <span className="tabular-nums">{formatearMoneda(totalNeto)}</span>
          </div>
          {discriminaIVA && totalIva > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA</span>
              <span className="tabular-nums">{formatearMoneda(totalIva)}</span>
            </div>
          )}
          {totalPercepciones > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Percepciones</span>
              <span className="tabular-nums">{formatearMoneda(totalPercepciones)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>Total</span>
            <span className="tabular-nums">{formatearMoneda(totalFinal)}</span>
          </div>
          {registrarPago && pagoMontoNum > 0 && (
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Saldo tras pago</span>
              <span className={`tabular-nums font-medium ${saldoTrasPago > 0.01 ? "text-destructive" : "text-green-600"}`}>
                {formatearMoneda(saldoTrasPago)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist de completitud */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Completitud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <CheckItem ok={cabeceraCompleta} label="Cabecera completa" />
          <CheckItem ok={tieneItemValido} label="Items validos" />
          <CheckItem ok={tienePdf} label="PDF adjunto" />
          {registrarPago && (
            <CheckItem ok={pagoValido} label="Pago completo" />
          )}
        </CardContent>
      </Card>

      {/* Errores y exito */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {exitoData && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-1 text-sm">
          <p className="text-green-700 font-medium">Factura registrada correctamente</p>
          {exitoData.estadoPago === "PAGADA" && exitoData.pagoRegistrado && (
            <p className="text-green-700">
              Pago de {formatearMoneda(exitoData.pagoRegistrado)} registrado — Factura: PAGADA
            </p>
          )}
          {exitoData.estadoPago === "PARCIALMENTE_PAGADA" && exitoData.pagoRegistrado && (
            <p className="text-green-700">
              Pago parcial de {formatearMoneda(exitoData.pagoRegistrado)} registrado — Saldo
              pendiente:{" "}
              {formatearMoneda(Math.max(0, exitoData.total - exitoData.pagoRegistrado))}
            </p>
          )}
          {exitoData.estadoPago === "PENDIENTE" && (
            <p className="text-muted-foreground text-xs">
              Estado: PENDIENTE DE PAGO — podes registrar el pago desde Proveedores →
              Registrar Pago
            </p>
          )}
        </div>
      )}

      {/* Boton de submit */}
      <Button type="submit" disabled={loading || !puedeRegistrar} className="w-full">
        {loading ? "Guardando..." : "Registrar Factura"}
      </Button>
    </div>
  )
}
