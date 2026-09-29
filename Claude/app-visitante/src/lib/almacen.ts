import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Visitante } from './tipos';

const CLAVE_ACTUAL = 'app-visitante:visitante-actual';

/**
 * Guarda al visitante que se acaba de registrar en este teléfono. Es un almacén LOCAL nada más —
 * todavía no hay un servidor propio de esta app (ver README, Fase 0). Cuando exista, esto pasa a
 * ser sobre todo una caché: lo que manda es lo que el servidor confirme.
 */
export async function guardarVisitanteActual(v: Visitante): Promise<void> {
  await AsyncStorage.setItem(CLAVE_ACTUAL, JSON.stringify(v));
}

export async function leerVisitanteActual(): Promise<Visitante | null> {
  const crudo = await AsyncStorage.getItem(CLAVE_ACTUAL);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as Visitante;
  } catch {
    return null;
  }
}

export async function borrarVisitanteActual(): Promise<void> {
  await AsyncStorage.removeItem(CLAVE_ACTUAL);
}
