export function HologramaBienvenida({ tamano = 300 }: { tamano?: number }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-full parpadeo"
      style={{
        width: tamano * 0.5,
        height: tamano * 0.5,
        border: '3px solid rgba(251,191,36,.8)',
        boxShadow: '0 0 40px rgba(251,191,36,.45), inset 0 0 30px rgba(251,191,36,.25)',
      }}
    />
  );
}