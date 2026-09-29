import { type ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, type TextInputProps, View,
} from 'react-native';
import { color, espacio, radio } from '@/lib/tema';

/** Piezas visuales compartidas de la app del visitante — sin librería de diseño aparte (React
 * Native puro), con la paleta de PGD (ver lib/tema.ts). */

export function Pantalla({ children }: { children: ReactNode }) {
  return <View style={estilos.pantalla}>{children}</View>;
}

export function Titulo({ children }: { children: ReactNode }) {
  return <Text style={estilos.titulo}>{children}</Text>;
}

export function Subtitulo({ children }: { children: ReactNode }) {
  return <Text style={estilos.subtitulo}>{children}</Text>;
}

type TonoBoton = 'primario' | 'suave' | 'peligro' | 'exito';

export function Boton({
  children, onPress, tono = 'primario', deshabilitado = false, cargando = false,
}: {
  children: ReactNode; onPress: () => void; tono?: TonoBoton; deshabilitado?: boolean; cargando?: boolean;
}) {
  const estiloTono = {
    primario: { fondo: color.azul, texto: color.blanco },
    suave: { fondo: color.blanco, texto: color.tinta, borde: color.linea },
    peligro: { fondo: color.peligro, texto: color.blanco },
    exito: { fondo: color.exito, texto: color.blanco },
  }[tono];
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      onPress={inactivo ? undefined : onPress}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: estiloTono.fondo, borderColor: estiloTono.borde ?? estiloTono.fondo, opacity: inactivo ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {cargando ? <ActivityIndicator color={estiloTono.texto} /> : <Text style={[estilos.botonTexto, { color: estiloTono.texto }]}>{children}</Text>}
    </Pressable>
  );
}

export function Campo({ etiqueta, ayuda, ...resto }: { etiqueta: string; ayuda?: string } & TextInputProps) {
  return (
    <View style={estilos.campoContenedor}>
      <Text style={estilos.campoEtiqueta}>{etiqueta}</Text>
      <TextInput {...resto} placeholderTextColor={color.tinta2} style={estilos.campo} />
      {ayuda ? <Text style={estilos.campoAyuda}>{ayuda}</Text> : null}
    </View>
  );
}

/** Elegir una de pocas opciones (ej. tipo de documento): más rápido de tocar en un teléfono que un
 * selector desplegable. */
export function SelectorSegmentado<T extends string>({
  etiqueta, valor, opciones, onCambiar,
}: {
  etiqueta: string; valor: T; opciones: { valor: T; texto: string }[]; onCambiar: (v: T) => void;
}) {
  return (
    <View style={estilos.campoContenedor}>
      <Text style={estilos.campoEtiqueta}>{etiqueta}</Text>
      <View style={estilos.segmentado}>
        {opciones.map((o) => {
          const activo = o.valor === valor;
          return (
            <Pressable key={o.valor} onPress={() => onCambiar(o.valor)}
              style={[estilos.segmento, activo && estilos.segmentoActivo]}>
              <Text style={[estilos.segmentoTexto, activo && estilos.segmentoTextoActivo]}>{o.texto}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Tarjeta({ children }: { children: ReactNode }) {
  return <View style={estilos.tarjeta}>{children}</View>;
}

export function CajaAviso({ texto, tono = 'aviso' }: { texto: string; tono?: 'aviso' | 'peligro' | 'exito' }) {
  const fondo = { aviso: color.avisoFondo, peligro: color.peligroFondo, exito: color.exitoFondo }[tono];
  const texto2 = { aviso: color.aviso, peligro: color.peligro, exito: color.exito }[tono];
  return (
    <View style={[estilos.caja, { backgroundColor: fondo }]}>
      <Text style={[estilos.cajaTexto, { color: texto2 }]}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.papel, padding: espacio.lg, gap: espacio.md },
  titulo: { fontSize: 26, fontWeight: '800', color: color.tinta },
  subtitulo: { fontSize: 15, color: color.tinta2, lineHeight: 21 },
  boton: {
    height: 52, borderRadius: radio.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: espacio.lg, borderWidth: 1,
  },
  botonTexto: { fontSize: 16, fontWeight: '700' },
  campoContenedor: { gap: espacio.xs },
  campoEtiqueta: { fontSize: 13, fontWeight: '700', color: color.tinta2 },
  campo: {
    height: 48, borderRadius: radio.md, borderWidth: 1, borderColor: color.linea, backgroundColor: color.blanco,
    paddingHorizontal: espacio.md, fontSize: 15, color: color.tinta,
  },
  campoAyuda: { fontSize: 12, color: color.tinta2 },
  tarjeta: {
    backgroundColor: color.blanco, borderRadius: radio.xl, borderWidth: 1, borderColor: color.linea, padding: espacio.lg, gap: espacio.md,
  },
  caja: { borderRadius: radio.md, padding: espacio.md },
  cajaTexto: { fontSize: 13.5, fontWeight: '700' },
  segmentado: { flexDirection: 'row', gap: espacio.xs },
  segmento: {
    flex: 1, height: 44, borderRadius: radio.md, borderWidth: 1, borderColor: color.linea, backgroundColor: color.blanco,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: espacio.xs,
  },
  segmentoActivo: { backgroundColor: color.azulClaro, borderColor: color.azul },
  segmentoTexto: { fontSize: 12.5, fontWeight: '700', color: color.tinta2, textAlign: 'center' },
  segmentoTextoActivo: { color: color.azul },
});
