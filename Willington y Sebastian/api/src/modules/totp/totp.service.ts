import crypto from "node:crypto";
import { authenticator } from "otplib";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { env } from "../../config/env";
import { base32Encode } from "../../lib/base32";

export const TOTP_STEP_SECONDS = 20;

authenticator.options = {
  step: TOTP_STEP_SECONDS,
  digits: 6,
  window: env.totpWindowSteps, // tolerancia de +-N pasos (N=1 => +-20s) por latencia de red
};

/**
 * Deriva, a partir del secreto base del usuario, un secreto especifico para
 * un area fisica. Asi un token generado/valido para el area A nunca calza
 * para el area B, aunque este dentro de la ventana de tiempo valida.
 */
export function deriveAreaSecret(baseSecretBase32: string, areaCode: string): string {
  const digest = crypto
    .createHmac("sha1", Buffer.from(baseSecretBase32, "utf8"))
    .update(areaCode)
    .digest();
  return base32Encode(digest);
}

export class TotpService {
  async enroll(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("Usuario no encontrado");

    const secretBase32 = authenticator.generateSecret();

    await prisma.totpSecret.upsert({
      where: { userId },
      create: { userId, secretBase32 },
      update: { secretBase32 },
    });

    // El secreto base solo se devuelve aqui, en el momento de enrolar; de ahi
    // en adelante debe vivir unicamente en el dispositivo/llave del usuario.
    return { userId, secretBase32, stepSeconds: TOTP_STEP_SECONDS };
  }

  async verify(userId: string, areaCode: string, token: string) {
    const [totpSecret, area] = await Promise.all([
      prisma.totpSecret.findUnique({ where: { userId } }),
      prisma.area.findUnique({ where: { code: areaCode } }),
    ]);

    if (!totpSecret) throw new NotFoundError("El usuario no tiene un token enrolado");
    if (!area) throw new NotFoundError(`Area '${areaCode}' no existe`);

    const areaSecret = deriveAreaSecret(totpSecret.secretBase32, area.code);

    // Se fija un unico epoch para toda la verificacion: checkDelta y el
    // calculo del timeStep deben basarse en el mismo instante. Si cada uno
    // llamara a Date.now() por su cuenta, un paso de 20s podria cambiar entre
    // ambas llamadas y el timeStep guardado para single-use quedaria
    // desfasado del que realmente se valido.
    const epoch = Date.now();
    authenticator.options = { epoch };

    // checkDelta valida el token dentro de la ventana configurada y devuelve
    // cuantos pasos de 20s esta desfasado respecto al paso actual (o null si
    // no calza con ningun paso de la ventana => token invalido/expirado).
    const delta = authenticator.checkDelta(token, areaSecret);

    if (delta === null) {
      await this.logAttempt(userId, area.id, false, "token invalido o expirado");
      return { valid: false, allowed: false };
    }

    const currentStep = Math.floor(epoch / 1000 / TOTP_STEP_SECONDS);
    const matchedStep = BigInt(currentStep + delta);

    // Se consume el token con un INSERT directo y se deja que la restriccion
    // unica (userId, areaId, timeStep) de la base decida el single-use de
    // forma atomica. Un check-then-create (buscar si existe y luego crear)
    // deja una ventana entre ambos awaits donde dos verificaciones
    // concurrentes con el mismo token podrian pasar el chequeo las dos.
    try {
      await prisma.consumedToken.create({ data: { userId, areaId: area.id, timeStep: matchedStep } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        await this.logAttempt(userId, area.id, false, "token ya fue utilizado (single-use)");
        return { valid: false, allowed: false, reason: "token_reused" };
      }
      throw err;
    }

    const access = await prisma.userAreaAccess.findUnique({
      where: { userId_areaId: { userId, areaId: area.id } },
    });
    const allowed = Boolean(access);

    await this.logAttempt(
      userId,
      area.id,
      allowed,
      allowed ? undefined : "token valido pero sin permiso en el area"
    );

    return { valid: true, allowed };
  }

  private async logAttempt(userId: string, areaId: string, success: boolean, reason?: string) {
    await prisma.accessLog.create({ data: { userId, areaId, method: "TOTP", success, reason } });
  }
}

export const totpService = new TotpService();
