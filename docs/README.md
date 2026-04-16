# Documentación Trans-Magg

Índice de toda la documentación del proyecto. Refactorizado en 2026-04 con
la regla "una sola fuente por concepto".

## Por dónde empezar

### Si sos nuevo en el proyecto
1. [README.md](../README.md) — setup, stack, estado.
2. [arquitectura/stack.md](./arquitectura/stack.md) — patrones obligatorios.
3. [politicas/htdp.md](./politicas/htdp.md) — receta de cómo escribir
   código nuevo.
4. [politicas/money.md](./politicas/money.md) — política monetaria
   obligatoria.

### Si vas a tocar código fiscal (facturación, NC/ND, ARCA)
1. [arca/matriz.md](./arca/matriz.md) — qué comprobantes se emiten (catálogo
   cerrado). **Prevalece sobre cualquier otra fuente**.
2. [reglas-fiscales/nc-nd-iva.md](./reglas-fiscales/nc-nd-iva.md) — IVA en
   NC/ND.
3. [arca/implementacion.md](./arca/implementacion.md) — config + UI +
   backend.
4. [arca/invariantes.md](./arca/invariantes.md) — tests obligatorios.

### Si vas a tocar dinero
1. [politicas/money.md](./politicas/money.md) — usar siempre `money.ts`,
   nunca aritmética cruda.

### Si vas a tocar saldos / cuenta corriente / OPs
1. [negocio/cuenta-corriente.md](./negocio/cuenta-corriente.md) — modelo
   unificado.
2. [negocio/ordenes-pago.md](./negocio/ordenes-pago.md) — flujo de creación,
   distribución, invariante.

### Si sos un agente IA
1. [../CLAUDE.md](../CLAUDE.md) — contrato operativo (lo principal).
2. Lo de arriba según la tarea.

## Mapa

```
docs/
├── README.md                    Este archivo
├── INCONSISTENCIAS-DETECTADAS.md  Pendientes a revisar
├── politicas/
│   ├── htdp.md                  Receta HTDP (única fuente)
│   ├── money.md                 Política monetaria (única fuente)
│   ├── tests.md                 Cuándo y cómo testear
│   └── invariantes.md           Reglas transversales que no se rompen
├── arquitectura/
│   ├── stack.md                 Tecnologías + patrones API/cliente
│   ├── auth-rbac.md             Roles y permisos
│   ├── pdfs.md                  pdfkit + pdf-merge + visor
│   └── storage-r2.md            R2: prefijos, helpers, signed URLs
├── arca/
│   ├── matriz.md                Catálogo cerrado de comprobantes (NORMATIVO)
│   ├── implementacion.md        Config + UI + backend + validaciones
│   ├── arquitectura.md          WSAA + WSFEv1 + idempotencia + hardening
│   └── invariantes.md           Reglas y tests ARCA
├── negocio/
│   ├── viajes.md                Ciclo de vida + doble tarifa
│   ├── facturacion.md           Empresa: emisión + NC/ND + recibos
│   ├── liquidacion.md           Fletero: emisión + NC/ND
│   ├── cuenta-corriente.md      Modelo unificado de saldoPendiente
│   ├── adelantos.md             Tipos + cheques + descuentos en OP
│   ├── ordenes-pago.md          OP: aplicaciones + medios + invariante
│   └── cheques.md               Cartera propia/tercero (esqueleto)
└── reglas-fiscales/
    └── nc-nd-iva.md             IVA en NC/ND (Manera 1 / Manera 2)
```

## Reglas de oro de la documentación

1. **Una sola fuente por concepto**. Si tenés que documentar algo que ya está
   en otro doc, linkeá — no copies.
2. **Doc al lado del código**. JSDoc encima de la función, archivo MD para
   conceptos transversales.
3. **Si el código cambia, la doc cambia**. Una doc desactualizada es peor
   que ninguna.
4. **Si encontrás algo desactualizado**, corregilo o agregalo a
   [INCONSISTENCIAS-DETECTADAS.md](./INCONSISTENCIAS-DETECTADAS.md).

## Sistema viejo

`sistemaviejo/` contiene documentación extraída del sistema VB6 anterior. Es
**contexto histórico**, no especificación vigente. Leerlo cuando:

- Necesitás entender el "por qué" detrás de una decisión heredada.
- Estás migrando un flujo y querés ver cómo lo hacía el sistema viejo.
- Ves un nombre o concepto raro y sospechás que viene del sistema viejo.

NO usar `sistemaviejo/` como fuente de verdad para implementar nuevo código.
