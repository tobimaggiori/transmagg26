/**
 * movimiento-cuenta.ts — Helpers centrales del libro de movimientos de cuenta.
 *
 * Única puerta de entrada para insertar, revertir y consultar MovimientoCuenta.
 * Los commands de entidades que impactan una cuenta (cheques, pagos, FCI,
 * infracciones, movimientos manuales) deben pasar por estos helpers dentro
 * de la misma transacción donde persisten la entidad origen.
 *
 * Invariantes garantizadas por este módulo:
 * 1. `orden` intra-día se asigna automáticamente (max+1) para preservar
 *    el orden de inserción cuando dos movimientos comparten fecha.
 * 2. No se puede insertar, modificar ni borrar un movimiento en un día
 *    que ya tiene ConciliacionDia — hay que desellar primero.
 * 3. Tampoco se puede operar dentro de un mes con CierreMesCuenta — hay
 *    que reabrir el mes primero.
 * 4. El saldo corrido se calcula desde `Cuenta.saldoInicial` a
 *    `fechaSaldoInicial`, sumando/restando movimientos ordenados por
 *    (fecha asc, orden asc).
 * 5. Los importes siempre se tratan con helpers de `money.ts`.
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes, restarImportes, m } from "@/lib/money"
import { calcularMontoImpuestoDebcred } from "@/lib/financial"

/** Categorías de movimientos auto-generados como hijos de un movimiento manual.
 *  No deben crearse ni borrarse individualmente — siempre cascadean con su padre. */
export const CATEGORIAS_IMPUESTO_AUTOGENERADO = [
  "IMPUESTO_DEBCRED",
  "IIBB_SIRCREB_TUCUMAN",
] as const
export type CategoriaImpuestoAutogenerado = (typeof CATEGORIAS_IMPUESTO_AUTOGENERADO)[number]

export function esCategoriaImpuestoAutogenerado(categoria: string): boolean {
  return (CATEGORIAS_IMPUESTO_AUTOGENERADO as readonly string[]).includes(categoria)
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/**
 * Diseño de datos:
 * MovimientoInput es el input mínimo para registrar un movimiento.
 * - `monto` es siempre positivo; el signo lo determina `tipo`.
 * - `fecha` se truncará al componente de día (sin hora).
 * - Exactamente una de las FKs nullable debe estar seteada, o `esManual`
 *   debe ser true. El helper lo valida.
 * - `movimientoGrupoId` se usa para emparejar dos movimientos espejo en
 *   transferencias entre cuentas propias.
 */
export type MovimientoInput = {
  cuentaId: string
  fecha: Date
  tipo: "INGRESO" | "EGRESO"
  categoria: string
  monto: number
  descripcion: string
  operadorCreacionId: string
  esManual?: boolean
  comprobanteS3Key?: string | null
  chequeEmitidoId?: string | null
  chequeRecibidoId?: string | null
  pagoAFleteroId?: string | null
  pagoProveedorId?: string | null
  pagoDeEmpresaId?: string | null
  pagoImpuestoId?: string | null
  movimientoFciId?: string | null
  infraccionId?: string | null
  cuentaDestinoId?: string | null
  movimientoGrupoId?: string | null
}

export type MovimientoConSaldo = {
  id: string
  cuentaId: string
  fecha: Date
  orden: number
  tipo: "INGRESO" | "EGRESO"
  categoria: string
  monto: number
  descripcion: string
  esManual: boolean
  saldoCorrido: number
  referencia: {
    tipo:
      | "CHEQUE_EMITIDO"
      | "CHEQUE_RECIBIDO"
      | "PAGO_A_FLETERO"
      | "PAGO_PROVEEDOR"
      | "PAGO_DE_EMPRESA"
      | "PAGO_IMPUESTO"
      | "MOVIMIENTO_FCI"
      | "INFRACCION"
      | "MANUAL"
    id: string | null
  }
  conciliado: boolean
}

// ─── Helpers internos ────────────────────────────────────────────────────────

/**
 * aDiaUtc: Date -> Date
 *
 * Dado [un Date], devuelve [un Date truncado al comienzo del día en UTC].
 * Existe porque `fecha` en MovimientoCuenta es `@db.Date` y comparaciones
 * deben hacerse a nivel día sin componente horario.
 *
 * Ejemplos:
 * aDiaUtc(new Date("2026-04-15T10:30:00Z")).toISOString() === "2026-04-15T00:00:00.000Z"
 * aDiaUtc(new Date("2026-04-15T00:00:00Z")).toISOString() === "2026-04-15T00:00:00.000Z"
 */
export function aDiaUtc(fecha: Date): Date {
  const d = new Date(fecha)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * rangoMesUtc: number number -> { desde: Date; hasta: Date }
 *
 * Dado [mes 1..12 y año], devuelve [el rango [primer día 00:00Z, último día+1 00:00Z)].
 *
 * Ejemplos:
 * rangoMesUtc(4, 2026) // { desde: 2026-04-01T00:00Z, hasta: 2026-05-01T00:00Z }
 * rangoMesUtc(12, 2026) // { desde: 2026-12-01T00:00Z, hasta: 2027-01-01T00:00Z }
 */
export function rangoMesUtc(mes: number, anio: number): { desde: Date; hasta: Date } {
  const desde = new Date(Date.UTC(anio, mes - 1, 1))
  const hasta = new Date(Date.UTC(anio, mes, 1))
  return { desde, hasta }
}

/**
 * contarReferencias: MovimientoInput -> number
 *
 * Dado [un input], devuelve [la cantidad de FKs no nulas]. Incluye `esManual`
 * como una referencia válida. Se usa para enforcar "exactamente una".
 */
function contarReferencias(input: MovimientoInput): number {
  let n = 0
  if (input.chequeEmitidoId) n++
  if (input.chequeRecibidoId) n++
  if (input.pagoAFleteroId) n++
  if (input.pagoProveedorId) n++
  if (input.pagoDeEmpresaId) n++
  if (input.pagoImpuestoId) n++
  if (input.movimientoFciId) n++
  if (input.infraccionId) n++
  if (input.esManual) n++
  return n
}

/**
 * validarDiaLibre: Tx string Date -> Promise<void>
 *
 * Dado [tx, cuentaId, fecha], lanza error si el día está sellado por
 * ConciliacionDia o si el mes contenedor tiene CierreMesCuenta.
 * Se usa antes de insertar/borrar movimientos.
 */
async function validarDiaLibre(tx: Tx, cuentaId: string, fecha: Date): Promise<void> {
  const dia = aDiaUtc(fecha)
  const sellado = await tx.conciliacionDia.findUnique({
    where: { cuentaId_fecha: { cuentaId, fecha: dia } },
    select: { id: true },
  })
  if (sellado) {
    throw new Error("El día está conciliado. Desconciliá el día antes de modificar sus movimientos.")
  }
  const cerradoMes = await tx.cierreMesCuenta.findUnique({
    where: {
      cuentaId_mes_anio: {
        cuentaId,
        mes: dia.getUTCMonth() + 1,
        anio: dia.getUTCFullYear(),
      },
    },
    select: { id: true },
  })
  if (cerradoMes) {
    throw new Error("El mes está cerrado. Reabrí el mes antes de modificar sus movimientos.")
  }
}

// ─── Registrar movimiento ────────────────────────────────────────────────────

/**
 * registrarMovimiento: Tx MovimientoInput -> Promise<{ id: string; orden: number }>
 *
 * Dado [una transacción de Prisma y el input de un movimiento], inserta
 * el MovimientoCuenta asignando `orden = max+1` dentro de (cuentaId, fecha)
 * y devuelve [el id y orden asignado].
 *
 * Valida:
 * - Exactamente una referencia (FK a entidad origen) O `esManual=true`.
 * - `monto` > 0.
 * - Día no está sellado y mes no está cerrado.
 *
 * Ejemplos:
 * registrarMovimiento(tx, {
 *   cuentaId: "c1", fecha: new Date("2026-04-15"), tipo: "EGRESO",
 *   categoria: "CHEQUE_EMITIDO_DEBITADO", monto: 1000,
 *   descripcion: "Cheque #123", chequeEmitidoId: "ch1",
 *   operadorCreacionId: "u1",
 * }) // => { id: "...", orden: 1 }
 */
export async function registrarMovimiento(
  tx: Tx,
  input: MovimientoInput
): Promise<{ id: string; orden: number }> {
  const monto = m(input.monto)
  if (monto <= 0) {
    throw new Error("El monto del movimiento debe ser positivo")
  }
  if (contarReferencias(input) !== 1) {
    throw new Error(
      "Un MovimientoCuenta requiere exactamente una referencia (cheque, pago, FCI, infracción) o esManual=true"
    )
  }

  const dia = aDiaUtc(input.fecha)
  await validarDiaLibre(tx, input.cuentaId, dia)

  const max = await tx.movimientoCuenta.aggregate({
    where: { cuentaId: input.cuentaId, fecha: dia },
    _max: { orden: true },
  })
  const orden = (max._max.orden ?? 0) + 1

  const creado = await tx.movimientoCuenta.create({
    data: {
      cuentaId: input.cuentaId,
      fecha: dia,
      orden,
      tipo: input.tipo,
      categoria: input.categoria,
      monto,
      descripcion: input.descripcion,
      esManual: Boolean(input.esManual),
      comprobanteS3Key: input.comprobanteS3Key ?? null,
      chequeEmitidoId: input.chequeEmitidoId ?? null,
      chequeRecibidoId: input.chequeRecibidoId ?? null,
      pagoAFleteroId: input.pagoAFleteroId ?? null,
      pagoProveedorId: input.pagoProveedorId ?? null,
      pagoDeEmpresaId: input.pagoDeEmpresaId ?? null,
      pagoImpuestoId: input.pagoImpuestoId ?? null,
      movimientoFciId: input.movimientoFciId ?? null,
      infraccionId: input.infraccionId ?? null,
      cuentaDestinoId: input.cuentaDestinoId ?? null,
      movimientoGrupoId: input.movimientoGrupoId ?? null,
      operadorCreacionId: input.operadorCreacionId,
    },
    select: { id: true, orden: true },
  })
  return creado
}

/**
 * registrarTransferenciaEntrePropias: Tx {...} -> Promise<{ grupoId, origenId, destinoId }>
 *
 * Dado [tx y datos de una transferencia entre dos cuentas propias], crea
 * 2 MovimientoCuenta espejo con `movimientoGrupoId` compartido: EGRESO en
 * la cuenta origen, INGRESO en la cuenta destino, ambos con el mismo monto
 * y fecha. Devuelve [los ids creados].
 */
export async function registrarTransferenciaEntrePropias(
  tx: Tx,
  data: {
    cuentaOrigenId: string
    cuentaDestinoId: string
    fecha: Date
    monto: number
    descripcion: string
    operadorCreacionId: string
  }
): Promise<{ grupoId: string; origenId: string; destinoId: string }> {
  if (data.cuentaOrigenId === data.cuentaDestinoId) {
    throw new Error("La cuenta origen y destino no pueden ser la misma")
  }
  const grupoId = crypto.randomUUID()
  const egreso = await registrarMovimiento(tx, {
    cuentaId: data.cuentaOrigenId,
    fecha: data.fecha,
    tipo: "EGRESO",
    categoria: "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS",
    monto: data.monto,
    descripcion: data.descripcion,
    esManual: true,
    cuentaDestinoId: data.cuentaDestinoId,
    movimientoGrupoId: grupoId,
    operadorCreacionId: data.operadorCreacionId,
  })
  const ingreso = await registrarMovimiento(tx, {
    cuentaId: data.cuentaDestinoId,
    fecha: data.fecha,
    tipo: "INGRESO",
    categoria: "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS",
    monto: data.monto,
    descripcion: data.descripcion,
    esManual: true,
    cuentaDestinoId: data.cuentaOrigenId,
    movimientoGrupoId: grupoId,
    operadorCreacionId: data.operadorCreacionId,
  })
  return { grupoId, origenId: egreso.id, destinoId: ingreso.id }
}

// ─── Revertir movimiento ─────────────────────────────────────────────────────

/**
 * revertirMovimiento: Tx string -> Promise<void>
 *
 * Dado [tx y el id de un movimiento], lo elimina. Si el movimiento tiene
 * `movimientoGrupoId` (transferencia entre cuentas propias), elimina también
 * el espejo.
 *
 * Valida:
 * - El movimiento existe.
 * - Su día no está sellado y su mes no está cerrado.
 * - Si es espejo de transferencia, aplica la misma validación al espejo.
 */
export async function revertirMovimiento(tx: Tx, movimientoId: string): Promise<void> {
  const mov = await tx.movimientoCuenta.findUnique({
    where: { id: movimientoId },
    select: { id: true, cuentaId: true, fecha: true, movimientoGrupoId: true },
  })
  if (!mov) throw new Error("Movimiento no encontrado")

  await validarDiaLibre(tx, mov.cuentaId, mov.fecha)

  if (mov.movimientoGrupoId) {
    const espejos = await tx.movimientoCuenta.findMany({
      where: { movimientoGrupoId: mov.movimientoGrupoId },
      select: { id: true, cuentaId: true, fecha: true },
    })
    for (const e of espejos) {
      await validarDiaLibre(tx, e.cuentaId, e.fecha)
    }
    await tx.movimientoCuenta.deleteMany({
      where: { movimientoGrupoId: mov.movimientoGrupoId },
    })
  } else {
    await tx.movimientoCuenta.delete({ where: { id: movimientoId } })
  }
}

// ─── Saldo corrido ───────────────────────────────────────────────────────────

/**
 * calcularSaldoAFecha: string Date -> Promise<number>
 *
 * Dado [cuentaId y una fecha-corte], devuelve [el saldo al final de ese día]
 * (inclusive), calculado como:
 *   saldoInicial (si aplica por fechaSaldoInicial) + Σ INGRESOS − Σ EGRESOS
 *   para movimientos con fecha ≤ fechaCorte.
 *
 * Si la cuenta no tiene `fechaSaldoInicial` o es posterior a fechaCorte,
 * el saldoInicial no se suma (se asume saldo 0 antes de esa fecha).
 */
export async function calcularSaldoAFecha(cuentaId: string, fechaCorte: Date): Promise<number> {
  const cuenta = await prisma.cuenta.findUnique({
    where: { id: cuentaId },
    select: { saldoInicial: true, fechaSaldoInicial: true },
  })
  if (!cuenta) throw new Error("Cuenta no encontrada")

  const corte = aDiaUtc(fechaCorte)
  const inicialAplica =
    cuenta.fechaSaldoInicial && aDiaUtc(cuenta.fechaSaldoInicial).getTime() <= corte.getTime()
  const base = inicialAplica ? cuenta.saldoInicial : 0

  const ingresos = await prisma.movimientoCuenta.aggregate({
    where: { cuentaId, tipo: "INGRESO", fecha: { lte: corte } },
    _sum: { monto: true },
  })
  const egresos = await prisma.movimientoCuenta.aggregate({
    where: { cuentaId, tipo: "EGRESO", fecha: { lte: corte } },
    _sum: { monto: true },
  })
  const totalIn = Number(ingresos._sum.monto ?? 0)
  const totalOut = Number(egresos._sum.monto ?? 0)
  return restarImportes(sumarImportes([base, totalIn]), totalOut)
}

/**
 * calcularSaldoActual: string -> Promise<number>
 *
 * Dado [cuentaId], devuelve [el saldo total al momento presente] aplicando
 * saldoInicial + todos los movimientos existentes.
 */
export async function calcularSaldoActual(cuentaId: string): Promise<number> {
  const cuenta = await prisma.cuenta.findUnique({
    where: { id: cuentaId },
    select: { saldoInicial: true },
  })
  if (!cuenta) throw new Error("Cuenta no encontrada")

  const ingresos = await prisma.movimientoCuenta.aggregate({
    where: { cuentaId, tipo: "INGRESO" },
    _sum: { monto: true },
  })
  const egresos = await prisma.movimientoCuenta.aggregate({
    where: { cuentaId, tipo: "EGRESO" },
    _sum: { monto: true },
  })
  return restarImportes(
    sumarImportes([cuenta.saldoInicial, Number(ingresos._sum.monto ?? 0)]),
    Number(egresos._sum.monto ?? 0)
  )
}

// ─── Libro con saldo corrido ─────────────────────────────────────────────────

export type FiltrosLibro = {
  cuentaId: string
  desde?: Date
  hasta?: Date
  tipo?: "INGRESO" | "EGRESO"
  categoria?: string
  soloConciliados?: boolean
  soloNoConciliados?: boolean
}

/**
 * listarMovimientosConSaldoCorrido: FiltrosLibro -> Promise<MovimientoConSaldo[]>
 *
 * Dado [filtros del libro], devuelve [los movimientos en el rango ordenados
 * cronológicamente con el saldo corrido en cada uno y un flag `conciliado`
 * según si existe ConciliacionDia para (cuentaId, fecha)].
 *
 * El saldo corrido arranca desde:
 *   saldoArranque = saldoAFecha(desde − 1 día) si `desde` está seteado
 *                 = 0                          en otro caso
 * y se va acumulando movimiento por movimiento.
 */
export async function listarMovimientosConSaldoCorrido(
  filtros: FiltrosLibro
): Promise<MovimientoConSaldo[]> {
  const where: Record<string, unknown> = { cuentaId: filtros.cuentaId }
  if (filtros.desde || filtros.hasta) {
    const rango: { gte?: Date; lt?: Date } = {}
    if (filtros.desde) rango.gte = aDiaUtc(filtros.desde)
    if (filtros.hasta) {
      const hastaExclusivo = aDiaUtc(filtros.hasta)
      hastaExclusivo.setUTCDate(hastaExclusivo.getUTCDate() + 1)
      rango.lt = hastaExclusivo
    }
    where.fecha = rango
  }
  if (filtros.tipo) where.tipo = filtros.tipo
  if (filtros.categoria) where.categoria = filtros.categoria

  const movimientos = await prisma.movimientoCuenta.findMany({
    where,
    orderBy: [{ fecha: "asc" }, { orden: "asc" }],
  })

  let saldoArranque = 0
  if (filtros.desde) {
    const diaAnterior = new Date(aDiaUtc(filtros.desde))
    diaAnterior.setUTCDate(diaAnterior.getUTCDate() - 1)
    saldoArranque = await calcularSaldoAFecha(filtros.cuentaId, diaAnterior)
  }

  const fechasUnicas = Array.from(new Set(movimientos.map((m) => m.fecha.toISOString())))
  const diasConciliados = await prisma.conciliacionDia.findMany({
    where: {
      cuentaId: filtros.cuentaId,
      fecha: { in: fechasUnicas.map((s) => new Date(s)) },
    },
    select: { fecha: true },
  })
  const setConciliados = new Set(diasConciliados.map((d) => d.fecha.toISOString()))

  let saldo = saldoArranque
  const resultado: MovimientoConSaldo[] = []
  for (const m of movimientos) {
    if (m.tipo === "INGRESO") saldo = sumarImportes([saldo, Number(m.monto)])
    else saldo = restarImportes(saldo, Number(m.monto))

    const conciliado = setConciliados.has(m.fecha.toISOString())
    if (filtros.soloConciliados && !conciliado) continue
    if (filtros.soloNoConciliados && conciliado) continue

    resultado.push({
      id: m.id,
      cuentaId: m.cuentaId,
      fecha: m.fecha,
      orden: m.orden,
      tipo: m.tipo as "INGRESO" | "EGRESO",
      categoria: m.categoria,
      monto: Number(m.monto),
      descripcion: m.descripcion,
      esManual: m.esManual,
      saldoCorrido: saldo,
      referencia: determinarReferencia(m),
      conciliado,
    })
  }
  return resultado
}

// ─── Movimiento manual con impuestos auto-generados ─────────────────────────

export type ImpuestoAplicable = { aplica: boolean; alicuota: number }

export type ImpuestosAplicarManual = {
  debcred?: ImpuestoAplicable
  iibbSircreb?: ImpuestoAplicable
}

/**
 * registrarMovimientoManualConImpuestos: Tx MovimientoInput ImpuestosAplicarManual -> Promise<{ id; orden; impuestoIds }>
 *
 * Dado [tx, el input de un movimiento manual y los impuestos a aplicar],
 * crea el movimiento principal y, por cada impuesto con `aplica: true`,
 * un movimiento hijo EGRESO con la categoría correspondiente. Todos quedan
 * agrupados via `movimientoGrupoId`, lo que garantiza que `revertirMovimiento`
 * los borre en cascada. Si no aplica ningún impuesto, no se asigna grupo.
 *
 * El monto de cada impuesto se calcula como `monto × alicuota` (helper de
 * `financial.ts`). Si el monto resulta 0 (alícuota 0), el hijo no se crea.
 *
 * Pre: input.esManual === true (acepta solo movimientos manuales).
 *
 * Ejemplos:
 * registrarMovimientoManualConImpuestos(tx, { ..., monto: 1000, esManual: true },
 *   { debcred: { aplica: true, alicuota: 0.006 } })
 *   // crea 2 movs en grupo: padre 1000 + hijo IMPUESTO_DEBCRED 6
 * registrarMovimientoManualConImpuestos(tx, input, {})
 *   // crea solo el padre, sin grupo
 * registrarMovimientoManualConImpuestos(tx, input,
 *   { debcred: { aplica: true, alicuota: 0.006 }, iibbSircreb: { aplica: true, alicuota: 0.0006 } })
 *   // crea 3 movs en grupo: padre + 2 hijos
 */
export async function registrarMovimientoManualConImpuestos(
  tx: Tx,
  input: MovimientoInput,
  impuestos: ImpuestosAplicarManual
): Promise<{ id: string; orden: number; impuestoIds: string[] }> {
  if (!input.esManual) {
    throw new Error("registrarMovimientoManualConImpuestos requiere esManual=true")
  }

  const aplicaDebcred = impuestos.debcred?.aplica === true
  const aplicaIibb = impuestos.iibbSircreb?.aplica === true
  const necesitaGrupo = aplicaDebcred || aplicaIibb

  const grupoId = necesitaGrupo ? crypto.randomUUID() : null

  const principal = await registrarMovimiento(tx, {
    ...input,
    movimientoGrupoId: grupoId ?? input.movimientoGrupoId ?? null,
  })

  const impuestoIds: string[] = []

  if (aplicaDebcred && impuestos.debcred) {
    const monto = calcularMontoImpuestoDebcred(input.monto, impuestos.debcred.alicuota)
    if (monto > 0) {
      const hijo = await registrarMovimiento(tx, {
        cuentaId: input.cuentaId,
        fecha: input.fecha,
        tipo: "EGRESO",
        categoria: "IMPUESTO_DEBCRED",
        monto,
        descripcion: `Impuesto débito/crédito (${(impuestos.debcred.alicuota * 100).toFixed(3)}%) — ${input.descripcion}`,
        esManual: true,
        operadorCreacionId: input.operadorCreacionId,
        movimientoGrupoId: grupoId,
      })
      impuestoIds.push(hijo.id)
    }
  }

  if (aplicaIibb && impuestos.iibbSircreb) {
    const monto = calcularMontoImpuestoDebcred(input.monto, impuestos.iibbSircreb.alicuota)
    if (monto > 0) {
      const hijo = await registrarMovimiento(tx, {
        cuentaId: input.cuentaId,
        fecha: input.fecha,
        tipo: "EGRESO",
        categoria: "IIBB_SIRCREB_TUCUMAN",
        monto,
        descripcion: `IIBB SIRCREB Tucumán (${(impuestos.iibbSircreb.alicuota * 100).toFixed(3)}%) — ${input.descripcion}`,
        esManual: true,
        operadorCreacionId: input.operadorCreacionId,
        movimientoGrupoId: grupoId,
      })
      impuestoIds.push(hijo.id)
    }
  }

  return { id: principal.id, orden: principal.orden, impuestoIds }
}

type RefRaw = {
  esManual: boolean
  chequeEmitidoId: string | null
  chequeRecibidoId: string | null
  pagoAFleteroId: string | null
  pagoProveedorId: string | null
  pagoDeEmpresaId: string | null
  pagoImpuestoId: string | null
  movimientoFciId: string | null
  infraccionId: string | null
}

function determinarReferencia(m: RefRaw): MovimientoConSaldo["referencia"] {
  if (m.chequeEmitidoId) return { tipo: "CHEQUE_EMITIDO", id: m.chequeEmitidoId }
  if (m.chequeRecibidoId) return { tipo: "CHEQUE_RECIBIDO", id: m.chequeRecibidoId }
  if (m.pagoAFleteroId) return { tipo: "PAGO_A_FLETERO", id: m.pagoAFleteroId }
  if (m.pagoProveedorId) return { tipo: "PAGO_PROVEEDOR", id: m.pagoProveedorId }
  if (m.pagoDeEmpresaId) return { tipo: "PAGO_DE_EMPRESA", id: m.pagoDeEmpresaId }
  if (m.pagoImpuestoId) return { tipo: "PAGO_IMPUESTO", id: m.pagoImpuestoId }
  if (m.movimientoFciId) return { tipo: "MOVIMIENTO_FCI", id: m.movimientoFciId }
  if (m.infraccionId) return { tipo: "INFRACCION", id: m.infraccionId }
  return { tipo: "MANUAL", id: null }
}
