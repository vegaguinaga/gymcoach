// Formatos de fecha para la pantalla Progreso.

/** "3 ene" */
export const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })

/** "lun, 3 de enero" */
export const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'long' })

/** Minutos entre inicio y fin (null si no hay fin). */
export function duracionMin(inicio: string, fin?: string): number | null {
  if (!fin) return null
  return Math.max(0, Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000))
}
