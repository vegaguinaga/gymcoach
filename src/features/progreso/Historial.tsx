import { volumen } from '../../domain/fuerza'
import { recordsNuevos } from '../../domain/progreso'
import type { WorkoutSession } from '../../domain/tipos'
import { duracionMin, fechaLarga } from './formato'

/** Lista de sesiones terminadas (la más reciente primero). Cada una abre su detalle. */
export function Historial({ sesiones }: { sesiones: WorkoutSession[] }) {
  if (sesiones.length === 0)
    return <p className="rounded-xl bg-neutral-900 p-4 text-neutral-400">Aún no hay sesiones. ¡La primera te espera en Entrenar!</p>

  return (
    <ul className="flex flex-col gap-2">
      {sesiones.map((s) => {
        const hechas = s.series.filter((x) => x.completada).length
        const min = duracionMin(s.fecha, s.fin)
        const records = recordsNuevos(s, sesiones).length
        return (
          <li key={s.id}>
            <a
              href={`#/progreso/${s.id}`}
              className="flex min-h-16 items-center justify-between gap-3 rounded-xl bg-neutral-900 p-4 active:bg-neutral-800"
            >
              <div>
                <p className="font-semibold">
                  {s.diaNombre}
                  {records > 0 && <span className="ml-2 text-sm" aria-label={`${records} récords`}>🏆 {records}</span>}
                </p>
                <p className="text-sm text-neutral-400">
                  {fechaLarga(s.fecha)}
                  {min !== null && ` · ${min} min`}
                </p>
              </div>
              <div className="text-right text-sm tabular-nums">
                <p>{volumen(s.series).toLocaleString('es')} kg</p>
                <p className="text-neutral-400">{hechas} series</p>
              </div>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
