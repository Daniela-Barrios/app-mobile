import type { Request, Response } from "express";
import { z } from "zod";
import { totpService } from "./totp.service";

const enrollSchema = z.object({
  userId: z.string().uuid(),
});

const verifySchema = z.object({
  userId: z.string().uuid(),
  areaCode: z.string().min(1),
  token: z.string().regex(/^\d{6}$/, "El token debe tener 6 digitos"),
});

export async function enrollHandler(req: Request, res: Response): Promise<void> {
  const { userId } = enrollSchema.parse(req.body);
  const result = await totpService.enroll(userId);
  res.status(201).json(result);
}

export async function verifyHandler(req: Request, res: Response): Promise<void> {
  const { userId, areaCode, token } = verifySchema.parse(req.body);
  const result = await totpService.verify(userId, areaCode, token);
  res.status(200).json(result);
}
