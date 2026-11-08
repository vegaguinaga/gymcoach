// Medidas corporales en cm (cintura, cadera, pecho, brazo, muslo). Lógica pura.
import { MEDIDAS, type BodyMeasurement, type Medida } from './tipos'
import { redondearKg } from './unidades'

export const ETIQUETA_MEDIDA: Record<Medida, string> = {
  cintura: 'Cintura',
  cadera: 'Cadera',
  pecho: 'Pecho',
  brazo: 'Brazo',
  muslo: 'Muslo',
}

/** Consejo de cómo medir cada zona (siempre en el mismo sitio y a la misma hora). */
export const AYUDA_MEDIDA: Record<Medida, string> = {
  cintura: 'a la altura del ombligo, sin apretar el abdomen',
  cadera: 'en la parte más ancha de los glúteos',
  pecho: 'a la altura de los pezones, con los brazos relajados',
  brazo: 'en la parte más ancha, relajado',
  muslo: 'en la parte más ancha, de pie',
}

export const LIMITES_CM = { min: 10, max: 250 } as const

export type ResultadoMedidas = { ok: true; cm: Partial<Record<Medida, number>> } | { ok: false; error: string }

/**
 * Valida lo que se escribió en el formulario. Los campos vacíos (undefined o NaN) se ignoran,
 * pero tiene que haber al menos una medida y todas dentro de 10–250 cm. Redondea a 1 decimal.
 */
export function normalizarMedidas(entrada: Partial<Record<Medida, number | undefined>>): ResultadoMedidas {
  const cm: Partial<Record<Medida, number>> = {}
  for (const m of MEDIDAS) {
    const v = entrada[m]
    if (v === undefined || Number.isNaN(v)) continue
    if (!Number.isFinite(v) || v < LIMITES_CM.min || v > LIMITES_CM.max)
      return { ok: false, error: `${ETIQUETA_MEDIDA[m]}: escribe un valor entre ${LIMITES_CM.min} y ${LIMITES_CM.max} cm.` }
    cm[m] = redondearKg(v)
  }
  if (Object.keys(cm).length === 0) return { ok: false, error: 'Escribe al menos una medida.' }
  return { ok: true, cm }
}

const ordenados = (registros: BodyMeasurement[]) => [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha))

/** Puntos de una medida para la gráfica, del más antiguo al más reciente (solo los registros que la tienen). */
export function serieMedida(registros: BodyMeasurement[], medida: Medida): { fecha: string; valor: number }[] {
  return ordenados(registros).flatMap((r) => {
    const v = r.cm[medida]
    return v === undefined ? [] : [{ fecha: r.fecha, valor: v }]
  })
}

export interface ResumenMedida {
  medida: Medida
  actual: number
  fecha: string
  /** Diferencia con la medición anterior de esa zona (null si es la primera) */
  cambio: number | null
  /** Diferencia con la primera medición de esa zona (null si es la primera) */
  cambioTotal: number | null
}

/** Última medida de cada zona con sus cambios. Solo incluye las zonas que se midieron alguna vez. */
export function resumenMedidas(registros: BodyMeasurement[]): ResumenMedida[] {
  return MEDIDAS.flatMap((medida) => {
    const puntos = serieMedida(registros, medida)
    const ultimo = puntos.at(-1)
    if (!ultimo) return []
    const anterior = puntos.at(-2)
    return [{
      medida,
      actual: ultimo.valor,
      fecha: ultimo.fecha,
      cambio: anterior ? redondearKg(ultimo.valor - anterior.valor) : null,
      cambioTotal: puntos.length > 1 ? redondearKg(ultimo.valor - puntos[0].valor) : null,
    }]
  })
}

/** Junta las medidas nuevas con las ya guardadas ese día (las nuevas mandan). */
export function combinarMedidas(previas: Partial<Record<Medida, number>> | undefined, nuevas: Partial<Record<Medida, number>>) {
  return { ...previas, ...nuevas }
}

/** "+1.5 cm", "−2 cm" o "=" */
export function textoCambio(cambio: number): string {
  if (cambio === 0) return '='
  return `${cambio > 0 ? '+' : '−'}${Math.abs(cambio).toLocaleString('es')} cm`
}
