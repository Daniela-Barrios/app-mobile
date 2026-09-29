import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../middleware/asyncHandler";
import { registerFaceHandler, verifyFaceHandler } from "./biometric.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      cb(new Error("Formato de imagen no soportado (solo jpeg/png)"));
      return;
    }
    cb(null, true);
  },
});

export const biometricRouter = Router();

// POST /api/biometric/register  (multipart/form-data: userId, photo)
biometricRouter.post("/register", upload.single("photo"), asyncHandler(registerFaceHandler));

// POST /api/biometric/verify  (multipart/form-data: areaCode, photo)
biometricRouter.post("/verify", upload.single("photo"), asyncHandler(verifyFaceHandler));
