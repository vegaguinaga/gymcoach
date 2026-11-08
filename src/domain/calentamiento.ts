// Calentamiento: series de aproximación antes de los compuestos (regla de seguridad).
// Lógica pura. Son solo una guía: no se registran ni suman volumen.
import { incrementoKg } from './progresion'
import type { Exercise } from './tipos'
import { redondearKg } from './unidades'

export interface SerieAproximacion {
  kg: number
  reps: number
}

/** Con menos de este peso de trabajo basta una sola serie suave. */
export const KG_MINIMO_APROXIMACION = 20

const ESCALONES = [
  { pct: 0.4, reps: 8 },
  { pct: 0.6, reps: 5 },
  { pct: 0.8, reps: 3 },
]

/**
 * Series de aproximación según el peso de la primera serie de trabajo.
 * Solo para compuestos con carga; redondea al incremento del ejercicio (2 kg mancuernas, 2.5 kg resto)
 * y descarta las que quedan en 0, repetidas o iguales al peso de trabajo.
 */
export function seriesCalentamiento(kgTrabajo: number, ej?: Exercise): SerieAproximacion[] {
  if (!ej || ej.tipo !== 'compuesto' || !(kgTrabajo > 0)) return []
  const inc = incrementoKg(ej)
  const redondear = (kg: number) => redondearKg(Math.round(kg / inc) * inc)
  const escalones = kgTrabajo < KG_MINIMO_APROXIMACION ? [{ pct: 0.5, reps: 10 }] : ESCALONES
  const series: SerieAproximacion[] = []
  for (const { pct, reps } of escalones) {
    const kg = redondear(kgTrabajo * pct)
    if (kg > 0 && kg < kgTrabajo && !series.some((s) => s.kg === kg)) series.push({ kg, reps })
  }
  return series
}
