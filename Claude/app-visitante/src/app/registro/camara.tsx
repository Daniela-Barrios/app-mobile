import { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { FormularioVisitante } from '@/components/FormularioVisitante';
import { Boton, CajaAviso, Pantalla, Subtitulo, Titulo } from '@/components/ui';
import { color, espacio, radio } from '@/lib/tema';
import { guardarVisitanteActual } from '@/lib/almacen';
import { VACIO, datosCompletos, type DatosVisitante } from '@/lib/tipos';

type Paso = 'camara' | 'datos';

/**
 * Registro con foto: primero la foto (de frente, para poder reconocerla después — Fase 0.3), luego
 * los mismos datos que el registro manual. Si el teléfono tiene huella o rostro configurado, ofrece
 * confirmar con eso que quien registra es realmente el dueño del teléfono (expo-local-authentication;
 * no es lo mismo que "reconocer la foto entre visitantes": eso necesita comparar contra fotos
 * anteriores, que todavía no hay dónde guardar — ver README, pendiente de decidir el servicio).
 */
export default function RegistroCamara() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camaraRef = useRef<CameraView>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [paso, setPaso] = useState<Paso>('camara');
  const [datos, setDatos] = useState<DatosVisitante>(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [biometria, setBiometria] = useState<'sin-probar' | 'confirmado' | 'no-disponible'>('sin-probar');
  const completo = datosCompletos(datos);

  const tomarFoto = async () => {
    const p = await camaraRef.current?.takePictureAsync({ quality: 0.6 });
    if (p) { setFoto(p.uri); setPaso('datos'); }
  };

  const confirmarConBiometria = async () => {
    const hay = await LocalAuthentication.hasHardwareAsync();
    const inscrito = hay && (await LocalAuthentication.isEnrolledAsync());
    if (!inscrito) { setBiometria('no-disponible'); return; }
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirma que eres tú' });
    setBiometria(r.success ? 'confirmado' : 'sin-probar');
  };

  const guardar = async () => {
    setEnviando(true);
    await guardarVisitanteActual({
      ...datos, id: Crypto.randomUUID(), foto: foto ?? undefined, origen: 'camara',
      confirmadoConBiometria: biometria === 'confirmado', creadoEn: new Date().toISOString(),
    });
    setEnviando(false);
    router.replace('/registro/confirmacion');
  };

  if (paso === 'camara') {
    if (!permiso) return <Pantalla><Subtitulo>Cargando la cámara…</Subtitulo></Pantalla>;
    if (!permiso.granted) {
      return (
        <Pantalla>
          <Titulo>Necesitamos tu cámara</Titulo>
          <Subtitulo>Para tomarte la foto de registro. Nunca se usa para nada más.</Subtitulo>
          <Boton onPress={pedirPermiso}>Permitir cámara</Boton>
        </Pantalla>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: color.tinta }}>
        <CameraView ref={camaraRef} style={{ flex: 1 }} facing="front" />
        <View style={estilos.controles}>
          <Text style={estilos.ayudaCamara}>Mira a la cámara, con buena luz y sin gorra ni gafas oscuras.</Text>
          <Boton onPress={tomarFoto}>Tomar foto</Boton>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ backgroundColor: color.papel, padding: espacio.lg, gap: espacio.md }}>
      <Titulo>Confirma tus datos</Titulo>
      {foto && <Image source={{ uri: foto }} style={estilos.miniatura} />}
      <Boton tono="suave" onPress={() => setPaso('camara')}>Repetir la foto</Boton>

      {biometria !== 'confirmado' ? (
        <Boton tono="suave" onPress={confirmarConBiometria}>🔒 Confirmar con huella o rostro (opcional)</Boton>
      ) : (
        <CajaAviso tono="exito" texto="Confirmado con tu huella o rostro." />
      )}
      {biometria === 'no-disponible' && <CajaAviso tono="aviso" texto="Este teléfono no tiene huella ni rostro configurados — puedes seguir sin ese paso." />}

      <FormularioVisitante datos={datos} onCambiar={setDatos} />
      {!completo && <CajaAviso texto="Completa los campos marcados con * para continuar." />}
      <Boton onPress={guardar} deshabilitado={!completo} cargando={enviando}>Generar mi pase</Boton>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  controles: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: espacio.lg, gap: espacio.md, backgroundColor: 'rgba(15,23,42,0.75)' },
  ayudaCamara: { color: color.blanco, textAlign: 'center', fontSize: 13.5 },
  miniatura: { width: 120, height: 120, borderRadius: radio.xl, alignSelf: 'center', borderWidth: 2, borderColor: color.linea },
});
