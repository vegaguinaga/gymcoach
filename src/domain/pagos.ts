// Mensualidad del gym: cuándo vence el último pago y cuántos días faltan. Lógica pura.
import type { GymPayment } from './tipos'

/** A partir de estos días (o menos) antes del vencimiento se avisa en Entrenar. */
export const DIAS_AVISO_PAGO = 3
export const MAX_MONTO = 10_000_000

const DIA_MS = 86_400_000
const diaUTC = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())

/** Mismo día del mes siguiente (hora local). Si ese día no existe, el último del mes: 31 ene → 28/29 feb. */
export function vencimiento(fecha: Date): Date {
  const ultimoDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 2, 0).getDate()
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, Math.min(fecha.getDate(), ultimoDelMes))
}

export interface EstadoPago {
  ultimo: GymPayment
  vence: Date
  /** Días hasta el vencimiento: 0 = vence hoy, negativo = ya venció */
  dias: number
}

/** Estado del pago más reciente, o null si nunca se registró uno. */
export function estadoPago(pagos: GymPayment[], ahora = new Date()): EstadoPago | null {
  const ultimo = pagos.reduce<GymPayment | null>((a, p) => (!a || p.fecha > a.fecha ? p : a), null)
  if (!ultimo) return null
  const vence = vencimiento(new Date(ultimo.fecha))
  return { ultimo, vence, dias: Math.round((diaUTC(vence) - diaUTC(ahora)) / DIA_MS) }
}

export function textoDias(dias: number): string {
  if (dias === 0) return 'Vence hoy'
  if (dias > 0) return dias === 1 ? 'Vence mañana' : `Faltan ${dias} días`
  return dias === -1 ? 'Venció ayer' : `Venció hace ${-dias} días`
}

/** Fecha de un <input type="date"> (aaaa-mm-dd) como mediodía local; null si es inválida o futura. */
export function fechaDePago(texto: string, ahora = new Date()): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  if (d.getDate() !== Number(m[3]) || diaUTC(d) > diaUTC(ahora)) return null
  return d
}

/** Monto opcional: vacío = sin monto; acepta coma decimal. undefined si no es válido. */
export function leerMonto(texto: string): number | null | undefined {
  const t = texto.trim()
  if (!t) return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) && n > 0 && n <= MAX_MONTO ? Math.round(n * 100) / 100 : undefined
}
