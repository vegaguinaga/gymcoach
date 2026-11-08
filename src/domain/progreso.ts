// Progreso: historial por ejercicio, récords personales y resumen de constancia.
// Solo cuentan las sesiones terminadas y las series completadas.
import { mejor1RM, volumen } from './fuerza'
import { esPorTiempo } from './medida'
import type { SetLog, WorkoutSession } from './tipos'

export interface PuntoEjercicio {
  fecha: string
  sesionId?: number
  /** Mejor 1RM estimado de la sesión (null si ninguna serie sirve, ej. peso corporal sin lastre) */
  unoRM: number | null
  volumen: number
  /** Mejor serie de la sesión */
  mejorSerie: SerieRecord
}

export interface SerieRecord {
  kg: number
  reps: number
}

export interface RecordEjercicio {
  ejercicioId: string
  unoRM: { valor: number; fecha: string } | null
  mejorSerie: (SerieRecord & { fecha: string }) | null
}

export interface RecordNuevo {
  ejercicioId: string
  tipo: 'unoRM' | 'serie'
  /** Texto listo para mostrar: "82.5 kg" o "60 kg × 8" */
  texto: string
}

const terminadasOrdenadas = (sesiones: WorkoutSession[]) =>
  sesiones.filter((s) => s.estado === 'terminada').sort((a, b) => a.fecha.localeCompare(b.fecha))

const completadasDe = (sesion: WorkoutSession, ejercicioId: string) =>
  sesion.series.filter((s) => s.completada && s.ejercicioId === ejercicioId)

/** a supera a b: más kg × reps; con empate (ej. peso corporal, kg 0), más reps. */
function serieMejor(a: SerieRecord, b: SerieRecord): boolean {
  const va = a.kg * a.reps
  const vb = b.kg * b.reps
  return va > vb || (va === vb && a.reps > b.reps)
}

function mejorSerieDe(series: SetLog[]): SerieRecord | null {
  let mejor: SerieRecord | null = null
  for (const s of series) {
    if (s.reps < 1) continue
    if (!mejor || serieMejor(s, mejor)) mejor = { kg: s.kg, reps: s.reps }
  }
  return mejor
}

/** "60 kg × 8", "12 reps"; por tiempo: "45 s" o "10 kg × 45 s". */
export function textoSerie(s: SerieRecord, porTiempo = false): string {
  if (porTiempo) return s.kg > 0 ? `${s.kg} kg × ${s.reps} s` : `${s.reps} s`
  return s.kg > 0 ? `${s.kg} kg × ${s.reps}` : `${s.reps} reps`
}

/** Un punto por sesión terminada en la que se completó alguna serie del ejercicio, de la más antigua a la más reciente. */
export function historialEjercicio(sesiones: WorkoutSession[], ejercicioId: string): PuntoEjercicio[] {
  const puntos: PuntoEjercicio[] = []
  for (const sesion of terminadasOrdenadas(sesiones)) {
    const series = completadasDe(sesion, ejercicioId)
    const mejorSerie = mejorSerieDe(series)
    if (!mejorSerie) continue
    puntos.push({ fecha: sesion.fecha, sesionId: sesion.id, unoRM: mejor1RM(series), volumen: volumen(series), mejorSerie })
  }
  return puntos
}

/** Récords personales por ejercicio: mayor 1RM estimado y mejor serie (kg × reps). Ante empate se queda la fecha más antigua. */
export function recordsPorEjercicio(sesiones: WorkoutSession[]): Map<string, RecordEjercicio> {
  const records = new Map<string, RecordEjercicio>()
  for (const sesion of terminadasOrdenadas(sesiones)) {
    const ids = new Set(sesion.series.filter((s) => s.completada).map((s) => s.ejercicioId))
    for (const id of ids) {
      const series = completadasDe(sesion, id)
      const r = records.get(id) ?? { ejercicioId: id, unoRM: null, mejorSerie: null }
      const rm = mejor1RM(series)
      if (rm !== null && (!r.unoRM || rm > r.unoRM.valor)) r.unoRM = { valor: rm, fecha: sesion.fecha }
      const serie = mejorSerieDe(series)
      if (serie && (!r.mejorSerie || serieMejor(serie, r.mejorSerie))) r.mejorSerie = { ...serie, fecha: sesion.fecha }
      records.set(id, r)
    }
  }
  return records
}

/**
 * Récords que bate `sesion` frente a las sesiones anteriores.
 * La primera vez que se hace un ejercicio no cuenta como récord (no hay con qué comparar).
 */
export function recordsNuevos(sesion: WorkoutSession, historial: WorkoutSession[]): RecordNuevo[] {
  const previas = historial.filter((s) => s.id !== sesion.id && s.fecha < sesion.fecha)
  const antes = recordsPorEjercicio(previas)
  const nuevos: RecordNuevo[] = []
  const ids = new Set(sesion.series.filter((s) => s.completada).map((s) => s.ejercicioId))
  for (const id of ids) {
    const previo = antes.get(id)
    if (!previo) continue
    const series = completadasDe(sesion, id)
    const rm = mejor1RM(series)
    if (rm !== null && previo.unoRM && rm > previo.unoRM.valor) nuevos.push({ ejercicioId: id, tipo: 'unoRM', texto: `${rm} kg` })
    const serie = mejorSerieDe(series)
    if (serie && previo.mejorSerie && serieMejor(serie, previo.mejorSerie))
      nuevos.push({ ejercicioId: id, tipo: 'serie', texto: textoSerie(serie, esPorTiempo(id)) })
  }
  return nuevos
}

/** Ids de ejercicios con alguna serie completada, del usado más recientemente al más antiguo. */
export function ejerciciosRealizados(sesiones: WorkoutSession[]): string[] {
  const vistos = new Set<string>()
  for (const sesion of terminadasOrdenadas(sesiones).reverse())
    for (const s of sesion.series) if (s.completada) vistos.add(s.ejercicioId)
  return [...vistos]
}

/** Sesiones terminadas en los últimos `dias` días (incluido hoy). */
export function sesionesEnDias(sesiones: WorkoutSession[], dias: number, ahora = new Date()): number {
  const desde = ahora.getTime() - dias * 24 * 60 * 60 * 1000
  return sesiones.filter((s) => s.estado === 'terminada' && new Date(s.fecha).getTime() >= desde).length
}
