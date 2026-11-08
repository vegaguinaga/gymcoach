// Tipos de dominio de GymCoach. Sin React ni Dexie: solo datos.
// Fechas en ISO string; pesos en kg con 1 decimal.

export const GRUPOS_MUSCULARES = [
  'pecho',
  'espalda',
  'hombros',
  'biceps',
  'triceps',
  'cuadriceps',
  'isquios',
  'gluteos',
  'gemelos',
  'core',
] as const
export type GrupoMuscular = (typeof GRUPOS_MUSCULARES)[number]

export const EQUIPOS = ['gym', 'mancuernas', 'peso_corporal'] as const
export type Equipo = (typeof EQUIPOS)[number]

export type TipoEjercicio = 'compuesto' | 'accesorio'

export interface Exercise {
  id: string
  nombre: string
  grupoPrincipal: GrupoMuscular
  gruposSecundarios: GrupoMuscular[]
  equipo: Equipo
  tipo: TipoEjercicio
  instrucciones: string[]
  erroresComunes: string[]
  /** ids de otros ejercicios que trabajan lo mismo */
  alternativas: string[]
  /** true si hay fotos de inicio y final en public/ejercicios/<id>-0|1.webp */
  fotos?: boolean
}

export const OBJETIVOS = ['fuerza', 'musculo', 'perder_grasa', 'salud'] as const
export type Objetivo = (typeof OBJETIVOS)[number]

export interface Profile {
  /** Siempre 1: hay un solo perfil por dispositivo */
  id: 1
  nombre: string
  objetivo: Objetivo
  diasPorSemana: number
  minutosPorSesion: number
  /** Equipos a los que tiene acceso */
  equipo: Equipo[]
  actualizado: string
}

export interface BodyWeightEntry {
  id?: number
  fecha: string
  kg: number
}

// --- Tipos que se usarán en fases siguientes (rutinas y sesiones) ---

export interface EjercicioPlanificado {
  ejercicioId: string
  series: number
  repsMin: number
  repsMax: number
  rpe: number
  descansoSeg: number
}

export interface DiaRutina {
  nombre: string
  ejercicios: EjercicioPlanificado[]
}

export interface Routine {
  id?: number
  nombre: string
  creada: string
  dias: DiaRutina[]
}

export interface SetLog {
  ejercicioId: string
  serie: number
  kg: number
  reps: number
  rpe?: number
  completada: boolean
}

export interface WorkoutSession {
  id?: number
  fecha: string
  rutinaId?: number
  diaNombre: string
  series: SetLog[]
  notas?: string
}
