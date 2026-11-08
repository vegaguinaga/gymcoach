// Copia de seguridad: exportar/importar todos los datos del usuario en un JSON. Lógica pura.
import { MEDIDAS } from './tipos'
import type { BodyMeasurement, BodyWeightEntry, Profile, Routine, WorkoutSession } from './tipos'

/** Versión del formato del archivo. Si cambia, `validarRespaldo` debe seguir aceptando las anteriores. */
// v1: perfil, peso, rutinas y sesiones · v2 (fase 10): + medidas corporales
export const VERSION_RESPALDO = 2

export interface DatosUsuario {
  perfil: Profile[]
  pesosCorporales: BodyWeightEntry[]
  rutinas: Routine[]
  sesiones: WorkoutSession[]
  medidas: BodyMeasurement[]
}

/** La biblioteca de ejercicios no se incluye: es la base de la app y se vuelve a copiar al iniciar. */
export interface Respaldo extends DatosUsuario {
  app: 'gymcoach'
  version: number
  creado: string
}

export type ResultadoValidacion = { ok: true; respaldo: Respaldo } | { ok: false; error: string }

export function crearRespaldo(datos: DatosUsuario, ahora = new Date()): Respaldo {
  return { app: 'gymcoach', version: VERSION_RESPALDO, creado: ahora.toISOString(), ...datos }
}

/** Nombre del archivo, ej. gymcoach-2026-11-08.json */
export function nombreArchivo(ahora = new Date()): string {
  return `gymcoach-${ahora.toISOString().slice(0, 10)}.json`
}

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const esTexto = (v: unknown): v is string => typeof v === 'string'
const esNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const esIdOpcional = (v: unknown) => v === undefined || esNumero(v)

const esPerfil = (v: unknown) => esObjeto(v) && v.id === 1 && Array.isArray(v.equipo) && esNumero(v.diasPorSemana)
const esPeso = (v: unknown) => esObjeto(v) && esIdOpcional(v.id) && esTexto(v.fecha) && esNumero(v.kg)
const esMedida = (v: unknown) =>
  esObjeto(v) && esIdOpcional(v.id) && esTexto(v.fecha) && esObjeto(v.cm) &&
  Object.entries(v.cm).every(([k, n]) => (MEDIDAS as readonly string[]).includes(k) && esNumero(n))
const esRutina = (v: unknown) => esObjeto(v) && esIdOpcional(v.id) && esTexto(v.creada) && Array.isArray(v.dias)
const esSerie = (v: unknown) =>
  esObjeto(v) && esTexto(v.ejercicioId) && esNumero(v.kg) && esNumero(v.reps) && typeof v.completada === 'boolean'
const esSesion = (v: unknown) =>
  esObjeto(v) &&
  esIdOpcional(v.id) &&
  esTexto(v.fecha) &&
  (v.estado === 'en_curso' || v.estado === 'terminada') &&
  Array.isArray(v.ejercicios) &&
  Array.isArray(v.series) &&
  v.series.every(esSerie)

/** `desdeVersion`: secciones que las copias anteriores no traen (se toman como vacías). */
const TABLAS: { clave: keyof DatosUsuario; nombre: string; valido: (v: unknown) => boolean; desdeVersion?: number }[] = [
  { clave: 'perfil', nombre: 'perfil', valido: esPerfil },
  { clave: 'pesosCorporales', nombre: 'peso corporal', valido: esPeso },
  { clave: 'rutinas', nombre: 'rutinas', valido: esRutina },
  { clave: 'sesiones', nombre: 'sesiones', valido: esSesion },
  { clave: 'medidas', nombre: 'medidas', valido: esMedida, desdeVersion: 2 },
]

/** Comprueba que un JSON (ya parseado) sea un respaldo de GymCoach que esta versión sabe leer. */
export function validarRespaldo(json: unknown): ResultadoValidacion {
  if (!esObjeto(json) || json.app !== 'gymcoach') return { ok: false, error: 'El archivo no es una copia de GymCoach.' }
  if (!esNumero(json.version) || json.version > VERSION_RESPALDO)
    return { ok: false, error: 'La copia es de una versión más nueva de la app. Actualiza GymCoach e inténtalo otra vez.' }
  const datos: Record<string, unknown> = { ...json }
  for (const { clave, nombre, valido, desdeVersion } of TABLAS) {
    if (desdeVersion && json.version < desdeVersion && datos[clave] === undefined) datos[clave] = []
    const lista = datos[clave]
    if (!Array.isArray(lista)) return { ok: false, error: `Falta la sección de ${nombre}.` }
    const mal = lista.findIndex((v) => !valido(v))
    if (mal >= 0) return { ok: false, error: `Hay un dato dañado en ${nombre} (n.º ${mal + 1}).` }
  }
  const ids = (json.sesiones as WorkoutSession[]).flatMap((s) => (s.id === undefined ? [] : [s.id]))
  if (new Set(ids).size !== ids.length) return { ok: false, error: 'Hay sesiones repetidas en el archivo.' }
  return { ok: true, respaldo: datos as unknown as Respaldo }
}

/** Cuántos datos trae un respaldo (para confirmar antes de importar). */
export function resumenRespaldo(r: DatosUsuario): string {
  const terminadas = r.sesiones.filter((s) => s.estado === 'terminada').length
  const n = (c: number, uno: string, varios: string) => `${c} ${c === 1 ? uno : varios}`
  const partes = [n(terminadas, 'sesión', 'sesiones'), n(r.rutinas.length, 'rutina', 'rutinas'), n(r.pesosCorporales.length, 'registro de peso', 'registros de peso')]
  if (r.medidas.length > 0) partes.push(n(r.medidas.length, 'registro de medidas', 'registros de medidas'))
  return `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`
}

const DIA_MS = 86_400_000
/** Días desde la última copia a partir de los cuales se recuerda hacer otra (si hay sesiones nuevas). */
export const DIAS_ENTRE_COPIAS = 14
/** Sin ninguna copia, se avisa a partir de estas sesiones terminadas. */
export const SESIONES_SIN_COPIA = 3

/**
 * ¿Conviene recordar la copia? Solo si hay entrenamientos que se perderían:
 * nunca hubo copia y ya hay varias sesiones, o la última tiene 14+ días y hay sesiones posteriores.
 */
export function necesitaCopia(ultimaCopia: string | undefined, sesiones: WorkoutSession[], ahora = new Date()): boolean {
  const terminadas = sesiones.filter((s) => s.estado === 'terminada')
  if (!ultimaCopia) return terminadas.length >= SESIONES_SIN_COPIA
  const nuevas = terminadas.some((s) => (s.fin ?? s.fecha) > ultimaCopia)
  return nuevas && ahora.getTime() - Date.parse(ultimaCopia) >= DIAS_ENTRE_COPIAS * DIA_MS
}

/** "Nunca", "hoy", "ayer" o "hace N días" (por días de calendario locales). */
export function textoUltimaCopia(ultimaCopia: string | undefined, ahora = new Date()): string {
  if (!ultimaCopia) return 'nunca'
  const dia = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const dias = Math.max(0, Math.round((dia(ahora) - dia(new Date(ultimaCopia))) / DIA_MS))
  return dias === 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`
}
