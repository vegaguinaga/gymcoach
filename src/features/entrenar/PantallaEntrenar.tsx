import { useState } from 'react'
import { useEjercicios } from '../../data/repos/ejercicios'
import { usePerfil } from '../../data/repos/perfil'
import { useRutinaActual } from '../../data/repos/rutinas'
import { empezarSesion, useSesionEnCurso, useSesionesTerminadas, useUltimaSesion } from '../../data/repos/sesiones'
import { minutosEstimados } from '../../domain/generador'
import { estadoDescarga, type EstadoDescarga } from '../../domain/progresion'
import { siguienteDia } from '../../domain/sesion'
import type { Exercise, Routine, WorkoutSession } from '../../domain/tipos'
import { Pantalla } from '../../ui/Pantalla'
import { ResumenSesion } from './ResumenSesion'
import { SesionEnCurso } from './SesionEnCurso'

export function PantallaEntrenar() {
  const rutina = useRutinaActual()
  const enCurso = useSesionEnCurso()
  const ultima = useUltimaSesion()
  const ejercicios = useEjercicios()
  const historial = useSesionesTerminadas()
  const perfil = usePerfil()
  // Sesión recién terminada: se muestra su resumen hasta tocar "Listo"
  const [terminada, setTerminada] = useState<WorkoutSession | null>(null)

  if (rutina === undefined || enCurso === undefined || ultima === undefined || ejercicios === undefined || historial === undefined || perfil === undefined)
    return (
      <Pantalla titulo="Entrenar">
        <p className="text-neutral-400">Cargando…</p>
      </Pantalla>
    )

  const nombres = new Map(ejercicios.map((e) => [e.id, e]))

  if (terminada) return <ResumenSesion sesion={terminada} ejercicios={nombres} alCerrar={() => setTerminada(null)} />
  if (enCurso) return (
      <SesionEnCurso
        sesion={enCurso}
        ejercicios={nombres}
        historial={historial}
        equipo={perfil?.equipo ?? []}
        alTerminar={setTerminada}
      />
    )

  if (!rutina)
    return (
      <Pantalla titulo="Entrenar">
        <div className="flex flex-col gap-4 rounded-xl bg-neutral-900 p-4">
          <p>Para entrenar necesitas una rutina. La generamos en un toque según tu perfil.</p>
          <a href="#/rutina" className="flex min-h-12 items-center justify-center rounded-xl bg-lime-400 font-bold text-neutral-950">
            Ir a mi rutina
          </a>
        </div>
      </Pantalla>
    )

  // Compuestos de la rutina actual: si su 1RM baja 2 sesiones seguidas se recomienda descargar
  const compuestos = [...new Set(rutina.dias.flatMap((d) => d.ejercicios.map((e) => e.ejercicioId)))].filter(
    (id) => nombres.get(id)?.tipo === 'compuesto',
  )
  return (
    <SelectorDia
      rutina={rutina}
      sugerido={siguienteDia(rutina, ultima)}
      descarga={estadoDescarga(historial, compuestos)}
      ejercicios={nombres}
    />
  )
}

interface PropsSelector {
  rutina: Routine
  sugerido: number
  descarga: EstadoDescarga
  ejercicios: Map<string, Exercise>
}

function SelectorDia({ rutina, sugerido, descarga, ejercicios }: PropsSelector) {
  const [elegido, setElegido] = useState(sugerido)
  const [empezando, setEmpezando] = useState(false)
  const hayAviso = descarga.activa || descarga.recomendada
  const [conDescarga, setConDescarga] = useState(hayAviso)

  async function empezar() {
    setEmpezando(true)
    try {
      await empezarSesion(rutina, elegido, hayAviso && conDescarga)
    } finally {
      setEmpezando(false)
    }
  }

  return (
    <Pantalla titulo="Entrenar">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-neutral-300">¿Qué día entrenas hoy?</legend>
        {rutina.dias.map((dia, i) => (
          <label
            key={i}
            className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 ${
              elegido === i ? 'border-lime-400 bg-lime-400/10' : 'border-neutral-800 bg-neutral-900'
            }`}
          >
            <input
              type="radio"
              name="dia"
              checked={elegido === i}
              onChange={() => setElegido(i)}
              className="size-5 accent-lime-400"
            />
            <span className="flex flex-1 flex-col">
              <span className="font-semibold">
                Día {i + 1} · {dia.nombre}
              </span>
              <span className="text-sm text-neutral-400">
                {dia.ejercicios.length} ejercicios · ~{minutosEstimados(dia)} min
              </span>
            </span>
            {i === sugerido && (
              <span className="rounded-full bg-lime-400 px-2 py-0.5 text-xs font-bold text-neutral-950">Toca hoy</span>
            )}
          </label>
        ))}
      </fieldset>
      {hayAviso && (
        <div className="mt-4 rounded-xl border border-sky-400/40 bg-sky-400/10 p-4">
          <p className="font-semibold text-sky-200">
            {descarga.activa ? '🧘 Semana de descarga en curso' : '🧘 Te toca una semana de descarga'}
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            {descarga.motivo}
            {descarga.ejercicioId && ` (${ejercicios.get(descarga.ejercicioId)?.nombre ?? descarga.ejercicioId})`}.
            {descarga.recomendada && ' Durante 7 días haces la mitad de las series con el mismo peso.'}
          </p>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={conDescarga}
              onChange={(e) => setConDescarga(e.target.checked)}
              className="size-5 accent-sky-400"
            />
            <span>Entrenar hoy en modo descarga</span>
          </label>
        </div>
      )}
      <button
        type="button"
        onClick={empezar}
        disabled={empezando}
        className="mt-6 min-h-14 w-full rounded-xl bg-lime-400 text-lg font-bold text-neutral-950 disabled:opacity-40"
      >
        Empezar
      </button>
    </Pantalla>
  )
}
