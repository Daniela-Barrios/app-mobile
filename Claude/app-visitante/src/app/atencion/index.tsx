import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Boton, CajaAviso, Subtitulo, Titulo } from '@/components/ui';
import { color, espacio, radio } from '@/lib/tema';

const ANCHO = Dimensions.get('window').width;

interface Opcion { id: 'chat' | 'voz' | 'video'; icono: string; titulo: string; texto: string }

const OPCIONES: Opcion[] = [
  { id: 'chat', icono: '💬', titulo: 'Escribirle', texto: 'Chat con el vigilante, sin hablar ni ser visto.' },
  { id: 'voz', icono: '📞', titulo: 'Llamada de voz', texto: 'Habla con el vigilante; él no te ve.' },
  { id: 'video', icono: '📹', titulo: 'Videollamada', texto: 'El vigilante te ve y te escucha en vivo.' },
];

/**
 * "Sliders de atención": las formas de hablar con el vigilante, como tarjetas que se deslizan —
 * mismas tres opciones que el kiosco físico de Vigilante Virtual (src/kiosco/atencion.tsx en el
 * otro proyecto). Todavía sin conectar a ningún servidor (ver README): al elegir una, por ahora
 * solo se marca cuál se eligió.
 */
export default function Atencion() {
  const [pagina, setPagina] = useState(0);
  const [elegida, setElegida] = useState<Opcion | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: color.papel }}>
      <View style={{ padding: espacio.lg, gap: espacio.xs }}>
        <Titulo>¿Cómo prefieres hablar?</Titulo>
        <Subtitulo>Desliza para ver las opciones.</Subtitulo>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPagina(Math.round(e.nativeEvent.contentOffset.x / ANCHO))}
      >
        {OPCIONES.map((o) => (
          <View key={o.id} style={[estilos.tarjeta, { width: ANCHO - espacio.lg * 2, marginHorizontal: espacio.lg }]}>
            <Text style={{ fontSize: 56 }}>{o.icono}</Text>
            <Titulo>{o.titulo}</Titulo>
            <Subtitulo>{o.texto}</Subtitulo>
            <Boton onPress={() => setElegida(o)}>Elegir {o.titulo.toLowerCase()}</Boton>
          </View>
        ))}
      </ScrollView>

      <View style={estilos.puntos}>
        {OPCIONES.map((o, i) => (
          <View key={o.id} style={[estilos.punto, i === pagina && estilos.puntoActivo]} />
        ))}
      </View>

      <View style={{ padding: espacio.lg }}>
        {elegida && (
          <CajaAviso tono="aviso" texto={`Elegiste "${elegida.titulo}". Falta conectar esta app con el servidor de Vigilante Virtual para que la llamada llegue de verdad.`} />
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: color.blanco, borderRadius: radio.xl, borderWidth: 1, borderColor: color.linea,
    padding: espacio.xl, gap: espacio.md, alignItems: 'center', justifyContent: 'center', minHeight: 280,
  },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: espacio.xs, marginTop: espacio.md },
  punto: { width: 8, height: 8, borderRadius: radio.pastilla, backgroundColor: color.linea },
  puntoActivo: { backgroundColor: color.azul, width: 20 },
});
