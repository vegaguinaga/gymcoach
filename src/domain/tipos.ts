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

// --- Rutinas (fase 2) y sesiones (fase 3) ---

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
  /** Minutos de cardio sugeridos al final (pérdida de grasa) */
  cardioMin?: number
}

export interface Routine {
  id?: number
  nombre: string
  creada: string
  dias: DiaRutina[]
}

export interface SetLog {
  ejercicioId: string
  /** Número de serie dentro del ejercicio (1, 2, 3…) */
  serie: number
  /** Kg en la barra/mancuerna; en ejercicios de peso corporal, el lastre extra (0 = sin lastre) */
  kg: number
  reps: number
  rpe?: number
  completada: boolean
}

export type TipoSugerencia = 'subir' | 'mantener' | 'bajar' | 'nuevo' | 'descarga'

/** Sugerencia de progresión para un ejercicio, calculada al empezar la sesión (fase 5). */
export interface Sugerencia {
  tipo: TipoSugerencia
  /** Kg propuestos para todas las series (en peso corporal: el lastre) */
  kg: number
  /** Reps objetivo por serie; su largo es el número de series a hacer */
  reps: number[]
  /** Texto corto para mostrar en la tarjeta del ejercicio */
  texto: string
}

export type EstadoSesion = 'en_curso' | 'terminada'

export interface WorkoutSession {
  id?: number
  /** Inicio de la sesión (ISO) */
  fecha: string
  fin?: string
  estado: EstadoSesion
  rutinaId?: number
  diaIndice?: number
  diaNombre: string
  /** Copia del plan del día (series, reps objetivo, descanso) al empezar */
  ejercicios: EjercicioPlanificado[]
  series: SetLog[]
  /** Fin del descanso en curso (ISO); así el temporizador sobrevive a recargar la app */
  descansoHasta?: string
  notas?: string
  /** Sesión de una semana de descarga (no cuenta para la progresión) */
  descarga?: boolean
  /** Sugerencia por ejercicio (clave: ejercicioId) */
  sugerencias?: Record<string, Sugerencia>
}
