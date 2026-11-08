import { useLiveQuery } from 'dexie-react-hooks'
import type { Exercise } from '../../domain/tipos'
import { db } from '../db'
import base from '../exercises.json'

const BIBLIOTECA_BASE = base as Exercise[]

/**
 * Copia la biblioteca base a la base de datos (insertar o actualizar por id).
 * Se llama al iniciar: así las mejoras del JSON llegan a quien ya tenía la app.
 * No toca ejercicios con otros ids (p. ej. futuros ejercicios propios del usuario).
 */
export async function sincronizarBiblioteca(): Promise<void> {
  await db.ejercicios.bulkPut(BIBLIOTECA_BASE)
}

/** Todos los ejercicios (sin orden). `undefined` mientras carga. */
export function useEjercicios(): Exercise[] | undefined {
  return useLiveQuery(() => db.ejercicios.toArray())
}

export function useEjercicio(id: string): Exercise | undefined | null {
  // null = no existe; undefined = cargando
  return useLiveQuery(async () => (await db.ejercicios.get(id)) ?? null, [id])
}
