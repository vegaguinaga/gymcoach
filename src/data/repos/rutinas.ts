import { useLiveQuery } from 'dexie-react-hooks'
import type { Routine } from '../../domain/tipos'
import { db } from '../db'

/** Rutina actual (la más reciente); null si no hay ninguna, undefined mientras carga. */
export function useRutinaActual(): Routine | null | undefined {
  return useLiveQuery(async () => (await db.rutinas.orderBy('creada').last()) ?? null)
}

/**
 * Guarda una rutina nueva y la deja como actual. Las anteriores se conservan
 * (las sesiones de la fase 3 harán referencia a ellas por id).
 */
export async function guardarRutina(rutina: Routine): Promise<void> {
  const { id: _id, ...sinId } = rutina
  await db.rutinas.add(sinId)
}
