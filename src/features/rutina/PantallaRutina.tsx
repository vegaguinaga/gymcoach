import { useState } from 'react'
import { useEjercicios } from '../../data/repos/ejercicios'
import { usePerfil } from '../../data/repos/perfil'
import { guardarRutina, useRutinaActual } from '../../data/repos/rutinas'
import { diasEfectivos, generarRutina, minutosEstimados } from '../../domain/generador'
import type { DiaRutina, EjercicioPlanificado, Exercise } from '../../domain/tipos'
import { AvisoSeguridad } from '../../ui/AvisoSeguridad'
import { Pantalla } from '../../ui/Pantalla'

function textoDescanso(seg: number): string {
  return seg >= 60 && seg % 60 === 0 ? `${seg / 60} min` : seg > 60 ? `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')} min` : `${seg} s`
}

export function PantallaRutina() {
  const perfil = usePerfil()
  const ejercicios = useEjercicios()
  const rutina = useRutinaActual()
  const [generando, setGenerando] = useState(false)

  if (perfil === undefined || ejercicios === undefined || rutina === undefined)
    return (
      <Pantalla titulo="Mi rutina">
        <p className="text-neutral-400">Cargando…</p>
      </Pantalla>
    )

  if (perfil === null)
    return (
      <Pantalla titulo="Mi rutina">
        <div className="flex flex-col gap-4 rounded-xl bg-neutral-900 p-4">
          <p>Primero completa tu perfil: con tus días, minutos y equipo armamos la rutina.</p>
          <a href="#/perfil" className="flex min-h-12 items-center justify-center rounded-xl bg-lime-400 font-bold text-neutral-950">
            Ir a mi perfil
          </a>
        </div>
      </Pantalla>
    )

  async function generar() {
    if (!perfil || !ejercicios) return
    if (rutina && !confirm('¿Generar una rutina nueva? La actual quedará guardada en el historial.')) return
    setGenerando(true)
    try {
      await guardarRutina(generarRutina(perfil, ejercicios))
    } finally {
      setGenerando(false)
    }
  }

  const porId = new Map(ejercicios.map((e) => [e.id, e]))
  const perfilCambio = rutina !== null && perfil.actualizado > rutina.creada

  return (
    <Pantalla titulo="Mi rutina">
      <div className="flex flex-col gap-4">
        {rutina ? (
          <div>
            <p className="text-lg font-semibold">{rutina.nombre}</p>
            <p className="text-sm text-neutral-400">
              Creada el {new Date(rutina.creada).toLocaleDateString('es')}
            </p>
          </div>
        ) : (
          <p className="text-neutral-300">
            Aún no tienes rutina. La armamos según tu perfil: {diasEfectivos(perfil.diasPorSemana)} días de{' '}
            {perfil.minutosPorSesion} min.
          </p>
        )}

        {perfil.diasPorSemana > diasEfectivos(perfil.diasPorSemana) && (
          <p className="rounded-xl bg-neutral-900 p-3 text-sm text-neutral-300">
            Elegiste {perfil.diasPorSemana} días: para empezar te proponemos {diasEfectivos(perfil.diasPorSemana)} y uno
            de descanso para recuperarte.
          </p>
        )}

        {perfilCambio && (
          <p className="rounded-xl bg-lime-400/10 p-3 text-sm text-lime-200">
            Cambiaste tu perfil después de crear esta rutina. Genera una nueva para ajustarla.
          </p>
        )}

        <button
          type="button"
          onClick={generar}
          disabled={generando}
          className={`min-h-12 rounded-xl font-bold disabled:opacity-40 ${
            rutina && !perfilCambio ? 'bg-neutral-800 text-neutral-100' : 'bg-lime-400 text-neutral-950'
          }`}
        >
          {generando ? 'Generando…' : rutina ? 'Generar rutina nueva' : 'Generar mi rutina'}
        </button>

        {rutina && (
          <>
            <AvisoSeguridad compuesto />
            {rutina.dias.map((dia, i) => (
              <TarjetaDia key={i} numero={i + 1} dia={dia} porId={porId} />
            ))}
          </>
        )}
      </div>
    </Pantalla>
  )
}

function TarjetaDia({ numero, dia, porId }: { numero: number; dia: DiaRutina; porId: Map<string, Exercise> }) {
  return (
    <section className="rounded-xl bg-neutral-900 p-4" aria-labelledby={`dia-${numero}`}>
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id={`dia-${numero}`} className="text-lg font-bold">
          Día {numero} · {dia.nombre}
        </h2>
        <span className="shrink-0 text-sm text-neutral-400">~{minutosEstimados(dia)} min</span>
      </header>
      <ul className="divide-y divide-neutral-800">
        {dia.ejercicios.map((e) => (
          <FilaEjercicio key={e.ejercicioId} plan={e} ejercicio={porId.get(e.ejercicioId)} />
        ))}
      </ul>
      {!!dia.cardioMin && (
        <p className="mt-2 text-sm text-neutral-300">
          + {dia.cardioMin} min de cardio suave al final (bici, cinta inclinada o elíptica).
        </p>
      )}
    </section>
  )
}

function FilaEjercicio({ plan, ejercicio }: { plan: EjercicioPlanificado; ejercicio?: Exercise }) {
  return (
    <li>
      <a
        href={`#/ejercicios/${plan.ejercicioId}`}
        className="flex min-h-14 items-center justify-between gap-3 py-2 active:bg-neutral-800"
      >
        <span className="flex flex-col">
          <span className="font-semibold">{ejercicio?.nombre ?? plan.ejercicioId}</span>
          <span className="text-sm text-neutral-400">
            {plan.series} × {plan.repsMin}–{plan.repsMax} reps · RPE {plan.rpe} · descanso {textoDescanso(plan.descansoSeg)}
          </span>
        </span>
        <span aria-hidden="true" className="text-neutral-500">›</span>
      </a>
    </li>
  )
}
