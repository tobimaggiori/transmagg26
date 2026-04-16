# Viajes

Entidad central. Cada viaje participa en dos circuitos económicos
independientes: facturación a empresa y liquidación al fletero.

## Modelo

`Viaje` en `prisma/schema.prisma` (line ~333).

```
Viaje {
  id
  fleteroId               // null si es camión propio
  esCamionPropio
  camionId, choferId, empresaId, operadorId
  fechaViaje
  remito, remitoS3Key, tieneCupo, cupo, mercaderia
  procedencia, provinciaOrigen, destino, provinciaDestino, kilos
  tarifa                  // tarifa al fletero (legacy `tarifa_fletero`)
  tarifaEmpresa           // tarifa cobrada a empresa
  comisionPct
  estadoLiquidacion       // flag: PENDIENTE_LIQUIDAR | LIQUIDADO
  estadoFactura           // flag: PENDIENTE_FACTURAR | FACTURADO
  tieneCpe, nroCartaPorte, cartaPorteS3Key
  historialCambios
}
```

## Doble tarifa, dos circuitos

Cada viaje guarda **dos importes**:

- `tarifa` (`tarifa_fletero`): lo que Transmagg paga al fletero.
- `tarifaEmpresa`: lo que Transmagg cobra a la empresa.

Las reglas de visibilidad por rol son críticas:

- `tarifa` **NUNCA** visible para roles empresa o chofer.
- `tarifaEmpresa` **NUNCA** visible para roles fletero o chofer.

Ver [arquitectura/auth-rbac.md](../arquitectura/auth-rbac.md).

Sistema viejo guardaba un solo campo y re-interpretaba según contexto, lo
cual generaba bugs. Ver `sistemaviejo/viajes.md` para el contexto histórico.

## Estado de cada circuito

`estadoLiquidacion` y `estadoFactura` son flags booleanos disfrazados:

| Flag | Valores |
|---|---|
| `estadoLiquidacion` | `PENDIENTE_LIQUIDAR`, `LIQUIDADO` |
| `estadoFactura` | `PENDIENTE_FACTURAR`, `FACTURADO` |

> ⚠️ La documentación legacy y los archivos de negocio originales describen
> estados derivados más finos (`LIQUIDADO_VIGENTE`, `LIQUIDADO_AJUSTADO_PARCIAL`,
> etc.). En la implementación actual son flags simples.
> Ver [INCONSISTENCIAS-DETECTADAS.md](../INCONSISTENCIAS-DETECTADAS.md).

## Vínculos

| Tabla | Significado |
|---|---|
| `ViajeEnLiquidacion` | Asociación viaje ↔ LP (con tarifa fletero snapshot, subtotal) |
| `ViajeEnFactura` | Asociación viaje ↔ factura emitida (con tarifa empresa snapshot) |
| `ViajeEnNotaCD` | Viaje afectado por una NC/ND (snapshot de tarifa original y corregida) |
| `FaltanteViaje` | Faltante de mercadería detectado en viaje |

Cada vínculo guarda **snapshot** de los importes al momento de la asociación,
no la referencia viva. Esto preserva la historia económica aunque cambie la
tarifa del viaje original.

## Carta de porte

Campos `tieneCpe`, `nroCartaPorte`, `cartaPorteS3Key`. El PDF se sube a R2
con prefijo `cartas-de-porte`. Para viajes que la requieren, es información
fiscalmente relevante.

## Cupo

Un viaje puede pertenecer a un **cupo** (acuerdo comercial con la empresa).
Viajes hermanos del mismo cupo comparten un set de campos lockeados
(mercadería, ruta, tarifa, fletero/camión/chofer) y solo varían en kilos,
remito, CDP y fecha. Detalle completo del flujo (lookup, validaciones,
edición en bloque, agrupamiento en PDFs) en [cupo.md](./cupo.md).

## Camión propio

Cuando `esCamionPropio = true`, `fleteroId = null`. El viaje no genera
liquidación a fletero, pero sí puede generar factura a empresa. Ver
[facturacion.md](./facturacion.md).
