import { router } from 'expo-router';
import { Boton, CajaAviso, Pantalla, Subtitulo, Tarjeta, Titulo } from '@/components/ui';

/** Elegir cómo registrarse: con foto (lo recomendado — deja el registro listo para el
 * reconocimiento facial de vigilancia, Fase 0.3) o a mano. */
export default function ElegirRegistro() {
  return (
    <Pantalla>
      <Titulo>¿Cómo quieres registrarte?</Titulo>
      <Subtitulo>Con cualquiera de las dos formas queda tu pase listo para mostrar en portería.</Subtitulo>

      <Tarjeta>
        <Titulo>📷 Con foto</Titulo>
        <Subtitulo>Recomendado. Nos ayuda a reconocerte más rápido si vuelves a visitarnos.</Subtitulo>
        <Boton onPress={() => router.push('/registro/camara')}>Tomarme la foto</Boton>
      </Tarjeta>

      <Tarjeta>
        <Titulo>✍️ Solo con mis datos</Titulo>
        <Subtitulo>Sin foto — llenas el formulario a mano.</Subtitulo>
        <Boton tono="suave" onPress={() => router.push('/registro/formulario')}>Llenar el formulario</Boton>
      </Tarjeta>

      <CajaAviso texto="Tus datos se usan solo para controlar el acceso a las instalaciones, conforme a la Ley 1581 de 2012." />
    </Pantalla>
  );
}
