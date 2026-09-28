import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { authenticator } from "otplib";
import { prisma } from "../src/lib/prisma";
import { biometricService } from "../src/modules/biometric/biometric.service";
import { totpService, deriveAreaSecret } from "../src/modules/totp/totp.service";

const FIXTURES_DIR = path.join(__dirname, "seed-fixtures");
const PHOTOS_DIR = path.join(FIXTURES_DIR, "photos");

const AREAS = [
  { code: "LOBBY", name: "Lobby principal" },
  { code: "SERVER_ROOM", name: "Cuarto de servidores" },
  { code: "BOVEDA", name: "Boveda" },
] as const;

type AreaCode = (typeof AREAS)[number]["code"];

interface Person {
  fullName: string;
  email: string;
  areas: AreaCode[];
}

// 15 personas demo. Nicolas Vargas queda a proposito sin acceso a ninguna
// area (visitante) para poder probar el camino de "reconocido pero denegado".
const PEOPLE: Person[] = [
  { fullName: "Ana Torres", email: "ana.torres@demo.com", areas: ["LOBBY", "SERVER_ROOM", "BOVEDA"] },
  { fullName: "Carlos Ramirez", email: "carlos.ramirez@demo.com", areas: ["LOBBY", "SERVER_ROOM"] },
  { fullName: "Diana Lopez", email: "diana.lopez@demo.com", areas: ["LOBBY", "SERVER_ROOM", "BOVEDA"] },
  { fullName: "Eduardo Mora", email: "eduardo.mora@demo.com", areas: ["LOBBY"] },
  { fullName: "Felipe Rojas", email: "felipe.rojas@demo.com", areas: ["LOBBY", "SERVER_ROOM"] },
  { fullName: "Gabriela Nunez", email: "gabriela.nunez@demo.com", areas: ["LOBBY"] },
  { fullName: "Hector Silva", email: "hector.silva@demo.com", areas: ["LOBBY", "SERVER_ROOM", "BOVEDA"] },
  { fullName: "Isabel Castro", email: "isabel.castro@demo.com", areas: ["LOBBY"] },
  { fullName: "Javier Pena", email: "javier.pena@demo.com", areas: ["LOBBY"] },
  { fullName: "Karen Diaz", email: "karen.diaz@demo.com", areas: ["LOBBY"] },
  { fullName: "Luis Fernandez", email: "luis.fernandez@demo.com", areas: ["LOBBY", "SERVER_ROOM"] },
  { fullName: "Maria Gutierrez", email: "maria.gutierrez@demo.com", areas: ["LOBBY"] },
  { fullName: "Nicolas Vargas", email: "nicolas.vargas@demo.com", areas: [] },
  { fullName: "Olivia Sanchez", email: "olivia.sanchez@demo.com", areas: ["LOBBY"] },
  { fullName: "Pedro Jimenez", email: "pedro.jimenez@demo.com", areas: ["LOBBY"] },
];

/** Identicon simple (grilla 5x5 espejada) determinado por el nombre: cada persona obtiene una "foto" con estructura espacial real, no un color plano. */
function identiconSvg(seed: string, size = 256): string {
  const hash = crypto.createHash("sha256").update(seed).digest();
  const gridSize = 5;
  const cols = Math.ceil(gridSize / 2);
  const cell = size / gridSize;
  const hue = hash[0] % 360;
  const fg = `hsl(${hue}, 65%, 45%)`;

  let rects = "";
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < cols; col++) {
      const bit = hash[(row * cols + col) % hash.length] % 2;
      if (bit !== 1) continue;
      const y = row * cell;
      const x1 = col * cell;
      const x2 = (gridSize - 1 - col) * cell;
      rects += `<rect x="${x1}" y="${y}" width="${cell}" height="${cell}" fill="${fg}" />`;
      if (x2 !== x1) rects += `<rect x="${x2}" y="${y}" width="${cell}" height="${cell}" fill="${fg}" />`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#f4f4f4" /><g>${rects}</g></svg>`;
}

async function renderPhoto(seed: string): Promise<Buffer> {
  return sharp(Buffer.from(identiconSvg(seed))).png().toBuffer();
}

/** Misma identidad, "otra captura": pequena variacion para simular una segunda foto de la misma persona. */
async function renderPhotoVariant(seed: string): Promise<Buffer> {
  const base = await renderPhoto(seed);
  return sharp(base).blur(1.1).modulate({ brightness: 1.04 }).toBuffer();
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

async function main() {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });

  console.log("Limpiando datos demo previos...");
  await prisma.accessLog.deleteMany();
  await prisma.consumedToken.deleteMany();
  await prisma.userAreaAccess.deleteMany();
  await prisma.faceEmbedding.deleteMany();
  await prisma.totpSecret.deleteMany();
  await prisma.user.deleteMany();
  await prisma.area.deleteMany();

  console.log("Creando areas...");
  const areaByCode = new Map<AreaCode, { id: string; code: string; name: string }>();
  for (const area of AREAS) {
    const created = await prisma.area.create({ data: area });
    areaByCode.set(area.code, created);
  }

  const summary: Array<{
    userId: string;
    fullName: string;
    email: string;
    areas: AreaCode[];
    photo: string;
    photoVariant: string;
    totpSecretBase32: string;
    sampleTokens: Record<string, string>;
  }> = [];

  console.log("Creando 15 personas (usuario + foto + embedding + areas + TOTP)...");
  for (const person of PEOPLE) {
    const user = await prisma.user.create({
      data: { fullName: person.fullName, email: person.email },
    });

    const slug = slugify(person.fullName);
    const photoBuffer = await renderPhoto(person.email);
    const variantBuffer = await renderPhotoVariant(person.email);

    const photoPath = path.join(PHOTOS_DIR, `${slug}.png`);
    const variantPath = path.join(PHOTOS_DIR, `${slug}-variante.png`);
    fs.writeFileSync(photoPath, photoBuffer);
    fs.writeFileSync(variantPath, variantBuffer);

    await biometricService.registerFace(user.id, photoBuffer);

    for (const areaCode of person.areas) {
      const area = areaByCode.get(areaCode)!;
      await prisma.userAreaAccess.create({ data: { userId: user.id, areaId: area.id } });
    }

    const { secretBase32 } = await totpService.enroll(user.id);

    const sampleTokens: Record<string, string> = {};
    for (const areaCode of AREAS.map((a) => a.code)) {
      const areaSecret = deriveAreaSecret(secretBase32, areaCode);
      sampleTokens[areaCode] = authenticator.generate(areaSecret);
    }

    summary.push({
      userId: user.id,
      fullName: person.fullName,
      email: person.email,
      areas: person.areas,
      photo: path.relative(FIXTURES_DIR, photoPath),
      photoVariant: path.relative(FIXTURES_DIR, variantPath),
      totpSecretBase32: secretBase32,
      sampleTokens,
    });
  }

  fs.writeFileSync(path.join(FIXTURES_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  console.log(`\nListo: ${summary.length} personas, ${AREAS.length} areas.`);
  console.log(`Fotos en:   ${PHOTOS_DIR}`);
  console.log(`Resumen en: ${path.join(FIXTURES_DIR, "summary.json")}`);
  console.log("\nOJO: los sampleTokens del resumen son validos solo por unos ~20-40s desde que corriste el seed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
