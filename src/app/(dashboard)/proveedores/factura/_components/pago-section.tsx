import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { UploadPDF } from "@/components/upload-pdf"
import { formatearFecha } from "@/lib/utils"
import { formatearMoneda } from "@/lib/money"
import { type Proveedor, type Cuenta, type ChequeEnCartera, SELECT_CLS, REQUIERE_COMPROBANTE } from "./types"

type PagoSectionProps = {
  registrarPago: boolean
  onRegistrarPagoChange: (checked: boolean) => void
  pagoFecha: string
  onPagoFechaChange: (v: string) => void
  pagoMonto: string
  onPagoMontoChange: (v: string) => void
  pagoMontoNum: number
  saldoTrasPago: number
  pagoTipo: string
  onPagoTipoChange: (v: string) => void
  pagoObservaciones: string
  onPagoObservacionesChange: (v: string) => void
  pagoComprobantePdfS3Key: string
  onPagoComprobantePdfS3KeyChange: (key: string) => void
  pagoCuentaId: string
  onPagoCuentaIdChange: (v: string) => void
  pagoChequeRecibidoId: string
  onPagoChequeRecibidoIdChange: (v: string) => void
  pagoChequeNro: string
  onPagoChequeNroChange: (v: string) => void
  pagoChequeFechaEmision: string
  onPagoChequeFechaEmisionChange: (v: string) => void
  pagoChequeFechaPago: string
  onPagoChequeFechaPagoChange: (v: string) => void
  pagoChequeClausula: string
  onPagoChequeClausulaChange: (v: string) => void
  proveedor: Proveedor | undefined
  cuentas: Cuenta[]
  chequesFisicos: ChequeEnCartera[]
  chequesEcheq: ChequeEnCartera[]
}

export function PagoSection({
  registrarPago,
  onRegistrarPagoChange,
  pagoFecha,
  onPagoFechaChange,
  pagoMonto,
  onPagoMontoChange,
  pagoMontoNum,
  saldoTrasPago,
  pagoTipo,
  onPagoTipoChange,
  pagoObservaciones,
  onPagoObservacionesChange,
  pagoComprobantePdfS3Key,
  onPagoComprobantePdfS3KeyChange,
  pagoCuentaId,
  onPagoCuentaIdChange,
  pagoChequeRecibidoId,
  onPagoChequeRecibidoIdChange,
  pagoChequeNro,
  onPagoChequeNroChange,
  pagoChequeFechaEmision,
  onPagoChequeFechaEmisionChange,
  pagoChequeFechaPago,
  onPagoChequeFechaPagoChange,
  pagoChequeClausula,
  onPagoChequeClausulaChange,
  proveedor,
  cuentas,
  chequesFisicos,
  chequesEcheq,
}: PagoSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <label
          htmlFor="registrarPago"
          className="flex items-center gap-3 cursor-pointer"
        >
          <input
            type="checkbox"
            id="registrarPago"
            checked={registrarPago}
            onChange={(e) => onRegistrarPagoChange(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <div>
            <p className="text-base font-semibold leading-none">
              Registrar pago ahora{" "}
              <span className="text-sm font-normal text-muted-foreground">(opcional)</span>
            </p>
            {!registrarPago && (
              <p className="text-xs text-muted-foreground mt-1">
                La factura quedara en estado Pendiente de pago.
              </p>
            )}
          </div>
        </label>
      </CardHeader>

      {registrarPago && (
        <CardContent className="space-y-4 pt-0">
          {/* Fecha + Monto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pagoFecha">Fecha de pago</Label>
              <Input
                id="pagoFecha"
                type="date"
                value={pagoFecha}
                onChange={(e) => onPagoFechaChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pagoMonto">Monto a pagar</Label>
              <Input
                id="pagoMonto"
                type="number"
                step="0.01"
                min="0.01"
                value={pagoMonto}
                onChange={(e) => onPagoMontoChange(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {pagoMontoNum > 0 && (
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Saldo pendiente tras pago</span>
              <span className={saldoTrasPago > 0.01 ? "text-destructive font-medium tabular-nums" : "text-green-600 font-medium tabular-nums"}>
                {formatearMoneda(saldoTrasPago)}
              </span>
            </div>
          )}

          {/* Metodo */}
          <div className="space-y-1.5">
            <Label htmlFor="pagoTipo">Metodo de pago</Label>
            <select
              id="pagoTipo"
              value={pagoTipo}
              onChange={(e) => onPagoTipoChange(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">— Seleccionar —</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUE_PROPIO">Cheque propio (ECheq)</option>
              <option value="CHEQUE_FISICO_TERCERO">Cheque fisico de tercero</option>
              <option value="CHEQUE_ELECTRONICO_TERCERO">ECheq de tercero</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </div>

          {/* Campos dependientes del metodo */}
          {pagoTipo === "TRANSFERENCIA" && (
            <div className="space-y-1.5">
              <Label htmlFor="pagoCuentaTransf">Cuenta de origen *</Label>
              <select
                id="pagoCuentaTransf"
                value={pagoCuentaId}
                onChange={(e) => onPagoCuentaIdChange(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="">— Seleccionar cuenta —</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.tipo})
                  </option>
                ))}
              </select>
            </div>
          )}

          {pagoTipo === "CHEQUE_PROPIO" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pagoCuentaCheq">Cuenta chequera *</Label>
                <select
                  id="pagoCuentaCheq"
                  value={pagoCuentaId}
                  onChange={(e) => onPagoCuentaIdChange(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="">— Seleccionar cuenta —</option>
                  {cuentas
                    .filter((c) => c.tieneChequera)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pagoChequeNro">Nro. de cheque *</Label>
                  <Input
                    id="pagoChequeNro"
                    value={pagoChequeNro}
                    onChange={(e) => onPagoChequeNroChange(e.target.value)}
                    placeholder="Numero de cheque"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pagoChequeClausula">Clausula</Label>
                  <select
                    id="pagoChequeClausula"
                    value={pagoChequeClausula}
                    onChange={(e) => onPagoChequeClausulaChange(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="NO_A_LA_ORDEN">No a la orden</option>
                    <option value="AL_DIA">Al dia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pagoChequeFechaEmision">Fecha emision</Label>
                  <Input
                    id="pagoChequeFechaEmision"
                    type="date"
                    value={pagoChequeFechaEmision}
                    onChange={(e) => onPagoChequeFechaEmisionChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pagoChequeFechaPago">Fecha de pago del cheque</Label>
                  <Input
                    id="pagoChequeFechaPago"
                    type="date"
                    value={pagoChequeFechaPago}
                    onChange={(e) => onPagoChequeFechaPagoChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 px-4 py-3 space-y-1 text-sm">
                <p><span className="text-muted-foreground">Tipo beneficiario:</span> <strong>Proveedor</strong></p>
                <p><span className="text-muted-foreground">Nombre:</span> <strong>{proveedor?.razonSocial ?? "—"}</strong></p>
                <p><span className="text-muted-foreground">CUIT:</span> <strong>{proveedor?.cuit ?? "—"}</strong></p>
              </div>
            </div>
          )}

          {pagoTipo === "CHEQUE_FISICO_TERCERO" && (
            <div className="space-y-1.5">
              <Label htmlFor="pagoChequeCartera">Cheque fisico en cartera *</Label>
              <select
                id="pagoChequeCartera"
                value={pagoChequeRecibidoId}
                onChange={(e) => onPagoChequeRecibidoIdChange(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="">— Seleccionar cheque —</option>
                {chequesFisicos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nroCheque} — {c.bancoEmisor} — {formatearMoneda(c.monto)} — vto{" "}
                    {formatearFecha(c.fechaCobro)}
                  </option>
                ))}
              </select>
              {chequesFisicos.length === 0 && (
                <p className="text-xs text-muted-foreground">No hay cheques fisicos en cartera.</p>
              )}
            </div>
          )}

          {pagoTipo === "CHEQUE_ELECTRONICO_TERCERO" && (
            <div className="space-y-1.5">
              <Label htmlFor="pagoChequeEcheq">ECheq en cartera *</Label>
              <select
                id="pagoChequeEcheq"
                value={pagoChequeRecibidoId}
                onChange={(e) => onPagoChequeRecibidoIdChange(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="">— Seleccionar ECheq —</option>
                {chequesEcheq.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nroCheque} — {c.bancoEmisor} — {formatearMoneda(c.monto)} — vto{" "}
                    {formatearFecha(c.fechaCobro)}
                  </option>
                ))}
              </select>
              {chequesEcheq.length === 0 && (
                <p className="text-xs text-muted-foreground">No hay ECheq en cartera.</p>
              )}
            </div>
          )}

          {pagoTipo === "TARJETA" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                El gasto quedara pendiente de asignacion a una tarjeta.
                Podes asignarlo luego desde Contabilidad → Tarjetas al cerrar el resumen.
              </p>
            </div>
          )}

          {/* Observaciones */}
          <div className="space-y-1.5">
            <Label htmlFor="pagoObservaciones">Observaciones</Label>
            <Input
              id="pagoObservaciones"
              value={pagoObservaciones}
              onChange={(e) => onPagoObservacionesChange(e.target.value)}
              placeholder="Opcional..."
            />
          </div>

          {/* Comprobante PDF del pago */}
          {REQUIERE_COMPROBANTE.has(pagoTipo) && (
            <div className="space-y-1.5">
              <Label>Comprobante de pago *</Label>
              <UploadPDF
                prefijo="comprobantes-pago-proveedor"
                onUpload={(key: string) => onPagoComprobantePdfS3KeyChange(key)}
                label="Subir comprobante"
              />
              {pagoComprobantePdfS3Key && (
                <p className="text-xs text-green-600">Comprobante subido correctamente.</p>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
