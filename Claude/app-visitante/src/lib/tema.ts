/**
 * Paleta y medidas compartidas. Los mismos tonos que Vigilante Virtual (vigilante-virtual/
 * tailwind.config.js en pgd-kioskos) para que esta app se vea de la misma familia PGD — no hay
 * Tailwind aquí (React Native puro), así que quedan como constantes de StyleSheet.
 */
export const color = {
  tinta: '#0F172A',
  tinta2: '#475569',
  papel: '#F1F5F9',
  linea: '#CBD5E1',
  blanco: '#FFFFFF',
  azul: '#1D4ED8',
  azulOscuro: '#1E3A8A',
  azulClaro: '#DBEAFE',
  aviso: '#8A4B06',
  avisoFondo: '#FDF1D8',
  peligro: '#A1261B',
  peligroFondo: '#FBE9E7',
  exito: '#08683F',
  exitoFondo: '#E5F4EB',
} as const;

export const espacio = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radio = { md: 12, lg: 18, xl: 28, pastilla: 999 } as const;
