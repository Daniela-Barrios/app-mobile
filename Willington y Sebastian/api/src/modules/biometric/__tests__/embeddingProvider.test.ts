import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { cosineDistance, PixelGridEmbeddingProvider } from "../embeddingProvider";

describe("cosineDistance", () => {
  it("es 0 para vectores identicos", () => {
    const v = [0.6, 0.8];
    expect(cosineDistance(v, v)).toBeCloseTo(0, 10);
  });

  it("es 1 para vectores ortogonales", () => {
    expect(cosineDistance([1, 0], [0, 1])).toBeCloseTo(1, 10);
  });

  it("lanza error si las dimensiones no coinciden", () => {
    expect(() => cosineDistance([1, 0], [1, 0, 0])).toThrow();
  });
});

describe("PixelGridEmbeddingProvider", () => {
  it("genera el mismo embedding para la misma imagen (determinista)", async () => {
    const provider = new PixelGridEmbeddingProvider();
    const image = await sharp({
      create: { width: 64, height: 64, channels: 3, background: { r: 120, g: 40, b: 200 } },
    })
      .png()
      .toBuffer();

    const a = await provider.extractEmbedding(image);
    const b = await provider.extractEmbedding(image);

    expect(a).toHaveLength(provider.dims);
    expect(cosineDistance(a, b)).toBeCloseTo(0, 10);
  });

  it("distingue imagenes claramente distintas", async () => {
    const provider = new PixelGridEmbeddingProvider();
    const dark = await sharp({
      create: { width: 64, height: 64, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();
    const light = await sharp({
      create: { width: 64, height: 64, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .png()
      .toBuffer();

    const a = await provider.extractEmbedding(dark);
    const b = await provider.extractEmbedding(light);

    expect(cosineDistance(a, b)).toBeGreaterThan(0.5);
  });
});
