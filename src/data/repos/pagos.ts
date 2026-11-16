// Pagos de la mensualidad del gym.
import { useLiveQuery } from 'dexie-react-hooks'
import type { GymPayment } from '../../domain/tipos'
import { db } from '../db'

/** Todos los pagos, del más reciente al más antiguo. */
export function usePagos(): GymPayment[] | undefined {
  return useLiveQuery(() => db.pagos.orderBy('fecha').reverse().toArray())
}

/** Registra un pago (fecha y monto ya validados). */
export async function registrarPago(fecha: Date, monto: number | null): Promise<void> {
  await db.pagos.add(monto === null ? { fecha: fecha.toISOString() } : { fecha: fecha.toISOString(), monto })
}

export async function borrarPago(id: number): Promise<void> {
  await db.pagos.delete(id)
}
