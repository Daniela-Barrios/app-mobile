---
name: mock-data
description: Genera y mantiene los datos ficticios (usuarios, fotos, tokens, accesos, eventos) de forma coherente con el modelo y las reglas. Úsala al crear seeds, generadores o escenarios de demo.
---

# Datos simulados

## Principios
- El mock respeta **todas** las reglas reales (único token activo por usuario a nivel global —no por zona—, sin TTL, invalidación por biometría, baja lógica, trazabilidad). Se inserta por la misma capa de servicios cuando sea posible, no escribiendo directo al archivo del mock saltándose las reglas.
- Determinista (semilla fija configurable) e idempotente (re-ejecutar no duplica).
- `source: 'simulated'` en todo lo generado.
- Ningún registro semilla usa `deletedAt` salvo que el escenario de demo lo pida explícitamente (para probar el filtro "mostrar eliminados").
- Datos totalmente ficticios (nombres, documentos, fotos generadas o avatares); nada de personas reales.

## Volúmenes objetivo (ajustables)
~250 usuarios (≈230 activos, ≈20 inactivos), ~180 biometrías registradas y ~5 pendientes, 3+ zonas (Ingreso Principal, Lobby, Área Restringida), ~35 tokens activos (**máximo uno por usuario en todo el sistema**, no por zona), ~120 eventos "del día", accesos distribuidos por zona y hora, algunos rechazados, algunas cámaras en distintos estados de conexión.

## Escenarios de demo
Validación biométrica exitosa (token pasa a inválido y genera acceso autorizado), validación rechazada por token ya inválido, validación rechazada por zona incorrecta, token invalidado manualmente por admin, usuario nuevo con biometría pendiente, usuario dado de baja (soft) con tokens invalidados en cascada, cámara conectándose en vivo, solicitud a vigilante con chat de ejemplo, un registro de cada colección mostrado como "eliminado" (soft) para demostrar el filtro.

## Entregables
- Comando de seed (`docker compose run --rm mock-api npm run seed`) y de reset.
- Simulador opcional que emite eventos en vivo para que "Actividad reciente" se mueva durante la demo.
- Fotos y recursos de cámaras de ejemplo en el volumen del mock.
