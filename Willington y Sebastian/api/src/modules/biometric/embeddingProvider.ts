import sharp from "sharp";

const GRID_SIZE = 32; // imagen reducida a 32x32 en escala de grises => vector de 1024 dims

export interface FaceEmbeddingProvider {
  readonly name: string;
  readonly dims: number;
  extractEmbedding(imageBuffer: Buffer): Promise<number[]>;
}

/**
 * Proveedor de referencia: liviano, sin dependencias nativas pesadas ni
 * modelos preentrenados que descargar (nada de dlib/face_recognition). Reduce
 * la foto a una grilla fija de grises y la normaliza como vector, lo que deja
 * todo el pipeline (registro -> almacenamiento -> comparacion -> umbral)
 * funcionando de punta a punta para desarrollo y pruebas.
 *
 * Para produccion, sustituir por una implementacion real (face-api.js,
 * OpenCV + un modelo de embeddings entrenado, o un microservicio dedicado)
 * que cumpla esta misma interfaz y registrarla en su lugar.
 */
export class PixelGridEmbeddingProvider implements FaceEmbeddingProvider {
  readonly name = "pixel-grid-v1";
  readonly dims = GRID_SIZE * GRID_SIZE;

  async extractEmbedding(imageBuffer: Buffer): Promise<number[]> {
    const { data } = await sharp(imageBuffer)
      .resize(GRID_SIZE, GRID_SIZE, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const vector = Array.from(data, (value) => value / 255);
    return normalize(vector);
  }
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map((v) => v / magnitude);
}

/**
 * Distancia coseno entre dos vectores normalizados (0 = identicos, 2 = opuestos).
 */
export function cosineDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Los vectores deben tener la misma dimension");
  }
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  const similarity = Math.max(-1, Math.min(1, dot));
  return 1 - similarity;
}

export const defaultEmbeddingProvider: FaceEmbeddingProvider = new PixelGridEmbeddingProvider();
