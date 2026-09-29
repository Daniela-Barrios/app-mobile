import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { env } from "../../config/env";
import { cosineDistance, defaultEmbeddingProvider, FaceEmbeddingProvider } from "./embeddingProvider";

export class BiometricService {
  constructor(private readonly provider: FaceEmbeddingProvider = defaultEmbeddingProvider) {}

  async registerFace(userId: string, imageBuffer: Buffer) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("Usuario no encontrado");

    const vector = await this.provider.extractEmbedding(imageBuffer);

    const embedding = await prisma.faceEmbedding.upsert({
      where: { userId },
      create: { userId, vector, provider: this.provider.name, dims: this.provider.dims },
      update: { vector, provider: this.provider.name, dims: this.provider.dims },
    });

    return { userId, provider: embedding.provider, dims: embedding.dims };
  }

  async verifyFace(imageBuffer: Buffer, areaCode: string) {
    const area = await prisma.area.findUnique({ where: { code: areaCode } });
    if (!area) throw new NotFoundError(`Area '${areaCode}' no existe`);

    const probeVector = await this.provider.extractEmbedding(imageBuffer);

    // Nota: escaneo O(n) contra todos los embeddings registrados. Suficiente
    // para el alcance actual; si la base de usuarios crece, mover a un indice
    // de similitud (ej. pgvector) en vez de comparar uno por uno en memoria.
    const candidates = await prisma.faceEmbedding.findMany({
      where: { provider: this.provider.name },
      include: { user: true },
    });

    let best: { userId: string; fullName: string; distance: number } | null = null;
    for (const candidate of candidates) {
      const distance = cosineDistance(probeVector, candidate.vector);
      if (!best || distance < best.distance) {
        best = { userId: candidate.userId, fullName: candidate.user.fullName, distance };
      }
    }

    const matched = best !== null && best.distance <= env.faceMatchThreshold;

    if (!matched || !best) {
      await this.logAttempt(null, area.id, false, "sin coincidencia biometrica");
      return { matched: false, allowed: false, distance: best?.distance ?? null };
    }

    const access = await prisma.userAreaAccess.findUnique({
      where: { userId_areaId: { userId: best.userId, areaId: area.id } },
    });

    const allowed = Boolean(access);
    await this.logAttempt(
      best.userId,
      area.id,
      allowed,
      allowed ? undefined : "usuario reconocido sin permiso en el area"
    );

    return {
      matched: true,
      allowed,
      userId: best.userId,
      fullName: best.fullName,
      distance: best.distance,
    };
  }

  private async logAttempt(userId: string | null, areaId: string | null, success: boolean, reason?: string) {
    await prisma.accessLog.create({ data: { userId, areaId, method: "BIOMETRIC", success, reason } });
  }
}

export const biometricService = new BiometricService();
