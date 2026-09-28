export type TipoDocumento = 'cc' | 'ce' | 'pasaporte';

/** Mismos campos que el registro del kiosco de Vigilante Virtual (pgd-kioskos/vigilante-virtual),
 * para que el mismo visitante se reconozca igual en los dos sistemas el día que se conecten. */
export interface DatosVisitante {
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  empresa: string;
  motivo: string;
  destino: string;
  autorizadoPor: string;
}

export interface Visitante extends DatosVisitante {
  id: string;
  /** uri local de la foto (registro por cámara) — no hay servidor todavía que la reciba. */
  foto?: string;
  /** Cómo se registró: sirve para saber si tiene foto para reconocimiento facial más adelante. */
  origen: 'formulario' | 'camara';
  /** ¿Confirmó el registro con su huella o rostro (expo-local-authentication)? */
  confirmadoConBiometria: boolean;
  creadoEn: string;
}

export const TIPO_DOCUMENTO_TEXTO: Record<TipoDocumento, string> = {
  cc: 'Cédula de ciudadanía',
  ce: 'Cédula de extranjería',
  pasaporte: 'Pasaporte',
};

export const VACIO: DatosVisitante = {
  nombres: '', apellidos: '', tipoDocumento: 'cc', documento: '', empresa: '', motivo: '', destino: '', autorizadoPor: '',
};

/** ¿Ya se puede enviar? Los mismos campos obligatorios que pide el kiosco de VV. */
export function datosCompletos(d: DatosVisitante): boolean {
  return !!(d.nombres.trim() && d.apellidos.trim() && d.documento.trim() && d.destino.trim() && d.motivo.trim());
}
