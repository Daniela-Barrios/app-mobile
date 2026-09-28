---
name: fase-a-readiness
description: Mantiene la arquitectura lista para integrar hardware real (biométricos, cámaras, portal de vigilancia, puertas) mediante puertos/adaptadores. Úsala al definir servicios, APIs o eventos que tocan dispositivos.
---

# Preparación para Fase A

Objetivo: pasar de mock a real **sin tocar dominio ni UI**, solo reemplazando adaptadores.

## Puertos (interfaces) y adaptadores
| Puerto | Operaciones | Fase 0 (mock) | Fase A (real) |
|---|---|---|---|
| `BiometricPort` | register, verify, identify | genera ID simulado | lector biométrico |
| `CameraPort` | linkAccess, linkEvidence, linkVideo | referencia ficticia | cámaras/NVR |
| `GuardPortalPort` | chat, call, videoCall | respuestas de guion | portal de vigilancia |
| `DoorControlPort` | open, close, block, authorize | registra la orden | controlador de puertas |

## Reglas
- El dominio depende de los puertos; los adaptadores se eligen por configuración (`ADAPTER_*=mock|real`).
- Los dispositivos entran como eventos con contrato estable (`type`, `device_id`, `zone_id`, `occurred_at`, `payload`); el mock los emite igual que el hardware.
- El esquema ya incluye `devices`, `source`, `device_id`, `evidence_ref`; no agregar columnas ad hoc para Fase A.
- Toda orden a una puerta genera un evento auditable.
- Documentar los contratos en `docs/fase-a-contracts.md`.
- No implementar integraciones reales en Fase 0: solo interfaces + mocks.
