# PGD Visitante — app móvil del visitante (Fase 0)

App para que el visitante se registre desde su propio teléfono antes de llegar a la portería, y
desde ahí hable con el vigilante. Es la Fase 0 del proyecto de 4 fases (ver el mensaje del canal /
el histórico de la conversación con Daniela): la app móvil primero; el dashboard de administración,
el control de cámaras y la conexión de todo el ecosistema quedan para las fases siguientes.

**Tecnología:** Expo (React Native + TypeScript) con Expo Router. Se eligió sobre una PWA porque los
ítems 2 y 3 de la Fase 0 (biométricos, reconocimiento facial) casi siempre necesitan acceso nativo a
cámara y sensores que un navegador no da igual. El resultado es una **app propia instalable** (APK),
sin depender de ninguna otra app — se compila en la nube con EAS Build porque este equipo no tiene
Android Studio/Java para compilarla en local (ver «Cómo instalarla en el teléfono» abajo). Expo Go
solo se usa como atajo mientras se desarrolla, para no recompilar en cada cambio — nunca es el
producto final.

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

## Cómo instalarla en el teléfono (app propia, sin Expo Go)

La app final se instala como un APK propio, con su propio ícono — **no depende de tener Expo Go
instalado**. Se compila en la nube de EAS (gratis), porque este equipo no tiene Android
Studio/Java para compilarla en local:

```bash
cd Claude/app-visitante
npx eas-cli@latest login          # una sola vez, con tu cuenta de Expo (gratis)
npx eas-cli@latest build --platform android --profile preview
```

Tarda 10-20 min (más la cola del plan gratis). Al terminar, entrega un enlace de descarga del
`.apk`: se abre desde el navegador del teléfono y se instala como cualquier otra app (Android puede
pedir permitir «instalar de origen desconocido» la primera vez, por no venir de Play Store).

## Para desarrollar (con Expo Go, más rápido de iterar)

Mientras se construye, es más cómodo probar los cambios sin recompilar cada vez, con **Expo Go**
(app gratis de la tienda) como visor temporal — el APK final de arriba no la necesita:

```bash
npm install
npm run start       # muestra un código QR: ábrelo con la app Expo Go en el teléfono
# o, para verlo rápido en el navegador (sin cámara real):
npm run web
```

## Comandos

```bash
npm run start        # servidor de desarrollo (QR para Expo Go, solo para desarrollar)
npm run web           # vista previa en el navegador
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
```
