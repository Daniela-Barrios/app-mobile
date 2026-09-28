---
name: data-model
description: Define y evoluciona las colecciones del mock (usuarios, fotos, biometría, tokens, zonas, accesos, eventos, cámaras) con trazabilidad y baja lógica. Úsala al tocar colecciones o servicios de datos.
---

# Modelo de datos (colecciones del mock)

Sin base de datos relacional: colecciones JSON servidas por el mock, relacionadas por id. Detalle completo en `docs/PLAN.md` §2. Principios: trazabilidad completa, historial inmutable, **baja lógica siempre** (nunca `DELETE` físico).

## Colecciones
`users`, `photos`, `biometrics`, `zones`, `tokens`, `tokenHistory`, `accessLogs`, `events`, `cameras`, `guardRequests`/`guardMessages`, `admins`, `systemStatus`. Campos y relaciones: ver `docs/PLAN.md` §2.

## Reglas de integridad (aplicadas en la capa de servicios, no en el mock)
- Toda colección administrable lleva `deletedAt` (null = activo); "eliminar" en la UI = `PATCH deletedAt=now()` + evento de auditoría, nunca `DELETE`.
- `tokenHistory`, `accessLogs` y `events` son append-only: no se editan ni se dan de baja.
- `access_logs`/`accessLogs` referencia obligatoriamente user, zone, token y photo (la foto vigente **al momento** del acceso).
- Único token `activo` **por usuario, global en todo el sistema** (no por zona), sin TTL/`expiresAt` — ver skill `token-rules`.
- Timestamps en ISO 8601/UTC; la UI los presenta en hora local.
- `source` (`simulated`/`device`) presente en biometría, accesos y cámaras para distinguir mock de real.

## Entregables
- Diccionario de datos por colección en `docs/PLAN.md` (o `docs/data-model.md` si crece).
- Definición del dataset semilla junto con `mock-data`.
