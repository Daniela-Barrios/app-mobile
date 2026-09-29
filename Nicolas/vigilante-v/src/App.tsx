import { Bienvenida } from './components/Bienvenida';
import type { Kiosco } from './api/tipos';

const kiosco: Kiosco = { sede: 'Bodegas Panamericana' };

export default function App() {
  return (
    <div className="escenario">
      <div className="telefono">
        <Bienvenida kiosco={kiosco} lector={false} />
      </div>
    </div>
  );
}