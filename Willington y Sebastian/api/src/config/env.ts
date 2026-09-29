import "dotenv/config";

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: requireEnv("DATABASE_URL"),
  faceMatchThreshold: Number(process.env.FACE_MATCH_THRESHOLD ?? 0.35),
  totpWindowSteps: Number(process.env.TOTP_WINDOW_STEPS ?? 1),
};
