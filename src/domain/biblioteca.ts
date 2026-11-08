// Lógica pura de la biblioteca de ejercicios: filtros y validación.
import type { Equipo, Exercise, GrupoMuscular, TipoEjercicio } from './tipos'

export const ETIQUETA_GRUPO: Record<GrupoMuscular, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  cuadriceps: 'Cuádriceps',
  isquios: 'Isquiotibiales',
  gluteos: 'Glúteos',
  gemelos: 'Gemelos',
  core: 'Core',
}

export const ETIQUETA_EQUIPO: Record<Equipo, string> = {
  gym: 'Gimnasio (barras y máquinas)',
  mancuernas: 'Mancuernas',
  peso_corporal: 'Peso corporal',
}

export const ETIQUETA_TIPO: Record<TipoEjercicio, string> = {
  compuesto: 'Compuesto',
  accesorio: 'Accesorio',
}

export interface FiltroEjercicios {
  texto?: string
  grupo?: GrupoMuscular
  /** Si se indica, solo ejercicios hechos con alguno de estos equipos */
  equipos?: Equipo[]
}

/** Quita tildes y pasa a minúsculas para buscar sin importar acentos. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * Filtra ejercicios por texto (nombre), grupo muscular (principal o secundario)
 * y equipo disponible. El peso corporal siempre está disponible.
 */
export function filtrarEjercicios(ejercicios: Exercise[], filtro: FiltroEjercicios): Exercise[] {
  const texto = filtro.texto ? normalizar(filtro.texto) : ''
  return ejercicios
    .filter((e) => !texto || normalizar(e.nombre).includes(texto))
    .filter(
      (e) => !filtro.grupo || e.grupoPrincipal === filtro.grupo || e.gruposSecundarios.includes(filtro.grupo),
    )
    .filter(
      (e) => !filtro.equipos || e.equipo === 'peso_corporal' || filtro.equipos.includes(e.equipo),
    )
    .sort((a, b) => {
      // Primero los que tienen el grupo como principal, luego por nombre
      if (filtro.grupo) {
        const pa = a.grupoPrincipal === filtro.grupo ? 0 : 1
        const pb = b.grupoPrincipal === filtro.grupo ? 0 : 1
        if (pa !== pb) return pa - pb
      }
      return a.nombre.localeCompare(b.nombre, 'es')
    })
}

/** Devuelve las alternativas de un ejercicio que existen en la biblioteca. */
export function alternativasDe(ejercicio: Exercise, ejercicios: Exercise[]): Exercise[] {
  const porId = new Map(ejercicios.map((e) => [e.id, e]))
  return ejercicio.alternativas.flatMap((id) => porId.get(id) ?? [])
}

/** Rutas de las fotos de inicio y final (relativas a la base de la app), o [] si no tiene. */
export function fotosDe(ejercicio: Exercise): string[] {
  return ejercicio.fotos ? [0, 1].map((n) => `ejercicios/${ejercicio.id}-${n}.webp`) : []
}

/** Búsqueda de videos de técnica en YouTube para el ejercicio. */
export function urlVideo(ejercicio: Exercise): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ejercicio.nombre} técnica correcta`)}`
}

/** Revisa la integridad de la biblioteca. Devuelve la lista de problemas (vacía = OK). */
export function validarBiblioteca(ejercicios: Exercise[]): string[] {
  const problemas: string[] = []
  const ids = new Set<string>()
  for (const e of ejercicios) {
    if (ids.has(e.id)) problemas.push(`id repetido: ${e.id}`)
    ids.add(e.id)
  }
  for (const e of ejercicios) {
    if (e.instrucciones.length < 3 || e.instrucciones.length > 5)
      problemas.push(`${e.id}: debe tener 3–5 pasos de instrucciones`)
    if (e.erroresComunes.length === 0) problemas.push(`${e.id}: faltan errores comunes`)
    if (e.gruposSecundarios.includes(e.grupoPrincipal))
      problemas.push(`${e.id}: el grupo principal está repetido en secundarios`)
    for (const alt of e.alternativas) {
      if (alt === e.id) problemas.push(`${e.id}: es alternativa de sí mismo`)
      else if (!ids.has(alt)) problemas.push(`${e.id}: alternativa inexistente ${alt}`)
    }
  }
  return problemas
}
