// Ejercicios que se miden en segundos (isométricos, como la plancha).
// En ellos el campo `reps` guarda segundos: en SetLog, en la prescripción (repsMin/repsMax) y en las sugerencias.
// No cuentan para el 1RM ni para el volumen (kg × reps no tiene sentido con segundos).

export const EJERCICIOS_POR_TIEMPO: ReadonlySet<string> = new Set(['plancha'])

/** Segundos que se suman al progresar (equivale a +1 rep). */
export const PASO_SEGUNDOS = 5
export const LIMITES_SEGUNDOS = { min: 10, max: 180, paso: PASO_SEGUNDOS } as const
/** Tope al registrar una serie por tiempo (10 min). */
export const MAX_SEGUNDOS = 600
export const LIMITES_REPS = { min: 1, max: 30, paso: 1 } as const

export const esPorTiempo = (ejercicioId: string) => EJERCICIOS_POR_TIEMPO.has(ejercicioId)

/** Límites y paso del campo reps/segundos según el ejercicio. */
export const limitesReps = (ejercicioId: string) => (esPorTiempo(ejercicioId) ? LIMITES_SEGUNDOS : LIMITES_REPS)

/** Unidad corta para mostrar: "s" o "reps". */
export const unidad = (ejercicioId: string) => (esPorTiempo(ejercicioId) ? 's' : 'reps')

/** "45 s" o "8 reps". */
export const conUnidad = (ejercicioId: string, n: number) => `${n} ${unidad(ejercicioId)}`

/** "1:05" para segundos (cronómetro). */
export function textoCronometro(seg: number): string {
  const s = Math.max(0, Math.floor(seg))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
