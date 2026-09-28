---
name: dashboard-ui
description: Construye las pantallas del dashboard (KPIs, actividad reciente, módulos de usuarios, tokens, accesos, eventos, biometría y vigilante virtual). Úsala al trabajar en el frontend.
---

# Dashboard UI

## Pantallas / módulos
Detalle completo del mapa de pantallas en `docs/PLAN.md` §3 (11 módulos). Resumen:
1. **Resumen (home):** tarjetas KPI — usuarios (total/activos/inactivos), ingresos del día, accesos por zona, tokens generados/activos/inválidos, biometrías registradas/pendientes, eventos del día, solicitudes atendidas por vigilante, estado del sistema. Gráfico de accesos por zona y **actividad reciente** cronológica.
2. **Usuarios:** listado con foto, nombre, identificación, estado, biometría; crear/editar/consultar/desactivar (**soft**); flujo de biometría simulada (subir foto → generar ID → asociar → guardar).
3. **Tokens:** listado con filtros por estado/zona/usuario; generar (bloqueado si el usuario ya tiene **cualquier** token activo, en cualquier zona — regla global, sin TTL), revocar manualmente, **simular validación biométrica**; historial de estados de cada token.
4. **Registros de acceso:** historial con buscar/filtrar (fecha, zona, usuario, resultado); detalle con la cadena Usuario → Foto → Token → Zona → Registro. Registros inmutables.
5. **Eventos:** visualizar y auditar (tipo, actor, entidad, fecha). Inmutable.
6. **Zonas y Cámaras:** CRUD de zonas; grilla de cámaras con flujo visual de "conectar" (desconectada → conectando → conectada/error) y vínculo de evidencia a un acceso.
7. **Vigilante virtual:** chat simulado, botones "Llamar vigilante" e "Iniciar videollamada" (solo UI, sin funcionalidad real).
8. **Placeholders Fase A** para el resto de integraciones (biométricos reales, portal de vigilancia real, control de puertas).

## Arquitectura de datos ya implementada (web/src)
- `types.ts`: tipos de dominio, uno a uno con las colecciones del mock.
- `lib/apiClient.ts`: único cliente HTTP hacia `/api` (proxy de Vite al mock-api).
- `repositories/`: un repositorio por colección, CRUD puro contra json-server, sin reglas de negocio. Ningún repositorio hace `DELETE`.
- `services/tokenService.ts`: las reglas de token (único activo global por usuario, invalidación por validación biométrica, revocación manual, sin TTL) viven aquí, no en las páginas ni en los repositorios.
- `hooks/useAsync.ts`: hook genérico de carga (loading/error/reload) que usan todas las páginas para traer datos reales.
- `pages/`: una página por módulo; enrutadas con `react-router-dom` desde `main.tsx`, dentro de `Layout.tsx` (Sidebar + Topbar + `<Outlet/>`). Los módulos sin vista real usan `PlaceholderPage`.
- Nuevos módulos de negocio (biometría, zonas, cámaras, etc.) deben seguir el mismo patrón: repositorio → servicio (si hay reglas) → página con `useAsync`.

## Reglas
- Los datos vienen del mock a través de repositorios/servicios (nunca hardcodeados en componentes ni escritos directo al mock); estados de carga, vacío y error en cada vista.
- Toda acción "eliminar" es baja lógica (`deletedAt`) con confirmación; las listas ocultan lo eliminado por defecto con un toggle "mostrar eliminados".
- Generar un token está bloqueado si el usuario ya tiene **cualquier** token `activo` en el sistema (regla global, no por zona); la acción de "validar" (no "usar") es la que invalida el token. Los tokens no caducan por tiempo (sin TTL).
- **Stack de UI:** Vite + React + Tailwind, sin librerías de componentes (cero Material UI/Bootstrap/Ant). Construir un catálogo propio de componentes base con Tailwind (botones, tablas, badges, modales, etc.) reutilizado por todos los módulos.
- Paginación y filtros aplicados sobre los datos del repositorio, no recalculados a mano en cada componente.
- Etiqueta visible "Simulado" donde el origen sea mock (campo `source`).
- UI en español; accesible (contraste, teclado); responsive básico.
- Para gráficos, aplicar el skill `dataviz` si está disponible.
- Verificar visualmente en el navegador antes de dar una pantalla por terminada.
