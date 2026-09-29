import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { enrollHandler, verifyHandler } from "./totp.controller";

export const totpRouter = Router();

// POST /api/totp/enroll  { userId }  -> genera y guarda el secreto base del usuario
totpRouter.post("/enroll", asyncHandler(enrollHandler));

// POST /api/totp/verify  { userId, areaCode, token }
totpRouter.post("/verify", asyncHandler(verifyHandler));
