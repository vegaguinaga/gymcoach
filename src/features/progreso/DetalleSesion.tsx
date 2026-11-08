import { useState } from 'react'
import { borrarSesion, cambiarFechaSesion, editarSesionTerminada, useSesion, useSesionesTerminadas } from '../../data/repos/sesiones'
import { claveDia } from '../../domain/calendario'
import { editarSerie, hayCambios } from '../../domain/edicionSesion'
import { volumen } from '../../domain/fuerza'
import { recordsNuevos } from '../../domain/progreso'
import { agregarSerie, quitarSerie } from '../../domain/sesion'
import type { Exercise, SetLog } from '../../domain/tipos'
import { CampoNumero } from '../../ui/CampoNumero'
import { Pantalla } from '../../ui/Pantalla'
import { duracionMin, fechaLarga } from './formato'

export function DetalleSesion({ id, ejercicios }: { id: number; ejercicios: Map<string, Exercise> }) {
  const sesion = useSesion(id)
  const todas = useSesionesTerminadas()
  // Copia de las series mientras se edita (null = solo lectura)
  const [borrador, setBorrador] = useState<SetLog[] | null>(null)
  const [guardando, setGuardando] = useState(false)
  // Una sesión sin ninguna serie hecha (ej. recién registrada como olvidada) se abre lista para editar
  const [revisada, setRevisada] = useState(false)
  if (!revisada && sesion?.estado === 'terminada') {
    setRevisada(true)
    if (sesion.series.length > 0 && sesion.series.every((s) => !s.completada)) setBorrador(sesion.series)
  }

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

  async function guardar() {
    if (!borrador) return
    setGuardando(true)
    try {
      await editarSesionTerminada(id, borrador)
      setBorrador(null)
    } finally {
      setGuardando(false)
    }
  }

  const original = sesion.series
  function cancelar() {
    if (borrador && hayCambios(original, borrador) && !confirm('¿Descartar los cambios?')) return
    setBorrador(null)
  }

  const series = borrador ?? sesion.series
  const repsDe = (ejId: string) => sesion.ejercicios.find((e) => e.ejercicioId === ejId)?.repsMin ?? 8

  return (
    <Pantalla titulo={sesion.diaNombre} volver="#/progreso">
      <div className="flex flex-col gap-4">
        <p className="text-neutral-400">
          {fechaLarga(sesion.fecha)}
          {min !== null && ` · ${min} min`} · {volumen(sesion.series).toLocaleString('es')} kg
        </p>
        {sesion.notas && <p className="rounded-xl bg-neutral-900 p-3 text-sm text-neutral-300">📝 {sesion.notas}</p>}

        {borrador && (
          <p className="rounded-xl bg-lime-400/10 p-3 text-sm text-lime-200">
            {sesion.series.some((s) => s.completada)
              ? 'Corrige lo que anotaste mal. Los récords y las sugerencias se recalculan al guardar.'
              : 'Marca con ✓ las series que hiciste y ajusta kg y reps. Solo cuenta lo marcado.'}
          </p>
        )}

        {!borrador && records.length > 0 && (
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
            {borrador ? (
              <EditorSeries
                series={borrador}
                ejercicioId={ejId}
                alCambiar={setBorrador}
                repsPorDefecto={repsDe(ejId)}
              />
            ) : (
              <TablaSeries series={series.filter((s) => s.ejercicioId === ejId)} />
            )}
          </section>
        ))}

        {borrador ? (
          <div className="sticky bottom-20 flex gap-2">
            <button type="button" onClick={cancelar} className="min-h-12 flex-1 rounded-xl bg-neutral-800 font-semibold">
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || !hayCambios(sesion.series, borrador)}
              className="min-h-12 flex-1 rounded-xl bg-lime-400 font-bold text-neutral-950 disabled:opacity-40"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setBorrador(sesion.series)}
              className="min-h-12 rounded-xl bg-neutral-800 font-semibold"
            >
              ✏️ Editar series
            </button>
            <CambiarFecha id={id} fecha={sesion.fecha} />
            <button
              type="button"
              onClick={borrar}
              className="min-h-12 rounded-xl border border-red-900 text-red-300 active:bg-red-950"
            >
              Borrar sesión
            </button>
          </>
        )}
      </div>
    </Pantalla>
  )
}

function TablaSeries({ series }: { series: SetLog[] }) {
  return (
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
        {series.map((s) => (
          <tr key={s.serie} className={s.completada ? '' : 'text-neutral-600 line-through'}>
            <td className="py-1">{s.serie}</td>
            <td>{s.kg}</td>
            <td>{s.reps}</td>
            <td>{s.rpe ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const COLUMNAS = 'grid grid-cols-[1.25rem_1fr_1fr_3.5rem_2.75rem_2.75rem] items-center gap-1.5'

interface PropsEditor {
  series: SetLog[]
  ejercicioId: string
  repsPorDefecto: number
  alCambiar: (series: SetLog[]) => void
}

/** Filas editables de un ejercicio: kg, reps, RPE, hecha y quitar. Trabaja sobre la lista completa de series. */
function EditorSeries({ series, ejercicioId, repsPorDefecto, alCambiar }: PropsEditor) {
  const propias = series.map((s, indice) => ({ s, indice })).filter(({ s }) => s.ejercicioId === ejercicioId)
  return (
    <div>
      <div className={`${COLUMNAS} text-xs text-neutral-500`}>
        <span>#</span>
        <span>Kg</span>
        <span>Reps</span>
        <span>RPE</span>
        <span className="sr-only">Hecha</span>
        <span className="sr-only">Quitar</span>
      </div>
      <ul className="mt-1 flex flex-col gap-2">
        {propias.map(({ s, indice }) => (
          <li key={s.serie} className={COLUMNAS}>
            <span className="text-neutral-400">{s.serie}</span>
            <CampoNumero
              etiqueta={`Kg, serie ${s.serie}`}
              valor={s.kg}
              decimales
              alCambiar={(kg) => alCambiar(editarSerie(series, indice, { kg }))}
            />
            <CampoNumero
              etiqueta={`Reps, serie ${s.serie}`}
              valor={s.reps}
              alCambiar={(reps) => alCambiar(editarSerie(series, indice, { reps }))}
            />
            <select
              aria-label={`RPE, serie ${s.serie}`}
              value={s.rpe ?? ''}
              onChange={(e) => alCambiar(editarSerie(series, indice, { rpe: e.target.value ? Number(e.target.value) : undefined }))}
              className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-1 text-center"
            >
              <option value="">–</option>
              {[6, 7, 8, 9, 10].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => alCambiar(editarSerie(series, indice, { completada: !s.completada }))}
              aria-pressed={s.completada}
              aria-label={`${s.completada ? 'Desmarcar' : 'Marcar'} serie ${s.serie}`}
              className={`flex size-11 items-center justify-center rounded-lg text-xl font-bold ${
                s.completada ? 'bg-lime-400 text-neutral-950' : 'border border-neutral-600 text-neutral-400'
              }`}
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => alCambiar(quitarSerie(series, indice))}
              aria-label={`Quitar serie ${s.serie}`}
              className="flex size-11 items-center justify-center rounded-lg bg-neutral-800 text-lg text-red-300"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => alCambiar(agregarSerie(series, ejercicioId, repsPorDefecto))}
        className="mt-2 min-h-11 w-full rounded-lg bg-neutral-800 text-sm font-semibold"
      >
        + Serie
      </button>
    </div>
  )
}

/** Botón «Cambiar fecha» que despliega un selector de día (hasta hoy). Conserva la hora y la duración. */
function CambiarFecha({ id, fecha }: { id: number; fecha: string }) {
  const [abierto, setAbierto] = useState(false)
  const [dia, setDia] = useState(() => claveDia(new Date(fecha)))
  const [error, setError] = useState('')
  const [hoy] = useState(() => claveDia(new Date()))

  async function guardar() {
    if (await cambiarFechaSesion(id, dia)) {
      setAbierto(false)
      setError('')
    } else setError('Elige un día válido, hasta hoy.')
  }

  if (!abierto)
    return (
      <button
        type="button"
        onClick={() => {
          setDia(claveDia(new Date(fecha)))
          setAbierto(true)
        }}
        className="min-h-12 rounded-xl bg-neutral-800 font-semibold"
      >
        📅 Cambiar fecha
      </button>
    )

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-neutral-900 p-4">
      <label htmlFor="nueva-fecha" className="text-sm text-neutral-300">
        ¿Qué día entrenaste? Se conserva la hora y la duración.
      </label>
      <input
        id="nueva-fecha"
        type="date"
        value={dia}
        max={hoy}
        onChange={(e) => setDia(e.target.value)}
        className="min-h-12 rounded-lg border border-neutral-700 bg-neutral-950 px-3 [color-scheme:dark]"
      />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setAbierto(false)} className="min-h-12 flex-1 rounded-xl bg-neutral-800 font-semibold">
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={!dia || dia === claveDia(new Date(fecha))}
          className="min-h-12 flex-1 rounded-xl bg-lime-400 font-bold text-neutral-950 disabled:opacity-40"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}
