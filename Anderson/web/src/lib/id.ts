// Generador de ids deterministas-por-tiempo, legibles, para el mock.
// El mock (json-server) no genera ids con el formato que necesitamos
// (`token-...`, `evt-...`), así que los generamos en el cliente.
let counter = 0

export function newId(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`
}
