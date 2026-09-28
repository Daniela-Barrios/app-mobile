# Plan de Acción Técnico — Fase 0 (Maquetación Frontend)

> Alcance de trabajo: exclusivamente `Anderson/`. **Cero código en esta etapa**: este documento es solo arquitectura y plan. Requerimientos de origen: `docs/requerimientos-fase0.md`.

## 0. Cambio de enfoque (resumen)
| Antes | Ahora |
|---|---|
| Backend + DB relacional como eje | **Frontend de alta fidelidad** como eje |
| Postgres + API propia | **API mock ligera** (json-server) o persistencia local |
| Todos los módulos de Fase A "preparados" | Solo **cámaras "conectables"** (simulado); resto = vistas básicas / placeholders |

Se mantiene: todo local, cero despliegues, servicios en Docker, **todo administrable**, trazabilidad Usuario → Foto → Token → Zona → Registro, y estructura lista para Fase A.

## Decisiones confirmadas (2026-09-28, con corrección posterior del Tech Lead)
1. **Eliminar = siempre baja lógica (soft delete).** Ningún dato se borra físicamente en ninguna colección (usuarios, tokens, zonas, cámaras, etc.). Todo registro tiene un campo `deletedAt`/`active` y las vistas filtran por defecto los dados de baja, con opción de mostrarlos.
2. **Un único token activo por usuario, GLOBAL en todo el sistema (no por zona) — corrección.** Un usuario no puede tener más de un token `activo` a la vez, sin importar la zona: si tiene un token activo para "Entrada Principal", no puede generarse (ni existir) otro para "Bodega" u otra zona hasta que el primero sea **utilizado** (validado por biométrico) o **revocado manualmente**. Se invalida al validarse contra el biométrico simulado, no por un "uso" genérico ni por vencimiento.
3. **Sin TTL / sin caducidad.** Los tokens no vencen por tiempo. Viven en estado `activo` indefinidamente hasta que se validan (biometría) o se invalidan manualmente. El estado `vencido` **se elimina del modelo**.
4. **Stack confirmado: Vite + React + Tailwind CSS, cero librerías de componentes prefabricados** (nada de Material UI, Bootstrap, Ant, etc.). Todo componente visual se construye a mano con Tailwind. Para el mock local, la solución más ágil disponible (json-server). Ver §6.

## 1. Arquitectura propuesta

### 1.1 Contenedores Docker (mínimos)
| Contenedor | Rol | Notas |
|---|---|---|
| `web` | Frontend (SPA) con hot reload | Único servicio de UI; puerto local |
| `mock-api` | API REST mock (json-server) sobre un archivo de datos | Da CRUD real a la UI; el archivo de datos vive en un volumen para persistir entre reinicios |
| `media` (opcional) | Servir fotos/avatares de ejemplo | Puede resolverse con archivos estáticos del propio `web` |

Sin DB, sin backend propio. Un solo comando levanta todo; existe un procedimiento de **reset del mock** (volver al dataset semilla).

### 1.2 Estrategia de mock (decisión pendiente, recomendación)
| Opción | Pros | Contras |
|---|---|---|
| **A. json-server en Docker (recomendada)** | CRUD REST real, filtros/paginación/búsqueda gratis, datos compartidos entre pestañas, cumple "servicios en Docker" | Sin reglas de negocio: se implementan en una capa de servicios del frontend |
| B. Persistencia local (localStorage/IndexedDB) | Cero contenedores extra | Datos atados al navegador; menos realista; límite de fotos |
| C. Híbrida | A como fuente, B para preferencias de UI | Dos mecanismos |

**Recomendación:** A. La UI accede a los datos solo a través de una **capa de acceso a datos** (repositorios/servicios), de modo que cambiar a un backend real en Fase A no toque las vistas.

Consecuencia clave: las reglas (un único token activo por usuario en todo el sistema, sin TTL, invalidación al validar biometría, historial de estados, generación de eventos, baja lógica) viven en la **capa de servicios del frontend**, y cada operación debe escribir de forma coherente varios recursos (token + historial + acceso + evento). Ninguna operación de "eliminar" hace `DELETE`: siempre es un `PATCH` que marca baja lógica.

### 1.3 Capas del frontend
1. **Vistas/páginas** (una por módulo).
2. **Componentes de diseño** (design system propio: tarjetas KPI, tablas, formularios, modales, badges de estado, timeline).
3. **Servicios de dominio** (reglas de tokens, accesos, biometría simulada, vigilante).
4. **Repositorios** (acceso a `mock-api`; interfaz estable).
5. **Adaptadores de dispositivos** (cámaras simuladas; puertos vacíos para el resto).

## 2. Modelo de datos (recursos del mock)
Mismo modelo lógico previsto, simplificado a colecciones JSON; relaciones por id.

| Colección | Campos clave | Relaciones |
|---|---|---|
| `users` | id, documentId, fullName, status (activo/inactivo), createdAt, **deletedAt** | 1—N photos, tokens, accessLogs |
| `photos` | id, userId, url, isCurrent, uploadedAt, **deletedAt** | N—1 user |
| `biometrics` | id, userId, photoId, biometricRef, status (pendiente/registrada/revocada), source, **deletedAt** | N—1 user, photo |
| `zones` | id, code, name, isRestricted, active, **deletedAt** | 1—N tokens, accessLogs, cameras |
| `tokens` | id, code (TK-###), userId, zoneId, status (activo/inválido — **sin `vencido`, sin `expiresAt`**), issuedAt, **validatedAt**, invalidatedReason, **deletedAt** | N—1 user, zone |
| `tokenHistory` | id, tokenId, from, to, at, actor, reason | N—1 token (solo se agrega, nunca se borra) |
| `accessLogs` | id, userId, zoneId, tokenId, photoId, result (autorizado/rechazado), denyReason, occurredAt, source, cameraId?, evidenceRef? | referencia toda la cadena de trazabilidad; **inmutable, nunca se borra** |
| `events` | id, type, severity, occurredAt, actor, entityType, entityId, payload, source | alimenta actividad reciente y auditoría; **inmutable** |
| `cameras` | id, zoneId, name, streamRef (ficticio), status (desconectada/conectando/conectada/error), lastSeenAt, **deletedAt** | N—1 zone |
| `guardRequests` / `guardMessages` | solicitud, canal (chat/voz/video), estado, mensajes, **deletedAt** | N—1 user, zone |
| `admins` | id, name, role, **deletedAt** | actor en auditoría |
| `systemStatus` | operativo, vigilanteDisponible | KPI de estado |

> **Regla transversal de borrado:** toda colección administrable lleva `deletedAt` (null = activo). "Eliminar" en la UI = `PATCH deletedAt=now()` + evento de auditoría con el actor; nunca `DELETE`. Las listas filtran `deletedAt IS NULL` por defecto, con un toggle "mostrar eliminados" en cada módulo administrable. `tokenHistory`, `accessLogs` y `events` son además append-only por diseño (no se editan ni se dan de baja: son el historial).

> **Regla transversal de token único activo (GLOBAL, corregida):** el estado `activo` de un token es único **por usuario, en todo el sistema**, sin importar la zona — se aplica como regla de la capa de servicios antes de crear un token nuevo (rechaza si el usuario ya tiene cualquier token `activo`, sea cual sea su zona). Ese token pasa a `inválido` exactamente en el momento de la **validación biométrica** (no antes, no por "uso" genérico y no por vencimiento — **no hay TTL**), registrando `validatedAt`, una entrada en `tokenHistory` (`activo → inválido`, motivo `biometric_validation`) y el `accessLog` correspondiente. También puede invalidarse por **revocación manual** de un administrador (motivo `manual_revocation`). Solo entonces el usuario puede recibir un nuevo token activo, para cualquier zona.

Reglas de integridad que la capa de servicios debe garantizar: todo acceso lleva user+photo+token+zone; la foto se guarda como la vigente **al momento** del acceso; usuarios se desactivan (baja lógica) y sus tokens activos se invalidan; historial de tokens y eventos son append-only.

> Nota sobre "eliminar" (regla de oro, confirmada): **toda eliminación en toda la maqueta es baja lógica con confirmación**, sin excepción — usuarios, tokens, zonas, cámaras, admins, solicitudes de vigilante. Nunca se borra un dato físicamente. `tokenHistory`, `accessLogs` y `events` ni siquiera se dan de baja: son inmutables.

## 3. Mapa de pantallas (alta fidelidad)
Navegación lateral + barra superior (estado del sistema, admin actual, tema claro/oscuro opcional).

| # | Módulo | Contenido | Administración |
|---|---|---|---|
| 1 | **Resumen** | KPIs (usuarios total/activos/inactivos, ingresos del día, accesos por zona, tokens generados/activos/inválidos, biometrías registradas/pendientes, eventos, solicitudes atendidas, estado operativo), gráfico por zona, actividad reciente | Accesos directos a acciones frecuentes |
| 2 | **Usuarios** | Tabla + detalle con foto, estado, biometría, tokens, accesos | Crear, editar, desactivar/eliminar (**soft**), subir foto |
| 3 | **Biometría (simulada)** | Asistente: subir foto → generar ID → asociar → guardar; contadores registradas/pendientes | Re-enrolar, revocar (**soft**) |
| 4 | **Tokens** | Tabla con filtros (estado, zona, usuario), detalle con línea de tiempo de estados | Generar (bloqueado si el usuario ya tiene **cualquier** token activo, sin importar la zona), revocar manualmente, **simular validación biométrica** (invalida el token). Sin caducidad/TTL |
| 5 | **Registros de acceso** | Historial, búsqueda, filtros, detalle con cadena de trazabilidad visual | Simular acceso vía validación biométrica; ver/exportar (registros inmutables) |
| 6 | **Eventos / Auditoría** | Lista filtrable por tipo, actor y fecha | Visualizar y auditar (inmutable) |
| 7 | **Zonas** | Listado y configuración de zonas | Crear, editar, activar/desactivar/eliminar (**soft**) |
| 8 | **Cámaras** | Grilla de cámaras por zona con estados; flujo de "conectar" simulado (buscar → conectando → conectada), vista en vivo simulada (video/imagen de ejemplo), asociación de evidencia a un acceso | Agregar, editar, conectar/desconectar, eliminar (**soft**) |
| 9 | **Vigilante virtual** | Chat simulado con respuestas guionadas, botones "Llamar vigilante" e "Iniciar videollamada" (solo UI), cola de solicitudes | Atender/cerrar solicitudes, eliminar (**soft**) |
| 10 | **Fase A (placeholders)** | Vistas básicas de Biométricos, Portal de vigilancia real, Control de puertas: tarjeta "Próximamente", estado, contrato esperado | Ninguna (solo informativo) |
| 11 | **Configuración** | Reset de datos mock, escenario de demo, semilla | Restablecer dataset |

Requisitos de fidelidad: estados de carga, vacío y error; confirmaciones en acciones destructivas; notificaciones (toast) de resultado; formularios con validación; tablas con paginación, orden y búsqueda; responsive básico; accesibilidad (contraste, teclado); etiqueta visible "Simulado" en datos de origen mock; textos en español.

## 4. Hitos (secuenciales)

### Hito 1 — Setup del frontend y mock de datos
- **Objetivo:** proyecto frontend corriendo en Docker con API mock funcional y dataset semilla.
- **Tareas:** definir stack frontend y librería de UI (decisión §6); contenedores `web` y `mock-api` con volumen de datos; estructura de carpetas por capas (§1.3); definición y documentación de colecciones (§2); dataset semilla coherente (~250 usuarios, ~180 biometrías registradas y ~5 pendientes, zonas, ~35 tokens activos, ~120 eventos del día, accesos y rechazos, cámaras); fotos ficticias; procedimiento de reset; guía de estilos/tokens de diseño.
- **Criterio de aceptación:** un comando levanta todo; la app carga y lista datos reales del mock; reset restablece el estado.
- **Dependencias:** ninguna.

### Hito 2 — Sistema de diseño, layout y navegación
- **Objetivo:** esqueleto de alta fidelidad reutilizable.
- **Tareas:** layout (sidebar, topbar, estado del sistema), componentes base (KPI, tabla, formularios, modales, badges de estado, timeline, toasts, estados vacío/carga/error), tema, rutas de los 11 módulos con páginas vacías, capa de repositorios y servicios.
- **Aceptación:** navegación completa; catálogo visual de componentes; consistencia entre pantallas.
- **Depende de:** H1.

### Hito 3 — Dashboard resumen
- **Objetivo:** pantalla principal con todos los KPIs de la demo.
- **Tareas:** tarjetas KPI, accesos por zona, actividad reciente cronológica, estado del sistema, eventos del día, solicitudes atendidas por vigilante; actualización tras cambios en otros módulos.
- **Aceptación:** cada KPI cuadra con los datos del mock; los KPIs reaccionan cuando se administran datos.
- **Depende de:** H2.

### Hito 4 — Administración de usuarios y biometría simulada
- **Tareas:** CRUD completo de usuarios (baja lógica con confirmación), detalle con foto y biometría, asistente de biometría (subir foto → generar ID → asociar → guardar), contadores registradas/pendientes, generación de eventos por cada acción.
- **Aceptación:** crear/editar/desactivar/eliminar refleja cambios en KPIs, eventos y actividad reciente.
- **Depende de:** H3.

### Hito 5 — Tokens, accesos y trazabilidad
- **Tareas:** generar tokens con la regla de **único token activo por usuario, global en todo el sistema** (bloquear generación si el usuario ya tiene cualquier token activo, sea cual sea su zona); revocar manualmente (soft, con motivo `manual_revocation`); simulador de **validación biométrica** que, al validar, invalida el token (`activo → inválido`, `validatedAt`, `tokenHistory` con motivo `biometric_validation`) y crea el `accessLog` correspondiente en la misma operación; sin TTL ni job de vencimiento; línea de tiempo de estados por token; historial de accesos con búsqueda y filtros; vista de cadena de trazabilidad; casos de rechazo (token ya inválido, zona incorrecta, usuario inactivo).
- **Aceptación:** validar un token contra el biométrico simulado lo invalida y genera registro + evento en la misma acción; mientras el usuario tenga cualquier token activo (en cualquier zona), no se le puede emitir otro; los escenarios de rechazo producen los registros y eventos esperados; todo acceso es rastreable de punta a punta.
- **Depende de:** H4.

### Hito 6 — Zonas, eventos/auditoría y configuración
- **Tareas:** CRUD de zonas; módulo de eventos con filtros y auditoría por actor; pantalla de configuración (reset, escenarios de demo).
- **Aceptación:** toda acción administrativa aparece en auditoría con actor.
- **Depende de:** H5.

### Hito 7 — Cámaras (conexión simulada)
- **Tareas:** grilla de cámaras por zona; flujo visual de conexión con estados (desconectada → conectando → conectada / error); vista en vivo simulada; vincular evidencia a un registro de acceso; CRUD de cámaras; eventos de conexión/desconexión.
- **Aceptación:** una cámara puede "conectarse" desde el dashboard y su estado se ve en resumen y auditoría; un acceso puede mostrar su evidencia simulada.
- **Depende de:** H6.

### Hito 8 — Vigilante virtual y placeholders Fase A
- **Tareas:** chat simulado con guion, botones de llamada y videollamada (solo UI), cola de solicitudes atendibles; vistas básicas/placeholders de Biométricos, Portal de vigilancia real y Control de puertas con contrato esperado.
- **Aceptación:** solicitudes atendidas alimentan el KPI; los placeholders son claros sobre qué llegará en Fase A.
- **Depende de:** H6 (paralelizable con H7).

### Hito 9 — Pulido, QA y demo
- **Tareas:** revisión visual completa, estados vacíos/error, accesibilidad y responsive, guion de demo con escenarios (acceso autorizado, rechazado, token invalidado, usuario nuevo con biometría pendiente, cámara conectándose, solicitud a vigilante), verificación desde cero (reset + levantar), documentación breve para defender el entregable.
- **Aceptación:** demo completa sin pasos manuales fuera del guion.
- **Depende de:** H7, H8.

## 5. Vacíos de información y cuellos de botella
**Falta definir**
- ¿Hay identidad visual, logo o paleta del cliente a respetar? (el usuario aportará capturas de referencia de color/forma; no es estricto, pero se busca reutilizar la misma paleta).
- ¿Se registra acceso rechazado? (propuesta: sí, con motivo).
- ¿Es obligatoria la biometría registrada para poder generar un token?
- ¿Qué pasa si intentan validar biométricamente un token que ya está inválido? (propuesta: se rechaza y genera `accessLog` `denied` con motivo `token_invalid`, sin tocar el token).
- Roles de administración (¿un único admin simulado?).
- Origen de las fotos de ejemplo y de los videos/imágenes de cámaras simuladas.
- Idioma y formato de fecha/hora/zona horaria.

**Cuellos de botella técnicos**
- json-server no aplica reglas de negocio ni transacciones: operaciones multi-recurso (validar token → actualizar token, historial, acceso, evento) pueden quedar inconsistentes si falla una escritura. Mitigar con una única función de servicio por operación y orden de escritura definido; documentar limitación.
- Concurrencia/doble validación de un token entre pestañas: solo mitigable comprobando estado antes de escribir; aceptable en maqueta.
- Estados cronológicos del token: obligatorio guardar historial de transiciones, no solo el estado actual.
- KPIs y agregados: json-server no agrega; calcular en la capa de servicios con cuidado de rendimiento (paginar listas, evitar traer todo).
- Fotos: almacenamiento (archivos estáticos vs base64 en el mock) y peso del dataset.
- Cámaras: sin video real; definir el recurso simulado (loop de video o imágenes) y su peso.
- Tiempo "del día": definir zona horaria y qué significa "eventos del día" con datos semilla.
- Persistencia del mock en volumen y reset seguro para no perder cambios por accidente.
- Deuda de migración a Fase A: mantener repositorios y adaptadores con interfaces estables.
- Sin librerías de componentes: mayor esfuerzo de construir a mano estados de foco/accesibilidad de cada control con Tailwind; mitigar con un catálogo de componentes base reutilizables desde el Hito 2.

## 6. Decisiones
| Decisión | Estado | Detalle |
|---|---|---|
| Eliminar (cualquier entidad) | **Confirmada** | Siempre baja lógica (`deletedAt`), nunca borrado físico; con confirmación en UI |
| Token único por usuario | **Confirmada (corregida)** | Único token `activo` **por usuario, global en todo el sistema** (no por zona); se invalida al validarse contra el biométrico simulado o por revocación manual |
| Caducidad de tokens | **Confirmada** | **Sin TTL.** Los tokens no vencen; viven `activo` hasta ser validados o revocados |
| Stack | **Confirmada** | **Vite + React + Tailwind CSS**, sin librerías de componentes (cero Material UI/Bootstrap/Ant/etc.); todo componente se construye a mano con Tailwind |
| Mock | Confirmada | json-server (u otra solución ágil equivalente) en Docker + capa de repositorios |
| Cámaras | Propuesta | Estados simulados con recurso de video/imágenes local |
| Identidad visual | Pendiente | El usuario compartirá capturas de referencia de colores y formas (guía, no estricta) |

## 7. Documentos a mantener alineados
Este plan reemplaza el enfoque Docker+Postgres+API de `CLAUDE.md` y de los skills `docker-local`, `data-model` y `plan-fase0`, y corrige la regla de tokens (global, sin TTL) en `token-rules`. Ambos ya están alineados a esta versión.

## 8. Siguiente paso
Plan aprobado. **Hito 1 en curso:** setup de Vite + React + Tailwind, `docker-compose.yml` con `web` + `mock-api`, dataset semilla inicial. Identidad visual (colores/formas) se incorpora en cuanto el usuario comparta las referencias.
