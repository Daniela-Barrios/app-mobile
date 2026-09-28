---
name: plan-fase0
description: Produce o actualiza el Plan de Acción Técnico de la Fase 0 (arquitectura Docker, modelo de datos, hitos, casos borde) sin escribir código. Úsala al planificar, replanificar o revisar alcance.
---

# Plan de Acción Técnico — Fase 0

Actúa como Tech Lead / Arquitecto. **Prohibido escribir código** (ni SQL, ni compose, ni snippets) en esta etapa; solo diagramas en texto/Mermaid, tablas y listas.

## Insumos
Lee `docs/requerimientos-fase0.md` y `CLAUDE.md`.

## Entregable: `docs/PLAN.md` con estas secciones
1. **Arquitectura Docker:** contenedores (db, api, web, opcional adminer/seed), puertos, volúmenes, red, dependencias de arranque. Ver skill `docker-local`.
2. **Modelo de datos:** entidades, atributos clave, relaciones y cardinalidades. Ver skill `data-model`.
3. **Hitos secuenciales:** cada uno con objetivo, tareas, criterio de aceptación (DoD) y dependencias.
   - H1 Docker + DB · H2 Modelo + Mock · H3 API · H4 UI Dashboard · H5 Simulaciones · H6 Fase A readiness + demo.
4. **Casos borde y vacíos:** información faltante en las notas y cuellos de botella técnicos.
5. **Preguntas abiertas** para el equipo, con propuesta por defecto.

## Casos borde mínimos a analizar
- Estados cronológicos del token: historial de transiciones (tabla de eventos de estado), no solo el estado actual.
- Token vencido: ¿existe TTL? ¿quién lo marca (job) y cómo se simula el tiempo?
- "Un token por zona": ¿por usuario y zona a la vez activo? ¿o único global por zona?
- Uso concurrente/doble del mismo token (idempotencia y bloqueo).
- Acceso rechazado: ¿genera registro? ¿con qué token/foto?
- Cambio de foto o desactivación de usuario: qué pasa con tokens activos y con la trazabilidad histórica (snapshot de foto en el acceso).
- Biometría pendiente vs registrada; re-enrolamiento.
- Zonas: jerarquía, horarios, aforo; dispositivos por zona (puertas, cámaras) para Fase A.
- Zona horaria y "eventos del día"; volumen de eventos y paginación.
- Auditoría: quién administró qué (actor en eventos); roles de administrador.
- Almacenamiento de fotos (volumen Docker vs BD).

## Reglas
- Toda decisión relevante se registra en `docs/adr/NNN-titulo.md`.
- Marca claramente supuestos vs. requerimientos confirmados.
- Termina pidiendo aprobación del plan antes de pasar a implementación.
