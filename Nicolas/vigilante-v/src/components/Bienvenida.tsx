import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import {
  Accessibility,
  ArrowLeft,
  Bot,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Contact,
  CreditCard,
  DoorOpen,
  LifeBuoy,
  MessagesSquare,
  MousePointerClick,
  ScanLine,
  Send,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff
} from 'lucide-react';
import type { Kiosco } from '../api/tipos';
import { useAhora } from './piezas';
import { HologramaBienvenida } from './HologramaBienvenida';
import { fechaLarga, horaActual12, hoyISO } from '../lib/formato';

/* ============================== CONFIGURACIÓN ============================== */

const VIDEO_FONDO = '/video-vigilante.mp4.mp4';
const VIDEO_CON_SONIDO = true;

const EMPRESAS = ['Fraco', 'Kabil', 'Panamericana', 'Otra'];
const MOTIVOS = ['Visita', 'Entrega de mercancía', 'Proveedor', 'Entrevista', 'Otro'];

const TIPOS_DOCUMENTO = [
  'Cédula de ciudadanía',
  'Tarjeta de identidad',
  'Cédula de extranjería',
  'Pasaporte',
] as const;

type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

const PREGUNTAS_FRECUENTES = [
  {
    p: '¿Qué necesito para ingresar?',
    r: 'Tu documento de identidad, estar registrado y que la persona o empresa que visitas autorice tu ingreso.',
  },
  {
    p: '¿Cuál es el horario de atención?',
    r: 'La ventanilla única atiende de lunes a viernes en horario laboral. Fuera de ese horario puedes escribirle al vigilante.',
  },
  {
    p: '¿Cómo funciona el carnet o la tarjeta?',
    r: 'Si tienes carnet o tarjeta, acércalo al lector y el sistema te identifica sin necesidad de registrarte de nuevo.',
  },
  {
    p: '¿Cuánto demora la autorización?',
    r: 'Normalmente unos minutos. Si necesitas más rapidez, escríbele al vigilante.',
  },
  {
    p: '¿Qué hago si olvidé mi documento?',
    r: 'Escríbele al vigilante: te indicará cómo validar tu identidad de otra forma.',
  },
];

const PASOS_AYUDA = [
  'Si es tu primera vez, toca "Registrarme" y llena tus datos con una foto rápida.',
  'Toca "Solicitar ingreso", indica a quién visitas y el motivo.',
  'Espera la autorización. Puedes escribirle al vigilante si tienes dudas.',
  'Cuando te autoricen, acércate a la puerta. ¡Listo!',
];

/* ================================== TIPOS ================================== */

type Vista = 'menu' | 'vigilante' | 'registro' | 'ingreso' | 'faq' | 'ayuda' | 'asistente' | 'accesibilidad' | 'llamada_voz' | 'llamada_video' | 'comunicacion';

type Mensaje = { de: 'yo' | 'bot'; texto: string };
type Tema = {
  fondo: string;
  tarjeta: string;
  borde: string;
  texto: string;
  sub: string;
  acento: string;
  acentoTexto: string;
  cabecera: string;
};

const TEMA_NORMAL: Tema = {
  fondo: '#F1F5F9',
  tarjeta: '#FFFFFF',
  borde: '#D9E0EA',
  texto: '#0D1626',
  sub: '#5B6678',
  acento: '#1D4ED8',
  acentoTexto: '#FFFFFF',
  cabecera: '#0D1626',
};

const TEMA_CONTRASTE: Tema = {
  fondo: '#000000',
  tarjeta: '#000000',
  borde: '#FACC15',
  texto: '#FFFFFF',
  sub: '#FDE68A',
  acento: '#FACC15',
  acentoTexto: '#000000',
  cabecera: '#000000',
};

function hablar(texto: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'es-CO';
  window.speechSynthesis.speak(u);
}

/* ============================ COMPONENTE PRINCIPAL ============================ */

export function Bienvenida({
  kiosco,
  onEntrar,
  lector,
}: {
  kiosco: Kiosco;
  onEntrar?: () => void;
  lector?: boolean;
}) {
  const [fase, setFase] = useState<'bienvenida' | 'login' | 'panel'>('bienvenida');
  const [documentoSesion, setDocumentoSesion] = useState<{ tipo: TipoDocumento; numero: string } | null>(null);

  if (fase === 'panel' && documentoSesion) {
    return (
      <Panel
        kiosco={kiosco}
        documentoSesion={documentoSesion}
        onInicio={() => {
          setDocumentoSesion(null);
          setFase('bienvenida');
        }}
      />
    );
  }

  if (fase === 'login') {
    return (
      <LoginDocumento
        tema={TEMA_NORMAL}
        onCancelar={() => setFase('bienvenida')}
        onEntrar={(documento) => {
          setDocumentoSesion(documento);
          setFase('panel');
          onEntrar?.();
        }}
      />
    );
  }

  return (
    <BienvenidaVigilante
      kiosco={kiosco}
      lector={lector}
      onSiguiente={() => setFase('login')}
    />
  );
}

/* ================================ LOGIN ================================= */

function LoginDocumento({
  tema,
  onCancelar,
  onEntrar,
}: {
  tema: Tema;
  onCancelar: () => void;
  onEntrar: (documento: { tipo: TipoDocumento; numero: string }) => void;
}) {
  const [tipo, setTipo] = useState<TipoDocumento>('Cédula de ciudadanía');
  const [numero, setNumero] = useState('');
  const [error, setError] = useState('');

  const entrar = (e: FormEvent) => {
    e.preventDefault();
    const limpio = numero.replace(/\D/g, '');
    if (!limpio) {
      setError('Escribe tu número de documento para continuar.');
      return;
    }
    if (limpio.length < 5) {
      setError('El número de documento parece demasiado corto.');
      return;
    }
    setError('');
    onEntrar({ tipo, numero: limpio });
  };

  const colorError = tema.fondo === '#000000' ? '#FCA5A5' : '#B91C1C';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5" style={{ background: tema.fondo, color: tema.texto }}>
      <form onSubmit={entrar} className="w-full max-w-md">
        <Tarjeta tema={tema}>
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: tema.acento, color: tema.acentoTexto }}>
              <CreditCard size={32} />
            </div>
            <div>
              <p className="text-[25px] font-black">Identificación</p>
              <p className="text-[14px] mt-1" style={{ color: tema.sub }}>Antes de continuar, ingresa tu documento.</p>
            </div>
          </div>
          <Campo tema={tema} etiqueta="Tipo de documento">
            <select style={estiloInput(tema)} value={tipo} onChange={(e) => setTipo(e.target.value as TipoDocumento)}>
              {TIPOS_DOCUMENTO.map((tipoDocumento) => <option key={tipoDocumento} value={tipoDocumento}>{tipoDocumento}</option>)}
            </select>
          </Campo>
          <Campo tema={tema} etiqueta="Número de documento">
            <input style={{ ...estiloInput(tema), fontSize: 20, fontWeight: 700, letterSpacing: 1 }} inputMode="numeric" autoFocus value={numero} onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))} placeholder="Escribe tu documento" maxLength={15} />
          </Campo>
          <div className="rounded-xl p-3 text-[12px]" style={{ background: tema.fondo === '#000000' ? '#111111' : '#F8FAFC', color: tema.sub }}>
          </div>
          {error && <p className="text-[14px] font-bold text-left" style={{ color: colorError }}>{error}</p>}
          <BotonPrimario tema={tema} tipo="submit">Continuar</BotonPrimario>
          <button type="button" onClick={onCancelar} className="rounded-xl py-3 px-5 font-bold text-[15px]" style={{ border: `1px solid ${tema.borde}`, color: tema.texto }}>Volver</button>
        </Tarjeta>
      </form>
    </div>
  );
}

/* ============================ PANTALLA 1 (VIDEO) ============================ */

function BienvenidaVigilante({
  kiosco,
  lector,
  onSiguiente,
}: {
  kiosco: Kiosco;
  lector?: boolean;
  onSiguiente: () => void;
}) {
  const ahora = useAhora();
  const video = useRef<HTMLVideoElement>(null);
  const [silenciado, setSilenciado] = useState(!VIDEO_CON_SONIDO);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.volume = 1;
    v.muted = !VIDEO_CON_SONIDO;

    v.play()
      .then(() => setSilenciado(v.muted))
      .catch(() => {
        v.muted = true;
        setSilenciado(true);
        v.play().catch(() => undefined);
      });

    const activarSonido = (e: Event) => {
      if (!VIDEO_CON_SONIDO) return;
      if ((e.target as HTMLElement).closest('[data-sonido]')) return;
      if (v.muted) {
        v.muted = false;
        v.volume = 1;
        v.play().catch(() => undefined);
        setSilenciado(false);
      }
      window.removeEventListener('pointerdown', activarSonido);
    };
    window.addEventListener('pointerdown', activarSonido);
    return () => window.removeEventListener('pointerdown', activarSonido);
  }, []);

  const alternarSonido = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    v.volume = 1;
    v.play().catch(() => undefined);
    setSilenciado(v.muted);
  };

  return (
    <div
      className="relative overflow-hidden flex-1 flex flex-col items-center justify-center gap-5 bg-tinta text-white text-center px-6"
      style={{ isolation: 'isolate' }}
    >
      <video
        ref={video}
        src={VIDEO_FONDO}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: -1 }}
        autoPlay
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: -1,
          background:
            'linear-gradient(to bottom, rgba(13,22,38,.75) 0%, rgba(13,22,38,.65) 28%, rgba(13,22,38,0) 38%, rgba(13,22,38,0) 66%, rgba(13,22,38,.65) 76%, rgba(13,22,38,.75) 100%)',
        }}
      />

      <button
        data-sonido
        onClick={alternarSonido}
        aria-label={silenciado ? 'Activar sonido' : 'Silenciar'}
        className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/50 backdrop-blur px-4 py-2 text-[14px] font-bold"
      >
        {silenciado ? <VolumeX size={20} /> : <Volume2 size={20} />}
        {silenciado ? 'Activar sonido' : 'Sonido'}
      </button>

      <HologramaBienvenida tamano={300} />
      <div>
        <h1 className="text-[36px] font-bold leading-tight">Vigilante Virtual</h1>
        <p className="text-[18px] text-white/80 mt-2">{kiosco.sede}</p>
      </div>

      <button
        onClick={onSiguiente}
        className="flex items-center gap-3 font-bold text-[20px] px-8 py-4 rounded-full parpadeo mt-4"
        style={{ backgroundColor: '#FBBF24', color: '#0D1626' }}
      >
        <MousePointerClick size={26} aria-hidden="true" />
        Toca para comenzar
      </button>

      {lector && (
        <p className="flex items-center gap-3 text-[15px] text-white/75">
          <ScanLine size={26} aria-hidden="true" />¿Tienes carnet o tarjeta? Acércalo al lector
        </p>
      )}
      <div className="absolute bottom-6 left-0 right-0 cifras text-white/60 text-[14px]">
        {horaActual12(ahora)} · {fechaLarga(hoyISO(ahora))}
      </div>
    </div>
  );
}

/* ============================ PANTALLA 2 (PANEL) ============================ */

const TITULOS: Record<Vista, string> = {
  menu: '¿En qué te ayudamos?',
  vigilante: 'Chat con el vigilante',
  registro: 'Registrarme',
  ingreso: 'Solicitar ingreso',
  faq: 'Preguntas frecuentes',
  ayuda: 'Ayuda',
  asistente: 'Asistente virtual',
  accesibilidad: 'Accesibilidad',
  llamada_voz: 'Llamada de voz',
  llamada_video: 'Videollamada',
  comunicacion: 'Centro de comunicación',
};

type DatosRegistro = {
  tipoDocumento: TipoDocumento;
  nombre: string;
  documento: string;
  empresa: string;
  telefono: string;
};

type RegistroSesion = {
  datos: DatosRegistro;
  foto: string;
  token: string;
  segundos: number;
};

const generarToken = () => Math.floor(100000 + Math.random() * 900000).toString();

function Panel({
  kiosco,
  documentoSesion,
  onInicio,
}: {
  kiosco: Kiosco;
  documentoSesion: { tipo: TipoDocumento; numero: string };
  onInicio: () => void;
}) {
  const ahora = useAhora();
  const [vista, setVista] = useState<Vista>('menu');
  const [grande, setGrande] = useState(false);
  const [contraste, setContraste] = useState(false);
  const [voz, setVoz] = useState(false);
  const [registroActivo, setRegistroActivo] = useState<RegistroSesion | null>(null);
  const tema = contraste ? TEMA_CONTRASTE : TEMA_NORMAL;

  useEffect(() => {
    if (voz) hablar(TITULOS[vista]);
  }, [vista, voz]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // El token vive en la sesión completa del Panel, no dentro de VistaRegistro.
  // Así no se pierde al volver al menú y sigue cambiando cada 15 segundos.
  useEffect(() => {
    if (!registroActivo) return;

    const intervalo = window.setInterval(() => {
      setRegistroActivo((actual) => {
        if (!actual) return actual;

        if (actual.segundos <= 1) {
          return {
            ...actual,
            token: generarToken(),
            segundos: 15,
          };
        }

        return {
          ...actual,
          segundos: actual.segundos - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalo);
  }, [Boolean(registroActivo)]);

  const cerrarSesion = () => {
    // Al cerrar la sesión se invalida inmediatamente el registro y su token.
    setRegistroActivo(null);
    setVista('menu');
    onInicio();
  };

  const volver = () => (vista === 'menu' ? cerrarSesion() : setVista('menu'));

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{ background: tema.fondo, color: tema.texto, zoom: grande ? 1.2 : 1 }}
    >
      <header
        className="flex items-center gap-3 px-4 py-4 text-white"
        style={{ background: tema.cabecera, borderBottom: contraste ? `2px solid ${tema.borde}` : undefined }}
      >
        <button
          onClick={volver}
          className="flex items-center gap-1 rounded-xl border border-white/40 px-3 py-2 text-[15px] font-bold"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {vista === 'menu' ? 'Cerrar sesión' : 'Atrás'}
        </button>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] text-white/70 truncate">{kiosco.sede}</p>
          <h1 className="text-[20px] font-bold leading-tight truncate">{TITULOS[vista]}</h1>
        </div>
        <div className="text-right cifras">
          <p className="text-[20px] font-bold">{horaActual12(ahora)}</p>
          <p className="text-[10px] text-white/70">{fechaLarga(hoyISO(ahora))}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {vista === 'menu' && (
          <Menu
            tema={tema}
            ir={setVista}
            registroActivo={registroActivo}
          />
        )}
        {vista === 'comunicacion' && <VistaComunicacion tema={tema} ir={setVista} />}
        {vista === 'llamada_voz' && <VistaSimulacionLlamada tema={tema} tipo="voz" alTerminar={() => setVista('menu')} />}
        {vista === 'llamada_video' && <VistaSimulacionLlamada tema={tema} tipo="video" alTerminar={() => setVista('menu')} />}
        {vista === 'vigilante' && <VistaVigilante tema={tema} voz={voz} />}
        {vista === 'registro' && (
          <VistaRegistro
            tema={tema}
            documentoSesion={documentoSesion}
            registroActivo={registroActivo}
            alRegistrar={(registro) => {
              setRegistroActivo(registro);
            }}
            alTerminar={() => setVista('menu')}
            alCerrarSesion={cerrarSesion}
          />
        )}
        {vista === 'ingreso' && <VistaIngreso tema={tema} alTerminar={() => setVista('menu')} />}
        {vista === 'faq' && <VistaFAQ tema={tema} />}
        {vista === 'ayuda' && <VistaAyuda tema={tema} ir={setVista} />}
        {vista === 'asistente' && <VistaAsistente tema={tema} voz={voz} />}
        {vista === 'accesibilidad' && (
          <VistaAccesibilidad
            tema={tema}
            grande={grande}
            setGrande={setGrande}
            contraste={contraste}
            setContraste={setContraste}
            voz={voz}
            setVoz={setVoz}
          />
        )}
      </main>

      <footer
        className="flex items-center justify-between px-4 py-3 text-[12px]"
        style={{ background: tema.tarjeta, borderTop: `1px solid ${tema.borde}`, color: tema.sub }}
      >
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#0F766E' }} />
          En línea
        </span>
        <span>Vigilante Virtual · PGD</span>
      </footer>
    </div>
  );
}

/* ---------------------------------- Menú ---------------------------------- */

function Menu({
  tema,
  ir,
  registroActivo,
}: {
  tema: Tema;
  ir: (v: Vista) => void;
  registroActivo: RegistroSesion | null;
}) {
  const items: { v: Vista; titulo: string; sub: string; Icono: typeof Bot }[] = [
    { v: 'comunicacion', titulo: 'Comunicación', sub: 'Llama, haz videollamada o chatea', Icono: Phone },
    { v: 'registro', titulo: 'Registrarme', sub: 'Completa tus datos y toma una foto', Icono: Contact },
    { v: 'ingreso', titulo: 'Solicitar ingreso', sub: 'Pide permiso para entrar a la bodega', Icono: DoorOpen },
    { v: 'faq', titulo: 'Preguntas frecuentes', sub: 'Requisitos, horarios, carnet y más', Icono: CircleHelp },
    { v: 'ayuda', titulo: 'Ayuda', sub: 'Cómo funciona, paso a paso', Icono: LifeBuoy },
    { v: 'asistente', titulo: 'Asistente virtual', sub: 'Pregúntale lo que necesites saber', Icono: Bot },
    { v: 'accesibilidad', titulo: 'Accesibilidad', sub: 'Texto grande, contraste y voz', Icono: Accessibility },
  ];

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => ir('vigilante')}
        className="rounded-2xl p-5 text-left flex flex-col gap-6"
        style={{ background: tema.acento, color: tema.acentoTexto, border: `1px solid ${tema.borde}` }}
      >
        <MessagesSquare size={30} aria-hidden="true" />
        <div>
          <p className="text-[18px] font-bold">Hablar con el vigilante</p>
          <p className="text-[12px] opacity-90 mt-1">Escríbele y resuelve tu consulta</p>
        </div>
      </button>

      {registroActivo && (
        <button
          onClick={() => ir('registro')}
          className="relative overflow-hidden rounded-2xl p-4 text-left"
          style={{
            background: tema.cabecera,
            color: '#FFFFFF',
            border: `2px solid ${tema.acento}`,
            boxShadow: `0 8px 25px rgba(0,0,0,.12)`,
          }}
        >
          <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full opacity-20" style={{ background: tema.acento }} />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-widest text-white/70">
                Código activo
              </p>
              <p className="text-[15px] font-bold mt-1 truncate">{registroActivo.datos.nombre}</p>
              <p className="text-[11px] text-white/60 mt-1">
                Se actualiza automáticamente
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-bold text-white/60">TOKEN</p>
              <p className="text-[28px] font-black tracking-[4px]" style={{ color: tema.acento === '#1D4ED8' ? '#93C5FD' : tema.acento }}>
                {registroActivo.token}
              </p>
              <p className="text-[10px] font-bold text-white/60">{registroActivo.segundos}s</p>
            </div>
          </div>
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        {items.map(({ v, titulo, sub, Icono }) => (
          <button
            key={v}
            onClick={() => ir(v)}
            className="rounded-2xl p-4 text-left flex flex-col gap-5 min-h-[130px] transition-transform active:scale-95"
            style={{ background: tema.tarjeta, border: `1px solid ${tema.borde}`, color: tema.texto }}
          >
            <Icono size={26} style={{ color: tema.acento }} aria-hidden="true" />
            <div>
              <p className="text-[16px] font-bold leading-tight">{titulo}</p>
              <p className="text-[11px] mt-1" style={{ color: tema.sub }}>
                {sub}
              </p>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => ir('registro')}
        className="rounded-2xl p-4 text-left"
        style={{ background: tema.tarjeta, border: `1px solid ${tema.borde}`, color: tema.texto }}
      >
        <p className="text-[14px] font-bold">Administrar mi registro</p>
        <p className="text-[11px] mt-1" style={{ color: tema.sub }}>
          Consulta tu código o finaliza tu registro activo.
        </p>
      </button>
    </div>
  );
}

/* ----------------------------- Centro de Comunicación ----------------------------- */

function VistaComunicacion({ tema, ir }: { tema: Tema; ir: (v: Vista) => void }) {
  return (
    <div className="flex flex-col gap-4 mt-2">
      <p className="text-[15px] text-center mb-2 font-medium" style={{ color: tema.sub }}>
        ¿Cómo prefieres contactar al vigilante?
      </p>
      
      <div className="flex flex-col gap-3">
        <button
          onClick={() => ir('llamada_voz')}
          className="rounded-2xl p-5 text-left flex items-center gap-5 shadow-sm transition-transform active:scale-95"
          style={{ background: '#16A34A', color: '#FFFFFF' }}
        >
          <Phone size={32} aria-hidden="true" />
          <div>
            <p className="text-[18px] font-bold">Llamada de voz</p>
            <p className="text-[13px] opacity-90 mt-1">Habla con el vigilante por audio</p>
          </div>
        </button>

        <button
          onClick={() => ir('llamada_video')}
          className="rounded-2xl p-5 text-left flex items-center gap-5 shadow-sm transition-transform active:scale-95"
          style={{ background: '#2563EB', color: '#FFFFFF' }}
        >
          <Video size={32} aria-hidden="true" />
          <div>
            <p className="text-[18px] font-bold">Videollamada</p>
            <p className="text-[13px] opacity-90 mt-1">Llama con cámara activada</p>
          </div>
        </button>

        <button
          onClick={() => ir('vigilante')}
          className="rounded-2xl p-5 text-left flex items-center gap-5 shadow-sm transition-transform active:scale-95"
          style={{ background: tema.acento, color: tema.acentoTexto }}
        >
          <MessagesSquare size={32} aria-hidden="true" />
          <div>
            <p className="text-[18px] font-bold">Chat de texto</p>
            <p className="text-[13px] opacity-90 mt-1">Escríbele un mensaje al vigilante</p>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Piezas comunes ----------------------------- */

function Tarjeta({ tema, children }: { tema: Tema; children: ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-4"
      style={{ background: tema.tarjeta, border: `1px solid ${tema.borde}` }}
    >
      {children}
    </div>
  );
}

function Campo({
  tema,
  etiqueta,
  children,
}: {
  tema: Tema;
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-left">
      <span className="text-[13px] font-bold" style={{ color: tema.sub }}>
        {etiqueta}
      </span>
      {children}
    </label>
  );
}

const estiloInput = (tema: Tema): CSSProperties => ({
  background: tema.tarjeta,
  color: tema.texto,
  border: `1px solid ${tema.borde}`,
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 16,
  width: '100%',
});

function BotonPrimario({
  tema,
  onClick,
  children,
  tipo = 'button',
  deshabilitado,
}: {
  tema: Tema;
  onClick?: () => void;
  children: ReactNode;
  tipo?: 'button' | 'submit';
  deshabilitado?: boolean;
}) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={deshabilitado}
      className="rounded-xl py-3 px-5 font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-95"
      style={{ background: tema.acento, color: tema.acentoTexto }}
    >
      {children}
    </button>
  );
}

function Exito({ tema, titulo, detalle, alVolver }: { tema: Tema; titulo: string; detalle: string; alVolver: () => void }) {
  return (
    <Tarjeta tema={tema}>
      <div className="flex flex-col items-center gap-3 text-center py-4">
        <span
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: tema.acento, color: tema.acentoTexto }}
        >
          <Check size={30} aria-hidden="true" />
        </span>
        <p className="text-[20px] font-bold">{titulo}</p>
        <p className="text-[14px]" style={{ color: tema.sub }}>
          {detalle}
        </p>
      </div>
      <BotonPrimario tema={tema} onClick={alVolver}>
        Volver al menú
      </BotonPrimario>
    </Tarjeta>
  );
}

function contrasteFondoBot(tema: Tema) {
  return tema.fondo === '#000000' ? '#000000' : '#EEF2F7';
}

function Chat({
  tema,
  mensajes,
  onEnviar,
  placeholder,
  sugerencias,
}: {
  tema: Tema;
  mensajes: Mensaje[];
  onEnviar: (texto: string) => void;
  placeholder: string;
  sugerencias?: string[];
}) {
  const [texto, setTexto] = useState('');
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = (e?: FormEvent) => {
    e?.preventDefault();
    const t = texto.trim();
    if (!t) return;
    onEnviar(t);
    setTexto('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-2xl p-3 flex flex-col gap-2 overflow-y-auto"
        style={{ background: tema.tarjeta, border: `1px solid ${tema.borde}`, height: '52vh' }}
      >
        {mensajes.map((m, i) => (
          <div
            key={i}
            className="max-w-[85%] rounded-2xl px-4 py-2 text-[15px] text-left"
            style={
              m.de === 'yo'
                ? { alignSelf: 'flex-end', background: tema.acento, color: tema.acentoTexto }
                : {
                    alignSelf: 'flex-start',
                    background: contrasteFondoBot(tema),
                    color: tema.texto,
                    border: `1px solid ${tema.borde}`,
                  }
            }
          >
            {m.texto}
          </div>
        ))}
        <div ref={fin} />
      </div>

      {sugerencias && (
        <div className="flex flex-wrap gap-2">
          {sugerencias.map((s) => (
            <button
              key={s}
              onClick={() => onEnviar(s)}
              className="rounded-full px-3 py-2 text-[13px] font-bold transition-transform active:scale-95"
              style={{ border: `1px solid ${tema.acento}`, color: tema.acento, background: tema.tarjeta }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={enviar} className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          style={estiloInput(tema)}
        />
        <button
          type="submit"
          aria-label="Enviar"
          className="rounded-xl px-4 flex items-center justify-center transition-transform active:scale-95"
          style={{ background: tema.acento, color: tema.acentoTexto }}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

/* ---------------------------- Hablar con vigilante (chat) --------------------------- */

function VistaVigilante({ tema, voz }: { tema: Tema; voz: boolean }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { de: 'bot', texto: 'Hola, soy el vigilante virtual. Escríbeme tu consulta y te ayudo.' },
  ]);

  const enviar = (texto: string) => {
    setMensajes((m) => [...m, { de: 'yo', texto }]);
    setTimeout(() => {
      const r = 'Recibido. Un vigilante te responderá en breve.';
      setMensajes((m) => [...m, { de: 'bot', texto: r }]);
      if (voz) hablar(r);
    }, 900);
  };

  return <Chat tema={tema} mensajes={mensajes} onEnviar={enviar} placeholder="Escribe tu mensaje…" />;
}


/* -------------------------------- Registrarme ------------------------------- */

function VistaRegistro({
  tema,
  documentoSesion,
  registroActivo,
  alRegistrar,
  alTerminar,
  alCerrarSesion,
}: {
  tema: Tema;
  documentoSesion: { tipo: TipoDocumento; numero: string };
  registroActivo: RegistroSesion | null;
  alRegistrar: (registro: RegistroSesion) => void;
  alTerminar: () => void;
  alCerrarSesion: () => void;
}) {
  const [datos, setDatos] = useState<DatosRegistro>(
    registroActivo?.datos ?? { tipoDocumento: documentoSesion.tipo, nombre: '', documento: documentoSesion.numero, empresa: '', telefono: '' },
  );
  const [foto, setFoto] = useState<string | null>(registroActivo?.foto ?? null);
  const [error, setError] = useState('');
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [camaraLista, setCamaraLista] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cambiar = (k: keyof DatosRegistro, v: string) => setDatos((d) => ({ ...d, [k]: v }));

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamaraLista(false);
    setCamaraAbierta(false);
  };

  const abrirCamara = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite acceder a la cámara. Prueba usando Chrome desde localhost.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamaraAbierta(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => setCamaraLista(true)).catch(() => undefined);
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setError('No se pudo abrir la cámara. Revisa que hayas permitido el acceso a la cámara.');
    }
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('La cámara todavía no está lista. Espera un momento.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const contexto = canvas.getContext('2d');
    if (!contexto) {
      setError('No fue posible capturar la imagen.');
      return;
    }
    contexto.translate(canvas.width, 0);
    contexto.scale(-1, 1);
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFoto(canvas.toDataURL('image/jpeg', 0.85));
    setError('');
    detenerCamara();
  };

  const guardarRegistro = (e: FormEvent) => {
    e.preventDefault();
    if (!datos.nombre.trim()) {
      setError('Escribe tu nombre completo.');
      return;
    }
    if (!foto) {
      setError('Toma una foto para continuar.');
      return;
    }
    const registro: RegistroSesion = {
      datos: { ...datos, tipoDocumento: documentoSesion.tipo, documento: documentoSesion.numero },
      foto,
      token: registroActivo?.token ?? generarToken(),
      segundos: registroActivo?.segundos ?? 15,
    };
    setError('');
    alRegistrar(registro);
  };

  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
  }, []);

  if (registroActivo) {
    const porcentaje = (registroActivo.segundos / 15) * 100;
    return (
      <div className="flex flex-col gap-4">
        <Tarjeta tema={tema}>
          <div className="text-center">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full flex items-center justify-center" style={{ background: tema.acento, color: tema.acentoTexto }}><Check size={30} /></div>
            <p className="text-[22px] font-bold">Registro activo</p>
            <p className="text-[14px] mt-1" style={{ color: tema.sub }}>Tu código permanece activo durante esta sesión.</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: tema.fondo === '#000000' ? '#111111' : '#F8FAFC', border: `1px solid ${tema.borde}` }}>
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color: tema.sub }}>Persona registrada</p>
            <div className="flex items-center gap-4">
              <img src={registroActivo.foto} alt="Foto del visitante" className="w-20 h-20 rounded-full object-cover shrink-0" style={{ border: `3px solid ${tema.acento}` }} />
              <div className="min-w-0 text-left">
                <p className="text-[19px] font-bold truncate">{registroActivo.datos.nombre}</p>
                <p className="text-[13px] mt-1" style={{ color: tema.sub }}>{registroActivo.datos.tipoDocumento}: {registroActivo.datos.documento}</p>
                {registroActivo.datos.empresa && <p className="text-[13px]" style={{ color: tema.sub }}>Empresa: {registroActivo.datos.empresa}</p>}
                {registroActivo.datos.telefono && <p className="text-[13px]" style={{ color: tema.sub }}>Teléfono: {registroActivo.datos.telefono}</p>}
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[28px] p-6 text-center" style={{ background: `linear-gradient(145deg, ${tema.cabecera} 0%, ${tema.cabecera} 55%, ${tema.acento} 180%)`, border: `1px solid ${tema.acento}`, boxShadow: '0 12px 35px rgba(0,0,0,.18)' }}>
            <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-20" style={{ background: tema.acento }} />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 text-white/70"><span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} /><span className="text-[11px] font-bold uppercase tracking-[0.22em]">Código activo</span></div>
              <p className="text-[11px] font-semibold text-white/60 mt-4">PRESENTA ESTE CÓDIGO</p>
              <p className="text-[52px] leading-none font-black tracking-[9px] mt-2 text-white" style={{ textShadow: '0 3px 15px rgba(0,0,0,.25)' }}>{registroActivo.token}</p>
              <div className="mt-6"><div className="flex items-center justify-between text-[11px] font-bold text-white/60 mb-2"><span>Código temporal</span><span>{registroActivo.segundos}s</span></div><div className="h-2 rounded-full overflow-hidden bg-white/20"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${porcentaje}%`, background: '#FFFFFF' }} /></div></div>
              <p className="text-[12px] text-white/70 mt-4">Se renueva automáticamente cada 15 segundos</p>
            </div>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: tema.fondo === '#000000' ? '#1A1A1A' : '#EFF6FF', color: tema.sub }}><p className="text-[14px] font-semibold">Presenta el código actual al vigilante para validar tu registro.</p></div>
          <BotonPrimario tema={tema} onClick={alTerminar}>Volver al menú</BotonPrimario>
          <button
            type="button"
            onClick={alCerrarSesion}
            className="rounded-xl py-3 px-5 font-bold text-[15px]"
            style={{
              border: `1px solid ${tema.borde}`,
              color: tema.texto,
              background: tema.tarjeta,
            }}
          >
            Cerrar sesión y desactivar registro
          </button>
        </Tarjeta>
      </div>
    );
  }


  return (
    <form onSubmit={guardarRegistro}>
      <Tarjeta tema={tema}>
        <Campo tema={tema} etiqueta="Tipo de documento">
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: tema.fondo === '#000000' ? '#111111' : '#F8FAFC', border: `1px solid ${tema.borde}` }}
          >
            <CreditCard size={20} style={{ color: tema.acento }} />
            <span className="font-bold">{datos.tipoDocumento}</span>
          </div>
        </Campo>

        <Campo tema={tema} etiqueta="Número de documento">
          <div className="relative">
            <input
              style={{ ...estiloInput(tema), paddingRight: 110, opacity: 0.78 }}
              value={datos.documento}
              readOnly
              aria-readonly="true"
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-[11px] font-bold"
              style={{ background: tema.fondo === '#000000' ? '#27272A' : '#E2E8F0', color: tema.sub }}
            >
              Bloqueado
            </span>
          </div>
        </Campo>

        <Campo tema={tema} etiqueta="Nombre completo">
          <input style={estiloInput(tema)} value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} autoComplete="name" />
        </Campo>
        <Campo tema={tema} etiqueta="Empresa (opcional)">
          <input style={estiloInput(tema)} value={datos.empresa} onChange={(e) => cambiar('empresa', e.target.value)} />
        </Campo>
        <Campo tema={tema} etiqueta="Teléfono (opcional)">
          <input style={estiloInput(tema)} inputMode="tel" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value.replace(/[^\d+]/g, ''))} />
        </Campo>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-left" style={{ color: tema.sub }}>
            Foto rápida
          </span>
          {foto && (
            <div className="flex flex-col items-center gap-3">
              <img src={foto} alt="Foto tomada" className="w-40 h-40 rounded-2xl object-cover" />
              <button
                type="button"
                onClick={abrirCamara}
                className="font-bold text-[14px]"
                style={{ color: tema.acento }}
              >
                Tomar otra foto
              </button>
            </div>
          )}

          {!foto && (
            <button
              type="button"
              onClick={abrirCamara}
              className="rounded-xl py-4 font-bold text-[16px] flex items-center justify-center gap-2 cursor-pointer"
              style={{
                border: `1px dashed ${tema.acento}`,
                color: tema.acento,
                background: tema.tarjeta,
              }}
            >
              <Camera size={22} />
              Tomar foto
            </button>
          )}
        </div>

        {error && (
          <p className="text-[14px] font-bold text-left" style={{ color: colorError }}>
            {error}
          </p>
        )}
        <BotonPrimario tema={tema} tipo="submit">
          Guardar registro
        </BotonPrimario>
      </Tarjeta>

      {camaraAbierta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
        >
          <div
            className="w-full max-w-lg rounded-3xl p-4 flex flex-col gap-4"
            style={{ background: tema.tarjeta, border: `1px solid ${tema.borde}` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[18px] font-bold">Tomar foto</p>
                <p className="text-[12px]" style={{ color: tema.sub }}>
                  Mira a la cámara y toca el botón cuando estés listo.
                </p>
              </div>
              <button
                type="button"
                onClick={detenerCamara}
                className="rounded-xl px-3 py-2 font-bold"
                style={{ border: `1px solid ${tema.borde}`, color: tema.texto }}
              >
                Cerrar
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute inset-5 rounded-3xl border-2 border-white/40 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={capturarFoto}
              disabled={!camaraLista}
              className="rounded-2xl py-4 font-bold text-[17px] flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: tema.acento, color: tema.acentoTexto }}
            >
              <Camera size={24} />
              {camaraLista ? 'Tomar foto' : 'Preparando cámara...'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

/* ---------------------------- Solicitar ingreso ---------------------------- */

function VistaIngreso({ tema, alTerminar }: { tema: Tema; alTerminar: () => void }) {
  const [documento, setDocumento] = useState('');
  const [empresa, setEmpresa] = useState(EMPRESAS[0]);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [persona, setPersona] = useState('');
  const [error, setError] = useState('');
  const [codigo, setCodigo] = useState<number | null>(null);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!documento.trim()) {
      setError('Escribe tu número de documento.');
      return;
    }
    setError('');
    setCodigo(Math.floor(1000 + Math.random() * 9000));
  };

  if (codigo) {
    return (
      <Exito
        tema={tema}
        titulo={`Solicitud #${codigo} enviada`}
        detalle="Estado: pendiente de autorización. El vigilante te avisará cuando puedas ingresar."
        alVolver={alTerminar}
      />
    );
  }

  const colorError = tema.fondo === '#000000' ? '#FCA5A5' : '#B91C1C';

  return (
    <form onSubmit={enviar}>
      <Tarjeta tema={tema}>
        <Campo tema={tema} etiqueta="Número de documento">
          <input style={estiloInput(tema)} inputMode="numeric" value={documento} onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ''))} />
        </Campo>
        <Campo tema={tema} etiqueta="¿A qué empresa visitas?">
          <select style={estiloInput(tema)} value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
            {EMPRESAS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </Campo>
        <Campo tema={tema} etiqueta="¿A quién visitas? (opcional)">
          <input style={estiloInput(tema)} value={persona} onChange={(e) => setPersona(e.target.value)} />
        </Campo>
        <Campo tema={tema} etiqueta="Motivo">
          <select style={estiloInput(tema)} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Campo>
        {error && (
          <p className="text-[14px] font-bold text-left" style={{ color: colorError }}>
            {error}
          </p>
        )}
        <BotonPrimario tema={tema} tipo="submit">
          Enviar solicitud
        </BotonPrimario>
      </Tarjeta>
    </form>
  );
}

/* ---------------------------- Preguntas frecuentes ---------------------------- */

function VistaFAQ({ tema }: { tema: Tema }) {
  const [abierta, setAbierta] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-3">
      {PREGUNTAS_FRECUENTES.map((item, i) => {
        const activa = abierta === i;
        return (
          <div
            key={item.p}
            className="rounded-2xl overflow-hidden"
            style={{ background: tema.tarjeta, border: `1px solid ${tema.borde}` }}
          >
            <button
              onClick={() => setAbierta(activa ? null : i)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left font-bold text-[16px]"
              aria-expanded={activa}
            >
              {item.p}
              <ChevronDown
                size={22}
                style={{ transform: activa ? 'rotate(180deg)' : undefined, color: tema.acento, flexShrink: 0 }}
              />
            </button>
            {activa && (
              <p className="px-4 pb-4 text-[15px] text-left" style={{ color: tema.sub }}>
                {item.r}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------- Ayuda ----------------------------------- */

function VistaAyuda({ tema, ir }: { tema: Tema; ir: (v: Vista) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Tarjeta tema={tema}>
        {PASOS_AYUDA.map((paso, i) => (
          <div key={i} className="flex items-start gap-3 text-left">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ background: tema.acento, color: tema.acentoTexto }}
            >
              {i + 1}
            </span>
            <p className="text-[15px] pt-1">{paso}</p>
          </div>
        ))}
      </Tarjeta>
      <BotonPrimario tema={tema} onClick={() => ir('vigilante')}>
        <MessagesSquare size={20} /> Hablar con el vigilante
      </BotonPrimario>
    </div>
  );
}

/* ------------------------------ Asistente virtual ----------------------------- */

const RESPUESTAS: { claves: string[]; texto: string }[] = [
  { claves: ['requisito', 'necesito', 'ingresar', 'entrar'], texto: PREGUNTAS_FRECUENTES[0].r },
  { claves: ['horario', 'hora', 'atienden', 'abierto'], texto: PREGUNTAS_FRECUENTES[1].r },
  { claves: ['carnet', 'tarjeta', 'lector'], texto: PREGUNTAS_FRECUENTES[2].r },
  { claves: ['demora', 'tarda', 'autorizacion', 'autorización', 'cuanto', 'cuánto'], texto: PREGUNTAS_FRECUENTES[3].r },
  { claves: ['olvide', 'olvidé', 'documento', 'cedula', 'cédula'], texto: PREGUNTAS_FRECUENTES[4].r },
  { claves: ['registr'], texto: 'Toca "Registrarme" en el menú, llena tus datos y toma una foto rápida.' },
  { claves: ['hola', 'buenas', 'buenos'], texto: '¡Hola! ¿En qué te puedo ayudar?' },
];

function VistaAsistente({ tema, voz }: { tema: Tema; voz: boolean }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { de: 'bot', texto: 'Hola, soy el asistente virtual. Pregúntame por requisitos, horarios, carnet o registro.' },
  ]);

  const responder = (texto: string) => {
    setMensajes((m) => [...m, { de: 'yo', texto }]);
    const t = texto.toLowerCase();
    const hallada = RESPUESTAS.find((r) => r.claves.some((c) => t.includes(c)));
    const respuesta =
      hallada?.texto ??
      'No estoy seguro de eso. Prueba con otra pregunta o escríbele al vigilante desde el menú.';
    setTimeout(() => {
      setMensajes((m) => [...m, { de: 'bot', texto: respuesta }]);
      if (voz) hablar(respuesta);
    }, 600);
  };

  return (
    <Chat
      tema={tema}
      mensajes={mensajes}
      onEnviar={responder}
      placeholder="Pregunta lo que necesites…"
      sugerencias={['¿Qué necesito para ingresar?', 'Horarios', '¿Cómo uso el carnet?']}
    />
  );
}

/* -------------------------------- Accesibilidad ------------------------------- */

function VistaAccesibilidad({
  tema,
  grande,
  setGrande,
  contraste,
  setContraste,
  voz,
  setVoz,
}: {
  tema: Tema;
  grande: boolean;
  setGrande: (v: boolean) => void;
  contraste: boolean;
  setContraste: (v: boolean) => void;
  voz: boolean;
  setVoz: (v: boolean) => void;
}) {
  const filas = [
    { titulo: 'Texto grande', sub: 'Aumenta el tamaño de todo el contenido', valor: grande, cambiar: setGrande },
    { titulo: 'Alto contraste', sub: 'Fondo negro con letras amarillas y blancas', valor: contraste, cambiar: setContraste },
    {
      titulo: 'Lectura en voz alta',
      sub: 'El panel lee los títulos y las respuestas',
      valor: voz,
      cambiar: (v: boolean) => {
        setVoz(v);
        if (v) hablar('Lectura en voz alta activada');
        else window.speechSynthesis?.cancel();
      },
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {filas.map((f) => (
        <button
          key={f.titulo}
          onClick={() => f.cambiar(!f.valor)}
          role="switch"
          aria-checked={f.valor}
          className="rounded-2xl p-4 flex items-center justify-between gap-4 text-left"
          style={{ background: tema.tarjeta, border: `1px solid ${tema.borde}` }}
        >
          <div>
            <p className="text-[16px] font-bold">{f.titulo}</p>
            <p className="text-[12px] mt-1" style={{ color: tema.sub }}>
              {f.sub}
            </p>
          </div>
          <span
            className="relative w-14 h-8 rounded-full shrink-0 transition-colors"
            style={{ background: f.valor ? tema.acento : '#94A3B8' }}
          >
            <span
              className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
              style={{ left: f.valor ? 28 : 4 }}
            />
          </span>
        </button>
      ))}
      <BotonPrimario tema={tema} onClick={() => hablar('Así suena la lectura en voz alta del vigilante virtual.')}>
        <Volume2 size={20} /> Probar voz
      </BotonPrimario>
    </div>
  );
}

/* ------------------------ Simulación Llamada / Video (Moderna) ------------------------ */

function VistaSimulacionLlamada({ tema, tipo, alTerminar }: { tema: Tema; tipo: 'voz' | 'video'; alTerminar: () => void }) {
  const [estado, setEstado] = useState<'marcando' | 'conectado' | 'finalizada'>('marcando');
  const [segundos, setSegundos] = useState(0);
  const [micSilenciado, setMicSilenciado] = useState(false);
  const [camApagada, setCamApagada] = useState(false);

  useEffect(() => {
    if (estado === 'marcando') {
      const timer = setTimeout(() => setEstado('conectado'), 3000); 
      return () => clearTimeout(timer);
    }
    if (estado === 'conectado') {
      const timer = setInterval(() => setSegundos((s) => s + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [estado]);

  const colgar = () => {
    setEstado('finalizada');
    setTimeout(alTerminar, 1500);
  };

  const tiempo = `${Math.floor(segundos / 60).toString().padStart(2, '0')}:${(segundos % 60).toString().padStart(2, '0')}`;
  const esVideo = tipo === 'video';

  const colorFondo = esVideo ? '#000000' : tema.fondo;
  const colorTextoPrincipal = esVideo ? '#FFFFFF' : tema.texto;
  const colorTextoSecundario = esVideo ? 'rgba(255,255,255,0.7)' : tema.sub;

  return (
    <div 
      className="flex flex-col items-center justify-between h-full relative overflow-hidden rounded-3xl transition-colors duration-500" 
      style={{ background: colorFondo, color: colorTextoPrincipal }}
    >
      
      {/* Fondo de Video (Solo Videollamada) */}
      {esVideo && estado === 'conectado' && !camApagada && (
        <>
          <video 
            src={VIDEO_FONDO} 
            autoPlay 
            loop 
            muted 
            className="absolute inset-0 w-full h-full object-cover" 
          />
          {/* Gradiente oscuro superior e inferior para legibilidad del texto y controles */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />
        </>
      )}

      {/* Avatar y Estado (Sección Superior/Central) */}
      <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-6">
        {(!esVideo || estado !== 'conectado' || camApagada) && (
          <div className="relative mb-8 flex items-center justify-center">
            {/* Animación de ondas pulsantes al marcar */}
            {estado === 'marcando' && (
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-20" 
                style={{ backgroundColor: esVideo ? '#3B82F6' : tema.acento }}
              />
            )}
            
            {/* Círculo del Avatar */}
            <div 
              className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all duration-300"
              style={{ 
                background: esVideo ? '#1E293B' : tema.tarjeta, 
                color: esVideo ? '#60A5FA' : tema.acento,
                border: `1px solid ${esVideo ? 'rgba(255,255,255,0.1)' : tema.borde}` 
              }}
            >
              <Bot size={54} strokeWidth={1.5} aria-hidden="true" />
            </div>
          </div>
        )}

        {/* Textos de estado más limpios */}
        <h2 className="text-[26px] font-semibold tracking-tight drop-shadow-md">
          {estado === 'marcando' ? 'Llamando...' : estado === 'conectado' ? 'Vigilante' : 'Finalizada'}
        </h2>
        <p 
          className="text-[16px] mt-1 font-medium tracking-wide drop-shadow-md transition-all" 
          style={{ color: colorTextoSecundario }}
        >
          {estado === 'conectado' ? tiempo : estado === 'marcando' ? 'Conectando' : 'Desconectado'}
        </p>
      </div>

      {/* "Dock" Flotante de Controles (Glassmorphism) */}
      <div className="z-10 w-full pb-10 flex justify-center px-4">
        <div 
          className="flex items-center justify-center gap-4 px-6 py-4 rounded-[2rem] shadow-2xl backdrop-blur-xl border transition-all duration-300"
          style={{ 
            background: esVideo || tema.fondo === '#000000' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: esVideo || tema.fondo === '#000000' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Botón de Micrófono */}
          <button
            onClick={() => setMicSilenciado(!micSilenciado)}
            disabled={estado !== 'conectado'}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 hover:scale-105"
            style={{ 
              background: micSilenciado ? '#FEE2E2' : (esVideo || tema.fondo === '#000000' ? 'rgba(255,255,255,0.1)' : tema.fondo),
              color: micSilenciado ? '#EF4444' : colorTextoPrincipal
            }}
          >
            {micSilenciado ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* Botón de Cámara (Solo si es videollamada) */}
          {esVideo && (
            <button
              onClick={() => setCamApagada(!camApagada)}
              disabled={estado !== 'conectado'}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 hover:scale-105"
              style={{ 
                background: camApagada ? '#FEE2E2' : 'rgba(255,255,255,0.1)',
                color: camApagada ? '#EF4444' : '#FFFFFF'
              }}
            >
              {camApagada ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}

          {/* Botón de Colgar (Destacado) dafaecdacedasdasda */}
          <button
            onClick={colgar}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}