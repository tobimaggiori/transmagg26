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
    prisma.movimientoBancario.deleteMany(),
    prisma.saldoFci.deleteMany(),
    prisma.movimientoFci.deleteMany(),
    prisma.broker.deleteMany(),
    prisma.fci.deleteMany(),
    prisma.empleado.deleteMany(),
    prisma.pagoAProveedor.deleteMany(),
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

  await prisma.movimientoBancario.createMany({
    data: [
      {
        cuentaId: cuentaGaliciaPesos.id,
        tipo: "TRANSFERENCIA_RECIBIDA",
        monto: 350000,
        fecha: new Date("2026-03-21T09:00:00.000Z"),
        descripcion: "Cobro de empresa cliente",
        referencia: "TRX-0001",
        impuestoDebitoAplica: false,
        impuestoDebitoMonto: 0,
        impuestoCreditoAplica: true,
        impuestoCreditoMonto: 2100,
        otrosDescuentosMonto: 0,
        operadorId: operadorTransmagg.id,
      },
      {
        cuentaId: cuentaGaliciaPesos.id,
        tipo: "TRANSFERENCIA_ENVIADA",
        monto: -80000,
        fecha: new Date("2026-03-22T12:00:00.000Z"),
        descripcion: "Pago de proveedor urgente",
        referencia: "TRX-0002",
        impuestoDebitoAplica: true,
        impuestoDebitoMonto: 480,
        impuestoCreditoAplica: false,
        impuestoCreditoMonto: 0,
        otrosDescuentosDescripcion: "Comisión bancaria",
        otrosDescuentosMonto: 250,
        operadorId: operadorTransmagg.id,
      },
      {
        cuentaId: cuentaGaliciaPesos.id,
        tipo: "ENVIO_A_BROKER",
        monto: -200000,
        fecha: new Date("2026-03-24T15:00:00.000Z"),
        descripcion: "Envío de fondos a BALANZ",
        referencia: "BRK-0001",
        impuestoDebitoAplica: false,
        impuestoDebitoMonto: 0,
        impuestoCreditoAplica: false,
        impuestoCreditoMonto: 0,
        cuentaBrokerId: cuentaBalanz.id,
        operadorId: operadorTransmagg.id,
      },
      {
        cuentaId: cuentaGaliciaPesos.id,
        tipo: "RESCATE_DE_BROKER",
        monto: 50000,
        fecha: new Date("2026-03-28T13:30:00.000Z"),
        descripcion: "Rescate de fondos desde BALANZ",
        referencia: "BRK-0002",
        impuestoDebitoAplica: false,
        impuestoDebitoMonto: 0,
        impuestoCreditoAplica: false,
        impuestoCreditoMonto: 0,
        cuentaBrokerId: cuentaBalanz.id,
        operadorId: operadorTransmagg.id,
      },
      {
        cuentaId: cuentaMacroPesos.id,
        tipo: "PAGO_SUELDO",
        monto: -250000,
        fecha: new Date("2026-03-29T17:00:00.000Z"),
        descripcion: "Pago de sueldo mensual",
        referencia: "HAB-0326",
        impuestoDebitoAplica: false,
        impuestoDebitoMonto: 0,
        impuestoCreditoAplica: false,
        impuestoCreditoMonto: 0,
        empleadoId: empleadoPrueba.id,
        operadorId: operadorTransmagg.id,
      },
    ],
  })

  console.log("✅ Empleado y movimientos bancarios creados")

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
