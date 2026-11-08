// Edición manual de la rutina (rutinas propias).
// Regla: los cambios en un día se aplican a todos los días que se llaman igual
// (ej. «Full Body A» se repite en los días 1 y 3), igual que «Cambiar» ejercicio.
// Los días se pueden agregar (copia de otro, al final) y quitar; «qué día toca» sigue
// funcionando porque avanza en ciclo, y el historial no cambia (cada sesión guarda su copia del día).
import { NO_PRESCRIBIBLES, prescripcion } from './generador'
import type { DiaRutina, EjercicioPlanificado, Exercise, Routine } from './tipos'

export const LIMITES = {
  series: { min: 1, max: 6 },
  reps: { min: 1, max: 30 },
  rpe: { min: 5, max: 10 },
  descansoSeg: { min: 30, max: 300, paso: 15 },
} as const
export const MAX_NOMBRE = 30
export const MAX_DIAS = 7

const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)))

/** Aplica un cambio al día indicado y a los días con su mismo nombre. Marca la rutina como personalizada. */
function enDiasIguales(rutina: Routine, diaIndice: number, cambio: (d: DiaRutina) => DiaRutina): Routine {
  const dia = rutina.dias[diaIndice]
  if (!dia) return rutina
  return { ...rutina, personalizada: true, dias: rutina.dias.map((d) => (d.nombre === dia.nombre ? cambio(d) : d)) }
}

/** Deja una prescripción dentro de los límites (si el mínimo de reps supera al máximo, sube el máximo). */
export function normalizarPrescripcion(p: EjercicioPlanificado): EjercicioPlanificado {
  const { series, reps, rpe, descansoSeg: d } = LIMITES
  const repsMin = limitar(p.repsMin, reps.min, reps.max)
  return {
    ...p,
    series: limitar(p.series, series.min, series.max),
    repsMin,
    repsMax: limitar(Math.max(p.repsMax, repsMin), reps.min, reps.max),
    rpe: limitar(p.rpe, rpe.min, rpe.max),
    descansoSeg: limitar(Math.round(p.descansoSeg / d.paso) * d.paso, d.min, d.max),
  }
}

/** Cambia series, reps, RPE o descanso de un ejercicio del día. */
export function editarPrescripcion(
  rutina: Routine,
  diaIndice: number,
  posicion: number,
  cambios: Partial<Omit<EjercicioPlanificado, 'ejercicioId'>>,
): Routine {
  const viejo = rutina.dias[diaIndice]?.ejercicios[posicion]
  if (!viejo) return rutina
  // Si se baja el máximo por debajo del mínimo, el mínimo baja con él
  const ajuste = cambios.repsMax !== undefined && cambios.repsMin === undefined ? { repsMin: Math.min(viejo.repsMin, cambios.repsMax) } : {}
  const nuevo = normalizarPrescripcion({ ...viejo, ...ajuste, ...cambios })
  return enDiasIguales(rutina, diaIndice, (d) => ({
    ...d,
    ejercicios: d.ejercicios.map((e, i) => (i === posicion && e.ejercicioId === viejo.ejercicioId ? nuevo : e)),
  }))
}

/** true si el ejercicio se puede agregar al día (no está ya y se mide en reps). */
export function sePuedeAgregar(dia: DiaRutina, ejercicio: Exercise): boolean {
  return !NO_PRESCRIBIBLES.has(ejercicio.id) && !dia.ejercicios.some((e) => e.ejercicioId === ejercicio.id)
}

/** Agrega un ejercicio al final del día con la prescripción de su tipo. */
export function agregarEjercicio(rutina: Routine, diaIndice: number, ejercicio: Exercise): Routine {
  const dia = rutina.dias[diaIndice]
  if (!dia || !sePuedeAgregar(dia, ejercicio)) return rutina
  return enDiasIguales(rutina, diaIndice, (d) =>
    d.ejercicios.some((e) => e.ejercicioId === ejercicio.id) ? d : { ...d, ejercicios: [...d.ejercicios, prescripcion(ejercicio)] },
  )
}

/** Quita un ejercicio del día. Siempre queda al menos uno. */
export function quitarEjercicio(rutina: Routine, diaIndice: number, posicion: number): Routine {
  const dia = rutina.dias[diaIndice]
  const viejo = dia?.ejercicios[posicion]
  if (!viejo || dia.ejercicios.length <= 1) return rutina
  return enDiasIguales(rutina, diaIndice, (d) =>
    d.ejercicios[posicion]?.ejercicioId === viejo.ejercicioId ? { ...d, ejercicios: d.ejercicios.filter((_, i) => i !== posicion) } : d,
  )
}

/** Mueve un ejercicio una posición arriba (-1) o abajo (+1). */
export function moverEjercicio(rutina: Routine, diaIndice: number, posicion: number, delta: -1 | 1): Routine {
  const dia = rutina.dias[diaIndice]
  const destino = posicion + delta
  if (!dia?.ejercicios[posicion] || destino < 0 || destino >= dia.ejercicios.length) return rutina
  const orden = dia.ejercicios.map((e) => e.ejercicioId).join()
  return enDiasIguales(rutina, diaIndice, (d) => {
    if (d.ejercicios.map((e) => e.ejercicioId).join() !== orden) return d
    const ejercicios = [...d.ejercicios]
    ;[ejercicios[posicion], ejercicios[destino]] = [ejercicios[destino], ejercicios[posicion]]
    return { ...d, ejercicios }
  })
}

/** Limpia un nombre: sin espacios de más y como máximo 30 caracteres. */
export function normalizarNombre(nombre: string): string {
  return nombre.replace(/\s+/g, ' ').trim().slice(0, MAX_NOMBRE)
}

/** Renombra solo ese día (si el nombre queda vacío no cambia nada). Al renombrarlo deja de cambiar junto a sus iguales. */
export function renombrarDia(rutina: Routine, diaIndice: number, nombre: string): Routine {
  const limpio = normalizarNombre(nombre)
  const dia = rutina.dias[diaIndice]
  if (!dia || !limpio || limpio === dia.nombre) return rutina
  return { ...rutina, personalizada: true, dias: rutina.dias.map((d, i) => (i === diaIndice ? { ...d, nombre: limpio } : d)) }
}

export function renombrarRutina(rutina: Routine, nombre: string): Routine {
  const limpio = normalizarNombre(nombre)
  if (!limpio || limpio === rutina.nombre) return rutina
  return { ...rutina, nombre: limpio, personalizada: true }
}

/**
 * Agrega al final una copia del día indicado (máximo 7 días). Conserva el nombre,
 * así que cambia junto a su original hasta que se renombre.
 */
export function agregarDia(rutina: Routine, copiaDe: number): Routine {
  const dia = rutina.dias[copiaDe]
  if (!dia || rutina.dias.length >= MAX_DIAS) return rutina
  const copia: DiaRutina = { ...dia, ejercicios: dia.ejercicios.map((e) => ({ ...e })) }
  return { ...rutina, personalizada: true, dias: [...rutina.dias, copia] }
}

/** Quita un día de la rutina. Siempre queda al menos uno. */
export function quitarDia(rutina: Routine, diaIndice: number): Routine {
  if (!rutina.dias[diaIndice] || rutina.dias.length <= 1) return rutina
  return { ...rutina, personalizada: true, dias: rutina.dias.filter((_, i) => i !== diaIndice) }
}
