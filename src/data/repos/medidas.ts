// Medidas corporales: un registro por día (si se mide otra vez el mismo día, se combinan).
import { useLiveQuery } from 'dexie-react-hooks'
import { claveDia } from '../../domain/calendario'
import { combinarMedidas } from '../../domain/medidas'
import type { BodyMeasurement, Medida } from '../../domain/tipos'
import { db } from '../db'

/** Todas las medidas, de la más antigua a la más reciente. */
export function useMedidas(): BodyMeasurement[] | undefined {
  return useLiveQuery(() => db.medidas.orderBy('fecha').toArray())
}

/** Guarda las medidas de hoy (ya validadas). Si ya había un registro hoy (día local), lo completa. */
export async function registrarMedidas(cm: Partial<Record<Medida, number>>, ahora = new Date()): Promise<void> {
  const hoy = claveDia(ahora)
  await db.transaction('rw', db.medidas, async () => {
    const recientes = await db.medidas.where('fecha').above(new Date(ahora.getTime() - 2 * 86_400_000).toISOString()).toArray()
    const deHoy = recientes.find((r) => claveDia(new Date(r.fecha)) === hoy)
    if (deHoy?.id !== undefined) await db.medidas.update(deHoy.id, { cm: combinarMedidas(deHoy.cm, cm), fecha: ahora.toISOString() })
    else await db.medidas.add({ fecha: ahora.toISOString(), cm })
  })
}

export async function borrarMedidas(id: number): Promise<void> {
  await db.medidas.delete(id)
}
