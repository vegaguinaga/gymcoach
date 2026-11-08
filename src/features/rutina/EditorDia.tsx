import { esPorTiempo, limitesReps } from '../../domain/medida'
import { useState } from 'react'
import { filtrarEjercicios } from '../../domain/biblioteca'
import {
  agregarEjercicio,
  editarPrescripcion,
  LIMITES,
  MAX_NOMBRE,
  moverEjercicio,
  quitarEjercicio,
  renombrarDia,
  sePuedeAgregar,
} from '../../domain/edicionRutina'
import type { EjercicioPlanificado, Equipo, Exercise, Routine } from '../../domain/tipos'

interface Props {
  rutina: Routine
  diaIndice: number
  porId: Map<string, Exercise>
  ejercicios: Exercise[]
  equipo: Equipo[]
  /** Guarda la rutina modificada */
  alGuardar: (rutina: Routine) => Promise<void>
}

/** Edición de un día: nombre, series/reps/RPE/descanso, orden, quitar y agregar ejercicios. Cada cambio se guarda al momento. */
export function EditorDia({ rutina, diaIndice, porId, ejercicios, equipo, alGuardar }: Props) {
  const dia = rutina.dias[diaIndice]
  const [nombre, setNombre] = useState(dia.nombre)
  const [agregando, setAgregando] = useState(false)
  const iguales = rutina.dias.flatMap((d, i) => (i !== diaIndice && d.nombre === dia.nombre ? [i + 1] : []))

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Nombre del día
        <input
          value={nombre}
          maxLength={MAX_NOMBRE}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={() => {
            const r = renombrarDia(rutina, diaIndice, nombre)
            if (r === rutina) setNombre(dia.nombre)
            else void alGuardar(r)
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-base text-neutral-100"
        />
      </label>
      {iguales.length > 0 && (
        <p className="text-xs text-neutral-400">
          Los cambios de ejercicios también se aplican al día {iguales.join(' y ')} (se llama igual). Cámbiale el nombre
          si quieres editarlo por separado.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {dia.ejercicios.map((e, pos) => (
          <FilaEditable
            key={e.ejercicioId}
            plan={e}
            nombre={porId.get(e.ejercicioId)?.nombre ?? e.ejercicioId}
            primero={pos === 0}
            ultimo={pos === dia.ejercicios.length - 1}
            unico={dia.ejercicios.length === 1}
            alEditar={(c) => alGuardar(editarPrescripcion(rutina, diaIndice, pos, c))}
            alMover={(d) => alGuardar(moverEjercicio(rutina, diaIndice, pos, d))}
            alQuitar={() => alGuardar(quitarEjercicio(rutina, diaIndice, pos))}
          />
        ))}
      </ul>

      {agregando ? (
        <BuscadorEjercicio
          opciones={filtrarEjercicios(ejercicios, { equipos: equipo }).filter((x) => sePuedeAgregar(dia, x))}
          alElegir={async (x) => {
            await alGuardar(agregarEjercicio(rutina, diaIndice, x))
            setAgregando(false)
          }}
          alCerrar={() => setAgregando(false)}
        />
      ) : (
        <button type="button" onClick={() => setAgregando(true)} className="min-h-11 rounded-lg bg-neutral-800 text-sm font-semibold">
          + Añadir ejercicio
        </button>
      )}
    </div>
  )
}

interface PropsFila {
  plan: EjercicioPlanificado
  nombre: string
  primero: boolean
  ultimo: boolean
  unico: boolean
  alEditar: (cambios: Partial<Omit<EjercicioPlanificado, 'ejercicioId'>>) => Promise<void>
  alMover: (delta: -1 | 1) => Promise<void>
  alQuitar: () => Promise<void>
}

function FilaEditable({ plan, nombre, primero, ultimo, unico, alEditar, alMover, alQuitar }: PropsFila) {
  const { series, rpe, descansoSeg: d } = LIMITES
  // En ejercicios por tiempo, reps son segundos (de 5 en 5)
  const reps = limitesReps(plan.ejercicioId)
  const etiquetaReps = esPorTiempo(plan.ejercicioId) ? 'Segundos' : 'Reps'
  return (
    <li className="rounded-lg border border-neutral-800 p-3">
      <div className="mb-2 flex items-center gap-1">
        <span className="flex-1 font-semibold">{nombre}</span>
        <BotonIcono etiqueta={`Subir ${nombre}`} disabled={primero} onClick={() => alMover(-1)}>
          ↑
        </BotonIcono>
        <BotonIcono etiqueta={`Bajar ${nombre}`} disabled={ultimo} onClick={() => alMover(1)}>
          ↓
        </BotonIcono>
        <BotonIcono
          etiqueta={`Quitar ${nombre}`}
          disabled={unico}
          onClick={() => {
            if (confirm(`¿Quitar ${nombre} de este día?`)) void alQuitar()
          }}
          peligro
        >
          ×
        </BotonIcono>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Contador
          etiqueta="Series"
          texto={String(plan.series)}
          menos={plan.series > series.min ? () => alEditar({ series: plan.series - 1 }) : undefined}
          mas={plan.series < series.max ? () => alEditar({ series: plan.series + 1 }) : undefined}
        />
        <Contador
          etiqueta="RPE"
          texto={String(plan.rpe)}
          menos={plan.rpe > rpe.min ? () => alEditar({ rpe: plan.rpe - 1 }) : undefined}
          mas={plan.rpe < rpe.max ? () => alEditar({ rpe: plan.rpe + 1 }) : undefined}
        />
        <Contador
          etiqueta={`${etiquetaReps} mín.`}
          texto={String(plan.repsMin)}
          menos={plan.repsMin > reps.min ? () => alEditar({ repsMin: plan.repsMin - reps.paso }) : undefined}
          mas={plan.repsMin < reps.max ? () => alEditar({ repsMin: plan.repsMin + reps.paso }) : undefined}
        />
        <Contador
          etiqueta={`${etiquetaReps} máx.`}
          texto={String(plan.repsMax)}
          menos={plan.repsMax > reps.min ? () => alEditar({ repsMax: plan.repsMax - reps.paso }) : undefined}
          mas={plan.repsMax < reps.max ? () => alEditar({ repsMax: plan.repsMax + reps.paso }) : undefined}
        />
        <Contador
          etiqueta="Descanso"
          texto={`${plan.descansoSeg} s`}
          menos={plan.descansoSeg > d.min ? () => alEditar({ descansoSeg: plan.descansoSeg - d.paso }) : undefined}
          mas={plan.descansoSeg < d.max ? () => alEditar({ descansoSeg: plan.descansoSeg + d.paso }) : undefined}
        />
      </div>
    </li>
  )
}

/** − valor +. Sin función = botón desactivado (llegó al límite). */
function Contador({ etiqueta, texto, menos, mas }: { etiqueta: string; texto: string; menos?: () => void; mas?: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-neutral-400">{etiqueta}</span>
      <div className="flex items-center rounded-lg bg-neutral-950">
        <button
          type="button"
          onClick={menos}
          disabled={!menos}
          aria-label={`Menos ${etiqueta.toLowerCase()}`}
          className="size-11 shrink-0 rounded-lg text-xl disabled:opacity-30"
        >
          −
        </button>
        <span className="flex-1 text-center tabular-nums" aria-live="polite">
          {texto}
        </span>
        <button
          type="button"
          onClick={mas}
          disabled={!mas}
          aria-label={`Más ${etiqueta.toLowerCase()}`}
          className="size-11 shrink-0 rounded-lg text-xl disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  )
}

function BotonIcono({
  etiqueta,
  disabled,
  onClick,
  peligro,
  children,
}: {
  etiqueta: string
  disabled?: boolean
  onClick: () => void
  peligro?: boolean
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      className={`size-11 shrink-0 rounded-lg bg-neutral-800 text-lg disabled:opacity-30 ${peligro ? 'text-red-300' : ''}`}
    >
      {children}
    </button>
  )
}

function BuscadorEjercicio({
  opciones,
  alElegir,
  alCerrar,
}: {
  opciones: Exercise[]
  alElegir: (e: Exercise) => Promise<void>
  alCerrar: () => void
}) {
  const [texto, setTexto] = useState('')
  const visibles = filtrarEjercicios(opciones, { texto }).slice(0, 30)
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-700 p-3">
      <div className="flex gap-2">
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar ejercicio…"
          aria-label="Buscar ejercicio para añadir"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3"
        />
        <button type="button" onClick={alCerrar} className="min-h-11 rounded-lg bg-neutral-800 px-3 text-sm">
          Cerrar
        </button>
      </div>
      {visibles.length === 0 ? (
        <p className="text-sm text-neutral-400">No hay ejercicios con ese nombre para tu equipo.</p>
      ) : (
        <ul className="max-h-72 divide-y divide-neutral-800 overflow-y-auto">
          {visibles.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => alElegir(e)} className="flex min-h-12 w-full flex-col justify-center text-left active:bg-neutral-800">
                <span>{e.nombre}</span>
                <span className="text-xs text-neutral-400">{e.tipo === 'compuesto' ? 'Compuesto' : 'Accesorio'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
