import { useEffect, useState } from 'react';
import * as Crypto from 'expo-crypto';

const VIGENCIA_SEG = 20;

/**
 * El "pase" que muestra el visitante (como texto y como QR) mientras espera o mientras está en las
 * instalaciones: cambia cada {@link VIGENCIA_SEG} segundos para que no sirva de nada fotografiarlo o
 * copiarlo — el mismo motivo por el que el carnet QR del kiosco de Vigilante Virtual usa un token
 * aleatorio en vez de un código fijo (ver vigilante-virtual/servidor/src/dominio/puerta.ts).
 *
 * Hoy no hay servidor que valide este token (esta app todavía no habla con ningún backend, ver
 * README) — la rotación ya queda lista para cuando lo haya: el servidor solo tendría que aceptar
 * el token vigente de los últimos {@link VIGENCIA_SEG} s, igual que ya hace con los pases de VV.
 */
export function useTokenRotativo() {
  const [token, setToken] = useState(() => Crypto.randomUUID());
  const [segundosRestantes, setSegundosRestantes] = useState(VIGENCIA_SEG);

  useEffect(() => {
    const t = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s > 1) return s - 1;
        setToken(Crypto.randomUUID());
        return VIGENCIA_SEG;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return { token, segundosRestantes, vigenciaSeg: VIGENCIA_SEG };
}
