import { Campo, SelectorSegmentado } from '@/components/ui';
import { TIPO_DOCUMENTO_TEXTO, type DatosVisitante, type TipoDocumento } from '@/lib/tipos';

const OPCIONES_DOCUMENTO = (Object.entries(TIPO_DOCUMENTO_TEXTO) as [TipoDocumento, string][])
  .map(([valor, texto]) => ({ valor, texto }));

/** Los campos del registro (los mismos que pide el kiosco de Vigilante Virtual), reutilizados
 * tanto en el registro manual como después de tomarse la foto. */
export function FormularioVisitante({ datos, onCambiar }: { datos: DatosVisitante; onCambiar: (d: DatosVisitante) => void }) {
  const set = <K extends keyof DatosVisitante>(campo: K, valor: DatosVisitante[K]) => onCambiar({ ...datos, [campo]: valor });

  return (
    <>
      <Campo etiqueta="Nombres *" value={datos.nombres} onChangeText={(v) => set('nombres', v)} autoCapitalize="words" />
      <Campo etiqueta="Apellidos *" value={datos.apellidos} onChangeText={(v) => set('apellidos', v)} autoCapitalize="words" />
      <SelectorSegmentado etiqueta="Tipo de documento" valor={datos.tipoDocumento} opciones={OPCIONES_DOCUMENTO} onCambiar={(v) => set('tipoDocumento', v)} />
      <Campo etiqueta="Número de documento *" value={datos.documento} onChangeText={(v) => set('documento', v)} keyboardType="number-pad" />
      <Campo etiqueta="Empresa" value={datos.empresa} onChangeText={(v) => set('empresa', v)} autoCapitalize="words" />
      <Campo etiqueta="¿A quién o a dónde visitas? *" value={datos.destino} onChangeText={(v) => set('destino', v)} autoCapitalize="words" />
      <Campo etiqueta="Motivo de la visita *" value={datos.motivo} onChangeText={(v) => set('motivo', v)} />
      <Campo etiqueta="¿Quién te autorizó?" value={datos.autorizadoPor} onChangeText={(v) => set('autorizadoPor', v)} autoCapitalize="words" />
    </>
  );
}
