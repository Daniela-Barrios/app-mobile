import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, FormEvent, ReactNode } from 'react';
import {
  Accessibility,
  ArrowLeft,
  Bot,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Contact,
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
  const [entro, setEntro] = useState(false);

  if (entro) {
    return <Panel kiosco={kiosco} onInicio={() => setEntro(false)} />;
  }

  return (
    <BienvenidaVigilante
      kiosco={kiosco}
      lector={lector}
      onSiguiente={() => {
        setEntro(true);
        onEntrar?.();
      }}
    />
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

function Panel({ kiosco, onInicio }: { kiosco: Kiosco; onInicio: () => void }) {
  const ahora = useAhora();
  const [vista, setVista] = useState<Vista>('menu');
  const [grande, setGrande] = useState(false);
  const [contraste, setContraste] = useState(false);
  const [voz, setVoz] = useState(false);
  const tema = contraste ? TEMA_CONTRASTE : TEMA_NORMAL;

  useEffect(() => {
    if (voz) hablar(TITULOS[vista]);
  }, [vista, voz]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const volver = () => (vista === 'menu' ? onInicio() : setVista('menu'));

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
          {vista === 'menu' ? 'Inicio' : 'Atrás'}
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
        {vista === 'menu' && <Menu tema={tema} ir={setVista} />}
        {vista === 'comunicacion' && <VistaComunicacion tema={tema} ir={setVista} />}
        {vista === 'llamada_voz' && <VistaSimulacionLlamada tema={tema} tipo="voz" alTerminar={() => setVista('menu')} />}
        {vista === 'llamada_video' && <VistaSimulacionLlamada tema={tema} tipo="video" alTerminar={() => setVista('menu')} />}
        {vista === 'vigilante' && <VistaVigilante tema={tema} voz={voz} />}
        {vista === 'registro' && <VistaRegistro tema={tema} alTerminar={() => setVista('menu')} />}
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

function Menu({ tema, ir }: { tema: Tema; ir: (v: Vista) => void }) {
  const items: { v: Vista; titulo: string; sub: string; Icono: typeof Bot }[] = [
    { v: 'comunicacion', titulo: 'Comunicación', sub: 'Llama, haz videollamada o chatea', Icono: Phone },
    { v: 'registro', titulo: 'Registrarme', sub: 'Tus datos y una foto rápida', Icono: Contact },
    { v: 'ingreso', titulo: 'Solicitar ingreso', sub: 'Pide permiso para entrar a la bodega', Icono: DoorOpen },
    { v: 'faq', titulo: 'Preguntas frecuentes', sub: 'Requisitos, horarios, carnet y más', Icono: CircleHelp },
    { v: 'ayuda', titulo: 'Ayuda', sub: 'Cómo funciona, paso a paso', Icono: LifeBuoy },
    { v: 'asistente', titulo: 'Asistente virtual', sub: 'Pregúntale lo que necesites saber', Icono: Bot },
    { v: 'accesibilidad', titulo: 'Accesibilidad', sub: 'Texto grande, contraste y voz', Icono: Accessibility },
  ];

  return (
    <div className="flex flex-col gap-3">
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

function VistaRegistro({ tema, alTerminar }: { tema: Tema; alTerminar: () => void }) {
  const [datos, setDatos] = useState({ nombre: '', documento: '', empresa: '', telefono: '' });
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  const cambiar = (k: keyof typeof datos, v: string) => setDatos((d) => ({ ...d, [k]: v }));

  const tomarFoto = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const lector = new FileReader();
    lector.onload = () => setFoto(String(lector.result));
    lector.readAsDataURL(f);
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!datos.nombre.trim() || !datos.documento.trim()) {
      setError('Escribe tu nombre y tu número de documento.');
      return;
    }
    if (!foto) {
      setError('Toma una foto rápida para continuar.');
      return;
    }
    setError('');
    setListo(true);
  };

  if (listo) {
    return (
      <Exito
        tema={tema}
        titulo="¡Registro completado!"
        detalle="Ya puedes solicitar tu ingreso desde el menú."
        alVolver={alTerminar}
      />
    );
  }

  const colorError = tema.fondo === '#000000' ? '#FCA5A5' : '#B91C1C';

  return (
    <form onSubmit={enviar}>
      <Tarjeta tema={tema}>
        <Campo tema={tema} etiqueta="Nombre completo">
          <input style={estiloInput(tema)} value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} autoComplete="name" />
        </Campo>
        <Campo tema={tema} etiqueta="Número de documento">
          <input style={estiloInput(tema)} inputMode="numeric" value={datos.documento} onChange={(e) => cambiar('documento', e.target.value.replace(/\D/g, ''))} />
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
          {foto && <img src={foto} alt="Tu foto" className="w-32 h-32 rounded-2xl object-cover self-center" />}
          <label
            className="rounded-xl py-3 font-bold text-[15px] flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
            style={{ border: `1px dashed ${tema.acento}`, color: tema.acento }}
          >
            <Camera size={20} />
            {foto ? 'Tomar otra foto' : 'Tomar foto'}
            <input type="file" accept="image/*" capture="user" onChange={tomarFoto} className="hidden" />
          </label>
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

          {/* Botón de Colgar (Destacado) */}
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