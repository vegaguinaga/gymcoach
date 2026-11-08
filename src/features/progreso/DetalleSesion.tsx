import { borrarSesion, useSesion, useSesionesTerminadas } from '../../data/repos/sesiones'
import { volumen } from '../../domain/fuerza'
import { recordsNuevos } from '../../domain/progreso'
import type { Exercise } from '../../domain/tipos'
import { Pantalla } from '../../ui/Pantalla'
import { duracionMin, fechaLarga } from './formato'

export function DetalleSesion({ id, ejercicios }: { id: number; ejercicios: Map<string, Exercise> }) {
  const sesion = useSesion(id)
  const todas = useSesionesTerminadas()

  if (sesion === undefined || todas === undefined)
    return (
      <Pantalla titulo="Sesión" volver="#/progreso">
        <p className="text-neutral-400">Cargando…</p>
      </Pantalla>
    )
  if (!sesion || sesion.estado !== 'terminada')
    return (
      <Pantalla titulo="Sesión" volver="#/progreso">
        <p className="text-neutral-400">No encontramos esta sesión.</p>
      </Pantalla>
    )

  const nombre = (i: string) => ejercicios.get(i)?.nombre ?? i
  const ids = [...new Set(sesion.series.map((s) => s.ejercicioId))]
  const records = recordsNuevos(sesion, todas)
  const min = duracionMin(sesion.fecha, sesion.fin)

  async function borrar() {
    if (!confirm('¿Borrar esta sesión del historial? No se puede deshacer.')) return
    await borrarSesion(id)
    window.location.hash = '#/progreso'
  }

  return (
    <Pantalla titulo={sesion.diaNombre} volver="#/progreso">
      <div className="flex flex-col gap-4">
        <p className="text-neutral-400">
          {fechaLarga(sesion.fecha)}
          {min !== null && ` · ${min} min`} · {volumen(sesion.series).toLocaleString('es')} kg
        </p>
        {sesion.notas && <p className="rounded-xl bg-neutral-900 p-3 text-sm text-neutral-300">📝 {sesion.notas}</p>}

        {records.length > 0 && (
          <section className="rounded-xl border border-lime-400/40 bg-neutral-900 p-4">
            <h2 className="mb-2 font-semibold">🏆 Récords de este día</h2>
            <ul className="text-sm">
              {records.map((r) => (
                <li key={`${r.ejercicioId}-${r.tipo}`} className="flex justify-between py-1">
                  <span>{nombre(r.ejercicioId)}</span>
                  <span className="tabular-nums">
                    {r.tipo === 'unoRM' ? '1RM ' : ''}
                    {r.texto}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {ids.map((ejId) => (
          <section key={ejId} className="rounded-xl bg-neutral-900 p-4">
            <h2 className="mb-2 font-semibold">{nombre(ejId)}</h2>
            {sesion.notasEjercicio?.[ejId] && <p className="mb-2 text-sm text-neutral-400">📝 {sesion.notasEjercicio[ejId]}</p>}
            <table className="w-full text-sm tabular-nums">
              <thead className="text-left text-xs text-neutral-500">
                <tr>
                  <th className="font-normal">Serie</th>
                  <th className="font-normal">Kg</th>
                  <th className="font-normal">Reps</th>
                  <th className="font-normal">RPE</th>
                </tr>
              </thead>
              <tbody>
                {sesion.series
                  .filter((s) => s.ejercicioId === ejId)
                  .map((s) => (
                    <tr key={s.serie} className={s.completada ? '' : 'text-neutral-600 line-through'}>
                      <td className="py-1">{s.serie}</td>
                      <td>{s.kg}</td>
                      <td>{s.reps}</td>
                      <td>{s.rpe ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        ))}

        <button
          type="button"
          onClick={borrar}
          className="min-h-12 rounded-xl border border-red-900 text-red-300 active:bg-red-950"
        >
          Borrar sesión
        </button>
      </div>
    </Pantalla>
  )
}
