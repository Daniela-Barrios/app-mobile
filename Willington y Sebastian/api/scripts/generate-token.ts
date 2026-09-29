/**
 * Genera un token TOTP valido (ahora mismo) para un secreto base + area,
 * usando exactamente la misma derivacion que el servidor. Util para probar
 * /api/totp/verify a mano desde la consola sin tener un kiosko/llave real.
 *
 * Uso: npx tsx scripts/generate-token.ts <secretBase32> <areaCode>
 */
import { authenticator } from "otplib";
import { deriveAreaSecret, TOTP_STEP_SECONDS } from "../src/modules/totp/totp.service";

const [secretBase32, areaCode] = process.argv.slice(2);

if (!secretBase32 || !areaCode) {
  console.error("Uso: npx tsx scripts/generate-token.ts <secretBase32> <areaCode>");
  process.exit(1);
}

authenticator.options = { step: TOTP_STEP_SECONDS, digits: 6 };

const areaSecret = deriveAreaSecret(secretBase32, areaCode);
const token = authenticator.generate(areaSecret);

console.log(token);
