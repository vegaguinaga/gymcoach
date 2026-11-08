// Fórmulas de fuerza: 1RM estimado y volumen.
import { redondearKg } from './unidades'
import { esPorTiempo } from './medida'
import type { SetLog } from './tipos'

/** 1RM estimado con Epley: kg × (1 + reps / 30). Solo es fiable con 1–12 reps; fuera de eso, null. */
export function unoRMEpley(kg: number, reps: number): number | null {
  if (kg <= 0 || reps < 1 || reps > 12) return null
  if (reps === 1) return redondearKg(kg)
  return redondearKg(kg * (1 + reps / 30))
}

/** Volumen = Σ kg × reps de las series completadas (los ejercicios por tiempo no cuentan). */
export function volumen(series: SetLog[]): number {
  return redondearKg(series.filter((s) => s.completada && !esPorTiempo(s.ejercicioId)).reduce((t, s) => t + s.kg * s.reps, 0))
}

/** Mayor 1RM estimado entre las series completadas (null si ninguna sirve). */
export function mejor1RM(series: SetLog[]): number | null {
  let mejor: number | null = null
  for (const s of series) {
    if (!s.completada || esPorTiempo(s.ejercicioId)) continue
    const rm = unoRMEpley(s.kg, s.reps)
    if (rm !== null && (mejor === null || rm > mejor)) mejor = rm
  }
  return mejor
}
