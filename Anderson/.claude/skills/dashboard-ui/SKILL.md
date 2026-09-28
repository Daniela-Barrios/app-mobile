---
name: dashboard-ui
description: Construye las pantallas del dashboard (KPIs, actividad reciente, usuarios, accesos, biometría, zonas y cámaras). Úsala al trabajar en el frontend.
---

# Dashboard UI

## Alcance real (corrección importante)
**Los tokens se generan en otra aplicación.** Este dashboard es de **monitoreo y administración de personas/accesos**, no de emisión de tokens. No existe pantalla de "Tokens" ni acción de "generar token": el uso de tokens se observa dentro de **Accesos** y del detalle de cada usuario. El grupo de nav "Monitoreo" (Eventos/Auditoría, Vigilante virtual) está **oculto** por ahora (sus rutas siguen vivas en `main.tsx`, solo no aparecen en el Sidebar).

## Pantallas / módulos vigentes
1. **Resumen (home):** KPIs calculados de datos reales del mock — usuarios activos, tokens activos, biometrías registradas, eventos totales. Actividad reciente cronológica y accesos por zona.
2. **Usuarios:** listado con avatar, nombre, documento, empresa, estado, biometría; buscador por nombre/documento. Cada fila lleva al **detalle del usuario** (`/usuarios/:userId`): ficha con foto/avatar, datos personales (documento, empresa, teléfono, estado, biometría), contadores de accesos autorizados/rechazados, **últimos accesos** (uso de token por zona) y **acciones y trazas** (eventos relacionados a ese usuario o a sus tokens). Esta vista replica el patrón "expediente" que pidió el usuario (ficha + historial), no un formulario de alta.
3. **Accesos** (antes "Registros de acceso" — renombrado): historial de accesos con **filtros por zona y por usuario**; muestra token usado y resultado (autorizado/rechazado + motivo). Registros inmutables. Es aquí donde se ve la actividad/uso de tokens, ya que no hay módulo de Tokens aparte.
4. **Zonas:** Entrada, Bodega, Oficina (nombres fijos acordados con el usuario).
5. **Cámaras:** vista con **pestañas por zona**; cada pestaña lista las cámaras de esa zona (nombre, estado conectada/conectando/desconectada/error, última señal).
6. **Biometría:** placeholder (pendiente de construir).
7. **Fase A / Configuración:** placeholders.
8. **Eventos / Auditoría y Vigilante virtual:** implementados pero ocultos del Sidebar (ver arriba).

## Arquitectura de datos ya implementada (web/src)
- `types.ts`: tipos de dominio, uno a uno con las colecciones del mock (incluye `company`/`phone` en `User` para la ficha personal).
- `lib/apiClient.ts`: único cliente HTTP hacia `/api` (proxy de Vite al mock-api).
- `repositories/`: un repositorio por colección, CRUD puro contra json-server, sin reglas de negocio. Ningún repositorio hace `DELETE`.
- `services/tokenService.ts`: reglas de token documentadas (único activo global por usuario, invalidación por validación biométrica, sin TTL) — **ya no se invoca desde la UI** (los tokens no se generan aquí); se conserva como referencia y para que el seed las respete. No lo borres sin revisar `docs/PLAN.md` y el skill `token-rules`.
- `hooks/useAsync.ts`: hook genérico de carga (loading/error/reload) que usan todas las páginas para traer datos reales.
- `components/Avatar.tsx`: iniciales sobre fondo `brand-50`, usado en listados y fichas de usuario.
- `pages/`: una página por módulo; enrutadas con `react-router-dom` desde `main.tsx`, dentro de `Layout.tsx` (Sidebar + Topbar + `<Outlet/>`). Los módulos sin vista real usan `PlaceholderPage`.
- Nuevos módulos de negocio deben seguir el mismo patrón: repositorio → (servicio si hay reglas) → página con `useAsync`.

## Reglas
- Los datos vienen del mock a través de repositorios (nunca hardcodeados en componentes ni escritos directo al mock); estados de carga, vacío y error en cada vista.
- Toda acción "eliminar" es baja lógica (`deletedAt`) con confirmación; las listas ocultan lo eliminado por defecto con un toggle "mostrar eliminados".
- No agregar de vuelta una acción de "generar/validar/revocar token" a la UI sin que el usuario lo pida explícitamente — es responsabilidad de otra aplicación.
- **Stack de UI:** Vite + React + Tailwind, sin librerías de componentes (cero Material UI/Bootstrap/Ant). Construir un catálogo propio de componentes base con Tailwind (botones, tablas, badges, pestañas, etc.) reutilizado por todos los módulos.
- Filtros (zona, usuario, búsqueda) se aplican sobre los datos ya cargados del repositorio; si el dataset crece mucho, mover el filtro al repositorio (query params de json-server).
- Etiqueta visible "Simulado" donde el origen sea mock (campo `source`).
- UI en español; accesible (contraste, teclado); responsive básico.
- Para gráficos, aplicar el skill `dataviz` si está disponible.
- Verificar visualmente en el navegador (idealmente contra Docker, no solo `npm run dev` suelto) antes de dar una pantalla por terminada.
