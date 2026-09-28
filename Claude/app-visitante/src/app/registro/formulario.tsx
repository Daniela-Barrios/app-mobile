import { useState } from 'react';
import { ScrollView } from 'react-native';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { FormularioVisitante } from '@/components/FormularioVisitante';
import { Boton, CajaAviso, Subtitulo } from '@/components/ui';
import { color, espacio } from '@/lib/tema';
import { guardarVisitanteActual } from '@/lib/almacen';
import { VACIO, datosCompletos, type DatosVisitante } from '@/lib/tipos';

/** Registro sin foto: los mismos campos que pide el kiosco físico, a mano. */
export default function RegistroFormulario() {
  const [datos, setDatos] = useState<DatosVisitante>(VACIO);
  const [enviando, setEnviando] = useState(false);
  const completo = datosCompletos(datos);

  const guardar = async () => {
    setEnviando(true);
    await guardarVisitanteActual({
      ...datos, id: Crypto.randomUUID(), origen: 'formulario', confirmadoConBiometria: false, creadoEn: new Date().toISOString(),
    });
    setEnviando(false);
    router.replace('/registro/confirmacion');
  };

  return (
    <ScrollView contentContainerStyle={{ backgroundColor: color.papel, padding: espacio.lg, gap: espacio.md }}>
      <Subtitulo>Los campos con * son obligatorios.</Subtitulo>
      <FormularioVisitante datos={datos} onCambiar={setDatos} />
      {!completo && <CajaAviso texto="Completa los campos marcados con * para continuar." />}
      <Boton onPress={guardar} deshabilitado={!completo} cargando={enviando}>Generar mi pase</Boton>
    </ScrollView>
  );
}
