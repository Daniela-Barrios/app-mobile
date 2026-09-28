# Sistema de diseño — Dashboard Control de Acceso

Extraído de las capturas de referencia del "Vigilante Virtual" (mobile) compartidas por el usuario. **No es estricto**, pero se reutiliza la misma paleta y formas en todo el dashboard, adaptando el layout mobile-first a desktop (sidebar + contenido en vez de topbar+bottombar de una app de chat).

## Referencias
- `1.png`: pantalla de inicio del chat — topbar oscura, banner primario azul, grilla de tarjetas de acciones, bottom bar oscura con estado "En línea".
- `2.png`: formulario de registro — tarjeta blanca con inputs, botón primario ancho, zona de "foto rápida" con borde punteado.

## Paleta de color

| Token | Hex aprox. | Uso |
|---|---|---|
| `brand-600` | `#3355E0` | Color primario: banner "Hablar con el vigilante", botón "Guardar registro", enlaces, iconos activos |
| `brand-700` | `#2846B8` | Hover/active de botones primarios |
| `brand-50` | `#EEF2FF` | Fondos sutiles de estado activo, halos de foco |
| `ink-900` | `#0B0F19` | Topbar y bottom bar (casi negro-azulado), texto de máximo contraste |
| `ink-700` | `#374151` | Texto secundario oscuro (subtítulos de tarjetas) |
| `surface` | `#FFFFFF` | Fondo de tarjetas y formularios |
| `surface-muted` | `#F4F5F8` | Fondo de página (detrás de las tarjetas) |
| `border` | `#E5E7EB` | Bordes de tarjetas e inputs |
| `text-muted` | `#6B7280` | Texto de apoyo (descripciones cortas bajo cada acción) |
| `success-500` | `#22C55E` | Punto de estado "En línea" / operativo |

Estas se declaran como tokens de Tailwind (`@theme` en `index.css`), no como colores sueltos: cualquier componente los referencia por nombre (`bg-brand-600`, `text-ink-900`, etc.), nunca por hex directo.

## Formas y espaciado
- **Radios:** tarjetas y contenedores grandes `rounded-2xl` (16px); botones e inputs `rounded-xl`/`rounded-lg` (10–12px); chips de icono cuadrados `rounded-xl`; el punto de estado es circular (`rounded-full`).
- **Bordes:** 1px `border-border` en tarjetas sobre fondo `surface-muted`; los inputs llevan el mismo borde y cambian a `brand-600` en foco.
- **Sombra:** muy sutil (`shadow-sm`), casi imperceptible — el contraste lo da el borde, no la sombra.
- **Densidad:** tarjetas de acción en grilla 2 columnas en mobile (icono + título + descripción corta); en desktop pasan a grilla de 3–4 columnas o a tarjetas KPI en fila, manteniendo el mismo componente base.
- **Iconos:** estilo outline (trazo, no relleno), color `brand-600` sobre fondo blanco o `brand-50`, dentro de un chip cuadrado redondeado.
- **Botón primario:** ancho completo en mobile, azul sólido, texto blanco, `rounded-xl`, altura generosa (~48px) para uso táctil.
- **Input:** borde gris claro, `rounded-lg`, label en negrita pequeña encima (no flotante), placeholder gris.
- **Zona de carga (foto):** borde punteado `border-dashed border-brand-600/40`, fondo `surface`, icono + texto centrados.

## Layout definitivo: sidebar de navegación (corrección tras primera revisión)
La primera iteración calcó demasiado literal la maqueta de chat mobile (topbar + banner + grilla de acciones) y no se sentía "empresarial". Se corrige a un layout de dashboard SaaS estándar:

- **Sidebar fija a la izquierda** (`ink-900`, 256px en desktop): logo, navegación agrupada en 4 secciones (General / Administración / Monitoreo / Sistema) con los 11 módulos del plan, item activo resaltado en `brand-600` sólido. En mobile se oculta y se abre como panel off-canvas con overlay, activado desde el botón de menú de la topbar.
- **Topbar clara** (`surface`, borde inferior `border`): título de la página + subtítulo de contexto, notificaciones, chip de usuario/admin. Reemplaza el banner "Hablar con el vigilante" como elemento dominante — el vigilante pasa a ser un módulo más del sidebar, no el foco de la pantalla de inicio.
- **Contenido:** KPIs en tarjetas compactas y neutras (borde sutil, sin sombra fuerte, icono pequeño en chip `brand-50`), no tarjetas grandes coloridas. Bloques de contenido (actividad reciente, accesos por zona) en tarjetas `rounded-xl` con encabezado propio, más discretas que en la v1.
- **Color:** el azul de marca se reserva para el ítem de navegación activo, iconos de acento y botones primarios — ya no dominan bloques completos de la pantalla. El resto es escala de grises/neutros (`surface`, `surface-muted`, `border`, `text-muted`) para una lectura más "empresarial" y menos "app de mensajería".
- **Iconos:** SVG propios (trazo 1.75, estilo outline consistente) en `web/src/components/icons.tsx` — nada de emojis ni librerías de iconos externas.

| | Mobile | Desktop |
|---|---|---|
| Navegación | Sidebar off-canvas (overlay) + topbar con botón de menú | Sidebar fija visible + topbar |
| Contenido | KPIs en grid 2 columnas, bloques apilados | KPIs en fila de 4, bloques en grid de 3 columnas (actividad 2/3, accesos por zona 1/3) |

El **mismo componente de tarjeta** (borde + `rounded-xl`) se reutiliza para KPIs, listas y formularios en todos los módulos, ajustando su contenido interno, no su forma.

## Tipografía
- Sans-serif del sistema (misma familia que ya usa el proyecto: `system-ui`).
- Títulos de tarjeta: bold, `ink-900`, tamaño compacto (~15–16px en mobile).
- Descripciones: `text-muted`, tamaño pequeño (~13px).
- Encabezados de página/módulo: bold, mayor tamaño, `ink-900`.

## Estado de esta guía
Base para el Hito 2 (sistema de diseño y navegación). Los tokens ya están declarados en `web/src/index.css` (`@theme`). Ajustable si el usuario aporta más referencias o corrige algún tono.
