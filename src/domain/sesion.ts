// Reglas de una sesión de entrenamiento en vivo. Lógica pura: sin React ni Dexie.
import { mejor1RM, volumen } from './fuerza'
import type { DiaRutina, Routine, SetLog, WorkoutSession } from './tipos'

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

/**
 * Series de un día listas para entrenar: con los kg y reps de la última vez que se hizo
 * cada ejercicio. Si es nuevo: 0 kg y el mínimo de reps (empezar liviano).
 */
export function seriesIniciales(dia: DiaRutina, historial: WorkoutSession[]): SetLog[] {
  return dia.ejercicios.flatMap((plan) => {
    const previas = ultimasSeries(plan.ejercicioId, historial)
    return Array.from({ length: plan.series }, (_, i): SetLog => {
      const ref = previas[Math.min(i, previas.length - 1)]
      return {
        ejercicioId: plan.ejercicioId,
        serie: i + 1,
        kg: ref?.kg ?? 0,
        reps: ref?.reps ?? plan.repsMin,
        completada: false,
      }
    })
  })
}

/** Crea una sesión nueva en curso para el día indicado de la rutina. */
export function nuevaSesion(
  rutina: Routine,
  diaIndice: number,
  historial: WorkoutSession[],
  ahora = new Date(),
): WorkoutSession {
  const dia = rutina.dias[diaIndice]
  return {
    fecha: ahora.toISOString(),
    estado: 'en_curso',
    rutinaId: rutina.id,
    diaIndice,
    diaNombre: dia.nombre,
    ejercicios: dia.ejercicios.map((e) => ({ ...e })),
    series: seriesIniciales(dia, historial),
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
