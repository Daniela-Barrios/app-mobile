FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

# db.json vive en un volumen (ver docker-compose.yml): se genera aqui, en tiempo
# de arranque del contenedor, solo si aun no existe. Si ya existe (persistido
# entre reinicios), se respeta tal cual para no perder cambios administrados
# desde la UI. Para volver a la semilla: docker compose run --rm mock-api npm run seed.
CMD ["sh", "-c", "test -f db.json || npm run seed; npm run start"]
