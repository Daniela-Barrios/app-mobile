---
name: dashboard-ui
description: Construye las pantallas del dashboard (KPIs, actividad reciente, usuarios, accesos, biometría, zonas y cámaras). Úsala al trabajar en el frontend.
---

# Dashboard UI

## Alcance real (corrección importante)
**Los tokens se generan en otra aplicación.** Este dashboard es de **monitoreo y administración de personas/accesos**, no de emisión de tokens. No existe pantalla de "Tokens" ni acción de "generar token": el uso de tokens se observa dentro de **Accesos** y del detalle de cada usuario. El grupo de nav "Monitoreo" (Eventos/Auditoría, Vigilante virtual) está **oculto** por ahora (sus rutas siguen vivas en `main.tsx`, solo no aparecen en el Sidebar).

## Pantallas / módulos vigentes
1. **Resumen (home):** KPIs calculados de datos reales del mock — usuarios activos, tokens activos, biometrías registradas, eventos totales. **Actividad reciente detallada** (basada en `accessLogs`, no en eventos crudos): nombre del usuario, hora, código de token y "Aprobado"/"No aprobado", cada fila enlaza a la ficha del usuario. Accesos por zona (gráfico de barras simple).
2. **Usuarios:** listado con avatar, nombre, documento, empresa, estado, biometría; buscador por nombre/documento. Cada fila lleva al **detalle del usuario** (`/usuarios/:userId`): ficha con foto/avatar, datos personales (documento, empresa, teléfono, estado, biometría), contadores de accesos autorizados/rechazados, **últimos accesos** (uso de token por zona) y **acciones y trazas** — lista legible (no `event.type` crudo) vía `lib/describeEvent.ts`: etiqueta humana + detalle (token/zona/actor) + punto de color por tono.
3. **Accesos** (antes "Registros de acceso" — renombrado): historial de accesos con **filtros por zona y por usuario**; muestra token usado y resultado (autorizado/rechazado + motivo). Registros inmutables. Es aquí donde se ve la actividad/uso de tokens, ya que no hay módulo de Tokens aparte.
4. **Zonas:** una **card por zona** (Entrada, Bodega, Oficina) con etiqueta "N usuarios en zona". Click navega a `/zonas/:zoneId` (`ZoneDetailPage`): lista de usuarios presentes (hora de entrada + tiempo transcurrido vía `lib/time.ts#elapsedSince`), y dos reportes del día — **entradas de hoy** y **salieron hoy**. "Presente" y "salió" son heurísticas de monitoreo basadas en el último acceso de cada usuario (`usersPresentInZone` en `ZonesPage.tsx`, reutilizada por `ZoneDetailPage`): presente = último acceso autorizado en esa zona; salió = tuvo un acceso autorizado hoy en esa zona pero su acceso más reciente ya es en otra. No hay evento de salida explícito todavía.
5. **Cámaras:** vista con **pestañas por zona**; cada pestaña lista las cámaras de esa zona (nombre, estado conectada/conectando/desconectada/error, última señal).
6. **Biometría:** listado de usuarios con tipo (huella/facial), estado, calidad y bloqueo activo. Cada uno abre su **detalle biométrico** (`/biometria/:userId`): datos biométricos comunes (tipo, ID, calidad de la muestra, dispositivo de enrolamiento) y **bloqueo de acceso** — general (`blockedGlobally`) o por zonas puntuales (`blockedZoneIds`, checkboxes + "Aplicar"). Ver `services/biometricService.ts`.
7. **Fase A / Configuración:** placeholders.
8. **Eventos / Auditoría y Vigilante virtual:** implementados pero ocultos del Sidebar (ver arriba).

## Arquitectura de datos ya implementada (web/src)
- `types.ts`: tipos de dominio, uno a uno con las colecciones del mock (incluye `company`/`phone` en `User`; `biometricType`/`qualityScore`/`device`/`blockedGlobally`/`blockedZoneIds` en `Biometric`).
- `lib/apiClient.ts`: único cliente HTTP hacia `/api` (proxy de Vite al mock-api).
- `lib/describeEvent.ts`: traduce un `SystemEvent` crudo a `{ label, detail, tone }` legible (usa `zones`/`tokens` para resolver nombres). Reutilizado por Resumen y la ficha de usuario; cualquier vista nueva que muestre eventos debe usarlo en vez de imprimir `event.type`.
- `repositories/`: un repositorio por colección, CRUD puro contra json-server, sin reglas de negocio. Ningún repositorio hace `DELETE`.
- `services/tokenService.ts`: reglas de token documentadas (único activo global por usuario, invalidación por validación biométrica, sin TTL) — **ya no se invoca desde la UI** (los tokens no se generan aquí); se conserva como referencia y para que el seed las respete.
- `services/biometricService.ts`: bloqueo/desbloqueo general y por zona de la biometría de un usuario; cada acción deja un `event`.
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
