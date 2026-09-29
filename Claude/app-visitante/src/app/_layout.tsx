import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { color } from '@/lib/tema';

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: color.blanco },
          headerTintColor: color.tinta,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: color.papel },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="registro/index" options={{ title: 'Registrarme' }} />
        <Stack.Screen name="registro/formulario" options={{ title: 'Tus datos' }} />
        <Stack.Screen name="registro/camara" options={{ title: 'Foto de registro' }} />
        <Stack.Screen name="registro/confirmacion" options={{ title: 'Tu pase', headerBackVisible: false }} />
        <Stack.Screen name="atencion/index" options={{ title: 'Hablar con el vigilante' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
