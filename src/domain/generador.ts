// Generador de rutinas para principiantes. Lógica pura: recibe perfil y biblioteca, devuelve una Routine.
import type { DiaRutina, EjercicioPlanificado, Exercise, GrupoMuscular, Profile, Routine } from './tipos'

export const MINUTOS_POR_SERIE = 2.5
export const MINUTOS_CALENTAMIENTO = 5
/** Para principiantes no recomendamos más de 5 días por defecto. */
export const MAX_DIAS_PRINCIPIANTE = 5

// --- Patrones de movimiento: ids en orden de preferencia (se elige el primero con el equipo disponible) ---
const CUAD = ['sentadilla', 'sentadilla_goblet', 'sentadilla_peso_corporal']
const CUAD_2 = ['prensa', 'sentadilla_bulgara', 'zancadas', 'sentadilla_goblet', 'sentadilla_peso_corporal']
const CUAD_ACC = ['extension_cuadriceps', 'zancadas', 'sentadilla_bulgara', 'sentadilla_peso_corporal']
const BISAGRA = ['peso_muerto_rumano', 'rumano_mancuernas', 'puente_gluteo']
const GLUTEO = ['hip_thrust', 'rumano_mancuernas', 'puente_gluteo']
const ISQUIO_ACC = ['curl_femoral', 'rumano_mancuernas', 'puente_gluteo']
const EMPUJE_H = ['press_banca', 'press_mancuernas', 'flexiones']
const EMPUJE_H_2 = ['press_inclinado_mancuernas', 'press_mancuernas', 'press_banca', 'flexiones']
const EMPUJE_V = ['press_militar', 'press_hombro_mancuernas', 'pike_pushup']
const EMPUJE_V_2 = ['press_hombro_mancuernas', 'press_militar', 'pike_pushup']
const TIRON_H = ['remo_barra', 'remo_mancuerna', 'remo_invertido']
const TIRON_H_2 = ['remo_mancuerna', 'remo_polea', 'remo_barra', 'remo_invertido']
const TIRON_V = ['jalon_pecho', 'dominadas', 'remo_invertido']
const TIRON_V_2 = ['dominadas', 'jalon_pecho', 'remo_invertido']
const PECHO_ACC = ['aperturas_mancuernas', 'cruce_poleas', 'flexiones']
const HOMBRO_ACC = ['elevaciones_laterales', 'face_pull', 'pajaros']
const POSTERIOR = ['face_pull', 'pajaros']
const BICEPS = ['curl_barra', 'curl_mancuernas', 'curl_martillo']
const BICEPS_2 = ['curl_martillo', 'curl_mancuernas', 'curl_barra']
const TRICEPS = ['extension_polea', 'press_frances', 'fondos_banco']
const TRICEPS_2 = ['press_frances', 'extension_polea', 'fondos_banco']
const GEMELOS = ['elevacion_gemelos']
// La plancha se mide en segundos, por eso no entra en el generador (todo se prescribe en reps)
const CORE = ['dead_bug', 'crunch', 'elevacion_piernas']
const CORE_2 = ['elevacion_piernas', 'crunch', 'dead_bug']

interface Plantilla {
  nombre: string
  /** Orden = prioridad: si no cabe en el tiempo, se recorta desde el final. */
  huecos: string[][]
}

const FULL_A: Plantilla = {
  nombre: 'Full Body A',
  huecos: [CUAD, EMPUJE_H, TIRON_H, BISAGRA, HOMBRO_ACC, BICEPS, CORE],
}
const FULL_B: Plantilla = {
  nombre: 'Full Body B',
  huecos: [CUAD_2, TIRON_V, EMPUJE_H_2, EMPUJE_V, GLUTEO, TRICEPS, CORE_2],
}
const TORSO_A: Plantilla = {
  nombre: 'Torso A',
  huecos: [EMPUJE_H, TIRON_H, EMPUJE_V_2, TIRON_V, PECHO_ACC, BICEPS, TRICEPS],
}
const PIERNA_A: Plantilla = {
  nombre: 'Pierna A',
  huecos: [CUAD, BISAGRA, CUAD_2, ISQUIO_ACC, GEMELOS, CORE],
}
const TORSO_B: Plantilla = {
  nombre: 'Torso B',
  huecos: [EMPUJE_H_2, TIRON_V_2, EMPUJE_V, TIRON_H_2, HOMBRO_ACC, BICEPS_2, TRICEPS_2],
}
const PIERNA_B: Plantilla = {
  nombre: 'Pierna B',
  huecos: [CUAD_2, GLUTEO, CUAD_ACC, ISQUIO_ACC, GEMELOS, CORE_2],
}
const PUSH: Plantilla = {
  nombre: 'Empuje',
  huecos: [EMPUJE_H, EMPUJE_V, EMPUJE_H_2, HOMBRO_ACC, TRICEPS, PECHO_ACC],
}
const PULL: Plantilla = {
  nombre: 'Tirón',
  huecos: [TIRON_V, TIRON_H, POSTERIOR, BICEPS, BICEPS_2],
}

/** Días que realmente se planifican (2–5). */
export function diasEfectivos(diasPorSemana: number): number {
  return Math.min(MAX_DIAS_PRINCIPIANTE, Math.max(2, Math.round(diasPorSemana)))
}

/** Split según días: 2–3 Full Body A/B · 4 Torso/Pierna ×2 · 5 Empuje/Tirón/Pierna + Torso/Pierna. */
export function plantillasPara(diasPorSemana: number): { nombre: string; semana: Plantilla[]; seriesAccesorio: number } {
  const dias = diasEfectivos(diasPorSemana)
  if (dias === 2) return { nombre: 'Full Body', semana: [FULL_A, FULL_B], seriesAccesorio: 3 }
  if (dias === 3) return { nombre: 'Full Body', semana: [FULL_A, FULL_B, FULL_A], seriesAccesorio: 3 }
  if (dias === 4)
    return { nombre: 'Torso / Pierna', semana: [TORSO_A, PIERNA_A, TORSO_B, PIERNA_B], seriesAccesorio: 3 }
  // Con 5 días hay más frecuencia: accesorios a 2 series para no pasar de ~16 series por grupo
  return { nombre: 'Empuje / Tirón / Pierna', semana: [PUSH, PULL, PIERNA_A, TORSO_B, PIERNA_B], seriesAccesorio: 2 }
}

/** Series, reps, RPE y descanso según el tipo de ejercicio. */
export function prescripcion(ejercicio: Exercise, seriesAccesorio = 3): EjercicioPlanificado {
  return ejercicio.tipo === 'compuesto'
    ? { ejercicioId: ejercicio.id, series: 3, repsMin: 6, repsMax: 10, rpe: 7, descansoSeg: 150 }
    : { ejercicioId: ejercicio.id, series: seriesAccesorio, repsMin: 10, repsMax: 15, rpe: 8, descansoSeg: 75 }
}

/** Cardio sugerido al final para pérdida de grasa (10–20 min), solo si la sesión da para ello. */
export function cardioSugerido(perfil: Pick<Profile, 'objetivo' | 'minutosPorSesion'>): number {
  if (perfil.objetivo !== 'perder_grasa') return 0
  const m = perfil.minutosPorSesion
  return m >= 90 ? 20 : m >= 60 ? 15 : m >= 40 ? 10 : 0
}

/** Máximo de series que caben en la sesión, descontando calentamiento y cardio. */
export function seriesDisponibles(minutos: number, cardioMin: number): number {
  return Math.max(0, Math.floor((minutos - MINUTOS_CALENTAMIENTO - cardioMin) / MINUTOS_POR_SERIE))
}

export function minutosEstimados(dia: DiaRutina): number {
  const series = dia.ejercicios.reduce((s, e) => s + e.series, 0)
  return Math.round(MINUTOS_CALENTAMIENTO + series * MINUTOS_POR_SERIE + (dia.cardioMin ?? 0))
}

/**
 * Recorta el día hasta que quepa en `maxSeries`, en este orden:
 * 1) accesorios a 2 series, 2) quitar accesorios del final, 3) compuestos a 2 series,
 * 4) quitar compuestos del final (dejando al menos 2 ejercicios).
 */
export function ajustarATiempo(
  ejercicios: EjercicioPlanificado[],
  esCompuesto: (id: string) => boolean,
  maxSeries: number,
): EjercicioPlanificado[] {
  const lista = ejercicios.map((e) => ({ ...e }))
  const total = () => lista.reduce((s, e) => s + e.series, 0)
  const ultimo = (f: (e: EjercicioPlanificado) => boolean) => lista.findLastIndex(f)

  while (total() > maxSeries) {
    const accA3 = ultimo((e) => !esCompuesto(e.ejercicioId) && e.series > 2)
    if (accA3 >= 0) { lista[accA3].series = 2; continue }
    const acc = ultimo((e) => !esCompuesto(e.ejercicioId))
    if (acc >= 0) { lista.splice(acc, 1); continue }
    const comp3 = ultimo((e) => e.series > 2)
    if (comp3 >= 0) { lista[comp3].series = 2; continue }
    if (lista.length > 2) { lista.pop(); continue }
    break
  }
  return lista
}

/** Elige el primer ejercicio del patrón con equipo disponible; evita repetir en el día y, si se puede, en la semana. */
function elegir(
  patron: string[],
  porId: Map<string, Exercise>,
  equipo: Profile['equipo'],
  usadosDia: Set<string>,
  usadosSemana: Set<string>,
): Exercise | undefined {
  const candidatos = patron
    .map((id) => porId.get(id))
    .filter((e): e is Exercise => !!e && equipo.includes(e.equipo) && !usadosDia.has(e.id))
  return candidatos.find((e) => !usadosSemana.has(e.id)) ?? candidatos[0]
}

export function generarRutina(perfil: Profile, ejercicios: Exercise[], ahora = new Date()): Routine {
  const porId = new Map(ejercicios.map((e) => [e.id, e]))
  const esCompuesto = (id: string) => porId.get(id)?.tipo === 'compuesto'
  const cardioMin = cardioSugerido(perfil)
  const maxSeries = seriesDisponibles(perfil.minutosPorSesion, cardioMin)
  const { nombre, semana, seriesAccesorio } = plantillasPara(perfil.diasPorSemana)

  // Cada plantilla se genera una vez (en 3 días, la A se repite igual)
  const generados = new Map<Plantilla, DiaRutina>()
  const usadosSemana = new Set<string>()
  const dias = semana.map((plantilla) => {
    const previo = generados.get(plantilla)
    if (previo) return previo
    const usadosDia = new Set<string>()
    const planificados: EjercicioPlanificado[] = []
    for (const patron of plantilla.huecos) {
      const ej = elegir(patron, porId, perfil.equipo, usadosDia, usadosSemana)
      if (!ej) continue
      usadosDia.add(ej.id)
      planificados.push(prescripcion(ej, seriesAccesorio))
    }
    planificados.forEach((p) => usadosSemana.add(p.ejercicioId))
    const dia: DiaRutina = {
      nombre: plantilla.nombre,
      ejercicios: ajustarATiempo(planificados, esCompuesto, maxSeries),
      ...(cardioMin > 0 && { cardioMin }),
    }
    generados.set(plantilla, dia)
    return dia
  })

  return {
    nombre: `${nombre} · ${dias.length} días`,
    creada: ahora.toISOString(),
    dias: dias.map((d) => ({ ...d, ejercicios: d.ejercicios.map((e) => ({ ...e })) })),
  }
}

/** Series semanales por grupo: el grupo principal cuenta 1 y cada secundario 0.5. */
export function seriesPorGrupo(rutina: Routine, ejercicios: Exercise[]): Record<GrupoMuscular, number> {
  const porId = new Map(ejercicios.map((e) => [e.id, e]))
  const conteo = {} as Record<GrupoMuscular, number>
  for (const dia of rutina.dias)
    for (const p of dia.ejercicios) {
      const ej = porId.get(p.ejercicioId)
      if (!ej) continue
      conteo[ej.grupoPrincipal] = (conteo[ej.grupoPrincipal] ?? 0) + p.series
      for (const g of ej.gruposSecundarios) conteo[g] = (conteo[g] ?? 0) + p.series / 2
    }
  return conteo
}
