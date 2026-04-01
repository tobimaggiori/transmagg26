/**
 * Seed de base de datos para desarrollo de Transmagg.
 * Crea datos de ejemplo para entidades operativas y del módulo financiero.
 *
 * Ejecutar con: npx ts-node prisma/seed.ts
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Iniciando seed de Transmagg...")

  // Limpiar modelos nuevos ANTES del deleteMany original (FK enforcement en LibSQL)
  await prisma.gastoDescuento.deleteMany()
  await prisma.gastoFletero.deleteMany()
  await prisma.gastoTarjeta.deleteMany()
  await prisma.resumenTarjeta.deleteMany()
  await prisma.tarjeta.deleteMany()

  await prisma.$transaction([
    prisma.adelantoDescuento.deleteMany(),
    prisma.adelantoFletero.deleteMany(),
    prisma.gastoTarjetaPrepaga.deleteMany(),
    prisma.tarjetaPrepaga.deleteMany(),
    prisma.pagoAFletero.deleteMany(),
    prisma.pagoDeEmpresa.deleteMany(),
    prisma.chequeEmitido.deleteMany(),
    prisma.chequeRecibido.deleteMany(),
    prisma.planillaGalicia.deleteMany(),
    prisma.movimientoSinFactura.deleteMany(),
    prisma.saldoFci.deleteMany(),
    prisma.movimientoFci.deleteMany(),
    prisma.broker.deleteMany(),
    prisma.fci.deleteMany(),
    prisma.empleado.deleteMany(),
    prisma.pagoProveedor.deleteMany(),
    prisma.asientoIva.deleteMany(),
    prisma.asientoIibb.deleteMany(),
    prisma.viajeEnFactura.deleteMany(),
    prisma.viajeEnLiquidacion.deleteMany(),
    prisma.liquidacion.deleteMany(),
    prisma.facturaEmitida.deleteMany(),
    prisma.viaje.deleteMany(),
    prisma.camionChofer.deleteMany(),
    prisma.camion.deleteMany(),
    prisma.facturaProveedor.deleteMany(),
    prisma.proveedor.deleteMany(),
    prisma.empresaUsuario.deleteMany(),
    prisma.empresa.deleteMany(),
    prisma.fletero.deleteMany(),
    prisma.otpCodigo.deleteMany(),
    prisma.cuenta.deleteMany(),
    prisma.usuario.deleteMany(),
  ])

  const adminTransmagg = await prisma.usuario.create({
    data: {
      nombre: "Administrador",
      apellido: "Transmagg",
      email: "admin@transmagg.com.ar",
      rol: "ADMIN_TRANSMAGG",
    },
  })

  const operadorTransmagg = await prisma.usuario.create({
    data: {
      nombre: "María",
      apellido: "González",
      email: "operador@transmagg.com.ar",
      rol: "OPERADOR_TRANSMAGG",
      telefono: "1134567890",
    },
  })

  const usuarioFletero1 = await prisma.usuario.create({
    data: {
      nombre: "Juan",
      apellido: "Pérez",
      email: "juan.perez@fletero.com",
      rol: "FLETERO",
      telefono: "1145678901",
    },
  })

  const usuarioFletero2 = await prisma.usuario.create({
    data: {
      nombre: "Carlos",
      apellido: "García",
      email: "garcia.cargas@fletero.com",
      rol: "FLETERO",
      telefono: "1156789012",
    },
  })

  const chofer1 = await prisma.usuario.create({
    data: {
      nombre: "Roberto",
      apellido: "Rodríguez",
      email: "chofer.rodriguez@transmagg.com.ar",
      rol: "CHOFER",
    },
  })

  const chofer2 = await prisma.usuario.create({
    data: {
      nombre: "Diego",
      apellido: "Fernández",
      email: "chofer.fernandez@transmagg.com.ar",
      rol: "CHOFER",
    },
  })

  const adminEmpresa = await prisma.usuario.create({
    data: {
      nombre: "Laura",
      apellido: "Martínez",
      email: "admin@alimentosdelsur.com.ar",
      rol: "ADMIN_EMPRESA",
    },
  })

  console.log("✅ Usuarios creados")

  const fletero1 = await prisma.fletero.create({
    data: {
      usuarioId: usuarioFletero1.id,
      razonSocial: "Juan Pérez Transportes",
      cuit: "20123456789",
      condicionIva: "RESPONSABLE_INSCRIPTO",
      comisionDefault: 10,
    },
  })

  const fletero2 = await prisma.fletero.create({
    data: {
      usuarioId: usuarioFletero2.id,
      razonSocial: "García Cargas SRL",
      cuit: "20234567891",
      condicionIva: "RESPONSABLE_INSCRIPTO",
      comisionDefault: 12,
    },
  })

  const camion1 = await prisma.camion.create({
    data: {
      fleteroId: fletero1.id,
      patenteChasis: "AB123CD",
      patenteAcoplado: "XY456ZW",
      tipoCamion: "Semi-remolque",
    },
  })

  const camion2 = await prisma.camion.create({
    data: {
      fleteroId: fletero2.id,
      patenteChasis: "EF789GH",
      tipoCamion: "Camión con acoplado",
    },
  })

  await prisma.camionChofer.createMany({
    data: [
      { camionId: camion1.id, choferId: chofer1.id, desde: new Date("2024-01-01T00:00:00.000Z") },
      { camionId: camion2.id, choferId: chofer2.id, desde: new Date("2024-01-01T00:00:00.000Z") },
    ],
  })

  console.log("✅ Fleteros, camiones y choferes creados")

  const empresa1 = await prisma.empresa.create({
    data: {
      razonSocial: "Alimentos del Sur SA",
      cuit: "30123456789",
      condicionIva: "RESPONSABLE_INSCRIPTO",
      direccion: "Av. Corrientes 1234, CABA",
    },
  })

  const empresa2 = await prisma.empresa.create({
    data: {
      razonSocial: "Constructora Norte SRL",
      cuit: "30234567891",
      condicionIva: "RESPONSABLE_INSCRIPTO",
      direccion: "Ruta 9 Km 150, Rosario",
    },
  })

  await prisma.empresaUsuario.create({
    data: {
      empresaId: empresa1.id,
      usuarioId: adminEmpresa.id,
      nivelAcceso: "ADMIN",
    },
  })

  console.log("✅ Empresas creadas")

  const proveedor1 = await prisma.proveedor.create({
    data: {
      razonSocial: "YPF SA",
      cuit: "30345678901",
      condicionIva: "RESPONSABLE_INSCRIPTO",
      rubro: "Combustible",
    },
  })

  const proveedor2 = await prisma.proveedor.create({
    data: {
      razonSocial: "Repuestos Vial SRL",
      cuit: "30456789012",
      condicionIva: "RESPONSABLE_INSCRIPTO",
      rubro: "Repuestos y mantenimiento",
    },
  })

  console.log("✅ Proveedores creados")

  const cuentaGaliciaPesos = await prisma.cuenta.create({
    data: {
      nombre: "Galicia Pesos",
      tipo: "BANCO",
      bancoOEntidad: "Banco Galicia",
      moneda: "PESOS",
      saldoInicial: 1200000,
      activa: true,
      tieneImpuestoDebcred: true,
      alicuotaImpuesto: 0.006,
      tieneChequera: true,
      tienePlanillaEmisionMasiva: true,
      formatoPlanilla: "GALICIA",
      formatoReconciliacion: "EXCEL",
    },
  })

  const cuentaGaliciaUsd = await prisma.cuenta.create({
    data: {
      nombre: "Galicia USD",
      tipo: "BANCO",
      bancoOEntidad: "Banco Galicia",
      moneda: "DOLARES",
      saldoInicial: 15000,
      activa: true,
      tieneImpuestoDebcred: true,
      alicuotaImpuesto: 0.006,
      tieneChequera: true,
    },
  })

  const cuentaBrubank = await prisma.cuenta.create({
    data: {
      nombre: "Brubank",
      tipo: "BANCO",
      bancoOEntidad: "Brubank",
      moneda: "PESOS",
      saldoInicial: 280000,
      activa: true,
      tieneImpuestoDebcred: true,
      alicuotaImpuesto: 0.006,
      tieneCuentaRemunerada: true,
    },
  })

  const cuentaMacroPesos = await prisma.cuenta.create({
    data: {
      nombre: "Macro Pesos",
      tipo: "BANCO",
      bancoOEntidad: "Banco Macro",
      moneda: "PESOS",
      saldoInicial: 630000,
      activa: true,
      tieneImpuestoDebcred: true,
      alicuotaImpuesto: 0.006,
      tieneCuentaRemunerada: true,
    },
  })

  const cuentaMercadoPago = await prisma.cuenta.create({
    data: {
      nombre: "Mercado Pago",
      tipo: "BILLETERA_VIRTUAL",
      bancoOEntidad: "Mercado Pago",
      moneda: "PESOS",
      saldoInicial: 210000,
      activa: true,
      tieneImpuestoDebcred: true,
      alicuotaImpuesto: 0.006,
      tieneCuentaRemunerada: true,
      tieneTarjetasPrepagasChoferes: true,
    },
  })

  const cuentaBamba = await prisma.cuenta.create({
    data: {
      nombre: "Bamba",
      tipo: "BILLETERA_VIRTUAL",
      bancoOEntidad: "Bamba",
      moneda: "PESOS",
      saldoInicial: 180000,
      activa: true,
      tieneImpuestoDebcred: true,
      alicuotaImpuesto: 0.006,
      tieneCuentaRemunerada: true,
      tieneTarjetasPrepagasChoferes: true,
    },
  })

  const cuentaBalanz = await prisma.cuenta.create({
    data: {
      nombre: "BALANZ",
      tipo: "BROKER",
      bancoOEntidad: "BALANZ Capital",
      moneda: "PESOS",
      saldoInicial: 0,
      activa: true,
      esCuentaComitenteBroker: true,
    },
  })

  const cuentaInviu = await prisma.cuenta.create({
    data: {
      nombre: "INVIU",
      tipo: "BROKER",
      bancoOEntidad: "INVIU",
      moneda: "PESOS",
      saldoInicial: 0,
      activa: true,
      esCuentaComitenteBroker: true,
    },
  })

  await prisma.broker.createMany({
    data: [
      {
        nombre: "BALANZ",
        cuit: "30710713915",
        cuentaId: cuentaBalanz.id,
        activo: true,
      },
      {
        nombre: "INVIU",
        cuit: "30715469293",
        cuentaId: cuentaInviu.id,
        activo: true,
      },
    ],
  })

  console.log("✅ Cuentas y brokers creados")

  const fondoGaliciaAhorro = await prisma.fci.create({
    data: {
      nombre: "Fondo Galicia Ahorro Plus",
      cuentaId: cuentaGaliciaPesos.id,
      moneda: "PESOS",
      activo: true,
      diasHabilesAlerta: 1,
    },
  })

  const fondoGaliciaUsd = await prisma.fci.create({
    data: {
      nombre: "Fondo Galicia Dólares Plus",
      cuentaId: cuentaGaliciaUsd.id,
      moneda: "DOLARES",
      activo: true,
      diasHabilesAlerta: 2,
    },
  })

  const fondoMacro = await prisma.fci.create({
    data: {
      nombre: "FCI Macro Rendimiento",
      cuentaId: cuentaMacroPesos.id,
      moneda: "PESOS",
      activo: true,
      diasHabilesAlerta: 1,
    },
  })

  const fondoBalanz = await prisma.fci.create({
    data: {
      nombre: "FCI BALANZ Pesos",
      cuentaId: cuentaBalanz.id,
      moneda: "PESOS",
      activo: true,
      diasHabilesAlerta: 1,
    },
  })

  await prisma.movimientoFci.createMany({
    data: [
      {
        fciId: fondoGaliciaAhorro.id,
        cuentaOrigenDestinoId: cuentaGaliciaPesos.id,
        tipo: "SUSCRIPCION",
        monto: 200000,
        fecha: new Date("2026-03-24T10:00:00.000Z"),
        descripcion: "Suscripción inicial Galicia Ahorro Plus",
        operadorId: operadorTransmagg.id,
      },
      {
        fciId: fondoGaliciaAhorro.id,
        cuentaOrigenDestinoId: cuentaGaliciaPesos.id,
        tipo: "RESCATE",
        monto: 50000,
        fecha: new Date("2026-03-27T10:30:00.000Z"),
        descripcion: "Rescate parcial para capital de trabajo",
        operadorId: operadorTransmagg.id,
      },
      {
        fciId: fondoMacro.id,
        cuentaOrigenDestinoId: cuentaMacroPesos.id,
        tipo: "SUSCRIPCION",
        monto: 120000,
        fecha: new Date("2026-03-25T11:00:00.000Z"),
        descripcion: "Suscripción en fondo Macro",
        operadorId: operadorTransmagg.id,
      },
    ],
  })

  await prisma.saldoFci.createMany({
    data: [
      {
        fciId: fondoGaliciaAhorro.id,
        saldoInformado: 205000,
        fechaActualizacion: new Date("2026-03-24T18:00:00.000Z"),
        rendimientoPeriodo: 5000,
        operadorId: operadorTransmagg.id,
      },
      {
        fciId: fondoGaliciaAhorro.id,
        saldoInformado: 210500,
        fechaActualizacion: new Date("2026-03-27T18:00:00.000Z"),
        rendimientoPeriodo: 5500,
        operadorId: operadorTransmagg.id,
      },
      {
        fciId: fondoBalanz.id,
        saldoInformado: 160000,
        fechaActualizacion: new Date("2026-03-26T18:00:00.000Z"),
        rendimientoPeriodo: 10000,
        operadorId: operadorTransmagg.id,
      },
    ],
  })

  console.log("✅ FCI, movimientos FCI y saldos FCI creados")

  const empleadoPrueba = await prisma.empleado.create({
    data: {
      nombre: "Ana",
      apellido: "López",
      cuit: "27222333444",
      cargo: "Administración",
      fechaIngreso: new Date("2024-05-06T00:00:00.000Z"),
      activo: true,
    },
  })

  await prisma.movimientoSinFactura.createMany({
    data: [
      {
        cuentaId: cuentaGaliciaPesos.id,
        tipo: "INGRESO",
        categoria: "TRANSFERENCIA_RECIBIDA",
        monto: 350000,
        fecha: new Date("2026-03-21T09:00:00.000Z"),
        descripcion: "Cobro de empresa cliente",
        referencia: "TRX-0001",
        operadorId: operadorTransmagg.id,
      },
      {
        cuentaId: cuentaGaliciaPesos.id,
        tipo: "EGRESO",
        categoria: "TRANSFERENCIA_ENVIADA",
        monto: 80000,
        fecha: new Date("2026-03-22T12:00:00.000Z"),
        descripcion: "Pago de proveedor urgente",
        referencia: "TRX-0002",
        operadorId: operadorTransmagg.id,
      },
      {
        cuentaId: cuentaGaliciaPesos.id,
        tipo: "EGRESO",
        categoria: "ENVIO_A_BROKER",
        monto: 200000,
        fecha: new Date("2026-03-24T15:00:00.000Z"),
        descripcion: "Envío de fondos a BALANZ",
        referencia: "BRK-0001",
        cuentaDestinoId: cuentaBalanz.id,
        operadorId: operadorTransmagg.id,
      },
      {
        cuentaId: cuentaGaliciaPesos.id,
        tipo: "INGRESO",
        categoria: "RESCATE_DE_BROKER",
        monto: 50000,
        fecha: new Date("2026-03-28T13:30:00.000Z"),
        descripcion: "Rescate de fondos desde BALANZ",
        referencia: "BRK-0002",
        cuentaDestinoId: cuentaBalanz.id,
        operadorId: operadorTransmagg.id,
      },
      {
        cuentaId: cuentaMacroPesos.id,
        tipo: "EGRESO",
        categoria: "PAGO_SUELDO",
        monto: 250000,
        fecha: new Date("2026-03-29T17:00:00.000Z"),
        descripcion: "Pago de sueldo mensual",
        referencia: "HAB-0326",
        operadorId: operadorTransmagg.id,
      },
    ],
  })

  console.log("✅ Empleado y movimientos sin factura creados")

  const viaje1 = await prisma.viaje.create({
    data: {
      fleteroId: fletero1.id,
      camionId: camion1.id,
      choferId: chofer1.id,
      empresaId: empresa1.id,
      operadorId: operadorTransmagg.id,
      fechaViaje: new Date("2025-03-15T00:00:00.000Z"),
      remito: "R-00123",
      mercaderia: "Alimentos secos",
      procedencia: "Buenos Aires",
      provinciaOrigen: "Buenos Aires",
      destino: "Córdoba",
      provinciaDestino: "Córdoba",
      kilos: 18000,
      tarifaOperativaInicial: 160000,
      estadoLiquidacion: "LIQUIDADO",
      estadoFactura: "PENDIENTE_FACTURAR",
    },
  })

  const viaje2 = await prisma.viaje.create({
    data: {
      fleteroId: fletero1.id,
      camionId: camion1.id,
      choferId: chofer1.id,
      empresaId: empresa2.id,
      operadorId: operadorTransmagg.id,
      fechaViaje: new Date("2025-03-18T00:00:00.000Z"),
      remito: "R-00124",
      mercaderia: "Materiales de construcción",
      provinciaOrigen: "Santa Fe",
      provinciaDestino: "Mendoza",
      kilos: 22000,
      tarifaOperativaInicial: 195000,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR",
      estadoFactura: "PENDIENTE_FACTURAR",
    },
  })

  const viaje3 = await prisma.viaje.create({
    data: {
      fleteroId: fletero2.id,
      camionId: camion2.id,
      choferId: chofer2.id,
      empresaId: empresa1.id,
      operadorId: operadorTransmagg.id,
      fechaViaje: new Date("2025-03-20T00:00:00.000Z"),
      remito: "R-00125",
      mercaderia: "Bebidas",
      provinciaOrigen: "Córdoba",
      provinciaDestino: "Buenos Aires",
      kilos: 15000,
      tarifaOperativaInicial: 145000,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR",
      estadoFactura: "FACTURADO",
    },
  })

  const liquidacion = await prisma.liquidacion.create({
    data: {
      fleteroId: fletero1.id,
      operadorId: operadorTransmagg.id,
      comisionPct: 10,
      subtotalBruto: 150000,
      comisionMonto: 15000,
      neto: 135000,
      ivaMonto: 3150,
      total: 138150,
      estado: "EMITIDA",
    },
  })

  const viajeEnLiquidacion = await prisma.viajeEnLiquidacion.create({
    data: {
      viajeId: viaje1.id,
      liquidacionId: liquidacion.id,
      fechaViaje: viaje1.fechaViaje,
      tarifaFletero: 150000,
      subtotal: 150000,
    },
  })

  const factura = await prisma.facturaEmitida.create({
    data: {
      empresaId: empresa1.id,
      operadorId: operadorTransmagg.id,
      tipoCbte: "A",
      nroComprobante: "0001-00000001",
      neto: 200000,
      ivaMonto: 42000,
      total: 242000,
      estadoArca: "ACEPTADA",
      estado: "EMITIDA",
    },
  })

  const viajeEnFactura = await prisma.viajeEnFactura.create({
    data: {
      viajeId: viaje3.id,
      facturaId: factura.id,
      fechaViaje: viaje3.fechaViaje,
      tarifaEmpresa: 200000,
      subtotal: 200000,
    },
  })

  await prisma.asientoIibb.createMany({
    data: [
      {
        viajeEnLiqId: viajeEnLiquidacion.id,
        tablaOrigen: "viajes_en_liquidacion",
        provincia: "Buenos Aires",
        montoIngreso: 150000,
        periodo: "2025-03",
      },
      {
        viajeEnFactId: viajeEnFactura.id,
        tablaOrigen: "viajes_en_factura",
        provincia: "Córdoba",
        montoIngreso: 200000,
        periodo: "2025-03",
      },
    ],
  })

  await prisma.asientoIva.create({
    data: {
      facturaEmitidaId: factura.id,
      tipoReferencia: "FACTURA_EMITIDA",
      tipo: "VENTA",
      baseImponible: 200000,
      alicuota: 21,
      montoIva: 42000,
      periodo: "2025-03",
    },
  })

  console.log("✅ Viajes, liquidación, factura y asientos creados")

  const chequeRecibidoDepositado = await prisma.chequeRecibido.create({
    data: {
      empresaId: empresa1.id,
      facturaId: factura.id,
      nroCheque: "900001",
      bancoEmisor: "Banco Nación",
      monto: 250000,
      fechaEmision: new Date("2026-03-10T00:00:00.000Z"),
      fechaCobro: new Date("2026-04-10T00:00:00.000Z"),
      estado: "DEPOSITADO",
      cuentaDepositoId: cuentaGaliciaPesos.id,
      fechaAcreditacion: new Date("2026-03-12T00:00:00.000Z"),
      operadorId: operadorTransmagg.id,
    },
  })

  const chequeRecibidoEndosado = await prisma.chequeRecibido.create({
    data: {
      empresaId: empresa2.id,
      nroCheque: "900002",
      bancoEmisor: "Banco Provincia",
      monto: 98000,
      fechaEmision: new Date("2026-03-14T00:00:00.000Z"),
      fechaCobro: new Date("2026-04-15T00:00:00.000Z"),
      estado: "ENDOSADO_FLETERO",
      endosadoATipo: "FLETERO",
      endosadoAFleteroId: fletero2.id,
      operadorId: operadorTransmagg.id,
    },
  })

  const chequeRecibidoCartera = await prisma.chequeRecibido.create({
    data: {
      empresaId: empresa1.id,
      nroCheque: "900003",
      bancoEmisor: "Banco Santander",
      monto: 130000,
      fechaEmision: new Date("2026-03-16T00:00:00.000Z"),
      fechaCobro: new Date("2026-04-20T00:00:00.000Z"),
      estado: "EN_CARTERA",
      operadorId: operadorTransmagg.id,
    },
  })

  const planillaGalicia = await prisma.planillaGalicia.create({
    data: {
      nombre: "Planilla 15/04/2026",
      cuentaId: cuentaGaliciaPesos.id,
      estado: "BORRADOR",
      totalMonto: 155000,
      cantidadCheques: 2,
      operadorId: operadorTransmagg.id,
    },
  })

  const chequeEmitidoPlanilla1 = await prisma.chequeEmitido.create({
    data: {
      fleteroId: fletero1.id,
      cuentaId: cuentaGaliciaPesos.id,
      nroCheque: "100001",
      tipoDocBeneficiario: "CUIT",
      nroDocBeneficiario: "20123456789",
      monto: 85000,
      fechaEmision: new Date("2026-04-14T00:00:00.000Z"),
      fechaPago: new Date("2026-04-15T00:00:00.000Z"),
      motivoPago: "ORDEN_DE_PAGO",
      descripcion1: "Pago parcial liquidación marzo",
      descripcion2: "Flete Córdoba",
      mailBeneficiario: "juan.perez@fletero.com",
      clausula: "A_LA_ORDEN",
      estado: "EMITIDO",
      liquidacionId: liquidacion.id,
      planillaGaliciaId: planillaGalicia.id,
      operadorId: operadorTransmagg.id,
    },
  })

  const chequeEmitidoPlanilla2 = await prisma.chequeEmitido.create({
    data: {
      proveedorId: proveedor2.id,
      cuentaId: cuentaGaliciaPesos.id,
      nroCheque: "100002",
      tipoDocBeneficiario: "CUIT",
      nroDocBeneficiario: "30456789012",
      monto: 70000,
      fechaEmision: new Date("2026-04-14T00:00:00.000Z"),
      fechaPago: new Date("2026-04-15T00:00:00.000Z"),
      motivoPago: "FACTURA",
      descripcion1: "Pago repuestos unidad EF789GH",
      descripcion2: "Orden abril",
      mailBeneficiario: "pagos@repuestosvial.com.ar",
      clausula: "NO_A_LA_ORDEN",
      estado: "EMITIDO",
      planillaGaliciaId: planillaGalicia.id,
      operadorId: operadorTransmagg.id,
    },
  })

  const chequeEmitidoAdelanto = await prisma.chequeEmitido.create({
    data: {
      fleteroId: fletero1.id,
      cuentaId: cuentaGaliciaPesos.id,
      nroCheque: "100003",
      tipoDocBeneficiario: "CUIT",
      nroDocBeneficiario: "20123456789",
      monto: 80000,
      fechaEmision: new Date("2026-03-19T00:00:00.000Z"),
      fechaPago: new Date("2026-03-20T00:00:00.000Z"),
      motivoPago: "VARIOS",
      descripcion1: "Adelanto operativo marzo",
      mailBeneficiario: "juan.perez@fletero.com",
      clausula: "A_LA_ORDEN",
      estado: "EMITIDO",
      operadorId: operadorTransmagg.id,
    },
  })

  console.log("✅ Cheques y planilla Galicia creados")

  await prisma.pagoDeEmpresa.create({
    data: {
      empresaId: empresa1.id,
      facturaId: factura.id,
      tipoPago: "CHEQUE",
      monto: 250000,
      referencia: chequeRecibidoDepositado.nroCheque,
      fechaPago: new Date("2026-03-12T00:00:00.000Z"),
      chequeRecibidoId: chequeRecibidoDepositado.id,
      cuentaId: cuentaGaliciaPesos.id,
      operadorId: operadorTransmagg.id,
    },
  })

  await prisma.pagoAFletero.create({
    data: {
      fleteroId: fletero1.id,
      liquidacionId: liquidacion.id,
      tipoPago: "CHEQUE_PROPIO",
      monto: 85000,
      referencia: chequeEmitidoPlanilla1.nroCheque,
      fechaPago: new Date("2026-04-15T00:00:00.000Z"),
      chequeEmitidoId: chequeEmitidoPlanilla1.id,
      cuentaId: cuentaGaliciaPesos.id,
      operadorId: operadorTransmagg.id,
    },
  })

  const adelantoParcial = await prisma.adelantoFletero.create({
    data: {
      fleteroId: fletero1.id,
      tipo: "CHEQUE_PROPIO",
      monto: 80000,
      fecha: new Date("2026-03-20T00:00:00.000Z"),
      descripcion: "Adelanto por combustible y peajes",
      chequeEmitidoId: chequeEmitidoAdelanto.id,
      montoDescontado: 30000,
      estado: "DESCONTADO_PARCIAL",
      operadorId: operadorTransmagg.id,
    },
  })

  const adelantoPendiente = await prisma.adelantoFletero.create({
    data: {
      fleteroId: fletero2.id,
      tipo: "CHEQUE_TERCERO",
      monto: 98000,
      fecha: new Date("2026-03-21T00:00:00.000Z"),
      descripcion: "Adelanto con cheque de tercero",
      chequeRecibidoId: chequeRecibidoEndosado.id,
      montoDescontado: 0,
      estado: "PENDIENTE_DESCUENTO",
      operadorId: operadorTransmagg.id,
    },
  })

  await prisma.adelantoDescuento.create({
    data: {
      adelantoId: adelantoParcial.id,
      liquidacionId: liquidacion.id,
      montoDescontado: 30000,
      fecha: new Date("2026-03-31T00:00:00.000Z"),
    },
  })

  console.log("✅ Pagos y adelantos creados")

  const tarjeta1 = await prisma.tarjetaPrepaga.create({
    data: {
      choferId: chofer1.id,
      cuentaId: cuentaMercadoPago.id,
      nroTarjeta: "4509123412341234",
      limiteMensual: 180000,
      activa: true,
    },
  })

  const tarjeta2 = await prisma.tarjetaPrepaga.create({
    data: {
      choferId: chofer2.id,
      cuentaId: cuentaBamba.id,
      nroTarjeta: "4509987612345678",
      limiteMensual: 150000,
      activa: true,
    },
  })

  await prisma.gastoTarjetaPrepaga.createMany({
    data: [
      {
        tarjetaId: tarjeta1.id,
        tipoGasto: "COMBUSTIBLE",
        monto: 45000,
        fecha: new Date("2026-03-25T08:00:00.000Z"),
        descripcion: "Carga YPF Ruta 9",
        operadorId: operadorTransmagg.id,
      },
      {
        tarjetaId: tarjeta1.id,
        tipoGasto: "PEAJE",
        monto: 9500,
        fecha: new Date("2026-03-25T09:00:00.000Z"),
        descripcion: "Peajes Córdoba",
        operadorId: operadorTransmagg.id,
      },
      {
        tarjetaId: tarjeta2.id,
        tipoGasto: "COMIDA",
        monto: 18000,
        fecha: new Date("2026-03-26T13:00:00.000Z"),
        descripcion: "Vianda chofer",
        operadorId: operadorTransmagg.id,
      },
      {
        tarjetaId: tarjeta2.id,
        tipoGasto: "ALOJAMIENTO",
        monto: 32000,
        fecha: new Date("2026-03-26T22:00:00.000Z"),
        descripcion: "Hotel de ruta",
        operadorId: operadorTransmagg.id,
      },
      {
        tarjetaId: tarjeta2.id,
        tipoGasto: "REPUESTO",
        monto: 27500,
        fecha: new Date("2026-03-27T16:00:00.000Z"),
        descripcion: "Manguera hidráulica",
        operadorId: operadorTransmagg.id,
      },
    ],
  })

  console.log("✅ Tarjetas prepagas y gastos creados")

  // ═══════════════════════════════════════════════════════════════════════════
  // DATOS DE PRUEBA ADICIONALES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n🌱 Agregando datos de prueba adicionales...")

  const hoy = new Date()
  const dias = (n: number) => new Date(hoy.getTime() + n * 24 * 60 * 60 * 1000)

  // ── Usuarios operadores ────────────────────────────────────────────────────
  const anaGarcia = await prisma.usuario.create({
    data: { nombre: "Ana", apellido: "García", email: "ana.garcia@transmagg.com", rol: "OPERADOR_TRANSMAGG" },
  })
  const carlosLopez = await prisma.usuario.create({
    data: { nombre: "Carlos", apellido: "López", email: "carlos.lopez@transmagg.com", rol: "ADMIN_TRANSMAGG" },
  })
  void carlosLopez

  // ── Empresas (4) con admin users ───────────────────────────────────────────
  const adminCereales = await prisma.usuario.create({
    data: { nombre: "Admin", apellido: "Cereales Norte", email: "admin@cerealesdelnorte.com.ar", rol: "ADMIN_EMPRESA" },
  })
  const adminAgroexport = await prisma.usuario.create({
    data: { nombre: "Admin", apellido: "Agroexport", email: "admin@agroexportpampeana.com.ar", rol: "ADMIN_EMPRESA" },
  })
  const adminTransUnidos = await prisma.usuario.create({
    data: { nombre: "Admin", apellido: "Trans Unidos", email: "admin@transportesunidos.com.ar", rol: "ADMIN_EMPRESA" },
  })
  const adminGranosSur = await prisma.usuario.create({
    data: { nombre: "Admin", apellido: "Granos Sur", email: "admin@granosdelsur.com.ar", rol: "ADMIN_EMPRESA" },
  })

  const empCereales = await prisma.empresa.create({
    data: { razonSocial: "Cereales del Norte S.A.", cuit: "30712345678", condicionIva: "RESPONSABLE_INSCRIPTO", direccion: "Av. Belgrano 1200, Rosario" },
  })
  const empAgroexport = await prisma.empresa.create({
    data: { razonSocial: "Agroexport Pampeana S.R.L.", cuit: "30689012345", condicionIva: "RESPONSABLE_INSCRIPTO", direccion: "Ruta 9 km 340, Córdoba" },
  })
  const empTransUnidos = await prisma.empresa.create({
    data: { razonSocial: "Transportes Unidos S.A.", cuit: "30556789012", condicionIva: "RESPONSABLE_INSCRIPTO", direccion: "San Martín 450, Santa Fe" },
  })
  const empGranosSur = await prisma.empresa.create({
    data: { razonSocial: "Granos del Sur Ltda.", cuit: "30443210987", condicionIva: "RESPONSABLE_INSCRIPTO", direccion: "Mitre 780, Bahía Blanca" },
  })

  await prisma.empresaUsuario.createMany({
    data: [
      { empresaId: empCereales.id, usuarioId: adminCereales.id, nivelAcceso: "ADMIN" },
      { empresaId: empAgroexport.id, usuarioId: adminAgroexport.id, nivelAcceso: "ADMIN" },
      { empresaId: empTransUnidos.id, usuarioId: adminTransUnidos.id, nivelAcceso: "ADMIN" },
      { empresaId: empGranosSur.id, usuarioId: adminGranosSur.id, nivelAcceso: "ADMIN" },
    ],
  })
  console.log("✅ 4 empresas de prueba creadas")

  // ── Fleteros (5) con camiones y choferes ───────────────────────────────────
  // Fletero 1: Transportes Pérez (MONOTRIBUTISTA, comision Transmagg 12% → fletero 88%)
  const usrPérez = await prisma.usuario.create({
    data: { nombre: "Carlos", apellido: "Pérez", email: "transportes.perez@fletero.com", rol: "FLETERO" },
  })
  const flPérez = await prisma.fletero.create({
    data: { usuarioId: usrPérez.id, razonSocial: "Transportes Pérez", cuit: "20234567890", condicionIva: "MONOTRIBUTISTA", comisionDefault: 12 },
  })
  const camPérez = await prisma.camion.create({
    data: { fleteroId: flPérez.id, patenteChasis: "AB124CD", patenteAcoplado: "EF456GH", tipoCamion: "SEMIRREMOLQUE" },
  })
  const choferPérez = await prisma.usuario.create({
    data: { nombre: "Roberto", apellido: "Pérez", email: "roberto.perez@gmail.com", rol: "CHOFER", fleteroId: flPérez.id },
  })
  await prisma.camionChofer.create({ data: { camionId: camPérez.id, choferId: choferPérez.id, desde: dias(-200) } })

  // Fletero 2: Logística Fernández (RI, comision 10% → fletero 90%)
  const usrFernandez = await prisma.usuario.create({
    data: { nombre: "Alejandro", apellido: "Fernández", email: "logistica.fernandez@fletero.com", rol: "FLETERO" },
  })
  const flFernandez = await prisma.fletero.create({
    data: { usuarioId: usrFernandez.id, razonSocial: "Logística Fernández", cuit: "27345678901", condicionIva: "RESPONSABLE_INSCRIPTO", comisionDefault: 10 },
  })
  const camFernandez1 = await prisma.camion.create({
    data: { fleteroId: flFernandez.id, patenteChasis: "IJ789KL", patenteAcoplado: "MN012OP", tipoCamion: "SEMIRREMOLQUE" },
  })
  const camFernandez2 = await prisma.camion.create({
    data: { fleteroId: flFernandez.id, patenteChasis: "QR345ST", tipoCamion: "CHASIS" },
  })
  void camFernandez2
  const choferMiguel = await prisma.usuario.create({
    data: { nombre: "Miguel", apellido: "Fernández", email: "miguel.fernandez@gmail.com", rol: "CHOFER", fleteroId: flFernandez.id },
  })
  const choferJuan = await prisma.usuario.create({
    data: { nombre: "Juan", apellido: "Rodríguez", email: "juan.rodriguez@gmail.com", rol: "CHOFER", fleteroId: flFernandez.id },
  })
  await prisma.camionChofer.createMany({
    data: [
      { camionId: camFernandez1.id, choferId: choferMiguel.id, desde: dias(-200) },
    ],
  })
  void choferJuan

  // Fletero 3: El Rápido Transporte (MONOTRIBUTISTA, comision 13% → fletero 87%)
  const usrRapido = await prisma.usuario.create({
    data: { nombre: "El Rápido", apellido: "Transporte", email: "el.rapido@fletero.com", rol: "FLETERO" },
  })
  const flRapido = await prisma.fletero.create({
    data: { usuarioId: usrRapido.id, razonSocial: "El Rápido Transporte", cuit: "30456789013", condicionIva: "MONOTRIBUTISTA", comisionDefault: 13 },
  })
  const camRapido = await prisma.camion.create({
    data: { fleteroId: flRapido.id, patenteChasis: "UV678WX", patenteAcoplado: "YZ901AB", tipoCamion: "SEMIRREMOLQUE" },
  })
  const choferDiego = await prisma.usuario.create({
    data: { nombre: "Diego", apellido: "Martínez", email: "diego.martinez@gmail.com", rol: "CHOFER", fleteroId: flRapido.id },
  })
  await prisma.camionChofer.create({ data: { camionId: camRapido.id, choferId: choferDiego.id, desde: dias(-200) } })

  // Fletero 4: Rutas del Centro S.R.L. (RI, comision 15% → fletero 85%)
  const usrRutas = await prisma.usuario.create({
    data: { nombre: "Rutas del Centro", apellido: "S.R.L.", email: "rutas.centro@fletero.com", rol: "FLETERO" },
  })
  const flRutas = await prisma.fletero.create({
    data: { usuarioId: usrRutas.id, razonSocial: "Rutas del Centro S.R.L.", cuit: "30567890123", condicionIva: "RESPONSABLE_INSCRIPTO", comisionDefault: 15 },
  })
  const camRutas = await prisma.camion.create({
    data: { fleteroId: flRutas.id, patenteChasis: "CD234EF", patenteAcoplado: "GH567IJ", tipoCamion: "SEMIRREMOLQUE" },
  })
  const choferPablo = await prisma.usuario.create({
    data: { nombre: "Pablo", apellido: "González", email: "pablo.gonzalez@gmail.com", rol: "CHOFER", fleteroId: flRutas.id },
  })
  await prisma.camionChofer.create({ data: { camionId: camRutas.id, choferId: choferPablo.id, desde: dias(-200) } })

  // Fletero 5: Transportista Gómez (MONOTRIBUTISTA, comision 8% → fletero 92%)
  const usrGomez = await prisma.usuario.create({
    data: { nombre: "Sergio", apellido: "Gómez", email: "transportista.gomez@fletero.com", rol: "FLETERO" },
  })
  const flGomez = await prisma.fletero.create({
    data: { usuarioId: usrGomez.id, razonSocial: "Transportista Gómez", cuit: "20678901234", condicionIva: "MONOTRIBUTISTA", comisionDefault: 8 },
  })
  const camGomez = await prisma.camion.create({
    data: { fleteroId: flGomez.id, patenteChasis: "KL890MN", tipoCamion: "CHASIS" },
  })
  const choferSergio = await prisma.usuario.create({
    data: { nombre: "Sergio", apellido: "Gómez", email: "sergio.gomez@gmail.com", rol: "CHOFER", fleteroId: flGomez.id },
  })
  await prisma.camionChofer.create({ data: { camionId: camGomez.id, choferId: choferSergio.id, desde: dias(-200) } })

  console.log("✅ 5 fleteros con camiones y choferes creados")

  // ── Proveedores (4) ────────────────────────────────────────────────────────
  const provYpf = await prisma.proveedor.create({
    data: { razonSocial: "YPF S.A.", cuit: "30546678190", condicionIva: "RESPONSABLE_INSCRIPTO", rubro: "COMBUSTIBLE" },
  })
  const provShell = await prisma.proveedor.create({
    data: { razonSocial: "Shell CAPSA", cuit: "30650310980", condicionIva: "RESPONSABLE_INSCRIPTO", rubro: "COMBUSTIBLE" },
  })
  const provTaller = await prisma.proveedor.create({
    data: { razonSocial: "Taller Mecánico El Camionero", cuit: "20287654321", condicionIva: "MONOTRIBUTISTA", rubro: "MANTENIMIENTO" },
  })
  const provNeumaticos = await prisma.proveedor.create({
    data: { razonSocial: "Neumáticos del Litoral S.R.L.", cuit: "30723456789", condicionIva: "RESPONSABLE_INSCRIPTO", rubro: "NEUMATICOS" },
  })
  void provNeumaticos
  console.log("✅ 4 proveedores de prueba creados")

  // ── Cuentas bancarias (3 nuevas) ───────────────────────────────────────────
  const cuentaGaliciaCC = await prisma.cuenta.create({
    data: {
      nombre: "Banco Galicia — Cuenta Corriente",
      tipo: "BANCO",
      bancoOEntidad: "Banco Galicia",
      moneda: "PESOS",
      saldoInicial: 5000000,
      activa: true,
      tieneChequera: true,
      tieneImpuestoDebcred: true,
      alicuotaImpuesto: 0.006,
      formatoReconciliacion: "EXCEL",
    },
  })
  const cuentaMacroCC = await prisma.cuenta.create({
    data: {
      nombre: "Banco Macro — Cuenta Corriente",
      tipo: "BANCO",
      bancoOEntidad: "Banco Macro",
      moneda: "PESOS",
      saldoInicial: 2000000,
      activa: true,
      tieneChequera: true,
      tieneImpuestoDebcred: false,
    },
  })
  const cuentaMPDigital = await prisma.cuenta.create({
    data: {
      nombre: "Mercado Pago — Billetera Virtual",
      tipo: "BILLETERA_VIRTUAL",
      bancoOEntidad: "Mercado Pago",
      moneda: "PESOS",
      saldoInicial: 500000,
      activa: true,
      tieneChequera: false,
      tieneImpuestoDebcred: false,
    },
  })

  // ── Brokers (2 nuevos) ─────────────────────────────────────────────────────
  const cuentaBalanzCapital = await prisma.cuenta.create({
    data: { nombre: "Balanz Capital (comitente)", tipo: "BROKER", bancoOEntidad: "Balanz Capital", moneda: "PESOS", saldoInicial: 0, activa: true, esCuentaComitenteBroker: true },
  })
  const cuentaIol = await prisma.cuenta.create({
    data: { nombre: "IOL Invertironline (comitente)", tipo: "BROKER", bancoOEntidad: "Invertironline IOL", moneda: "PESOS", saldoInicial: 0, activa: true, esCuentaComitenteBroker: true },
  })
  await prisma.broker.createMany({
    data: [
      { nombre: "Balanz Capital", cuit: "30710810231", cuentaId: cuentaBalanzCapital.id, activo: true },
      { nombre: "Invertironline (IOL)", cuit: "30707604779", cuentaId: cuentaIol.id, activo: true },
    ],
  })
  console.log("✅ 3 cuentas y 2 brokers nuevos creados")

  // ── Tarjetas de crédito corporativas (2) ──────────────────────────────────
  const tarjVisaGalicia = await prisma.tarjeta.create({
    data: {
      nombre: "VISA Corporativa Galicia",
      tipo: "CREDITO",
      banco: "Galicia",
      ultimos4: "4521",
      titularTipo: "EMPRESA",
      titularNombre: "Transmagg S.A.",
      cuentaId: cuentaGaliciaCC.id,
    },
  })
  const tarjMasterMacro = await prisma.tarjeta.create({
    data: {
      nombre: "Mastercard Macro",
      tipo: "CREDITO",
      banco: "Macro",
      ultimos4: "7834",
      titularTipo: "EMPRESA",
      titularNombre: "Transmagg S.A.",
      cuentaId: cuentaMacroCC.id,
    },
  })
  void tarjVisaGalicia
  void tarjMasterMacro
  console.log("✅ 2 tarjetas corporativas creadas")

  // ── Viajes (15) ────────────────────────────────────────────────────────────
  // Viajes 1, 7 → LP1 (EMITIDA, CAE) → facturables
  // Viajes 2, 3, 8 → LP2 (EMITIDA, sin CAE) → NO facturables aún
  // Viajes 4, 9 → LP3 (EMITIDA, CAE) → facturables
  // Viaje 5 → LP4 (BORRADOR)
  // Viajes 6, 10-15 → sin LP, PENDIENTE_LIQUIDAR

  const v1 = await prisma.viaje.create({
    data: {
      fleteroId: flPérez.id, camionId: camPérez.id, choferId: choferPérez.id,
      empresaId: empCereales.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-75), mercaderia: "GRANOS", procedencia: "Rosario",
      provinciaOrigen: "Santa Fe", destino: "Buenos Aires", provinciaDestino: "Buenos Aires",
      kilos: 25000, tarifaOperativaInicial: 220000,
      estadoLiquidacion: "LIQUIDADO", estadoFactura: "FACTURADO",
    },
  })
  const v2 = await prisma.viaje.create({
    data: {
      fleteroId: flFernandez.id, camionId: camFernandez1.id, choferId: choferMiguel.id,
      empresaId: empAgroexport.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-70), mercaderia: "SOJA", procedencia: "Córdoba",
      provinciaOrigen: "Córdoba", destino: "Rosario", provinciaDestino: "Santa Fe",
      kilos: 28000, tarifaOperativaInicial: 180000,
      estadoLiquidacion: "LIQUIDADO", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v3 = await prisma.viaje.create({
    data: {
      fleteroId: flFernandez.id, camionId: camFernandez1.id, choferId: choferMiguel.id,
      empresaId: empCereales.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-65), mercaderia: "MAÍZ", procedencia: "Santa Fe",
      provinciaOrigen: "Santa Fe", destino: "Buenos Aires", provinciaDestino: "Buenos Aires",
      kilos: 27000, tarifaOperativaInicial: 240000,
      estadoLiquidacion: "LIQUIDADO", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v4 = await prisma.viaje.create({
    data: {
      fleteroId: flRapido.id, camionId: camRapido.id, choferId: choferDiego.id,
      empresaId: empTransUnidos.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-60), mercaderia: "GIRASOL", procedencia: "Rosario",
      provinciaOrigen: "Santa Fe", destino: "Córdoba", provinciaDestino: "Córdoba",
      kilos: 24000, tarifaOperativaInicial: 195000,
      estadoLiquidacion: "LIQUIDADO", estadoFactura: "FACTURADO",
    },
  })
  const v5 = await prisma.viaje.create({
    data: {
      fleteroId: flRutas.id, camionId: camRutas.id, choferId: choferPablo.id,
      empresaId: empGranosSur.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-55), mercaderia: "CEREALES", procedencia: "Bahía Blanca",
      provinciaOrigen: "Buenos Aires", destino: "Rosario", provinciaDestino: "Santa Fe",
      kilos: 26000, tarifaOperativaInicial: 310000,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v6 = await prisma.viaje.create({
    data: {
      fleteroId: flGomez.id, camionId: camGomez.id, choferId: choferSergio.id,
      empresaId: empCereales.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-50), mercaderia: "SOJA", procedencia: "Córdoba",
      provinciaOrigen: "Córdoba", destino: "Buenos Aires", provinciaDestino: "Buenos Aires",
      kilos: 23000, tarifaOperativaInicial: 260000,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v7 = await prisma.viaje.create({
    data: {
      fleteroId: flPérez.id, camionId: camPérez.id, choferId: choferPérez.id,
      empresaId: empAgroexport.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-45), mercaderia: "MAÍZ", procedencia: "Rosario",
      provinciaOrigen: "Santa Fe", destino: "Córdoba", provinciaDestino: "Córdoba",
      kilos: 22000, tarifaOperativaInicial: 190000,
      estadoLiquidacion: "LIQUIDADO", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v8 = await prisma.viaje.create({
    data: {
      fleteroId: flFernandez.id, camionId: camFernandez1.id, choferId: choferMiguel.id,
      empresaId: empGranosSur.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-40), mercaderia: "GRANOS", procedencia: "Santa Fe",
      provinciaOrigen: "Santa Fe", destino: "Bahía Blanca", provinciaDestino: "Buenos Aires",
      kilos: 29000, tarifaOperativaInicial: 290000,
      estadoLiquidacion: "LIQUIDADO", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v9 = await prisma.viaje.create({
    data: {
      fleteroId: flRapido.id, camionId: camRapido.id, choferId: choferDiego.id,
      empresaId: empCereales.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-35), mercaderia: "GIRASOL", procedencia: "Córdoba",
      provinciaOrigen: "Córdoba", destino: "Rosario", provinciaDestino: "Santa Fe",
      kilos: 21000, tarifaOperativaInicial: 210000,
      estadoLiquidacion: "LIQUIDADO", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v10 = await prisma.viaje.create({
    data: {
      fleteroId: flRutas.id, camionId: camRutas.id, choferId: choferPablo.id,
      empresaId: empTransUnidos.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-30), mercaderia: "SOJA", procedencia: "Buenos Aires",
      provinciaOrigen: "Buenos Aires", destino: "Córdoba", provinciaDestino: "Córdoba",
      kilos: 20000, tarifaOperativaInicial: 185000,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v11 = await prisma.viaje.create({
    data: {
      fleteroId: flPérez.id, camionId: camPérez.id, choferId: choferPérez.id,
      empresaId: empGranosSur.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-25), mercaderia: "CEREALES", procedencia: "Rosario",
      provinciaOrigen: "Santa Fe", destino: "Bahía Blanca", provinciaDestino: "Buenos Aires",
      kilos: 25500, tarifaOperativaInicial: 320000,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v12 = await prisma.viaje.create({
    data: {
      fleteroId: flGomez.id, camionId: camGomez.id, choferId: choferSergio.id,
      empresaId: empAgroexport.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-20), mercaderia: "MAÍZ", procedencia: "Córdoba",
      provinciaOrigen: "Córdoba", destino: "Rosario", provinciaDestino: "Santa Fe",
      kilos: 19000, tarifaOperativaInicial: 200000,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v13 = await prisma.viaje.create({
    data: {
      fleteroId: flFernandez.id, camionId: camFernandez1.id, choferId: choferMiguel.id,
      empresaId: empCereales.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-15), mercaderia: "GRANOS", procedencia: "Santa Fe",
      provinciaOrigen: "Santa Fe", destino: "Buenos Aires", provinciaDestino: "Buenos Aires",
      kilos: 27500, tarifaOperativaInicial: 270000,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v14 = await prisma.viaje.create({
    data: {
      fleteroId: flRapido.id, camionId: camRapido.id, choferId: choferDiego.id,
      empresaId: empGranosSur.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-10), mercaderia: "SOJA", procedencia: "Rosario",
      provinciaOrigen: "Santa Fe", destino: "Bahía Blanca", provinciaDestino: "Buenos Aires",
      kilos: 26500, tarifaOperativaInicial: 340000,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  const v15 = await prisma.viaje.create({
    data: {
      fleteroId: flRutas.id, camionId: camRutas.id, choferId: choferPablo.id,
      empresaId: empCereales.id, operadorId: anaGarcia.id,
      fechaViaje: dias(-5), mercaderia: "GIRASOL", procedencia: "Buenos Aires",
      provinciaOrigen: "Buenos Aires", destino: "Rosario", provinciaDestino: "Santa Fe",
      kilos: 22500, tarifaOperativaInicial: 215000,
      estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR",
    },
  })
  void v6
  void v10
  void v11
  void v12
  void v13
  void v14
  void v15
  console.log("✅ 15 viajes de prueba creados")

  // ── Liquidaciones (4) ──────────────────────────────────────────────────────
  // LP1: Pérez, MONOTRIBUTISTA → ivaMonto = 0
  // Viajes 1 ($220k) + 7 ($190k) = $410k bruto; comision 12%
  const lp1 = await prisma.liquidacion.create({
    data: {
      fleteroId: flPérez.id,
      operadorId: anaGarcia.id,
      comisionPct: 12,
      subtotalBruto: 410000,
      comisionMonto: 49200,
      neto: 360800,
      ivaMonto: 0,
      total: 360800,
      estado: "EMITIDA",
      nroComprobante: 1,
      ptoVenta: 1,
      tipoCbte: 186,
      cae: "74123456789012",
      caeVto: dias(90),
      arcaEstado: "ACEPTADA",
    },
  })
  const lp1v1 = await prisma.viajeEnLiquidacion.create({
    data: { viajeId: v1.id, liquidacionId: lp1.id, fechaViaje: v1.fechaViaje, tarifaFletero: 220000, subtotal: 220000, mercaderia: "GRANOS", provinciaOrigen: "Santa Fe", provinciaDestino: "Buenos Aires", kilos: 25000 },
  })
  const lp1v7 = await prisma.viajeEnLiquidacion.create({
    data: { viajeId: v7.id, liquidacionId: lp1.id, fechaViaje: v7.fechaViaje, tarifaFletero: 190000, subtotal: 190000, mercaderia: "MAÍZ", provinciaOrigen: "Santa Fe", provinciaDestino: "Córdoba", kilos: 22000 },
  })
  await prisma.asientoIibb.createMany({
    data: [
      { viajeEnLiqId: lp1v1.id, tablaOrigen: "viajes_en_liquidacion", provincia: "Santa Fe", montoIngreso: 220000, periodo: "2026-01" },
      { viajeEnLiqId: lp1v7.id, tablaOrigen: "viajes_en_liquidacion", provincia: "Santa Fe", montoIngreso: 190000, periodo: "2026-02" },
    ],
  })

  // LP2: Fernández, RI → ivaMonto = neto * 21%
  // Viajes 2 ($180k) + 3 ($240k) + 8 ($290k) = $710k bruto; comision 10%
  const lp2 = await prisma.liquidacion.create({
    data: {
      fleteroId: flFernandez.id,
      operadorId: anaGarcia.id,
      comisionPct: 10,
      subtotalBruto: 710000,
      comisionMonto: 71000,
      neto: 639000,
      ivaMonto: 134190,
      total: 773190,
      estado: "EMITIDA",
      nroComprobante: 2,
      ptoVenta: 1,
      tipoCbte: 186,
      cae: null,
      arcaEstado: "PENDIENTE",
    },
  })
  await prisma.viajeEnLiquidacion.createMany({
    data: [
      { viajeId: v2.id, liquidacionId: lp2.id, fechaViaje: v2.fechaViaje, tarifaFletero: 180000, subtotal: 180000, mercaderia: "SOJA", provinciaOrigen: "Córdoba", provinciaDestino: "Santa Fe", kilos: 28000 },
      { viajeId: v3.id, liquidacionId: lp2.id, fechaViaje: v3.fechaViaje, tarifaFletero: 240000, subtotal: 240000, mercaderia: "MAÍZ", provinciaOrigen: "Santa Fe", provinciaDestino: "Buenos Aires", kilos: 27000 },
      { viajeId: v8.id, liquidacionId: lp2.id, fechaViaje: v8.fechaViaje, tarifaFletero: 290000, subtotal: 290000, mercaderia: "GRANOS", provinciaOrigen: "Santa Fe", provinciaDestino: "Buenos Aires", kilos: 29000 },
    ],
  })

  // LP3: El Rápido, MONOTRIBUTISTA → ivaMonto = 0
  // Viajes 4 ($195k) + 9 ($210k) = $405k bruto; comision 13%
  const lp3 = await prisma.liquidacion.create({
    data: {
      fleteroId: flRapido.id,
      operadorId: anaGarcia.id,
      comisionPct: 13,
      subtotalBruto: 405000,
      comisionMonto: 52650,
      neto: 352350,
      ivaMonto: 0,
      total: 352350,
      estado: "EMITIDA",
      nroComprobante: 3,
      ptoVenta: 1,
      tipoCbte: 186,
      cae: "74987654321098",
      caeVto: dias(85),
      arcaEstado: "ACEPTADA",
    },
  })
  const lp3v4 = await prisma.viajeEnLiquidacion.create({
    data: { viajeId: v4.id, liquidacionId: lp3.id, fechaViaje: v4.fechaViaje, tarifaFletero: 195000, subtotal: 195000, mercaderia: "GIRASOL", provinciaOrigen: "Santa Fe", provinciaDestino: "Córdoba", kilos: 24000 },
  })
  const lp3v9 = await prisma.viajeEnLiquidacion.create({
    data: { viajeId: v9.id, liquidacionId: lp3.id, fechaViaje: v9.fechaViaje, tarifaFletero: 210000, subtotal: 210000, mercaderia: "GIRASOL", provinciaOrigen: "Córdoba", provinciaDestino: "Santa Fe", kilos: 21000 },
  })
  void lp3v9
  await prisma.asientoIibb.create({
    data: { viajeEnLiqId: lp3v4.id, tablaOrigen: "viajes_en_liquidacion", provincia: "Santa Fe", montoIngreso: 195000, periodo: "2026-02" },
  })

  // LP4: Rutas Centro, RI, BORRADOR
  // Viaje 5 ($310k); comision 15%
  const lp4 = await prisma.liquidacion.create({
    data: {
      fleteroId: flRutas.id,
      operadorId: anaGarcia.id,
      comisionPct: 15,
      subtotalBruto: 310000,
      comisionMonto: 46500,
      neto: 263500,
      ivaMonto: 55335,
      total: 318835,
      estado: "BORRADOR",
    },
  })
  await prisma.viajeEnLiquidacion.create({
    data: { viajeId: v5.id, liquidacionId: lp4.id, fechaViaje: v5.fechaViaje, tarifaFletero: 310000, subtotal: 310000, mercaderia: "CEREALES", provinciaOrigen: "Buenos Aires", provinciaDestino: "Santa Fe", kilos: 26000 },
  })
  void lp4
  console.log("✅ 4 liquidaciones creadas (LP1/LP3 con CAE, LP2 sin CAE, LP4 borrador)")

  // ── Facturas emitidas (2) ──────────────────────────────────────────────────
  // Solo viajes con LP con CAE: viaje 1 (LP1) y viaje 4 (LP3)
  const fact1 = await prisma.facturaEmitida.create({
    data: {
      empresaId: empCereales.id,
      operadorId: anaGarcia.id,
      tipoCbte: "A",
      nroComprobante: "0001-00000001",
      neto: 220000,
      ivaMonto: 46200,
      total: 266200,
      estadoArca: "ACEPTADA",
      estado: "EMITIDA",
    },
  })
  const fact1v1 = await prisma.viajeEnFactura.create({
    data: { viajeId: v1.id, facturaId: fact1.id, fechaViaje: v1.fechaViaje, tarifaEmpresa: 220000, subtotal: 220000, mercaderia: "GRANOS", provinciaOrigen: "Santa Fe", provinciaDestino: "Buenos Aires", kilos: 25000 },
  })
  await prisma.asientoIva.create({
    data: { facturaEmitidaId: fact1.id, tipoReferencia: "FACTURA_EMITIDA", tipo: "VENTA", baseImponible: 220000, alicuota: 21, montoIva: 46200, periodo: "2026-01" },
  })
  await prisma.asientoIibb.create({
    data: { viajeEnFactId: fact1v1.id, tablaOrigen: "viajes_en_factura", provincia: "Santa Fe", montoIngreso: 220000, periodo: "2026-01" },
  })

  const fact2 = await prisma.facturaEmitida.create({
    data: {
      empresaId: empTransUnidos.id,
      operadorId: anaGarcia.id,
      tipoCbte: "A",
      nroComprobante: "0001-00000002",
      neto: 195000,
      ivaMonto: 40950,
      total: 235950,
      estadoArca: "ACEPTADA",
      estado: "EMITIDA",
    },
  })
  const fact2v4 = await prisma.viajeEnFactura.create({
    data: { viajeId: v4.id, facturaId: fact2.id, fechaViaje: v4.fechaViaje, tarifaEmpresa: 195000, subtotal: 195000, mercaderia: "GIRASOL", provinciaOrigen: "Santa Fe", provinciaDestino: "Córdoba", kilos: 24000 },
  })
  void fact2v4
  await prisma.asientoIva.create({
    data: { facturaEmitidaId: fact2.id, tipoReferencia: "FACTURA_EMITIDA", tipo: "VENTA", baseImponible: 195000, alicuota: 21, montoIva: 40950, periodo: "2026-02" },
  })
  console.log("✅ 2 facturas emitidas creadas")

  // ── Facturas de proveedores (4) ────────────────────────────────────────────
  // FP1: YPF, tipoCbte A, $280k + 21%, PAGADA
  const fp1 = await prisma.facturaProveedor.create({
    data: {
      proveedorId: provYpf.id,
      tipoCbte: "A",
      ptoVenta: "0001",
      nroComprobante: "0001-00000001",
      neto: 280000,
      ivaMonto: 58800,
      total: 338800,
      fechaCbte: dias(-60),
      concepto: "COMBUSTIBLE",
      estadoPago: "PAGADA",
    },
  })
  await prisma.itemFacturaProveedor.create({
    data: { facturaProveedorId: fp1.id, descripcion: "Combustible gasoil", cantidad: 1, precioUnitario: 280000, alicuotaIva: 21, esExento: false, subtotalNeto: 280000, montoIva: 58800, subtotalTotal: 338800 },
  })
  await prisma.asientoIva.create({
    data: { facturaProvId: fp1.id, tipoReferencia: "FACTURA_PROVEEDOR", tipo: "COMPRA", baseImponible: 280000, alicuota: 21, montoIva: 58800, periodo: "2026-01" },
  })

  // FP2: Shell CAPSA, tipoCbte A, $150k + 21%, por cuenta Fletero Pérez, PENDIENTE
  const fp2 = await prisma.facturaProveedor.create({
    data: {
      proveedorId: provShell.id,
      tipoCbte: "A",
      ptoVenta: "0001",
      nroComprobante: "0001-00000001",
      neto: 150000,
      ivaMonto: 31500,
      total: 181500,
      fechaCbte: dias(-45),
      concepto: "COMBUSTIBLE",
      estadoPago: "PENDIENTE",
      esPorCuentaDeFletero: true,
      fleteroId: flPérez.id,
      tipoGastoFletero: "COMBUSTIBLE",
    },
  })
  await prisma.itemFacturaProveedor.create({
    data: { facturaProveedorId: fp2.id, descripcion: "Combustible gasoil", cantidad: 1, precioUnitario: 150000, alicuotaIva: 21, esExento: false, subtotalNeto: 150000, montoIva: 31500, subtotalTotal: 181500 },
  })
  // GastoFletero: Fletero Pérez debe $181,500 a Transmagg
  await prisma.gastoFletero.create({
    data: { fleteroId: flPérez.id, facturaProveedorId: fp2.id, tipo: "COMBUSTIBLE", montoPagado: 181500, montoDescontado: 0, estado: "PENDIENTE_PAGO" },
  })

  // FP3: Taller Mecánico, tipoCbte C, $85k, 0% IVA, por cuenta Fletero Fernández, PAGADA
  const fp3 = await prisma.facturaProveedor.create({
    data: {
      proveedorId: provTaller.id,
      tipoCbte: "C",
      ptoVenta: "0001",
      nroComprobante: "0001-00000001",
      neto: 85000,
      ivaMonto: 0,
      total: 85000,
      fechaCbte: dias(-30),
      concepto: "MANTENIMIENTO",
      estadoPago: "PAGADA",
      esPorCuentaDeFletero: true,
      fleteroId: flFernandez.id,
      tipoGastoFletero: "OTRO",
    },
  })
  await prisma.itemFacturaProveedor.create({
    data: { facturaProveedorId: fp3.id, descripcion: "Reparación sistema de frenos", cantidad: 1, precioUnitario: 85000, alicuotaIva: 0, esExento: false, subtotalNeto: 85000, montoIva: 0, subtotalTotal: 85000 },
  })
  // GastoFletero: Fernández debe $85,000 pero ya pagado al proveedor → estado PAGADO
  await prisma.gastoFletero.create({
    data: { fleteroId: flFernandez.id, facturaProveedorId: fp3.id, tipo: "OTRO", montoPagado: 85000, montoDescontado: 0, estado: "PAGADO" },
  })

  // FP4: Neumáticos del Litoral, tipoCbte A, 4 x $180k + 21%, PENDIENTE
  const fp4 = await prisma.facturaProveedor.create({
    data: {
      proveedorId: provNeumaticos.id,
      tipoCbte: "A",
      ptoVenta: "0001",
      nroComprobante: "0001-00000001",
      neto: 720000,
      ivaMonto: 151200,
      total: 871200,
      fechaCbte: dias(-15),
      concepto: "MANTENIMIENTO",
      estadoPago: "PENDIENTE",
    },
  })
  await prisma.itemFacturaProveedor.create({
    data: { facturaProveedorId: fp4.id, descripcion: "Cubiertas 295/80 R22.5 x4", cantidad: 4, precioUnitario: 180000, alicuotaIva: 21, esExento: false, subtotalNeto: 720000, montoIva: 151200, subtotalTotal: 871200 },
  })
  await prisma.asientoIva.create({
    data: { facturaProvId: fp4.id, tipoReferencia: "FACTURA_PROVEEDOR", tipo: "COMPRA", baseImponible: 720000, alicuota: 21, montoIva: 151200, periodo: "2026-03" },
  })
  void fp4
  console.log("✅ 4 facturas de proveedores creadas (2 por cuenta de fletero)")

  // ── Pago 1: FP1 (YPF, $338,800 TRANSFERENCIA desde Banco Galicia CC) ────────
  await prisma.pagoProveedor.create({
    data: {
      facturaProveedorId: fp1.id,
      fecha: dias(-55),
      monto: 338800,
      tipo: "TRANSFERENCIA",
      cuentaId: cuentaGaliciaCC.id,
      operadorId: anaGarcia.id,
    },
  })
  await prisma.movimientoSinFactura.create({
    data: {
      cuentaId: cuentaGaliciaCC.id,
      tipo: "EGRESO",
      categoria: "TRANSFERENCIA_ENVIADA",
      monto: 338800,
      fecha: dias(-55),
      descripcion: "Pago factura YPF 0001-00000001",
      operadorId: anaGarcia.id,
    },
  })

  // ── Pago 2: FP3 (Taller Mecánico, $85,000 TRANSFERENCIA desde Banco Galicia CC) ─
  await prisma.pagoProveedor.create({
    data: {
      facturaProveedorId: fp3.id,
      fecha: dias(-25),
      monto: 85000,
      tipo: "TRANSFERENCIA",
      cuentaId: cuentaGaliciaCC.id,
      operadorId: anaGarcia.id,
    },
  })
  await prisma.movimientoSinFactura.create({
    data: {
      cuentaId: cuentaGaliciaCC.id,
      tipo: "EGRESO",
      categoria: "TRANSFERENCIA_ENVIADA",
      monto: 85000,
      fecha: dias(-25),
      descripcion: "Pago factura Taller Mecánico (por cuenta Fletero Fernández)",
      operadorId: anaGarcia.id,
    },
  })
  console.log("✅ 2 pagos a proveedores creados")

  // ── Pago 3: Cheque recibido de Cereales del Norte por Factura 1 ─────────────
  const chequeFactura1 = await prisma.chequeRecibido.create({
    data: {
      empresaId: empCereales.id,
      facturaId: fact1.id,
      nroCheque: "00012345",
      bancoEmisor: "Banco Santander",
      monto: 266200,
      fechaEmision: dias(-40),
      fechaCobro: dias(-10),
      estado: "EN_CARTERA",
      esElectronico: false,
      operadorId: anaGarcia.id,
    },
  })
  void chequeFactura1
  console.log("✅ Cheque recibido de Cereales del Norte (Factura 1) creado")

  // ── Cheques emitidos (2) ────────────────────────────────────────────────────
  await prisma.chequeEmitido.create({
    data: {
      fleteroId: flPérez.id,
      cuentaId: cuentaGaliciaCC.id,
      nroCheque: "00000001",
      tipoDocBeneficiario: "CUIT",
      nroDocBeneficiario: "20234567890",
      mailBeneficiario: "transportes.perez@fletero.com",
      monto: 180000,
      fechaEmision: dias(-20),
      fechaPago: dias(10),
      motivoPago: "ORDEN_DE_PAGO",
      clausula: "A_LA_ORDEN",
      esElectronico: true,
      estado: "EMITIDO",
      operadorId: anaGarcia.id,
    },
  })
  await prisma.chequeEmitido.create({
    data: {
      proveedorId: provYpf.id,
      cuentaId: cuentaMacroCC.id,
      nroCheque: "00000001",
      tipoDocBeneficiario: "CUIT",
      nroDocBeneficiario: "30546678190",
      monto: 95000,
      fechaEmision: dias(-5),
      fechaPago: dias(25),
      motivoPago: "FACTURA",
      clausula: "A_LA_ORDEN",
      esElectronico: true,
      estado: "PENDIENTE_EMISION",
      operadorId: anaGarcia.id,
    },
  })
  console.log("✅ 2 cheques emitidos de prueba creados")

  // ── Movimientos sin factura (3) ────────────────────────────────────────────
  await prisma.movimientoSinFactura.createMany({
    data: [
      {
        cuentaId: cuentaGaliciaCC.id,
        tipo: "INGRESO",
        categoria: "TRANSFERENCIA_RECIBIDA",
        monto: 500000,
        fecha: dias(-50),
        descripcion: "Adelanto de Granos del Sur por viajes futuros",
        referencia: "ADV-GS-001",
        operadorId: anaGarcia.id,
      },
      {
        cuentaId: cuentaGaliciaCC.id,
        tipo: "EGRESO",
        categoria: "MANTENIMIENTO_CUENTA",
        monto: 12500,
        fecha: dias(-35),
        descripcion: "Comisión mantenimiento cuenta corriente marzo",
        operadorId: anaGarcia.id,
      },
      {
        cuentaId: cuentaMPDigital.id,
        tipo: "INGRESO",
        categoria: "TRANSFERENCIA_RECIBIDA",
        monto: 200000,
        fecha: dias(-20),
        descripcion: "Pago anticipado Transportes Unidos",
        referencia: "ADV-TU-001",
        operadorId: anaGarcia.id,
      },
    ],
  })
  console.log("✅ 3 movimientos sin factura creados")
  console.log("\n✅ Datos de prueba adicionales cargados exitosamente.")
  console.log("  4 empresas | 5 fleteros | 15 viajes | 4 LPs | 2 facturas emitidas | 4 facturas proveedor | 2 GastoFletero | 3 movimientos")

  // ── ConfiguracionArca singleton ────────────────────────────────────────────
  await prisma.configuracionArca.upsert({
    where: { id: "unico" },
    update: {},
    create: {
      id: "unico",
      cuit: "30709381683",
      razonSocial: "TRANSMAGG S.R.L.",
      modo: "homologacion",
      puntosVenta: JSON.stringify({
        "1": "FACTURA_A",
        "2": "FACTURA_B",
        "3": "FACTURA_C",
        "4": "NOTA_CREDITO_A",
        "5": "NOTA_CREDITO_B",
        "6": "NOTA_DEBITO_A",
        "7": "NOTA_DEBITO_B",
        "8": "LIQ_PROD",
        "9": "RECIBO",
        "10": "ORDEN_PAGO",
      }),
      modalidadMiPymes: "SCA",
      activa: false,
    },
  })
  console.log("✅ ConfiguracionArca singleton creada/actualizada")

  console.log("\n🎉 Seed completado exitosamente.")
  console.log("\nUsuarios de prueba:")
  console.log("  admin@transmagg.com.ar            → ADMIN_TRANSMAGG")
  console.log("  operador@transmagg.com.ar         → OPERADOR_TRANSMAGG")
  console.log("  juan.perez@fletero.com            → FLETERO")
  console.log("  garcia.cargas@fletero.com         → FLETERO")
  console.log("  admin@alimentosdelsur.com.ar      → ADMIN_EMPRESA")
  console.log("  chofer.rodriguez@transmagg.com.ar → CHOFER")
  console.log("  chofer.fernandez@transmagg.com.ar → CHOFER")
  console.log("\nResumen financiero seed:")
  console.log(`  Cuentas creadas: 8`)
  console.log(`  Brokers creados: 2`)
  console.log(`  FCI creados: 4`)
  console.log(`  Movimientos FCI creados: 3`)
  console.log(`  Saldos FCI creados: 3`)
  console.log(`  Cheques recibidos creados: 3`)
  console.log(`  Cheques emitidos creados: 3`)
  console.log(`  Tarjetas prepagas creadas: 2`)
  console.log(`  Gastos prepaga creados: 5`)
  console.log(`  Adelantos creados: 2`)

  void fondoGaliciaUsd
  void viaje2
  void chequeEmitidoPlanilla2
  void chequeRecibidoCartera
  void adelantoPendiente
  void adminTransmagg
  void cuentaBrubank
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
