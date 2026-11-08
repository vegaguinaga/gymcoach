// Reglas de una sesión de entrenamiento en vivo. Lógica pura: sin React ni Dexie.
import { mejor1RM, volumen } from './fuerza'
import { prescripcion } from './generador'
import { sugerencia } from './progresion'
import type { DiaRutina, EjercicioPlanificado, Exercise, Routine, SetLog, Sugerencia, WorkoutSession } from './tipos'

/** Día que toca: el siguiente al último entrenado de esta rutina (o el primero). */
export function siguienteDia(rutina: Routine, ultima?: WorkoutSession | null): number {
  if (!ultima || ultima.rutinaId !== rutina.id || ultima.diaIndice === undefined) return 0
  return (ultima.diaIndice + 1) % rutina.dias.length
}

/** Series completadas de la última sesión terminada en la que se hizo ese ejercicio. */
export function ultimasSeries(ejercicioId: string, historial: WorkoutSession[]): SetLog[] {
  const ordenado = [...historial].filter((s) => s.estado === 'terminada').sort((a, b) => b.fecha.localeCompare(a.fecha))
  for (const sesion of ordenado) {
    const series = sesion.series.filter((s) => s.ejercicioId === ejercicioId && s.completada)
    if (series.length > 0) return series
  }
  return []
}

/** Sugerencia de progresión para cada ejercicio del día (clave: ejercicioId). */
export function sugerenciasDia(
  dia: DiaRutina,
  historial: WorkoutSession[],
  ejercicios: Exercise[] = [],
  descarga = false,
): Record<string, Sugerencia> {
  const porId = new Map(ejercicios.map((e) => [e.id, e]))
  return Object.fromEntries(
    dia.ejercicios.map((plan) => [plan.ejercicioId, sugerencia(plan, porId.get(plan.ejercicioId), historial, descarga)]),
  )
}

/**
 * Series de un día listas para entrenar, con los kg y reps sugeridos (doble progresión).
 * Si el ejercicio es nuevo: 0 kg y el mínimo de reps (empezar liviano).
 * En descarga: la mitad de las series y el mismo peso.
 */
export function seriesIniciales(
  dia: DiaRutina,
  historial: WorkoutSession[],
  ejercicios: Exercise[] = [],
  descarga = false,
  sugerencias = sugerenciasDia(dia, historial, ejercicios, descarga),
): SetLog[] {
  return dia.ejercicios.flatMap((plan) => {
    const sug = sugerencias[plan.ejercicioId]
    return sug.reps.map((reps, i): SetLog => ({ ejercicioId: plan.ejercicioId, serie: i + 1, kg: sug.kg, reps, completada: false }))
  })
}

export interface OpcionesSesion {
  ejercicios?: Exercise[]
  descarga?: boolean
  ahora?: Date
}

/** Crea una sesión nueva en curso para el día indicado de la rutina. */
export function nuevaSesion(
  rutina: Routine,
  diaIndice: number,
  historial: WorkoutSession[],
  { ejercicios = [], descarga = false, ahora = new Date() }: OpcionesSesion = {},
): WorkoutSession {
  const dia = rutina.dias[diaIndice]
  const sugerencias = sugerenciasDia(dia, historial, ejercicios, descarga)
  return {
    fecha: ahora.toISOString(),
    estado: 'en_curso',
    rutinaId: rutina.id,
    diaIndice,
    diaNombre: dia.nombre,
    ejercicios: dia.ejercicios.map((e) => ({ ...e, series: sugerencias[e.ejercicioId].reps.length })),
    series: seriesIniciales(dia, historial, ejercicios, descarga, sugerencias),
    sugerencias,
    ...(descarga && { descarga: true }),
  }
}

/**
 * Cambia un ejercicio solo en la sesión de hoy (ej. la máquina está ocupada); la rutina no se toca.
 * - Las series ya hechas del original se conservan (cuentan como trabajo de ese ejercicio) y su tarjeta
 *   queda con esas series. Si no había ninguna hecha, el original desaparece de la sesión.
 * - El nuevo va justo después, con las series que faltaban (mínimo 1), la prescripción de su tipo
 *   y la sugerencia de peso según su historial.
 */
export function cambiarEjercicioEnSesion(
  sesion: WorkoutSession,
  posicion: number,
  nuevo: Exercise,
  historial: WorkoutSession[],
): WorkoutSession {
  const viejo = sesion.ejercicios[posicion]
  if (!viejo || viejo.ejercicioId === nuevo.id || sesion.ejercicios.some((e) => e.ejercicioId === nuevo.id)) return sesion
  const hechas = sesion.series.filter((s) => s.ejercicioId === viejo.ejercicioId && s.completada)
  const pendientes = Math.max(1, viejo.series - hechas.length)
  const planNuevo: EjercicioPlanificado = { ...prescripcion(nuevo), series: pendientes }
  // En descarga, `sugerencia` hace la mitad de las series del plan: se le pasa el doble para que queden las pendientes
  const sug = sugerencia(
    { ...planNuevo, series: sesion.descarga ? pendientes * 2 : pendientes },
    nuevo,
    historial,
    !!sesion.descarga,
  )
  const seriesNuevo = sug.reps.map((reps, i): SetLog => ({ ejercicioId: nuevo.id, serie: i + 1, kg: sug.kg, reps, completada: false }))

  // Las series nuevas ocupan el lugar de la primera pendiente del original (todo lo anterior se conserva);
  // si no había pendientes, van después de su última serie
  const primeraPendiente = sesion.series.findIndex((s) => s.ejercicioId === viejo.ejercicioId && !s.completada)
  const insertarEn = primeraPendiente >= 0 ? primeraPendiente : sesion.series.findLastIndex((s) => s.ejercicioId === viejo.ejercicioId) + 1 || sesion.series.length
  const sinPendientes = sesion.series.filter((s) => s.ejercicioId !== viejo.ejercicioId || s.completada)
  const series = [...sinPendientes.slice(0, insertarEn), ...seriesNuevo, ...sinPendientes.slice(insertarEn)]

  const planesViejo = hechas.length > 0 ? [{ ...viejo, series: hechas.length }] : []
  const ejercicios = [
    ...sesion.ejercicios.slice(0, posicion),
    ...planesViejo,
    { ...planNuevo, series: seriesNuevo.length },
    ...sesion.ejercicios.slice(posicion + 1),
  ]
  const sugerencias = { ...sesion.sugerencias, [nuevo.id]: sug }
  if (hechas.length === 0) delete sugerencias[viejo.ejercicioId]
  return { ...sesion, ejercicios, series, sugerencias }
}

/** Agrega una serie al final de un ejercicio, copiando kg y reps de su última serie. */
export function agregarSerie(series: SetLog[], ejercicioId: string, repsPorDefecto = 8): SetLog[] {
  const ultimoIdx = series.findLastIndex((s) => s.ejercicioId === ejercicioId)
  const ultima = ultimoIdx >= 0 ? series[ultimoIdx] : undefined
  const nueva: SetLog = {
    ejercicioId,
    serie: (ultima?.serie ?? 0) + 1,
    kg: ultima?.kg ?? 0,
    reps: ultima?.reps ?? repsPorDefecto,
    completada: false,
  }
  const pos = ultimoIdx >= 0 ? ultimoIdx + 1 : series.length
  return [...series.slice(0, pos), nueva, ...series.slice(pos)]
}

/** Quita una serie y renumera las restantes de ese ejercicio. */
export function quitarSerie(series: SetLog[], indice: number): SetLog[] {
  const quitada = series[indice]
  if (!quitada) return series
  let n = 0
  return series
    .filter((_, i) => i !== indice)
    .map((s) => (s.ejercicioId === quitada.ejercicioId ? { ...s, serie: ++n } : s))
}

/** Segundos que quedan de descanso (0 si no hay o ya terminó). */
export function segundosRestantes(hasta: string | undefined, ahora = new Date()): number {
  if (!hasta) return 0
  return Math.max(0, Math.ceil((Date.parse(hasta) - ahora.getTime()) / 1000))
}

/** Fecha ISO en la que termina un descanso de `segundos` empezando ahora. */
export function finDescanso(segundos: number, ahora = new Date()): string {
  return new Date(ahora.getTime() + segundos * 1000).toISOString()
}

export interface ResumenSesion {
  minutos: number
  seriesCompletadas: number
  seriesTotales: number
  /** Kg totales levantados (Σ kg × reps) */
  volumenKg: number
  /** Mejor 1RM estimado por ejercicio (solo los que tienen dato) */
  mejores: { ejercicioId: string; unoRM: number }[]
}

export function resumenSesion(sesion: WorkoutSession, ahora = new Date()): ResumenSesion {
  const fin = sesion.fin ? Date.parse(sesion.fin) : ahora.getTime()
  const ids = [...new Set(sesion.series.map((s) => s.ejercicioId))]
  return {
    minutos: Math.max(0, Math.round((fin - Date.parse(sesion.fecha)) / 60000)),
    seriesCompletadas: sesion.series.filter((s) => s.completada).length,
    seriesTotales: sesion.series.length,
    volumenKg: volumen(sesion.series),
    mejores: ids.flatMap((id) => {
      const rm = mejor1RM(sesion.series.filter((s) => s.ejercicioId === id))
      return rm === null ? [] : [{ ejercicioId: id, unoRM: rm }]
    }),
  }
}
