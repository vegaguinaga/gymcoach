import { useEffect, useState } from 'react'
import { descartarSesion, modificarSesion, terminarSesion } from '../../data/repos/sesiones'
import { redondearKg } from '../../domain/unidades'
import { seriesCalentamiento } from '../../domain/calentamiento'
import { conNotaEjercicio, MAX_NOTA, ultimaNota } from '../../domain/notas'
import { opcionesDeCambio } from '../../domain/generador'
import { agregarSerie, cambiarEjercicioEnSesion, finDescanso, quitarSerie } from '../../domain/sesion'
import type { EjercicioPlanificado, Equipo, Exercise, SetLog, Sugerencia, TipoSugerencia, WorkoutSession } from '../../domain/tipos'
import { AvisoSeguridad } from '../../ui/AvisoSeguridad'
import { OpcionesCambio } from '../../ui/OpcionesCambio'
import { Pantalla } from '../../ui/Pantalla'
import { prepararAviso } from './aviso'
import { BarraDescanso } from './BarraDescanso'

interface Props {
  sesion: WorkoutSession
  ejercicios: Map<string, Exercise>
  historial: WorkoutSession[]
  /** Equipo del perfil: limita las opciones al cambiar un ejercicio */
  equipo: Equipo[]
  alTerminar: (sesion: WorkoutSession) => void
}

export function SesionEnCurso({ sesion, ejercicios, historial, equipo, alTerminar }: Props) {
  const id = sesion.id as number
  // Ejercicio cuyo selector de cambio está abierto
  const [cambiando, setCambiando] = useState<string | null>(null)

  /** Opciones para cambiar un ejercicio solo hoy (máquina ocupada): mismas reglas que en la rutina. */
  function opciones(ejercicio: Exercise): Exercise[] {
    const dia = { nombre: sesion.diaNombre, ejercicios: sesion.ejercicios }
    return opcionesDeCambio(ejercicio, dia, [...ejercicios.values()], equipo.length > 0 ? equipo : [ejercicio.equipo])
  }

  async function cambiar(viejoId: string, nuevo: Exercise) {
    await modificarSesion(id, (actual) => {
      const posicion = actual.ejercicios.findIndex((e) => e.ejercicioId === viejoId)
      const r = cambiarEjercicioEnSesion(actual, posicion, nuevo, historial)
      return { ejercicios: r.ejercicios, series: r.series, sugerencias: r.sugerencias }
    })
    setCambiando(null)
  }
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
        {sesion.descarga && (
          <p className="rounded-xl bg-sky-400/10 p-3 text-sm text-sky-200">
            🧘 Semana de descarga: la mitad de las series y el mismo peso. Termina cada serie con reps de sobra.
          </p>
        )}
        <AvisoSeguridad compuesto />
        {sesion.ejercicios.map((plan) => (
          <TarjetaEjercicio
            key={plan.ejercicioId}
            id={id}
            plan={plan}
            ejercicio={ejercicios.get(plan.ejercicioId)}
            series={sesion.series}
            sugerencia={sesion.sugerencias?.[plan.ejercicioId]}
            nota={sesion.notasEjercicio?.[plan.ejercicioId]}
            notaAnterior={ultimaNota(plan.ejercicioId, historial)?.texto}
            cambiando={cambiando === plan.ejercicioId}
            alAlternarCambio={() => setCambiando(cambiando === plan.ejercicioId ? null : plan.ejercicioId)}
            opciones={opciones}
            alCambiar={(nuevo) => cambiar(plan.ejercicioId, nuevo)}
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

const COLOR_SUGERENCIA: Record<TipoSugerencia, string> = {
  subir: 'text-lime-300',
  mantener: 'text-neutral-200',
  bajar: 'text-amber-300',
  nuevo: 'text-sky-300',
  descarga: 'text-sky-300',
}

function TarjetaEjercicio({
  id,
  plan,
  ejercicio,
  series,
  sugerencia,
  nota,
  notaAnterior,
  cambiando,
  alAlternarCambio,
  opciones,
  alCambiar,
}: {
  id: number
  plan: EjercicioPlanificado
  ejercicio?: Exercise
  series: SetLog[]
  sugerencia?: Sugerencia
  nota?: string
  notaAnterior?: string
  cambiando: boolean
  alAlternarCambio: () => void
  opciones: (ejercicio: Exercise) => Exercise[]
  alCambiar: (nuevo: Exercise) => void
}) {
  const propias = series.map((s, indice) => ({ s, indice })).filter(({ s }) => s.ejercicioId === plan.ejercicioId)
  const hechas = propias.filter(({ s }) => s.completada).length
  const pesoCorporal = ejercicio?.equipo === 'peso_corporal'
  // Aproximación según el peso de la primera serie; solo antes de empezar el ejercicio
  const calentamiento = hechas === 0 ? seriesCalentamiento(propias[0]?.s.kg ?? 0, ejercicio) : []

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
          {sugerencia && <p className={`mt-1 text-sm font-medium ${COLOR_SUGERENCIA[sugerencia.tipo]}`}>{sugerencia.texto}</p>}
          {notaAnterior && !nota && <p className="mt-1 text-sm text-neutral-400">📝 La última vez: {notaAnterior}</p>}
        </div>
        <span className={`shrink-0 text-sm ${hechas === propias.length ? 'text-lime-300' : 'text-neutral-400'}`}>
          {hechas}/{propias.length}
        </span>
      </header>

      {calentamiento.length > 0 && (
        <details className="mb-3 rounded-lg bg-neutral-950/60 px-3 text-sm">
          <summary className="flex min-h-11 cursor-pointer items-center font-medium text-orange-300">
            🔥 Calentamiento ({calentamiento.length} {calentamiento.length === 1 ? 'serie' : 'series'})
          </summary>
          <ul className="pb-3 tabular-nums text-neutral-300">
            {calentamiento.map((c) => (
              <li key={c.kg}>
                {c.kg} kg × {c.reps}
              </li>
            ))}
          </ul>
          <p className="pb-3 text-xs text-neutral-500">Sin llegar al cansancio y con poco descanso. No hace falta registrarlas.</p>
        </details>
      )}

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
        {/* Cambiar solo hoy (máquina ocupada); no tiene sentido si ya se hicieron todas las series */}
        {ejercicio && hechas < propias.length && (
          <button
            type="button"
            onClick={alAlternarCambio}
            aria-expanded={cambiando}
            className={`min-h-11 flex-1 rounded-lg text-sm font-semibold ${cambiando ? 'bg-neutral-700' : 'bg-neutral-800 text-neutral-300'}`}
          >
            {cambiando ? 'Cerrar' : '⇄ Cambiar'}
          </button>
        )}
      </div>
      <NotaEjercicio
        nota={nota}
        sugerida={notaAnterior}
        alGuardar={(texto) =>
          modificarSesion(id, (a) => ({ notasEjercicio: conNotaEjercicio(a.notasEjercicio, plan.ejercicioId, texto) }))
        }
      />
      {cambiando && ejercicio && (
        <div className="mt-2">
          <OpcionesCambio
            titulo={
              hechas === 0
                ? 'Cambiar solo hoy por:'
                : propias.length - hechas === 1
                  ? 'Cambiar la serie que falta (solo hoy) por:'
                  : `Cambiar las ${propias.length - hechas} series que faltan (solo hoy) por:`
            }
            opciones={opciones(ejercicio)}
            alElegir={alCambiar}
          />
        </div>
      )}
    </section>
  )
}

/** Nota del ejercicio en esta sesión (ej. "asiento en el 4"). Se guarda al salir del campo. */
function NotaEjercicio({
  nota,
  sugerida,
  alGuardar,
}: {
  nota?: string
  sugerida?: string
  alGuardar: (texto: string) => void
}) {
  const [abierta, setAbierta] = useState(false)
  if (!abierta)
    return (
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-sm text-neutral-400 active:bg-neutral-800"
      >
        📝 {nota ? <span className="text-neutral-200">{nota}</span> : 'Añadir nota'}
      </button>
    )
  return (
    <textarea
      aria-label="Nota del ejercicio"
      autoFocus
      rows={2}
      maxLength={MAX_NOTA}
      defaultValue={nota ?? sugerida ?? ''}
      placeholder="Ej.: asiento en el 4, agarre ancho"
      onBlur={(e) => {
        setAbierta(false)
        if (e.target.value.trim() !== (nota ?? '')) alGuardar(e.target.value)
      }}
      className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2 text-sm"
    />
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
