// Progresión: doble progresión (reps y luego peso), bajadas y semanas de descarga.
// Lógica pura: sin React ni Dexie. Solo cuentan las sesiones terminadas y las series completadas.
import { historialEjercicio } from './progreso'
import type { EjercicioPlanificado, Exercise, SetLog, Sugerencia, WorkoutSession } from './tipos'
import { redondearKg } from './unidades'

const DIA_MS = 86_400_000
/** Semanas sin descarga a partir de las cuales se recomienda una (regla: cada 4–6). */
export const SEMANAS_ENTRE_DESCARGAS = 6
export const DIAS_DESCARGA = 7

const TREN_INFERIOR = new Set(['cuadriceps', 'isquios', 'gluteos'])

/**
 * Cuánto subir cuando se completa el rango:
 * mancuernas → 2 kg (la mancuerna siguiente); compuestos → 2.5 kg (pierna y torso);
 * accesorios de gym → 1 kg (poleas y máquinas con incrementos finos).
 */
export function incrementoKg(ej?: Exercise): number {
  if (!ej) return 2.5
  if (ej.equipo === 'mancuernas') return 2
  if (ej.tipo === 'compuesto' || TREN_INFERIOR.has(ej.grupoPrincipal)) return 2.5
  return 1
}

/** Series completadas por sesión (sin contar descargas), de la más reciente a la más antigua. */
export function seriesPorSesion(ejercicioId: string, historial: WorkoutSession[]): SetLog[][] {
  return historial
    .filter((s) => s.estado === 'terminada' && !s.descarga)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((s) => s.series.filter((x) => x.ejercicioId === ejercicioId && x.completada))
    .filter((series) => series.length > 0)
}

const lista = (n: number, valor: (i: number) => number) => Array.from({ length: n }, (_, i) => valor(i))
const aMedioKg = (kg: number) => Math.round(kg * 2) / 2

/** Qué hacer hoy en un ejercicio según las últimas sesiones (doble progresión). */
export function sugerencia(
  plan: EjercicioPlanificado,
  ej: Exercise | undefined,
  historial: WorkoutSession[],
  descarga = false,
): Sugerencia {
  const n = descarga ? Math.ceil(plan.series / 2) : plan.series
  const previas = seriesPorSesion(plan.ejercicioId, historial)
  const ultima = previas[0]
  if (!ultima) {
    return { tipo: 'nuevo', kg: 0, reps: lista(n, () => plan.repsMin), texto: 'Nuevo: empieza liviano (RPE 6) y cuida la técnica' }
  }

  const kg = Math.max(...ultima.map((s) => s.kg))
  const repsPrevia = (i: number) => ultima[Math.min(i, ultima.length - 1)].reps
  const sinLastre = kg === 0 && ej?.equipo === 'peso_corporal'

  if (descarga) {
    return { tipo: 'descarga', kg, reps: lista(n, repsPrevia), texto: `Descarga: ${n} series, mismo peso y sin llegar al fallo` }
  }

  const alTope = ultima.length >= plan.series && ultima.every((s) => s.reps >= plan.repsMax)
  const rpeOk = ultima.every((s) => s.rpe === undefined || s.rpe <= 8)
  if (alTope && rpeOk) {
    if (sinLastre) {
      return { tipo: 'subir', kg: 0, reps: lista(n, (i) => repsPrevia(i) + 1), texto: '↑ ¡Tope del rango! Suma 1 rep o prueba una variante más difícil' }
    }
    const nuevo = redondearKg(kg + incrementoKg(ej))
    return { tipo: 'subir', kg: nuevo, reps: lista(n, () => plan.repsMin), texto: `↑ Sube a ${nuevo} kg y vuelve a ${plan.repsMin} reps` }
  }

  // Bajo el mínimo en más de la mitad de las series, 2 sesiones seguidas
  const bajo = (series: SetLog[]) => series.filter((s) => s.reps < plan.repsMin).length > series.length / 2
  if (previas.length >= 2 && bajo(previas[0]) && bajo(previas[1])) {
    if (sinLastre) {
      return { tipo: 'bajar', kg: 0, reps: lista(n, () => plan.repsMin), texto: '↓ Te está costando: prueba una variante más fácil' }
    }
    const nuevo = aMedioKg(kg * 0.9)
    return { tipo: 'bajar', kg: nuevo, reps: lista(n, () => plan.repsMin), texto: `↓ Baja a ${nuevo} kg (−10 %) para llegar a ${plan.repsMin} reps` }
  }

  return {
    tipo: 'mantener',
    kg,
    reps: lista(n, (i) => Math.min(repsPrevia(i) + 1, plan.repsMax)),
    texto: alTope ? 'Mismo peso: llegaste al tope pero con RPE alto, repite hasta que sea más cómodo' : 'Mismo peso: intenta +1 rep por serie',
  }
}

export interface EstadoDescarga {
  /** Hay una semana de descarga en curso */
  activa: boolean
  /** Conviene empezar una */
  recomendada: boolean
  motivo?: string
  /** Ejercicio cuyo 1RM bajó (para mostrar su nombre) */
  ejercicioId?: string
}

/**
 * Semana de descarga: dura 7 días desde su primera sesión. Se recomienda tras 6 semanas sin descarga
 * o si el 1RM estimado de un compuesto baja en 2 sesiones seguidas.
 */
export function estadoDescarga(sesiones: WorkoutSession[], idsCompuestos: string[], ahora = new Date()): EstadoDescarga {
  const terminadas = sesiones.filter((s) => s.estado === 'terminada').sort((a, b) => a.fecha.localeCompare(b.fecha))
  if (terminadas.length === 0) return { activa: false, recomendada: false }

  // Bloque de descarga al final del historial
  let i = terminadas.length
  while (i > 0 && terminadas[i - 1].descarga) i--
  const bloque = terminadas.slice(i)
  if (bloque.length > 0 && ahora.getTime() - Date.parse(bloque[0].fecha) < DIAS_DESCARGA * DIA_MS) {
    return { activa: true, recomendada: false, motivo: 'Semana de descarga en curso: la mitad de las series y el mismo peso' }
  }

  const ultimaDescarga = terminadas.findLast((s) => s.descarga)
  const referencia = ultimaDescarga ?? terminadas[0]
  const semanas = Math.floor((ahora.getTime() - Date.parse(referencia.fecha)) / (7 * DIA_MS))
  if (semanas >= SEMANAS_ENTRE_DESCARGAS) {
    return { activa: false, recomendada: true, motivo: `Llevas ${semanas} semanas sin descarga: una semana suave ayuda a recuperarte` }
  }

  const desde = terminadas.filter((s) => !s.descarga && (!ultimaDescarga || s.fecha > ultimaDescarga.fecha))
  for (const id of idsCompuestos) {
    const rm = historialEjercicio(desde, id)
      .flatMap((p) => (p.unoRM === null ? [] : [p.unoRM]))
      .slice(-3)
    if (rm.length === 3 && rm[2] < rm[1] && rm[1] < rm[0]) {
      return { activa: false, recomendada: true, ejercicioId: id, motivo: 'Tu 1RM estimado bajó 2 sesiones seguidas: toca recuperar' }
    }
  }
  return { activa: false, recomendada: false }
}
