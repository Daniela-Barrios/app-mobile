import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Boton, Pantalla, Subtitulo, Titulo } from '@/components/ui';
import { color } from '@/lib/tema';
import { leerVisitanteActual } from '@/lib/almacen';
import type { Visitante } from '@/lib/tipos';

/** Bienvenida: si ya hay un registro reciente en este teléfono, ofrece ir directo a su pase; si
 * no, a registrarse. Mismo espíritu que la bienvenida del kiosco físico de Vigilante Virtual. */
export default function Bienvenida() {
  const [actual, setActual] = useState<Visitante | null | undefined>(undefined);

  useEffect(() => {
    leerVisitanteActual().then(setActual);
  }, []);

  return (
    <Pantalla>
      <View style={{ flex: 1 }} />
      <View style={{ width: 84, height: 84, borderRadius: 24, backgroundColor: color.azul, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 34 }}>🛡️</Text>
      </View>
      <Titulo>PGD Visitante</Titulo>
      <Subtitulo>Regístrate antes de llegar a la portería: llevas tu pase listo en el teléfono.</Subtitulo>

      {actual && (
        <Boton tono="suave" onPress={() => router.push('/registro/confirmacion')}>
          Ver mi pase — {actual.nombres} {actual.apellidos}
        </Boton>
      )}
      <Boton onPress={() => router.push('/registro')}>{actual ? 'Registrar otra visita' : 'Registrarme'}</Boton>
      <Boton tono="suave" onPress={() => router.push('/atencion')}>Hablar con el vigilante</Boton>
      <View style={{ flex: 2 }} />
    </Pantalla>
  );
}
