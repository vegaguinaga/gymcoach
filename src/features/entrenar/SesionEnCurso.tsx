import { useEffect, useState } from 'react'
import { descartarSesion, modificarSesion, terminarSesion } from '../../data/repos/sesiones'
import { redondearKg } from '../../domain/unidades'
import { agregarSerie, finDescanso, quitarSerie } from '../../domain/sesion'
import type { EjercicioPlanificado, Exercise, SetLog, WorkoutSession } from '../../domain/tipos'
import { AvisoSeguridad } from '../../ui/AvisoSeguridad'
import { Pantalla } from '../../ui/Pantalla'
import { prepararAviso } from './aviso'
import { BarraDescanso } from './BarraDescanso'

interface Props {
  sesion: WorkoutSession
  ejercicios: Map<string, Exercise>
  alTerminar: (sesion: WorkoutSession) => void
}

export function SesionEnCurso({ sesion, ejercicios, alTerminar }: Props) {
  const id = sesion.id as number
  usePantallaEncendida()

  async function terminar() {
    const pendientes = sesion.series.filter((s) => !s.completada).length
    if (pendientes > 0 && !confirm(`Te quedan ${pendientes} series sin marcar. ¿Terminar igual?`)) return
    const fin = new Date().toISOString()
    // Primero el resumen y después guardar: así no asoma el selector de día entre medio
    alTerminar({ ...sesion, estado: 'terminada', fin, descansoHasta: undefined })
    await terminarSesion(id, fin)
  }

  async function descartar() {
    if (confirm('¿Descartar esta sesión? Se borrará lo que registraste hoy.')) await descartarSesion(id)
  }

  return (
    <Pantalla titulo={sesion.diaNombre}>
      <div className="flex flex-col gap-4">
        <Cronometro desde={sesion.fecha} />
        <AvisoSeguridad compuesto />
        {sesion.ejercicios.map((plan) => (
          <TarjetaEjercicio
            key={plan.ejercicioId}
            id={id}
            plan={plan}
            ejercicio={ejercicios.get(plan.ejercicioId)}
            series={sesion.series}
          />
        ))}
        <button type="button" onClick={terminar} className="min-h-14 rounded-xl bg-lime-400 text-lg font-bold text-neutral-950">
          Terminar sesión
        </button>
        <button type="button" onClick={descartar} className="min-h-12 rounded-xl text-red-300 active:bg-neutral-900">
          Descartar sesión
        </button>
        {/* Espacio para que la barra de descanso no tape los botones */}
        {sesion.descansoHasta && <div className="h-20" aria-hidden="true" />}
      </div>
      <BarraDescanso id={id} hasta={sesion.descansoHasta} />
    </Pantalla>
  )
}

function TarjetaEjercicio({
  id,
  plan,
  ejercicio,
  series,
}: {
  id: number
  plan: EjercicioPlanificado
  ejercicio?: Exercise
  series: SetLog[]
}) {
  const propias = series.map((s, indice) => ({ s, indice })).filter(({ s }) => s.ejercicioId === plan.ejercicioId)
  const hechas = propias.filter(({ s }) => s.completada).length
  const pesoCorporal = ejercicio?.equipo === 'peso_corporal'

  const cambiarSerie = (indice: number, cambios: Partial<SetLog>) =>
    modificarSesion(id, (actual) => ({
      series: actual.series.map((s, i) => (i === indice ? { ...s, ...cambios } : s)),
    }))

  const alternarCompletada = (indice: number) =>
    modificarSesion(id, (actual) => {
      const completada = !actual.series[indice]?.completada
      return {
        series: actual.series.map((s, i) => (i === indice ? { ...s, completada } : s)),
        // Al marcar una serie arranca el descanso de este ejercicio; al desmarcarla, no
        ...(completada && { descansoHasta: finDescanso(plan.descansoSeg) }),
      }
    })

  return (
    <section className="rounded-xl bg-neutral-900 p-4" aria-label={ejercicio?.nombre ?? plan.ejercicioId}>
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <a href={`#/ejercicios/${plan.ejercicioId}`} className="text-lg font-bold underline-offset-4 active:underline">
            {ejercicio?.nombre ?? plan.ejercicioId}
          </a>
          <p className="text-sm text-neutral-400">
            Objetivo: {plan.series} × {plan.repsMin}–{plan.repsMax} reps · RPE {plan.rpe}
          </p>
        </div>
        <span className={`shrink-0 text-sm ${hechas === propias.length ? 'text-lime-300' : 'text-neutral-400'}`}>
          {hechas}/{propias.length}
        </span>
      </header>

      <div className="grid grid-cols-[1.5rem_1fr_1fr_4.5rem_2.75rem] items-center gap-2 text-xs text-neutral-400">
        <span>#</span>
        <span>{pesoCorporal ? 'Lastre kg' : 'Kg'}</span>
        <span>Reps</span>
        <span>RPE</span>
        <span className="sr-only">Hecha</span>
      </div>
      <ul className="mt-1 flex flex-col gap-2">
        {propias.map(({ s, indice }) => (
          <li
            key={`${s.ejercicioId}-${s.serie}`}
            className={`grid grid-cols-[1.5rem_1fr_1fr_4.5rem_2.75rem] items-center gap-2 ${s.completada ? 'opacity-60' : ''}`}
          >
            <span className="text-neutral-400">{s.serie}</span>
            <CampoNumero
              etiqueta={`Kg, serie ${s.serie}`}
              valor={s.kg}
              decimales
              alCambiar={(kg) => cambiarSerie(indice, { kg: redondearKg(kg) })}
            />
            <CampoNumero
              etiqueta={`Reps, serie ${s.serie}`}
              valor={s.reps}
              alCambiar={(reps) => cambiarSerie(indice, { reps: Math.round(reps) })}
            />
            <select
              aria-label={`RPE, serie ${s.serie}`}
              value={s.rpe ?? ''}
              onChange={(e) => cambiarSerie(indice, { rpe: e.target.value ? Number(e.target.value) : undefined })}
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
              onClick={() => {
                prepararAviso()
                void alternarCompletada(indice)
              }}
              aria-pressed={s.completada}
              aria-label={`${s.completada ? 'Desmarcar' : 'Marcar'} serie ${s.serie}`}
              className={`flex size-11 items-center justify-center rounded-lg text-xl font-bold ${
                s.completada ? 'bg-lime-400 text-neutral-950' : 'border border-neutral-600 text-neutral-400'
              }`}
            >
              ✓
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => modificarSesion(id, (a) => ({ series: agregarSerie(a.series, plan.ejercicioId, plan.repsMin) }))}
          className="min-h-11 flex-1 rounded-lg bg-neutral-800 text-sm font-semibold"
        >
          + Serie
        </button>
        {propias.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const ultima = propias[propias.length - 1]
              modificarSesion(id, (a) => ({ series: quitarSerie(a.series, ultima.indice) }))
            }}
            className="min-h-11 flex-1 rounded-lg bg-neutral-800 text-sm font-semibold text-neutral-300"
          >
            − Quitar última
          </button>
        )}
      </div>
    </section>
  )
}

/**
 * Input numérico que guarda al salir del campo (así se puede escribir "22." sin que se borre).
 * Si el valor cambia desde fuera mientras no se edita, se actualiza.
 */
function CampoNumero({
  etiqueta,
  valor,
  decimales = false,
  alCambiar,
}: {
  etiqueta: string
  valor: number
  decimales?: boolean
  alCambiar: (n: number) => void
}) {
  const [texto, setTexto] = useState(String(valor))
  const [editando, setEditando] = useState(false)
  const mostrado = editando ? texto : String(valor)

  function guardar() {
    setEditando(false)
    const n = Number(texto.replace(',', '.'))
    if (texto.trim() !== '' && Number.isFinite(n) && n >= 0 && n !== valor) alCambiar(n)
  }

  return (
    <input
      aria-label={etiqueta}
      inputMode={decimales ? 'decimal' : 'numeric'}
      value={mostrado}
      onFocus={(e) => {
        setTexto(String(valor))
        setEditando(true)
        e.target.select()
      }}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="min-h-11 w-full min-w-0 rounded-lg border border-neutral-700 bg-neutral-950 px-2 text-center text-lg"
    />
  )
}

function Cronometro({ desde }: { desde: string }) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const minutos = Math.max(0, Math.floor((ahora - Date.parse(desde)) / 60000))
  return <p className="-mt-2 text-sm text-neutral-400">En curso · {minutos} min</p>
}

/** Mantiene la pantalla encendida durante la sesión (si el navegador lo permite). */
function usePantallaEncendida() {
  useEffect(() => {
    let bloqueo: WakeLockSentinel | null = null
    const pedir = () => {
      if (document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return
      navigator.wakeLock.request('screen').then((b) => (bloqueo = b)).catch(() => {})
    }
    pedir()
    // El bloqueo se suelta al cambiar de app: se pide de nuevo al volver
    document.addEventListener('visibilitychange', pedir)
    return () => {
      document.removeEventListener('visibilitychange', pedir)
      bloqueo?.release().catch(() => {})
    }
  }, [])
}
