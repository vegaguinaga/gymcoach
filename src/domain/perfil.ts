// Reglas del perfil: valores por defecto y límites razonables para un principiante.
import { redondearKg } from './unidades'
import type { Profile } from './tipos'

export const LIMITES = {
  dias: { min: 2, max: 6 },
  minutos: { min: 20, max: 120 },
  pesoKg: { min: 30, max: 250 },
} as const

export const ETIQUETA_OBJETIVO: Record<Profile['objetivo'], string> = {
  fuerza: 'Ganar fuerza',
  musculo: 'Ganar músculo',
  perder_grasa: 'Perder grasa',
  salud: 'Salud general',
}

export function perfilPorDefecto(ahora = new Date()): Profile {
  return {
    id: 1,
    nombre: '',
    objetivo: 'musculo',
    diasPorSemana: 3,
    minutosPorSesion: 60,
    equipo: ['gym', 'mancuernas', 'peso_corporal'],
    actualizado: ahora.toISOString(),
  }
}

/** Devuelve los errores del perfil por campo (objeto vacío = válido). */
export function validarPerfil(p: Profile): Partial<Record<keyof Profile, string>> {
  const errores: Partial<Record<keyof Profile, string>> = {}
  const { dias, minutos } = LIMITES
  if (!Number.isInteger(p.diasPorSemana) || p.diasPorSemana < dias.min || p.diasPorSemana > dias.max)
    errores.diasPorSemana = `Entre ${dias.min} y ${dias.max} días`
  if (!Number.isFinite(p.minutosPorSesion) || p.minutosPorSesion < minutos.min || p.minutosPorSesion > minutos.max)
    errores.minutosPorSesion = `Entre ${minutos.min} y ${minutos.max} minutos`
  if (p.equipo.length === 0) errores.equipo = 'Elige al menos un tipo de equipo'
  return errores
}

/** Valida y normaliza un peso corporal. Devuelve null si no es válido. */
export function normalizarPesoCorporal(kg: number): number | null {
  if (!Number.isFinite(kg) || kg < LIMITES.pesoKg.min || kg > LIMITES.pesoKg.max) return null
  return redondearKg(kg)
}

/** Aviso cuando los días elegidos superan lo recomendado para empezar. */
export function avisoDias(dias: number): string | null {
  return dias > 5 ? 'Para empezar se recomiendan máximo 5 días: el descanso también construye músculo.' : null
}
