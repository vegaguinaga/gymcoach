// Edición de sesiones ya terminadas (corregir lo que se anotó mal).
// Los récords, la progresión y el 1RM se recalculan solos porque se leen de las sesiones.
import { MAX_SEGUNDOS, esPorTiempo } from './medida'
import { claveDia } from './calendario'
import type { SetLog, WorkoutSession } from './tipos'
import { redondearKg } from './unidades'

export const MAX_KG = 500
export const MAX_REPS = 100

/** Ajusta una serie a valores válidos: kg 0–500 con 1 decimal, reps enteras 0–100 (por tiempo, segundos 0–600), RPE 1–10 o sin RPE. */
export function normalizarSerie(s: SetLog): SetLog {
  const kg = Number.isFinite(s.kg) ? Math.min(MAX_KG, Math.max(0, redondearKg(s.kg))) : 0
  const max = esPorTiempo(s.ejercicioId) ? MAX_SEGUNDOS : MAX_REPS
  const reps = Number.isFinite(s.reps) ? Math.min(max, Math.max(0, Math.round(s.reps))) : 0
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

/** Convierte 'AAAA-MM-DD' y 'HH:MM' (hora local) en una fecha; null si no son válidos. */
export function fechaLocal(dia: string, hora = '00:00'): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia)
  const h = /^(\d{2}):(\d{2})$/.exec(hora)
  if (!d || !h) return null
  const [anio, mes, num] = [Number(d[1]), Number(d[2]), Number(d[3])]
  const fecha = new Date(anio, mes - 1, num, Number(h[1]), Number(h[2]))
  // Descarta días que no existen (ej. 31 de febrero) y horas fuera de rango
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== num) return null
  if (fecha.getHours() !== Number(h[1]) || fecha.getMinutes() !== Number(h[2])) return null
  return fecha
}

/**
 * Mueve una sesión terminada a otro día, conservando la hora de inicio y la duración.
 * No acepta días futuros (null). Si al moverla a hoy quedaría empezando más tarde que ahora,
 * se adelanta para que termine ahora.
 */
export function cambiarFecha(
  sesion: Pick<WorkoutSession, 'fecha' | 'fin'>,
  dia: string,
  ahora = new Date(),
): { fecha: string; fin?: string } | null {
  const original = new Date(sesion.fecha)
  const hora = `${String(original.getHours()).padStart(2, '0')}:${String(original.getMinutes()).padStart(2, '0')}`
  const inicio = fechaLocal(dia, hora)
  if (!inicio || dia > claveDia(ahora)) return null
  inicio.setSeconds(original.getSeconds(), original.getMilliseconds())
  const duracion = sesion.fin ? Math.max(0, Date.parse(sesion.fin) - original.getTime()) : 0
  let ms = inicio.getTime()
  if (ms + duracion > ahora.getTime()) ms = ahora.getTime() - duracion
  return { fecha: new Date(ms).toISOString(), ...(sesion.fin && { fin: new Date(ms + duracion).toISOString() }) }
}
