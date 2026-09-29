import { describe, expect, it } from "vitest";
import { base32Encode } from "../base32";

describe("base32Encode", () => {
  it("codifica un buffer conocido segun RFC 4648", () => {
    // "foobar" -> MZXW6YTBOI (referencia estandar de RFC 4648, sin padding)
    expect(base32Encode(Buffer.from("foobar", "utf8"))).toBe("MZXW6YTBOI");
  });

  it("produce solo caracteres del alfabeto base32", () => {
    const encoded = base32Encode(Buffer.from([1, 2, 3, 4, 5, 250, 251, 252]));
    expect(encoded).toMatch(/^[A-Z2-7]+$/);
  });
});
