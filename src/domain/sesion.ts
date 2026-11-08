// Reglas de una sesión de entrenamiento en vivo. Lógica pura: sin React ni Dexie.
import { mejor1RM, volumen } from './fuerza'
import { sugerencia } from './progresion'
import type { DiaRutina, Exercise, Routine, SetLog, Sugerencia, WorkoutSession } from './tipos'

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
