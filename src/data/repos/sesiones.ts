import { useLiveQuery } from 'dexie-react-hooks'
import { nuevaSesion } from '../../domain/sesion'
import type { Routine, WorkoutSession } from '../../domain/tipos'
import { db } from '../db'

/** Sesión en curso; null si no hay, undefined mientras carga. */
export function useSesionEnCurso(): WorkoutSession | null | undefined {
  return useLiveQuery(async () => (await db.sesiones.where('estado').equals('en_curso').last()) ?? null)
}

/** Última sesión terminada (para saber qué día toca). */
export function useUltimaSesion(): WorkoutSession | null | undefined {
  return useLiveQuery(async () => {
    const terminadas = await db.sesiones.where('estado').equals('terminada').sortBy('fecha')
    return terminadas.at(-1) ?? null
  })
}

/**
 * Empieza el día indicado con las sugerencias de progresión (o en modo descarga).
 * Si ya había una sesión en curso, no crea otra.
 */
export async function empezarSesion(rutina: Routine, diaIndice: number, descarga = false): Promise<void> {
  await db.transaction('rw', db.sesiones, db.ejercicios, async () => {
    if (await db.sesiones.where('estado').equals('en_curso').count()) return
    const historial = await db.sesiones.where('estado').equals('terminada').toArray()
    const ejercicios = await db.ejercicios.toArray()
    await db.sesiones.add(nuevaSesion(rutina, diaIndice, historial, { ejercicios, descarga }))
  })
}

/**
 * Modifica la sesión en curso a partir de lo último guardado (dentro de una transacción),
 * para que dos cambios seguidos (salir de un input y tocar ✓) no se pisen.
 * Se guarda en cada edición: no se pierde nada si se cierra la app.
 */
export async function modificarSesion(
  id: number,
  cambio: (actual: WorkoutSession) => Partial<WorkoutSession>,
): Promise<void> {
  await db.transaction('rw', db.sesiones, async () => {
    const actual = await db.sesiones.get(id)
    if (actual?.estado === 'en_curso') await db.sesiones.update(id, cambio(actual))
  })
}

export async function terminarSesion(id: number, fin = new Date().toISOString()): Promise<void> {
  await db.sesiones.update(id, { estado: 'terminada', fin, descansoHasta: undefined })
}

/** Borra la sesión en curso (el usuario lo confirma antes). */
export async function descartarSesion(id: number): Promise<void> {
  await db.sesiones.delete(id)
}

/** Sesiones terminadas, de la más reciente a la más antigua. */
export function useSesionesTerminadas(): WorkoutSession[] | undefined {
  return useLiveQuery(async () => (await db.sesiones.where('estado').equals('terminada').sortBy('fecha')).reverse())
}

/** Una sesión por id (null si no existe). */
export function useSesion(id: number): WorkoutSession | null | undefined {
  return useLiveQuery(async () => (await db.sesiones.get(id)) ?? null, [id])
}

/** Borra una sesión terminada del historial (el usuario lo confirma antes). */
export async function borrarSesion(id: number): Promise<void> {
  await db.sesiones.delete(id)
}
