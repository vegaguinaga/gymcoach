import { useState } from 'react'
import { historialEjercicio, recordsPorEjercicio, textoSerie, type PuntoEjercicio } from '../../domain/progreso'
import type { Exercise, WorkoutSession } from '../../domain/tipos'
import { Chip } from '../../ui/Chip'
import { GraficaLinea } from './GraficaLinea'
import { fechaCorta } from './formato'

type Metrica = 'unoRM' | 'volumen' | 'reps'

const METRICAS: Record<Metrica, { etiqueta: string; unidad: string; valor: (p: PuntoEjercicio) => number | null }> = {
  unoRM: { etiqueta: '1RM estimado', unidad: 'kg', valor: (p) => p.unoRM },
  volumen: { etiqueta: 'Volumen', unidad: 'kg', valor: (p) => p.volumen },
  reps: { etiqueta: 'Mejores reps', unidad: 'reps', valor: (p) => p.mejorSerie.reps },
}

interface Props {
  sesiones: WorkoutSession[]
  /** Ejercicios realizados, el más reciente primero */
  ids: string[]
  ejercicios: Map<string, Exercise>
}

export function GraficaEjercicio({ sesiones, ids, ejercicios }: Props) {
  const [elegido, setElegido] = useState(ids[0])
  const [metricaElegida, setMetrica] = useState<Metrica>('unoRM')

  if (ids.length === 0)
    return <p className="rounded-xl bg-neutral-900 p-4 text-neutral-400">Termina una sesión para ver tu progreso por ejercicio.</p>

  const id = ids.includes(elegido) ? elegido : ids[0]
  const puntos = historialEjercicio(sesiones, id)
  const record = recordsPorEjercicio(sesiones).get(id)
  // Peso corporal sin lastre: no hay 1RM ni volumen en kg, se sigue por repeticiones
  const conKg = puntos.some((p) => p.unoRM !== null)
  const disponibles: Metrica[] = conKg ? ['unoRM', 'volumen', 'reps'] : ['reps']
  const metrica = disponibles.includes(metricaElegida) ? metricaElegida : disponibles[0]
  const m = METRICAS[metrica]
  const datos = puntos.flatMap((p) => {
    const valor = m.valor(p)
    return valor === null ? [] : [{ fecha: p.fecha, valor }]
  })
  const nombre = (i: string) => ejercicios.get(i)?.nombre ?? i

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Ejercicio
        <select
          value={id}
          onChange={(e) => setElegido(e.target.value)}
          className="min-h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100"
        >
          {ids.map((i) => (
            <option key={i} value={i}>
              {nombre(i)}
            </option>
          ))}
        </select>
      </label>

      {record && (
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-neutral-900 p-3">
            <dt className="text-xs text-neutral-400">🏆 Récord 1RM estimado</dt>
            <dd className="text-xl font-bold tabular-nums">{record.unoRM ? `${record.unoRM.valor} kg` : '—'}</dd>
            {record.unoRM && <dd className="text-xs text-neutral-500">{fechaCorta(record.unoRM.fecha)}</dd>}
          </div>
          <div className="rounded-xl bg-neutral-900 p-3">
            <dt className="text-xs text-neutral-400">🏆 Mejor serie</dt>
            <dd className="text-xl font-bold tabular-nums">{record.mejorSerie ? textoSerie(record.mejorSerie) : '—'}</dd>
            {record.mejorSerie && <dd className="text-xs text-neutral-500">{fechaCorta(record.mejorSerie.fecha)}</dd>}
          </div>
        </dl>
      )}

      {disponibles.length > 1 && (
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Qué medir">
          {disponibles.map((k) => (
            <Chip key={k} activo={k === metrica} onClick={() => setMetrica(k)}>
              {METRICAS[k].etiqueta}
            </Chip>
          ))}
        </div>
      )}

      <GraficaLinea datos={datos} unidad={m.unidad} titulo={m.etiqueta} />

      {/* Vista en tabla: las últimas sesiones con este ejercicio */}
      {puntos.length > 0 && (
        <section className="rounded-xl bg-neutral-900 p-4">
          <h3 className="mb-2 text-sm font-semibold text-neutral-300">Últimas sesiones</h3>
          <ul className="divide-y divide-neutral-800 text-sm">
            {puntos
              .slice(-5)
              .reverse()
              .map((p) => (
                <li key={p.fecha} className="flex justify-between gap-2 py-2">
                  <span className="text-neutral-400">{fechaCorta(p.fecha)}</span>
                  <span className="tabular-nums">{textoSerie(p.mejorSerie)}</span>
                  {conKg && <span className="tabular-nums text-neutral-400">{p.unoRM ?? '—'} kg 1RM</span>}
                </li>
              ))}
          </ul>
        </section>
      )}
      {conKg && <p className="text-xs text-neutral-500">1RM estimado con la fórmula de Epley; no hace falta probarlo.</p>}
    </div>
  )
}
