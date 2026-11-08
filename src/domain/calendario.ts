// Calendario de entrenamientos y racha semanal. Usa la hora local del teléfono.
import type { WorkoutSession } from './tipos'

export interface DiaCalendario {
  dia: number
  /** "AAAA-MM-DD" en hora local */
  clave: string
  sesiones: WorkoutSession[]
  hoy: boolean
}

/** "AAAA-MM-DD" de una fecha en hora local. */
export function claveDia(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${m}-${d}`
}

/** Lunes (00:00 local) de la semana de la fecha. */
export function inicioSemana(fecha: Date): Date {
  const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))
  return lunes
}

/** Sesiones agrupadas por día local. */
export function sesionesPorDia(sesiones: WorkoutSession[]): Map<string, WorkoutSession[]> {
  const mapa = new Map<string, WorkoutSession[]>()
  for (const s of [...sesiones].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    const k = claveDia(new Date(s.fecha))
    mapa.set(k, [...(mapa.get(k) ?? []), s])
  }
  return mapa
}

/**
 * Semanas del mes (lunes a domingo) para pintar la cuadrícula.
 * Las casillas de otros meses son null. `mes` va de 0 (enero) a 11.
 */
export function mesCalendario(anio: number, mes: number, sesiones: WorkoutSession[], ahora = new Date()): (DiaCalendario | null)[][] {
  const porDia = sesionesPorDia(sesiones)
  const hoy = claveDia(ahora)
  const diasMes = new Date(anio, mes + 1, 0).getDate()
  const hueco = (new Date(anio, mes, 1).getDay() + 6) % 7
  const casillas: (DiaCalendario | null)[] = Array.from({ length: hueco }, () => null)
  for (let dia = 1; dia <= diasMes; dia++) {
    const clave = claveDia(new Date(anio, mes, dia))
    casillas.push({ dia, clave, sesiones: porDia.get(clave) ?? [], hoy: clave === hoy })
  }
  while (casillas.length % 7) casillas.push(null)
  const semanas: (DiaCalendario | null)[][] = []
  for (let i = 0; i < casillas.length; i += 7) semanas.push(casillas.slice(i, i + 7))
  return semanas
}

/**
 * Semanas seguidas con al menos una sesión, contando hacia atrás desde la actual.
 * La semana en curso suma si ya entrenaste, pero no rompe la racha si aún no.
 */
export function rachaSemanas(sesiones: WorkoutSession[], ahora = new Date()): number {
  const semanas = new Set(sesiones.map((s) => claveDia(inicioSemana(new Date(s.fecha)))))
  const lunes = inicioSemana(ahora)
  let racha = 0
  if (semanas.has(claveDia(lunes))) racha++
  for (;;) {
    lunes.setDate(lunes.getDate() - 7)
    if (!semanas.has(claveDia(lunes))) return racha
    racha++
  }
}
