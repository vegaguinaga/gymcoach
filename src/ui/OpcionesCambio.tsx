import { ETIQUETA_EQUIPO } from '../domain/biblioteca'
import type { Exercise } from '../domain/tipos'

/** Lista de ejercicios para reemplazar a otro (Rutina y sesión en curso). */
export function OpcionesCambio({
  titulo,
  opciones,
  alElegir,
}: {
  titulo: string
  opciones: Exercise[]
  alElegir: (e: Exercise) => void
}) {
  if (opciones.length === 0)
    return <p className="mb-2 rounded-lg bg-neutral-800 p-3 text-sm text-neutral-300">No hay alternativas con tu equipo.</p>
  return (
    <div className="mb-2 rounded-lg bg-neutral-800 p-2">
      <p className="px-2 pb-1 text-xs text-neutral-400">{titulo}</p>
      <ul>
        {opciones.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => alElegir(o)}
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2 text-left active:bg-neutral-700"
            >
              <span>{o.nombre}</span>
              <span className="shrink-0 text-xs text-neutral-400">{ETIQUETA_EQUIPO[o.equipo]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
