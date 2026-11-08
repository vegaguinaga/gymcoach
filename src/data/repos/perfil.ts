import { useLiveQuery } from 'dexie-react-hooks'
import { normalizarPesoCorporal } from '../../domain/perfil'
import type { BodyWeightEntry, Profile } from '../../domain/tipos'
import { db } from '../db'

/** Perfil guardado; null si aún no existe, undefined mientras carga. */
export function usePerfil(): Profile | null | undefined {
  return useLiveQuery(async () => (await db.perfil.get(1)) ?? null)
}

export async function guardarPerfil(perfil: Profile): Promise<void> {
  await db.perfil.put({ ...perfil, actualizado: new Date().toISOString() })
}

/** Último peso corporal registrado (o null). */
export function useUltimoPeso(): BodyWeightEntry | null | undefined {
  return useLiveQuery(async () => (await db.pesosCorporales.orderBy('fecha').last()) ?? null)
}

/** Registra el peso de hoy. Si ya había uno hoy, lo reemplaza. Devuelve false si no es válido. */
export async function registrarPeso(kg: number, ahora = new Date()): Promise<boolean> {
  const valor = normalizarPesoCorporal(kg)
  if (valor === null) return false
  const hoy = ahora.toISOString().slice(0, 10)
  await db.transaction('rw', db.pesosCorporales, async () => {
    const deHoy = await db.pesosCorporales.where('fecha').startsWith(hoy).first()
    if (deHoy?.id !== undefined) await db.pesosCorporales.update(deHoy.id, { kg: valor, fecha: ahora.toISOString() })
    else await db.pesosCorporales.add({ kg: valor, fecha: ahora.toISOString() })
  })
  return true
}

/** Todos los pesos corporales, del más antiguo al más reciente (para la gráfica). */
export function usePesosCorporales(): BodyWeightEntry[] | undefined {
  return useLiveQuery(() => db.pesosCorporales.orderBy('fecha').toArray())
}
