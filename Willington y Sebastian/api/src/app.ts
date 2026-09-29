import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { biometricRouter } from "./modules/biometric/biometric.routes";
import { totpRouter } from "./modules/totp/totp.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "1mb" }));

  // Los endpoints biometricos/TOTP son objetivo natural de fuerza bruta; se
  // limita la tasa de intentos por IP ademas de la ventana temporal del TOTP.
  const verifyLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/biometric", verifyLimiter, biometricRouter);
  app.use("/api/totp", verifyLimiter, totpRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
