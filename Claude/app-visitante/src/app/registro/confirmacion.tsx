import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Boton, CajaAviso, Pantalla, Subtitulo, Tarjeta, Titulo } from '@/components/ui';
import { color, espacio } from '@/lib/tema';
import { leerVisitanteActual } from '@/lib/almacen';
import { useTokenRotativo } from '@/lib/token';
import { TIPO_DOCUMENTO_TEXTO, type Visitante } from '@/lib/tipos';

/** El pase: quién es, y el token que cambia cada 20 s (ver lib/token.ts) como QR y como texto —
 * mientras no haya un lector real que lo escanee, sirve para mostrarlo o dictarlo en portería. */
export default function Confirmacion() {
  const [visitante, setVisitante] = useState<Visitante | null | undefined>(undefined);
  const { token, segundosRestantes, vigenciaSeg } = useTokenRotativo();

  useEffect(() => {
    leerVisitanteActual().then((v) => {
      setVisitante(v);
      if (!v) router.replace('/registro');
    });
  }, []);

  if (!visitante) return null;

  return (
    <Pantalla>
      <CajaAviso tono="exito" texto="Registro guardado en este teléfono." />
      <Tarjeta>
        <View style={{ flexDirection: 'row', gap: espacio.md, alignItems: 'center' }}>
          {visitante.foto ? (
            <Image source={{ uri: visitante.foto }} style={{ width: 56, height: 56, borderRadius: 28 }} />
          ) : (
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: color.azulClaro, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: color.azul, fontWeight: '800', fontSize: 18 }}>
                {(visitante.nombres[0] ?? '') + (visitante.apellidos[0] ?? '')}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Titulo>{visitante.nombres} {visitante.apellidos}</Titulo>
            <Subtitulo>{TIPO_DOCUMENTO_TEXTO[visitante.tipoDocumento]} {visitante.documento}</Subtitulo>
          </View>
        </View>
        <Subtitulo>Visita a {visitante.destino}{visitante.empresa ? ` · ${visitante.empresa}` : ''}</Subtitulo>
      </Tarjeta>

      <Tarjeta>
        <Text style={{ fontSize: 15, fontWeight: '800', color: color.tinta }}>Código de acceso</Text>
        <Subtitulo>Cambia cada {vigenciaSeg} s — solo sirve el que ves ahora mismo.</Subtitulo>
        <View style={{ alignItems: 'center', gap: espacio.sm }}>
          <QRCode value={token} size={180} color={color.tinta} backgroundColor={color.blanco} />
          <Text style={{ fontFamily: 'monospace', fontSize: 12, color: color.tinta2 }}>{token}</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: color.azul }}>Se renueva en {segundosRestantes} s</Text>
        </View>
      </Tarjeta>

      <CajaAviso tono="aviso" texto="Este pase todavía no lo valida ningún lector: falta conectar esta app con el servidor de portería." />

      <Boton tono="suave" onPress={() => router.push('/atencion')}>Hablar con el vigilante</Boton>
      <Boton tono="suave" onPress={() => router.replace('/')}>Volver al inicio</Boton>
    </Pantalla>
  );
}
