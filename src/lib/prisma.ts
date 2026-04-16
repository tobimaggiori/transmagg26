/**
 * Propósito: Instancia singleton de Prisma Client para Transmagg.
 * Previene múltiples conexiones en desarrollo (hot-reload de Next.js).
 *
 * CONVERSIÓN DECIMAL → NUMBER
 * Los campos Decimal del schema se convierten a number via result extension.
 * PostgreSQL almacena DECIMAL con precisión real, pero el código de aplicación
 * trabaja con number (los cálculos se hacen con decimal.js via src/lib/money.ts).
 *
 * La precisión monetaria depende exclusivamente de que los cálculos pasen
 * por src/lib/money.ts (que usa decimal.js internamente). Los valores leídos
 * de la DB son convertidos a number — seguros para comparación y display,
 * pero NO para aritmética directa (usar sumarImportes, etc.).
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// ─── Helpers para result extension ──────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Convierte un campo Decimal requerido a number. */
function dn(field: string) {
  return {
    needs: { [field]: true } as any,
    compute: (data: any): number => Number(data[field]),
  }
}

/** Convierte un campo Decimal? nullable a number | null. */
function dnNull(field: string) {
  return {
    needs: { [field]: true } as any,
    compute: (data: any): number | null =>
      data[field] === null || data[field] === undefined ? null : Number(data[field]),
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Creación del cliente ────────────────────────────────────────────────────

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!
  const adapter = new PrismaPg({ connectionString })
  const base = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

  // Result extension: convierte todos los campos Decimal a number.
  // Los campos monetarios del schema usan Prisma Decimal para precisión
  // en persistencia, pero el código de aplicación trabaja con number
  // (los cálculos se hacen con decimal.js via src/lib/money.ts).
  return base.$extends({
    result: {
      polizaSeguro: {
        montoMensual: dnNull("montoMensual"),
      },
      pagoImpuesto: {
        monto: dn("monto"),
      },
      infraccion: {
        monto: dn("monto"),
      },
      viaje: {
        tarifa: dn("tarifa"),
        tarifaEmpresa: dn("tarifaEmpresa"),
        tarifaOperativaInicial: dn("tarifaOperativaInicial"),
      },
      viajeEnLiquidacion: {
        tarifaFletero: dn("tarifaFletero"),
        subtotal: dn("subtotal"),
      },
      viajeEnFactura: {
        tarifaEmpresa: dn("tarifaEmpresa"),
        subtotal: dn("subtotal"),
      },
      liquidacion: {
        subtotalBruto: dn("subtotalBruto"),
        comisionMonto: dn("comisionMonto"),
        neto: dn("neto"),
        ivaMonto: dn("ivaMonto"),
        total: dn("total"),
      },
      facturaEmitida: {
        neto: dn("neto"),
        ivaMonto: dn("ivaMonto"),
        total: dn("total"),
      },
      cuenta: {
        saldoInicial: dn("saldoInicial"),
      },
      fci: {
        saldoActual: dn("saldoActual"),
      },
      movimientoFci: {
        monto: dn("monto"),
      },
      saldoFci: {
        saldoInformado: dn("saldoInformado"),
        rendimientoPeriodo: dn("rendimientoPeriodo"),
      },
      movimientoSinFactura: {
        monto: dn("monto"),
      },
      chequeRecibido: {
        monto: dn("monto"),
      },
      chequeEmitido: {
        monto: dn("monto"),
      },
      planillaGalicia: {
        totalMonto: dn("totalMonto"),
      },
      tarjetaPrepaga: {
        limiteMensual: dnNull("limiteMensual"),
      },
      gastoTarjetaPrepaga: {
        monto: dn("monto"),
      },
      tarjeta: {
        limiteMensual: dnNull("limiteMensual"),
      },
      resumenTarjeta: {
        totalARS: dn("totalARS"),
        totalUSD: dnNull("totalUSD"),
      },
      gastoTarjeta: {
        monto: dn("monto"),
      },
      adelantoFletero: {
        monto: dn("monto"),
        montoDescontado: dn("montoDescontado"),
      },
      adelantoDescuento: {
        montoDescontado: dn("montoDescontado"),
      },
      gastoFletero: {
        montoPagado: dn("montoPagado"),
        montoDescontado: dn("montoDescontado"),
      },
      gastoDescuento: {
        montoDescontado: dn("montoDescontado"),
      },
      nCDescuento: {
        montoDescontado: dn("montoDescontado"),
      },
      pagoAFletero: {
        monto: dn("monto"),
      },
      pagoDeEmpresa: {
        monto: dn("monto"),
      },
      facturaProveedor: {
        neto: dn("neto"),
        ivaMonto: dn("ivaMonto"),
        total: dn("total"),
        percepcionIIBB: dnNull("percepcionIIBB"),
        percepcionIVA: dnNull("percepcionIVA"),
        percepcionGanancias: dnNull("percepcionGanancias"),
      },
      itemFacturaProveedor: {
        precioUnitario: dn("precioUnitario"),
        subtotalNeto: dn("subtotalNeto"),
        montoIva: dn("montoIva"),
        subtotalTotal: dn("subtotalTotal"),
      },
      pagoProveedor: {
        monto: dn("monto"),
      },
      asientoIva: {
        baseImponible: dn("baseImponible"),
        montoIva: dn("montoIva"),
      },
      asientoIibb: {
        montoIngreso: dn("montoIngreso"),
      },
      percepcionImpuesto: {
        monto: dn("monto"),
      },
      notaCreditoDebito: {
        montoNeto: dn("montoNeto"),
        montoIva: dn("montoIva"),
        montoTotal: dn("montoTotal"),
      },
      viajeEnNotaCD: {
        tarifaOriginal: dn("tarifaOriginal"),
        subtotalOriginal: dn("subtotalOriginal"),
        subtotalCorregido: dnNull("subtotalCorregido"),
      },
      facturaSeguro: {
        neto: dn("neto"),
        iva: dn("iva"),
        total: dn("total"),
        montoCuota: dnNull("montoCuota"),
      },
      cuotaFacturaSeguro: {
        monto: dn("monto"),
      },
      cierreResumenTarjeta: {
        totalPagado: dn("totalPagado"),
        diferencia: dn("diferencia"),
      },
      pagoFacturaTarjeta: {
        montoPagado: dn("montoPagado"),
      },
      reciboCobranza: {
        totalCobrado: dn("totalCobrado"),
        totalRetenciones: dn("totalRetenciones"),
        totalComprobantes: dn("totalComprobantes"),
        retencionGanancias: dn("retencionGanancias"),
        retencionIIBB: dn("retencionIIBB"),
        retencionSUSS: dn("retencionSUSS"),
      },
      medioPagoRecibo: {
        monto: dn("monto"),
      },
    },
  })
}

// ─── Singleton ──────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
