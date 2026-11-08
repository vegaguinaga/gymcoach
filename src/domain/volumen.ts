// Volumen semanal por grupo muscular: series planificadas en la rutina y series hechas en la semana.
// El grupo principal cuenta 1 serie y cada secundario 0.5.
import { inicioSemana } from './calendario'
import { GRUPOS_MUSCULARES, type Exercise, type GrupoMuscular, type Routine, type WorkoutSession } from './tipos'

export type EstadoVolumen = 'corto' | 'bien' | 'alto'

export interface VolumenGrupo {
  grupo: GrupoMuscular
  series: number
  min: number
  max: number
  estado: EstadoVolumen
}

/** Tope de series semanales para un principiante (todos los grupos). */
export const MAX_SERIES_SEMANA = 16
/** Mínimo para grupos grandes; los pequeños ya reciben trabajo indirecto de los compuestos. */
const MIN_GRANDE = 10
const MIN_PEQUENO = 6
const PEQUENOS: GrupoMuscular[] = ['biceps', 'triceps', 'gemelos', 'core']

export function rangoSemanal(grupo: GrupoMuscular): { min: number; max: number } {
  return { min: PEQUENOS.includes(grupo) ? MIN_PEQUENO : MIN_GRANDE, max: MAX_SERIES_SEMANA }
}

function conteoVacio(): Record<GrupoMuscular, number> {
  return Object.fromEntries(GRUPOS_MUSCULARES.map((g) => [g, 0])) as Record<GrupoMuscular, number>
}

function sumar(conteo: Record<GrupoMuscular, number>, ej: Exercise, series: number) {
  conteo[ej.grupoPrincipal] += series
  for (const g of ej.gruposSecundarios) conteo[g] += series / 2
}

/** Series semanales planificadas por grupo en la rutina. */
export function seriesPorGrupo(rutina: Routine, ejercicios: Exercise[]): Record<GrupoMuscular, number> {
  const porId = new Map(ejercicios.map((e) => [e.id, e]))
  const conteo = conteoVacio()
  for (const dia of rutina.dias)
    for (const p of dia.ejercicios) {
      const ej = porId.get(p.ejercicioId)
      if (ej) sumar(conteo, ej, p.series)
    }
  return conteo
}

/** Series completadas por grupo en las sesiones terminadas de la semana en curso (desde el lunes). */
export function seriesHechasSemana(sesiones: WorkoutSession[], ejercicios: Exercise[], ahora = new Date()): Record<GrupoMuscular, number> {
  const porId = new Map(ejercicios.map((e) => [e.id, e]))
  const desde = inicioSemana(ahora).getTime()
  const conteo = conteoVacio()
  for (const s of sesiones) {
    if (s.estado !== 'terminada' || new Date(s.fecha).getTime() < desde) continue
    for (const serie of s.series) {
      const ej = porId.get(serie.ejercicioId)
      if (serie.completada && ej) sumar(conteo, ej, 1)
    }
  }
  return conteo
}

/** Estado de cada grupo (en el orden de GRUPOS_MUSCULARES) según su rango semanal. */
export function volumenSemanal(conteo: Record<GrupoMuscular, number>): VolumenGrupo[] {
  return GRUPOS_MUSCULARES.map((grupo) => {
    const { min, max } = rangoSemanal(grupo)
    const series = conteo[grupo] ?? 0
    return { grupo, series, min, max, estado: series < min ? 'corto' : series > max ? 'alto' : 'bien' }
  })
}
