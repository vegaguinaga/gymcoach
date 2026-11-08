import { useState, type ReactNode } from 'react'
import { useEjercicios } from '../../data/repos/ejercicios'
import { usePerfil } from '../../data/repos/perfil'
import { actualizarRutina, guardarRutina, useRutinaActual } from '../../data/repos/rutinas'
import { cambiarEjercicio, diasEfectivos, generarRutina, minutosEstimados, opcionesDeCambio } from '../../domain/generador'
import { MAX_DIAS, agregarDia, quitarDia, renombrarRutina } from '../../domain/edicionRutina'
import type { DiaRutina, EjercicioPlanificado, Equipo, Exercise, Routine } from '../../domain/tipos'
import { AvisoSeguridad } from '../../ui/AvisoSeguridad'
import { OpcionesCambio } from '../../ui/OpcionesCambio'
import { VolumenSemanal } from '../../ui/VolumenSemanal'
import { seriesPorGrupo } from '../../domain/volumen'
import { Pantalla } from '../../ui/Pantalla'
import { EditorDia } from './EditorDia'

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
    const aviso = rutina?.personalizada
      ? '¿Generar una rutina nueva? La nueva no tendrá los cambios que hiciste a mano (la actual quedará guardada en el historial).'
      : '¿Generar una rutina nueva? La actual quedará guardada en el historial.'
    if (rutina && !confirm(aviso)) return
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
            <div className="flex items-center gap-2">
              <p className="flex-1 text-lg font-semibold">{rutina.nombre}</p>
              <button
                type="button"
                aria-label="Cambiar el nombre de la rutina"
                onClick={() => {
                  const nuevo = prompt('Nombre de la rutina', rutina.nombre)
                  if (nuevo !== null) void actualizarRutina(renombrarRutina(rutina, nuevo))
                }}
                className="size-11 rounded-lg bg-neutral-800"
              >
                ✏️
              </button>
            </div>
            <p className="text-sm text-neutral-400">
              Creada el {new Date(rutina.creada).toLocaleDateString('es')}
              {rutina.personalizada && ' · editada por ti'}
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
            <details className="rounded-xl bg-neutral-900 p-4">
              <summary className="flex min-h-11 cursor-pointer items-center font-semibold">📊 Volumen semanal</summary>
              <div className="mt-2">
                <VolumenSemanal plan={seriesPorGrupo(rutina, ejercicios)} />
              </div>
            </details>
            {rutina.dias.map((dia, i) => (
              <TarjetaDia
                key={`${i}-${dia.nombre}`}
                numero={i + 1}
                dia={dia}
                rutina={rutina}
                porId={porId}
                ejercicios={ejercicios}
                equipo={perfil.equipo}
                alCambiar={(pos, nuevo) => actualizarRutina({ ...cambiarEjercicio(rutina, i, pos, nuevo), personalizada: true })}
              />
            ))}
            <AgregarDia rutina={rutina} />
          </>
        )}
      </div>
    </Pantalla>
  )
}

/** «Añadir día»: copia de un día existente, al final de la rutina (máximo 7). */
function AgregarDia({ rutina }: { rutina: Routine }) {
  const [copiaDe, setCopiaDe] = useState(0)
  if (rutina.dias.length >= MAX_DIAS)
    return <p className="text-center text-sm text-neutral-500">La rutina ya tiene {MAX_DIAS} días, el máximo.</p>
  const origen = Math.min(copiaDe, rutina.dias.length - 1)
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-dashed border-neutral-700 p-4" aria-labelledby="titulo-agregar-dia">
      <h2 id="titulo-agregar-dia" className="font-semibold">
        Añadir un día
      </h2>
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Copia de
        <select
          value={origen}
          onChange={(e) => setCopiaDe(Number(e.target.value))}
          className="min-h-12 rounded-lg border border-neutral-700 bg-neutral-950 px-3"
        >
          {rutina.dias.map((d, i) => (
            <option key={i} value={i}>
              Día {i + 1} · {d.nombre}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-neutral-400">Mientras tenga el mismo nombre, cambia junto a su original. Renómbralo para separarlo.</p>
      <button
        type="button"
        onClick={() => void actualizarRutina(agregarDia(rutina, origen))}
        className="min-h-12 rounded-xl bg-neutral-800 font-semibold"
      >
        ➕ Añadir día
      </button>
    </section>
  )
}

interface PropsDia {
  numero: number
  dia: DiaRutina
  rutina: Routine
  porId: Map<string, Exercise>
  ejercicios: Exercise[]
  equipo: Equipo[]
  alCambiar: (posicion: number, nuevo: Exercise) => Promise<void>
}

function TarjetaDia({ numero, dia, rutina, porId, ejercicios, equipo, alCambiar }: PropsDia) {
  // Posición del ejercicio cuyo selector de cambio está abierto
  const [cambiando, setCambiando] = useState<number | null>(null)
  const [editando, setEditando] = useState(false)
  return (
    <section className="rounded-xl bg-neutral-900 p-4" aria-labelledby={`dia-${numero}`}>
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id={`dia-${numero}`} className="text-lg font-bold">
          Día {numero} · {dia.nombre}
        </h2>
        <span className="shrink-0 text-sm text-neutral-400">~{minutosEstimados(dia)} min</span>
      </header>
      <button
        type="button"
        onClick={() => {
          setEditando(!editando)
          setCambiando(null)
        }}
        aria-expanded={editando}
        className={`mb-2 min-h-11 w-full rounded-lg text-sm font-semibold ${
          editando ? 'bg-lime-400 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
        }`}
      >
        {editando ? '✓ Listo' : '✏️ Editar día'}
      </button>
      {editando ? (
        <>
          <EditorDia
            rutina={rutina}
            diaIndice={numero - 1}
            porId={porId}
            ejercicios={ejercicios}
            equipo={equipo}
            alGuardar={actualizarRutina}
          />
          {rutina.dias.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Quitar el día ${numero} (${dia.nombre}) de la rutina? Tu historial no se borra.`))
                  void actualizarRutina(quitarDia(rutina, numero - 1))
              }}
              className="mt-3 min-h-11 w-full rounded-lg border border-red-900 text-sm text-red-300 active:bg-red-950"
            >
              Quitar este día
            </button>
          )}
        </>
      ) : (
        <ul className="divide-y divide-neutral-800">
          {dia.ejercicios.map((e, pos) => {
            const ejercicio = porId.get(e.ejercicioId)
            const abierto = cambiando === pos
            return (
              <FilaEjercicio
                key={e.ejercicioId}
                plan={e}
                ejercicio={ejercicio}
                abierto={abierto}
                alAlternar={() => setCambiando(abierto ? null : pos)}
              >
                {abierto && ejercicio && (
                  <OpcionesCambio
                    titulo="Cambiar por (en todos los días iguales):"
                    opciones={opcionesDeCambio(ejercicio, dia, ejercicios, equipo)}
                    alElegir={async (nuevo) => {
                      await alCambiar(pos, nuevo)
                      setCambiando(null)
                    }}
                  />
                )}
              </FilaEjercicio>
            )
          })}
        </ul>
      )}
      {!!dia.cardioMin && (
        <p className="mt-2 text-sm text-neutral-300">
          + {dia.cardioMin} min de cardio suave al final (bici, cinta inclinada o elíptica).
        </p>
      )}
    </section>
  )
}

interface PropsFila {
  plan: EjercicioPlanificado
  ejercicio?: Exercise
  abierto: boolean
  alAlternar: () => void
  children?: ReactNode
}

function FilaEjercicio({ plan, ejercicio, abierto, alAlternar, children }: PropsFila) {
  return (
    <li className="py-1">
      <div className="flex items-center gap-2">
        <a
          href={`#/ejercicios/${plan.ejercicioId}`}
          className="flex min-h-14 flex-1 flex-col justify-center py-1 active:bg-neutral-800"
        >
          <span className="font-semibold">{ejercicio?.nombre ?? plan.ejercicioId}</span>
          <span className="text-sm text-neutral-400">
            {plan.series} × {plan.repsMin}–{plan.repsMax} reps · RPE {plan.rpe} · descanso {textoDescanso(plan.descansoSeg)}
          </span>
        </a>
        <button
          type="button"
          onClick={alAlternar}
          aria-expanded={abierto}
          className={`min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold ${
            abierto ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-800 text-neutral-300'
          }`}
        >
          {abierto ? 'Cerrar' : 'Cambiar'}
        </button>
      </div>
      {children}
    </li>
  )
}
