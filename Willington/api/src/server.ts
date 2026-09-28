import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`API de control de acceso escuchando en http://localhost:${env.port}`);
});
