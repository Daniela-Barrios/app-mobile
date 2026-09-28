export function hoyISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

export function fechaLarga(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d)
    .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(',', '');
}

export function horaActual12(d: Date = new Date()): string {
  return d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
}
