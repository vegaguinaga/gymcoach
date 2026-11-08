import { useState } from 'react'
import { useRutinaActual } from '../../data/repos/rutinas'
import { registrarSesionOlvidada } from '../../data/repos/sesiones'
import { claveDia } from '../../domain/calendario'
import { fechaLocal } from '../../domain/edicionSesion'
import { DURACION_OLVIDADA } from '../../domain/sesion'

const DURACIONES = [30, 45, 60, 75, 90, 120]
const campo = 'min-h-12 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 [color-scheme:dark]'

/** «Registrar sesión olvidada»: elige día de la rutina, fecha, hora y duración; después se completan las series. */
export function SesionOlvidada() {
  const rutina = useRutinaActual()
  const [abierto, setAbierto] = useState(false)
  const [hoy] = useState(() => claveDia(new Date()))
  const [diaIndice, setDiaIndice] = useState(0)
  const [fecha, setFecha] = useState(() => claveDia(new Date(Date.now() - 86400000)))
  const [hora, setHora] = useState('18:00')
  const [duracion, setDuracion] = useState<number>(DURACION_OLVIDADA.porDefecto)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!rutina) return null

  if (!abierto)
    return (
      <button type="button" onClick={() => setAbierto(true)} className="min-h-12 rounded-xl bg-neutral-800 font-semibold">
        ➕ Registrar sesión olvidada
      </button>
    )

  async function guardar() {
    if (!rutina) return
    const inicio = fechaLocal(fecha, hora)
    if (!inicio || inicio > new Date()) {
      setError('Elige una fecha y hora que ya hayan pasado.')
      return
    }
    setGuardando(true)
    try {
      const id = await registrarSesionOlvidada(rutina, diaIndice, inicio, duracion)
      if (id === null) setError('No se pudo registrar: revisa el día y la fecha.')
      else window.location.hash = `#/progreso/${id}`
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-neutral-900 p-4" aria-labelledby="titulo-olvidada">
      <h2 id="titulo-olvidada" className="font-semibold">
        Sesión olvidada
      </h2>
      <p className="text-sm text-neutral-400">Después marcas las series que hiciste y ajustas kg y reps.</p>
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Día de la rutina
        <select value={diaIndice} onChange={(e) => setDiaIndice(Number(e.target.value))} className={campo}>
          {rutina.dias.map((d, i) => (
            <option key={i} value={i}>
              Día {i + 1} · {d.nombre}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Fecha
          <input type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} className={campo} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Hora de inicio
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={campo} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Duración
        <select value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} className={campo}>
          {DURACIONES.map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
      </label>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAbierto(false)
            setError('')
          }}
          className="min-h-12 flex-1 rounded-xl bg-neutral-800 font-semibold"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || !fecha || !hora}
          className="min-h-12 flex-1 rounded-xl bg-lime-400 font-bold text-neutral-950 disabled:opacity-40"
        >
          {guardando ? 'Guardando…' : 'Continuar'}
        </button>
      </div>
    </section>
  )
}
