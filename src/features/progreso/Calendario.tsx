import { useState } from 'react'
import { mesCalendario, rachaSemanas, type DiaCalendario } from '../../domain/calendario'
import type { WorkoutSession } from '../../domain/tipos'
import { fechaLarga } from './formato'

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/** Mes con los días entrenados y la racha de semanas. Tocar un día muestra sus sesiones. */
export function Calendario({ sesiones }: { sesiones: WorkoutSession[] }) {
  const [hoy] = useState(() => new Date())
  const [mes, setMes] = useState(() => ({ anio: hoy.getFullYear(), mes: hoy.getMonth() }))
  const [elegido, setElegido] = useState<DiaCalendario | null>(null)

  const semanas = mesCalendario(mes.anio, mes.mes, sesiones, hoy)
  const delMes = semanas.flat().reduce((n, d) => n + (d?.sesiones.length ?? 0), 0)
  const racha = rachaSemanas(sesiones, hoy)
  const esMesActual = mes.anio === hoy.getFullYear() && mes.mes === hoy.getMonth()
  const titulo = new Date(mes.anio, mes.mes, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })

  function mover(delta: number) {
    const d = new Date(mes.anio, mes.mes + delta, 1)
    setMes({ anio: d.getFullYear(), mes: d.getMonth() })
    setElegido(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-neutral-900 p-4">
        <span className="text-2xl font-bold tabular-nums">🔥 {racha}</span>{' '}
        <span className="text-neutral-300">
          {racha === 1 ? 'semana seguida entrenando' : 'semanas seguidas entrenando'}
        </span>
        {racha === 0 && <span className="block text-sm text-neutral-400">Entrena esta semana para empezar tu racha.</span>}
      </p>

      <section className="rounded-xl bg-neutral-900 p-3" aria-label="Calendario de entrenamientos">
        <header className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => mover(-1)} aria-label="Mes anterior" className="size-11 rounded-lg bg-neutral-800 text-lg">
            ◀
          </button>
          <div className="text-center">
            <h2 className="font-semibold capitalize">{titulo}</h2>
            <p className="text-xs text-neutral-400">
              {delMes} {delMes === 1 ? 'sesión' : 'sesiones'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={esMesActual}
            aria-label="Mes siguiente"
            className="size-11 rounded-lg bg-neutral-800 text-lg disabled:opacity-30"
          >
            ▶
          </button>
        </header>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500" aria-hidden>
          {DIAS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {semanas.flat().map((d, i) =>
            d ? (
              <button
                key={d.clave}
                type="button"
                onClick={() => setElegido(d.sesiones.length ? d : null)}
                aria-label={`${d.dia}${d.sesiones.length ? `, ${d.sesiones.length} ${d.sesiones.length === 1 ? 'sesión' : 'sesiones'}` : ''}`}
                aria-pressed={elegido?.clave === d.clave}
                className={`flex aspect-square min-h-11 items-center justify-center rounded-lg tabular-nums ${
                  d.sesiones.length ? 'bg-lime-400 font-bold text-neutral-950' : 'text-neutral-300'
                } ${d.hoy ? 'ring-2 ring-neutral-100' : ''} ${elegido?.clave === d.clave ? 'outline-2 outline-offset-2 outline-lime-300' : ''}`}
              >
                {d.dia}
              </button>
            ) : (
              <span key={`h${i}`} />
            ),
          )}
        </div>
      </section>

      {elegido && (
        <ul className="flex flex-col gap-2">
          {elegido.sesiones.map((s) => (
            <li key={s.id}>
              <a
                href={`#/progreso/${s.id}`}
                className="flex min-h-14 items-center justify-between rounded-xl bg-neutral-900 p-4 active:bg-neutral-800"
              >
                <span className="font-semibold">{s.diaNombre}</span>
                <span className="text-sm text-neutral-400">{fechaLarga(s.fecha)} ›</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
