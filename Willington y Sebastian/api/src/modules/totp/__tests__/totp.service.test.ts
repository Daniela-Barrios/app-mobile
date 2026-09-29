import { describe, expect, it } from "vitest";
import { authenticator } from "otplib";
import { deriveAreaSecret, TOTP_STEP_SECONDS } from "../totp.service";

describe("deriveAreaSecret", () => {
  it("es determinista para el mismo (secreto, area)", () => {
    const a = deriveAreaSecret("BASESECRETXYZ", "LOBBY");
    const b = deriveAreaSecret("BASESECRETXYZ", "LOBBY");
    expect(a).toBe(b);
  });

  it("produce secretos distintos para areas distintas", () => {
    const lobby = deriveAreaSecret("BASESECRETXYZ", "LOBBY");
    const serverRoom = deriveAreaSecret("BASESECRETXYZ", "SERVER_ROOM");
    expect(lobby).not.toBe(serverRoom);
  });
});

describe("motor TOTP (step de 20s, ligado al area)", () => {
  it("un token generado para un area no es valido en otra area", () => {
    const baseSecret = "BASESECRETXYZ";
    const lobbySecret = deriveAreaSecret(baseSecret, "LOBBY");
    const serverRoomSecret = deriveAreaSecret(baseSecret, "SERVER_ROOM");

    const token = authenticator.generate(lobbySecret);

    expect(authenticator.checkDelta(token, lobbySecret)).not.toBeNull();
    expect(authenticator.checkDelta(token, serverRoomSecret)).toBeNull();
  });

  it("usa un ciclo de 20 segundos", () => {
    expect(TOTP_STEP_SECONDS).toBe(20);
    expect(authenticator.options.step).toBe(20);
  });

  it("rechaza un token que no corresponde a ningun paso de la ventana", () => {
    const secret = deriveAreaSecret("OTRO_SECRETO", "LOBBY");
    expect(authenticator.checkDelta("000000", secret)).toBeNull();
  });
});
