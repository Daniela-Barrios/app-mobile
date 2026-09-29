# Dashboard Control de Acceso — Fase 0 (Maquetación Frontend)

Maqueta funcional del dashboard de un Sistema de Control de Acceso, **centrada en frontend de alta fidelidad**. Simula la operación con **datos ficticios**, pero su estructura debe quedar preparada para la Fase A (biométricos, cámaras, videoporteros, portal de vigilancia, control de puertas).

Contexto de trabajo: **todo el desarrollo de este entregable ocurre dentro de esta carpeta (`Anderson/`)**.

Requerimientos completos: @docs/requerimientos-fase0.md
Plan de acción vigente: @docs/PLAN.md

## Reglas no negociables
1. **Todo local, cero despliegues.** Nada de cloud, CI/CD de deploy ni servicios externos.
2. **Todo servicio corre en Docker** (`docker compose up`). No instalar backend/mock-api en el host.
3. **Prioridad frontend.** Mucho más trabajo de UI que de backend; el backend es solo un mock ligero (ver `docs/PLAN.md`).
4. **Este dashboard es de monitoreo y administración de personas/accesos, NO de emisión de tokens.** Los tokens se generan en la app móvil del kiosco (`Nicolas/vigilante-v`, ver skill `dashboard-ui` § "App móvil conectada"); aquí solo se **observan** — usuarios, zonas, cámaras, biometría y el historial de accesos (que incluye el uso de esos tokens) sí son administrables (crear/editar/consultar/dar de baja), pero no existe una pantalla para "generar token". Dashboard y app móvil son dos clientes independientes del mismo mock-api: nunca se llaman entre sí.
5. **Eliminar = siempre baja lógica (soft delete).** Ningún dato se borra físicamente en ninguna colección, nunca. Toda acción de "eliminar" en la UI marca `deletedAt`/inactivo y queda auditada; las listas la ocultan por defecto con opción de mostrarla.
6. **Un único token activo por usuario, GLOBAL en todo el sistema (no por zona), sin TTL.** Regla del sistema externo que emite los tokens; documentada aquí (skill `token-rules`) porque el mock la respeta al generar datos semilla y porque el dashboard debe entenderla para mostrar el estado correctamente, no porque la UI la ejecute.
7. **Trazabilidad total:** Usuario → Fotografía → Token → Zona → Registro de acceso. Ningún acceso puede quedar sin esa cadena. `tokenHistory`, `accessLogs` y `events` son inmutables (append-only).
8. **Cámaras simuladas "conectables"**, agrupadas por zona en una vista de pestañas. El resto de integraciones de Fase A (biométricos reales, portal de vigilancia real, control de puertas) son solo vistas básicas o placeholders en esta fase.
9. **Fase A sin reescritura:** integraciones futuras entran por interfaces/adaptadores (ver skill `fase-a-readiness`); la Fase 0 solo aporta implementaciones *mock*.
10. **Etapa de planificación = cero código.** Mientras no se apruebe `docs/PLAN.md`, solo se producen documentos (ver skill `plan-fase0`).

## Stack (confirmado)
**Vite + React + Tailwind CSS.** Cero librerías de componentes prefabricados (nada de Material UI, Bootstrap, Ant Design, etc.): todo componente visual se construye a mano con Tailwind. Mock local con la solución más ágil disponible (json-server u equivalente).

## Arquitectura de datos (mock)
- Sin base de datos relacional: un **mock ligero tipo json-server** en Docker (propuesta en `docs/PLAN.md`), con un archivo de datos en un volumen para persistir entre reinicios.
- Las reglas de negocio (token único por zona, invalidación por biometría, baja lógica, generación de eventos) viven en una **capa de servicios del frontend**, nunca en el mock en sí.
- La UI nunca llama al mock directamente: pasa por repositorios/servicios, para poder migrar a un backend real en Fase A sin tocar vistas.

## Estructura del repo
- `Anderson/`, `Nicolas/`, `Sebastian/`, `Willington/`: carpetas de cada desarrollador. Trabaja solo en la tuya salvo acuerdo; código compartido va en carpetas de proyecto en la raíz.
- `docs/`: requerimientos, plan, decisiones (ADR) y diccionario de datos.
- `.claude/skills/`: guías de trabajo por tema.

## Skills disponibles
| Skill | Cuándo usarla |
|---|---|
| `plan-fase0` | Plan de acción, hitos, casos borde. Sin código |
| `docker-local` | Contenedores, compose, redes, volúmenes |
| `data-model` | Esquema relacional y migraciones |
| `token-rules` | Ciclo de vida y reglas de tokens |
| `mock-data` | Seeds y generadores de datos ficticios |
| `dashboard-ui` | KPIs, módulos y pantallas |
| `fase-a-readiness` | Interfaces para hardware real |

## Flujo de trabajo
- Rama de trabajo actual: `feat/dashboard`. Ramas nuevas: `feat/…`, `fix/…`; commits pequeños en imperativo.
- Hitos (detalle en `docs/PLAN.md`): H1 Setup frontend + mock → H2 Sistema de diseño y navegación → H3 Dashboard resumen → H4 Usuarios y biometría → H5 Tokens, accesos y trazabilidad → H6 Zonas, eventos y configuración → H7 Cámaras → H8 Vigilante y placeholders Fase A → H9 Pulido y demo.
- Idioma: documentación y UI en español; identificadores de código en inglés (`camelCase` en el mock JSON).
- Antes de dar algo por hecho: levantar con `docker compose up` desde cero y verificar en el navegador.

## Fuera de alcance (Fase 0)
Hardware real, chat/llamada/video reales, apertura real de puertas, autenticación productiva, cualquier despliegue, y cualquier borrado físico de datos.
