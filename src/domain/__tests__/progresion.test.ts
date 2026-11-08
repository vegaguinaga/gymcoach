import { describe, expect, it } from 'vitest'
import { estadoDescarga, incrementoKg, seriesPorSesion, sugerencia } from '../progresion'
import type { EjercicioPlanificado, Exercise, SetLog, WorkoutSession } from '../tipos'

const ej = (cambios: Partial<Exercise>): Exercise => ({
  id: 'x', nombre: 'X', grupoPrincipal: 'pecho', gruposSecundarios: [], equipo: 'gym', tipo: 'compuesto',
  instrucciones: [], erroresComunes: [], alternativas: [], ...cambios,
})
const banca = ej({ id: 'banca' })
const flexiones = ej({ id: 'flexiones', equipo: 'peso_corporal' })
const plan = (ejercicioId = 'banca', series = 3): EjercicioPlanificado => ({
  ejercicioId, series, repsMin: 6, repsMax: 10, rpe: 7, descansoSeg: 150,
})
const s = (kg: number, reps: number, rpe?: number, ejercicioId = 'banca', completada = true): SetLog => ({
  ejercicioId, serie: 1, kg, reps, rpe, completada,
})
let dia = 0
/** Sesiones terminadas en días consecutivos (en orden de llamada). */
function sesion(series: SetLog[], cambios: Partial<WorkoutSession> = {}): WorkoutSession {
  dia++
  return {
    fecha: new Date(Date.UTC(2026, 0, dia, 10)).toISOString(),
    estado: 'terminada', diaNombre: 'A', ejercicios: [], series, ...cambios,
  }
}

describe('incrementoKg', () => {
  it('mancuernas 2 kg, compuestos 2.5 kg, accesorios de gym 1 kg', () => {
    expect(incrementoKg(ej({ equipo: 'mancuernas' }))).toBe(2)
    expect(incrementoKg(ej({ grupoPrincipal: 'cuadriceps' }))).toBe(2.5)
    expect(incrementoKg(banca)).toBe(2.5)
    expect(incrementoKg(ej({ tipo: 'accesorio', grupoPrincipal: 'biceps' }))).toBe(1)
    expect(incrementoKg(ej({ tipo: 'accesorio', grupoPrincipal: 'isquios' }))).toBe(2.5)
  })
})

describe('sugerencia (doble progresión)', () => {
  it('ejercicio nuevo: 0 kg y el mínimo de reps', () => {
    expect(sugerencia(plan(), banca, [])).toMatchObject({ tipo: 'nuevo', kg: 0, reps: [6, 6, 6] })
  })

  it('tope del rango en todas las series con RPE ≤ 8: sube y vuelve al mínimo', () => {
    const h = [sesion([s(40, 10, 8), s(40, 10), s(40, 10, 7)])]
    expect(sugerencia(plan(), banca, h)).toMatchObject({ tipo: 'subir', kg: 42.5, reps: [6, 6, 6] })
  })

  it('tope con RPE 9 o con menos series que el plan: mismo peso', () => {
    expect(sugerencia(plan(), banca, [sesion([s(40, 10), s(40, 10), s(40, 10, 9)])])).toMatchObject({ tipo: 'mantener', kg: 40, reps: [10, 10, 10] })
    expect(sugerencia(plan(), banca, [sesion([s(40, 10), s(40, 10)])]).tipo).toBe('mantener')
  })

  it('dentro del rango: mismo peso (el mayor de la sesión) y +1 rep por serie sin pasar el tope', () => {
    const h = [sesion([s(35, 8), s(40, 10), s(40, 7)])]
    expect(sugerencia(plan(), banca, h)).toMatchObject({ tipo: 'mantener', kg: 40, reps: [9, 10, 8] })
  })

  it('bajo el mínimo en 2 sesiones seguidas: baja un 10 %', () => {
    const h = [sesion([s(50, 5), s(50, 4), s(50, 6)]), sesion([s(50, 5), s(50, 5), s(50, 7)])]
    expect(sugerencia(plan(), banca, h)).toMatchObject({ tipo: 'bajar', kg: 45, reps: [6, 6, 6] })
    // Una sola sesión mala no basta
    expect(sugerencia(plan(), banca, h.slice(1)).tipo).toBe('mantener')
  })

  it('peso corporal sin lastre: progresa en reps', () => {
    const h = [sesion([s(0, 10, 7, 'flexiones'), s(0, 10, 7, 'flexiones'), s(0, 11, 8, 'flexiones')])]
    expect(sugerencia(plan('flexiones'), flexiones, h)).toMatchObject({ tipo: 'subir', kg: 0, reps: [11, 11, 12] })
  })

  it('descarga: la mitad de las series (hacia arriba) y el mismo peso', () => {
    const h = [sesion([s(40, 10), s(40, 10), s(40, 9)])]
    expect(sugerencia(plan(), banca, h, true)).toMatchObject({ tipo: 'descarga', kg: 40, reps: [10, 10] })
  })

  it('ignora sesiones de descarga, en curso y series sin completar', () => {
    const h = [
      sesion([s(40, 8)]),
      sesion([s(40, 10), s(40, 10), s(40, 10)], { descarga: true }),
      sesion([s(60, 10)], { estado: 'en_curso' }),
      sesion([s(80, 10, undefined, 'banca', false)]),
    ]
    expect(seriesPorSesion('banca', h)).toHaveLength(1)
    expect(sugerencia(plan(), banca, h)).toMatchObject({ tipo: 'mantener', kg: 40 })
  })
})

describe('estadoDescarga', () => {
  const fecha = (d: number) => new Date(Date.UTC(2026, 0, d, 10)).toISOString()
  const ses = (d: number, series: SetLog[] = [s(40, 8)], descarga?: boolean): WorkoutSession => ({
    fecha: fecha(d), estado: 'terminada', diaNombre: 'A', ejercicios: [], series, descarga,
  })
  const el = (d: number) => new Date(Date.UTC(2026, 0, d, 12))

  it('sin sesiones o con poco tiempo: nada', () => {
    expect(estadoDescarga([], ['banca'], el(1))).toEqual({ activa: false, recomendada: false })
    expect(estadoDescarga([ses(1)], ['banca'], el(30)).recomendada).toBe(false)
  })

  it('se recomienda tras 6 semanas desde la primera sesión o desde la última descarga', () => {
    expect(estadoDescarga([ses(1)], ['banca'], el(43)).recomendada).toBe(true)
    const conDescarga = [ses(1), ses(20, undefined, true), ses(30)]
    expect(estadoDescarga(conDescarga, ['banca'], el(50)).recomendada).toBe(false)
    expect(estadoDescarga(conDescarga, ['banca'], el(62)).recomendada).toBe(true)
  })

  it('activa durante 7 días desde la primera sesión de descarga', () => {
    const h = [ses(1), ses(43, undefined, true), ses(45, undefined, true)]
    expect(estadoDescarga(h, [], el(49))).toMatchObject({ activa: true, recomendada: false })
    expect(estadoDescarga(h, [], el(50)).activa).toBe(false)
  })

  it('se recomienda si el 1RM de un compuesto baja 2 sesiones seguidas', () => {
    const h = [ses(1, [s(50, 8)]), ses(3, [s(50, 7)]), ses(5, [s(50, 6)])]
    expect(estadoDescarga(h, ['banca'], el(6))).toMatchObject({ recomendada: true, ejercicioId: 'banca' })
    expect(estadoDescarga(h, ['sentadilla'], el(6)).recomendada).toBe(false)
  })
})
