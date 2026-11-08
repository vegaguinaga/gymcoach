import { resumenSesion } from '../../domain/sesion'
import type { Exercise, WorkoutSession } from '../../domain/tipos'
import { Pantalla } from '../../ui/Pantalla'

interface Props {
  sesion: WorkoutSession
  ejercicios: Map<string, Exercise>
  alCerrar: () => void
}

export function ResumenSesion({ sesion, ejercicios, alCerrar }: Props) {
  const r = resumenSesion(sesion)
  const datos = [
    { etiqueta: 'Duración', valor: `${r.minutos} min` },
    { etiqueta: 'Series', valor: `${r.seriesCompletadas}/${r.seriesTotales}` },
    { etiqueta: 'Volumen', valor: `${r.volumenKg.toLocaleString('es')} kg` },
  ]

  return (
    <Pantalla titulo="¡Sesión terminada!">
      <div className="flex flex-col gap-4">
        <p className="text-neutral-300">{sesion.diaNombre} guardado. Buen trabajo 💪</p>
        <dl className="grid grid-cols-3 gap-2">
          {datos.map((d) => (
            <div key={d.etiqueta} className="rounded-xl bg-neutral-900 p-3 text-center">
              <dt className="text-xs text-neutral-400">{d.etiqueta}</dt>
              <dd className="text-xl font-bold">{d.valor}</dd>
            </div>
          ))}
        </dl>

        {r.mejores.length > 0 && (
          <section className="rounded-xl bg-neutral-900 p-4">
            <h2 className="mb-2 font-semibold">1RM estimado de hoy</h2>
            <ul className="divide-y divide-neutral-800">
              {r.mejores.map((m) => (
                <li key={m.ejercicioId} className="flex justify-between py-2">
                  <span>{ejercicios.get(m.ejercicioId)?.nombre ?? m.ejercicioId}</span>
                  <span className="font-semibold tabular-nums">{m.unoRM} kg</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-neutral-500">Estimación con la fórmula de Epley; no hace falta probarlo.</p>
          </section>
        )}

        <button type="button" onClick={alCerrar} className="min-h-14 rounded-xl bg-lime-400 text-lg font-bold text-neutral-950">
          Listo
        </button>
      </div>
    </Pantalla>
  )
}
