function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">
          Control de Acceso — Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Fase 0 · Maqueta funcional con datos simulados
        </p>
      </header>

      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="max-w-md text-center space-y-3">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200">
            Hito 1 · Setup del frontend
          </span>
          <h2 className="text-2xl font-semibold text-slate-900">
            Base lista: Vite + React + Tailwind
          </h2>
          <p className="text-sm text-slate-500">
            El sistema de diseño y los módulos del dashboard llegan en el
            Hito 2. Esta pantalla confirma que Tailwind y el proxy al mock
            están funcionando.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
