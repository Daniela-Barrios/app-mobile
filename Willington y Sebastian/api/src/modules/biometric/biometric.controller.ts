import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../lib/errors";
import { biometricService } from "./biometric.service";

const registerSchema = z.object({
  userId: z.string().uuid(),
});

const verifySchema = z.object({
  areaCode: z.string().min(1),
});

function requirePhoto(req: Request): Buffer {
  if (!req.file) {
    throw new AppError("Falta la foto (campo 'photo', multipart/form-data)", 422);
  }
  return req.file.buffer;
}

export async function registerFaceHandler(req: Request, res: Response): Promise<void> {
  const { userId } = registerSchema.parse(req.body);
  const photo = requirePhoto(req);
  const result = await biometricService.registerFace(userId, photo);
  res.status(201).json(result);
}

export async function verifyFaceHandler(req: Request, res: Response): Promise<void> {
  const { areaCode } = verifySchema.parse(req.body);
  const photo = requirePhoto(req);
  const result = await biometricService.verifyFace(photo, areaCode);
  res.status(200).json(result);
}
