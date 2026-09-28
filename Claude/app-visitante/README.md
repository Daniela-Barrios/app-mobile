# PGD Visitante — app móvil del visitante (Fase 0)

App para que el visitante se registre desde su propio teléfono antes de llegar a la portería, y
desde ahí hable con el vigilante. Es la Fase 0 del proyecto de 4 fases (ver el mensaje del canal /
el histórico de la conversación con Daniela): la app móvil primero; el dashboard de administración,
el control de cámaras y la conexión de todo el ecosistema quedan para las fases siguientes.

**Tecnología:** Expo (React Native + TypeScript) con Expo Router. Se eligió sobre una PWA porque los
ítems 2 y 3 de la Fase 0 (biométricos, reconocimiento facial) casi siempre necesitan acceso nativo a
cámara y sensores que un navegador no da igual. Con Expo Go se prueba en un teléfono real sin
instalar Android Studio ni Xcode — importante porque este equipo (el de Daniela) no tiene esas
herramientas.

## Qué hay hecho de la Fase 0

| # | Pedido | Estado |
|---|---|---|
| 1 | Registro normal + registro por cámara con foto | **Hecho** — `src/app/registro/` |
| 2 | Generación de tokens rotados cada 20 s | **Hecho** — `src/lib/token.ts`, se ve como QR y texto en `src/app/registro/confirmacion.tsx` |
| 3 | Reconocimiento de foto y registro con biométricos | **Parcial** — ver abajo |
| 4 | Todos los sliders de atención | **Hecho** (la UI) — `src/app/atencion/index.tsx`: chat / voz / video, como tarjetas deslizables |

### Sobre el ítem 3 (léelo antes de asumir que está listo)

Hay DOS cosas distintas mezcladas en ese punto, y solo la primera está hecha:

- **Confirmar con la huella o el rostro del teléfono** (`expo-local-authentication`): que quien se
  registra es el dueño del teléfono. **Hecho**, es el botón "🔒 Confirmar con huella o rostro" en el
  registro con cámara.
- **Reconocer la foto entre visitantes** (¿esta persona ya visitó antes?, comparar la foto nueva
  contra las guardadas): **no está hecho**. Necesita decidir con qué se compara — un servicio en la
  nube (AWS Rekognition, Azure Face, Google Vision) o un modelo en el propio teléfono — y todavía no
  hay ningún servidor propio de esta app donde guardar fotos de visitantes anteriores. Es la
  siguiente decisión pendiente, no una tarea de una sola línea.

## Qué falta, en general

- **No hay servidor todavía.** Todo lo que se registra queda en el teléfono (`AsyncStorage`), no en
  ningún backend. El token rotativo y los "sliders de atención" están listos para conectarse a un
  servidor cuando exista (mismo patrón que `vigilante-virtual/servidor` en el repo `pgd-kioskos`: un
  pase con token que vence, una señalización para las llamadas), pero hoy no hablan con nada.
- **Reconocimiento facial** (ver arriba): falta decidir el servicio y construirlo.
- **Solo probado en el navegador** (`npm run web`, ver abajo) por mí — no en un teléfono real: la
  cámara, el permiso de cámara del sistema y la huella/rostro del sistema solo se pueden probar de
  verdad en un teléfono. Necesito que alguien lo abra en Expo Go y confirme que funciona.

## Cómo probarlo

```bash
cd Claude/app-visitante
npm install
npm run start       # muestra un código QR: ábrelo con la app Expo Go en el teléfono
# o, para verlo rápido en el navegador (sin cámara real):
npm run web
```

Con **Expo Go** (se instala gratis desde la Play Store / App Store): abrir la app, escanear el QR
que sale en la terminal, y ya carga PGD Visitante en el teléfono, sin compilar nada aparte.

## Comandos

```bash
npm run start        # servidor de desarrollo (QR para Expo Go)
npm run web           # vista previa en el navegador
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
```

## Nota sobre la instalación de paquetes

`npx expo install <paquete>` a veces choca por una dependencia (`react-dom`) que pide una versión
más nueva de la que trae la plantilla de Expo SDK 57 — se resolvió instalando con
`--legacy-peer-deps`. Si `npx expo lint` o `npx expo start` alguna vez dicen "Cannot find module
'eslint'" o algo parecido justo después de instalar un paquete nuevo, es que quedó en una carpeta
`node_modules` anidada en vez de la de la raíz — corre el mismo comando una segunda vez, o instala
ese paquete puntual con `npm install <paquete> --legacy-peer-deps`.
