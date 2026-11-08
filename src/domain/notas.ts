// Notas por sesión y por ejercicio. Lógica pura.
import type { WorkoutSession } from './tipos'

export const MAX_NOTA = 500

/** Limpia una nota: sin espacios sobrantes y con un largo máximo. */
export function normalizarNota(texto: string): string {
  return texto.trim().slice(0, MAX_NOTA)
}

/** Devuelve las notas con la de este ejercicio cambiada; una nota vacía se elimina. */
export function conNotaEjercicio(
  notas: Record<string, string> | undefined,
  ejercicioId: string,
  texto: string,
): Record<string, string> | undefined {
  const resto = { ...notas }
  delete resto[ejercicioId]
  const nota = normalizarNota(texto)
  if (nota) resto[ejercicioId] = nota
  return Object.keys(resto).length > 0 ? resto : undefined
}

/** Nota más reciente de un ejercicio en sesiones terminadas (para recordarla al volver a hacerlo). */
export function ultimaNota(ejercicioId: string, historial: WorkoutSession[]): { texto: string; fecha: string } | null {
  const sesion = historial
    .filter((s) => s.estado === 'terminada' && s.notasEjercicio?.[ejercicioId])
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
  return sesion ? { texto: sesion.notasEjercicio?.[ejercicioId] as string, fecha: sesion.fecha } : null
}
