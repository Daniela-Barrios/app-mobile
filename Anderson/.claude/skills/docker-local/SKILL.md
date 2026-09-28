---
name: docker-local
description: Diseña y mantiene la infraestructura local con Docker Compose (frontend + mock-api ligero). Úsala al crear o modificar contenedores, puertos, volúmenes o el arranque del proyecto.
---

# Infraestructura local con Docker

Regla: **nada corre fuera de Docker** y **nada se despliega**. Un solo comando: `docker compose up`. Sin base de datos relacional: esto es una maqueta de frontend con un mock ligero.

## Contenedores propuestos
| Servicio | Rol | Notas |
|---|---|---|
| `web` | Frontend (SPA), hot reload | Único servicio de UI; expone puerto local |
| `mock-api` | API REST mock (tipo json-server) sobre un archivo de datos | Da CRUD real a la UI; dataset en un volumen para persistir entre reinicios |
| `media` (opcional) | Fotos/avatares/recursos de cámaras de ejemplo | Puede resolverse como estáticos del propio `web`, sin contenedor aparte |

## Convenciones
- Configuración por `.env` (con `.env.example` versionado); nunca secretos reales.
- Una red interna; solo `web` y `mock-api` publican puertos en `localhost`.
- Volumen `mock_data` para el dataset del mock; comando de **reset** (`docker compose run --rm mock-api npm run seed:reset` o equivalente) para volver a la semilla.
- Cada servicio con `healthcheck`.
- Imágenes con versión fija (no `latest`).

## Verificación
Desde cero: `docker compose down -v && docker compose up --build` debe dejar el dashboard con datos mock sin pasos manuales.
