# API de Control de Acceso

Backend en Node.js + Express + TypeScript con dos módulos:

1. **Biométrico** — registro y verificación facial (`/api/biometric`).
2. **Tokens dinámicos (TOTP de 20s)** — segundo factor ligado a cada área física (`/api/totp`).

Persistencia en PostgreSQL vía Prisma.

## Puesta en marcha

```bash
cd Willington/api
npm install
cp .env.example .env   # ajustar DATABASE_URL
npx prisma migrate dev --name init
npm run dev
```

`npm test` corre las pruebas unitarias (no requieren Postgres levantado).

## Base de datos demo (15 personas)

Para probar los endpoints de punta a punta sin depender de fotos/dispositivos reales:

```bash
# 1) Postgres local desechable
docker run -d --name control-acceso-pg -e POSTGRES_USER=demo -e POSTGRES_PASSWORD=demo \
  -e POSTGRES_DB=control_acceso -p 55432:5432 postgres:16-alpine

# 2) .env apuntando a ese contenedor (DATABASE_URL="postgresql://demo:demo@localhost:55432/control_acceso?schema=public")
cp .env.example .env

# 3) Esquema + seed
npx prisma migrate dev --name init
npm run db:seed

# 4) Levantar la API
npm run dev
```

`prisma/seed.ts` crea 3 áreas (`LOBBY`, `SERVER_ROOM`, `BOVEDA`) y 15 personas con acceso variado (una de ellas, Nicolás Vargas, sin acceso a ninguna área — a propósito, para poder probar el camino de "reconocido pero denegado"). Para cada persona genera una foto sintética (identicon determinista, con estructura espacial real — no un color plano) y una segunda "captura" ligeramente distinta de la misma persona (blur + brillo) para probar que el matching biométrico tolera variación entre fotos. Todo queda en `prisma/seed-fixtures/` (ignorado por git, regenerable con `npm run db:seed`): las fotos en `photos/` y un `summary.json` con `userId`, áreas, y el secreto TOTP de cada persona.

Para detener/limpiar el entorno demo: `docker rm -f control-acceso-pg`.

## Bug encontrado y corregido probando el flujo end-to-end

Al recorrer el flujo completo contra la base demo aparecieron dos problemas reales en `totp.service.ts` (ya corregidos):

1. **Desfase de reloj entre `checkDelta` y el cálculo del `timeStep`**: `authenticator.checkDelta()` usaba internamente su propio `Date.now()`, y el `timeStep` para single-use se calculaba con otro `Date.now()` posterior. Si el límite de 20s se cruzaba justo entre ambas llamadas, el paso guardado para deduplicar no era el mismo que realmente se validó. Se fijó un único `epoch` (`authenticator.options = { epoch }`) usado para ambos cálculos.
2. **Condición de carrera en el single-use**: la lógica original hacía `findUnique` (¿ya se usó?) y luego `create` en pasos separados con un `await` entre medio; dos verificaciones concurrentes con el mismo token podían pasar el chequeo las dos antes de que cualquiera insertara, y la segunda reventaba con un error 500 por la restricción única de Postgres. Se cambió a un `create` directo que atrapa la violación de unicidad (`P2002`) como señal de "token ya usado" — verificado con 5 requests concurrentes al mismo token: 1 pasó, 4 fueron rechazados limpiamente, sin ningún 500.

## Módulo biométrico

- `POST /api/biometric/register` — `multipart/form-data` con `userId` y `photo` (jpeg/png). Extrae el embedding facial y lo guarda (upsert por usuario).
- `POST /api/biometric/verify` — `multipart/form-data` con `areaCode` y `photo`. Extrae el embedding, busca la mejor coincidencia por distancia coseno contra los embeddings registrados y valida el umbral (`FACE_MATCH_THRESHOLD`). Si hay match, comprueba si ese usuario tiene acceso al área (`user_area_access`) y devuelve `{ matched, allowed, userId?, distance }`. Cada intento queda en `access_logs`.

### Proveedor de embeddings (pluggable)

`src/modules/biometric/embeddingProvider.ts` define la interfaz `FaceEmbeddingProvider`:

```ts
interface FaceEmbeddingProvider {
  readonly name: string;
  readonly dims: number;
  extractEmbedding(imageBuffer: Buffer): Promise<number[]>;
}
```

El proveedor por defecto (`PixelGridEmbeddingProvider`) es deliberadamente liviano: reduce la foto a una grilla de 32×32 en grises y la normaliza como vector. **No es un modelo de reconocimiento facial de producción** — no usa dlib/face_recognition/modelos preentrenados para no traer dependencias nativas pesadas ni descargar binarios de terceros en este scaffolding. Sirve para dejar registro → almacenamiento → comparación → umbral funcionando de punta a punta.

Para producción: implementar la misma interfaz con `face-api.js`, OpenCV + un modelo de embeddings entrenado, o delegar a un microservicio dedicado (ej. Python + face_recognition), e inyectarlo en `BiometricService` en lugar de `defaultEmbeddingProvider`.

## Motor de tokens dinámicos (20 segundos)

- `POST /api/totp/enroll` — `{ userId }`. Genera el secreto base (Base32) del usuario y lo guarda. **El secreto solo se devuelve en esta respuesta**; a partir de ahí debe vivir en el dispositivo/llave del usuario y en la base de datos.
- `POST /api/totp/verify` — `{ userId, areaCode, token }`. Reglas aplicadas:
  1. **Ciclo de 20s**: `authenticator.options.step = 20` (en vez del estándar de 30s).
  2. **Ventana de tolerancia**: `TOTP_WINDOW_STEPS` (por defecto 1 paso = ±20s) para absorber latencia de red.
  3. **Atado al área exacta**: el secreto usado para generar/validar el token no es el secreto base del usuario, sino uno derivado por área — `deriveAreaSecret = HMAC-SHA1(secretoBase, areaCode)` codificado en Base32. Un token válido para `LOBBY` no calza contra `SERVER_ROOM`, aunque esté dentro de la ventana de tiempo.
  4. **Single-use**: al validar un token se calcula su `timeStep` real (paso actual + delta) y se inserta en `consumed_tokens` con restricción única `(userId, areaId, timeStep)`. Un reintento del mismo token dentro de la misma ventana es rechazado (`reason: "token_reused"`) aunque el token siga siendo temporalmente válido.
  5. Tras superar 1–4, se comprueba el permiso de área (`user_area_access`) para decidir `allowed`. Todo intento (válido o no) queda registrado en `access_logs`.

## Modelo de datos (`prisma/schema.prisma`)

- `User`, `Area`, `UserAreaAccess` — usuarios, áreas físicas y permisos.
- `FaceEmbedding` — vector + proveedor/dimensión con que fue generado (permite invalidar/migrar si se cambia de proveedor).
- `TotpSecret` — secreto base por usuario.
- `ConsumedToken` — tokens TOTP ya usados, por `(userId, areaId, timeStep)`.
- `AccessLog` — auditoría de todo intento biométrico o TOTP.

## Pendiente / fuera de alcance de esta primera pasada

- Cifrado en reposo del secreto TOTP (`totp_secrets.secretBase32`) — hoy se guarda en texto plano en la BD, recomendable cifrarlo a nivel de aplicación o columna antes de producción.
- Proveedor de embeddings real (ver arriba).
- Autenticación/autorización de quién puede llamar a `/register`, `/enroll` (hoy los endpoints no están protegidos por un rol admin/kiosko).
- Índice de similitud para biometría a escala (pgvector u otro ANN) si crece la base de usuarios.
