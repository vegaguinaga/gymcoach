// Edición de sesiones ya terminadas (corregir lo que se anotó mal).
// Los récords, la progresión y el 1RM se recalculan solos porque se leen de las sesiones.
import type { SetLog } from './tipos'
import { redondearKg } from './unidades'

export const MAX_KG = 500
export const MAX_REPS = 100

/** Ajusta una serie a valores válidos: kg 0–500 con 1 decimal, reps enteras 0–100, RPE 1–10 o sin RPE. */
export function normalizarSerie(s: SetLog): SetLog {
  const kg = Number.isFinite(s.kg) ? Math.min(MAX_KG, Math.max(0, redondearKg(s.kg))) : 0
  const reps = Number.isFinite(s.reps) ? Math.min(MAX_REPS, Math.max(0, Math.round(s.reps))) : 0
  const rpe = s.rpe !== undefined && Number.isFinite(s.rpe) ? Math.min(10, Math.max(1, Math.round(s.rpe))) : undefined
  const normal: SetLog = { ...s, kg, reps, rpe }
  if (rpe === undefined) delete normal.rpe
  return normal
}

/** Cambia una serie (por índice en la lista) dejando los valores dentro de los límites. */
export function editarSerie(series: SetLog[], indice: number, cambios: Partial<Omit<SetLog, 'ejercicioId' | 'serie'>>): SetLog[] {
  if (!series[indice]) return series
  return series.map((s, i) => (i === indice ? normalizarSerie({ ...s, ...cambios }) : s))
}

/** true si las series editadas son distintas de las guardadas (para habilitar «Guardar»). */
export function hayCambios(antes: SetLog[], despues: SetLog[]): boolean {
  return JSON.stringify(antes.map(normalizarSerie)) !== JSON.stringify(despues.map(normalizarSerie))
}
