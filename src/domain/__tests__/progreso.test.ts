import { describe, expect, it } from 'vitest'
import {
  ejerciciosRealizados,
  historialEjercicio,
  recordsNuevos,
  recordsPorEjercicio,
  sesionesEnDias,
  textoSerie,
} from '../progreso'
import type { SetLog, WorkoutSession } from '../tipos'

const serie = (ejercicioId: string, kg: number, reps: number, completada = true): SetLog => ({
  ejercicioId, serie: 1, kg, reps, completada,
})
let siguienteId = 1
function sesion(fecha: string, series: SetLog[], cambios: Partial<WorkoutSession> = {}): WorkoutSession {
  return { id: siguienteId++, fecha, estado: 'terminada', diaNombre: 'A', ejercicios: [], series, ...cambios }
}

const s1 = sesion('2026-01-01T10:00:00Z', [serie('sentadilla', 60, 8), serie('sentadilla', 60, 6), serie('dominada', 0, 5)])
const s2 = sesion('2026-01-03T10:00:00Z', [serie('sentadilla', 65, 6), serie('sentadilla', 100, 10, false), serie('dominada', 0, 7)])
const enCurso = sesion('2026-01-05T10:00:00Z', [serie('sentadilla', 200, 5)], { estado: 'en_curso' })

describe('historialEjercicio', () => {
  it('un punto por sesión terminada, ordenado por fecha, solo series completadas', () => {
    // Desordenadas a propósito; la sesión en curso no cuenta
    const puntos = historialEjercicio([s2, enCurso, s1], 'sentadilla')
    expect(puntos.map((p) => p.fecha)).toEqual([s1.fecha, s2.fecha])
    expect(puntos[0]).toMatchObject({ unoRM: 76, volumen: 840, mejorSerie: { kg: 60, reps: 8 } })
    // La serie de 100 kg no se completó: se ignora
    expect(puntos[1]).toMatchObject({ unoRM: 78, volumen: 390, mejorSerie: { kg: 65, reps: 6 } })
  })

  it('peso corporal sin lastre: sin 1RM, la mejor serie es la de más reps', () => {
    const puntos = historialEjercicio([s1, s2], 'dominada')
    expect(puntos.map((p) => p.unoRM)).toEqual([null, null])
    expect(puntos[1].mejorSerie).toEqual({ kg: 0, reps: 7 })
  })

  it('omite sesiones sin series completadas del ejercicio', () => {
    expect(historialEjercicio([s1, s2], 'press_banca')).toEqual([])
  })
})

describe('recordsPorEjercicio', () => {
  it('mayor 1RM y mejor serie (kg × reps) con su fecha', () => {
    const r = recordsPorEjercicio([s1, s2, enCurso]).get('sentadilla')
    expect(r?.unoRM).toEqual({ valor: 78, fecha: s2.fecha })
    // 60×8 = 480 > 65×6 = 390
    expect(r?.mejorSerie).toEqual({ kg: 60, reps: 8, fecha: s1.fecha })
  })

  it('peso corporal: sin récord de 1RM, mejor serie por reps', () => {
    const r = recordsPorEjercicio([s1, s2]).get('dominada')
    expect(r?.unoRM).toBeNull()
    expect(r?.mejorSerie).toMatchObject({ kg: 0, reps: 7 })
  })
})

describe('recordsNuevos', () => {
  it('detecta los récords que supera la sesión', () => {
    const nuevos = recordsNuevos(s2, [s1, s2])
    expect(nuevos).toEqual([
      { ejercicioId: 'sentadilla', tipo: 'unoRM', texto: '78 kg' },
      { ejercicioId: 'dominada', tipo: 'serie', texto: '7 reps' },
    ])
  })

  it('la primera vez que se hace un ejercicio no es récord', () => {
    expect(recordsNuevos(s1, [s1])).toEqual([])
  })

  it('igualar un récord no cuenta', () => {
    const igual = sesion('2026-01-04T10:00:00Z', [serie('sentadilla', 60, 8)])
    expect(recordsNuevos(igual, [s1, igual])).toEqual([])
  })
})

describe('resumen', () => {
  it('ejercicios realizados: el más reciente primero, sin repetir', () => {
    const s3 = sesion('2026-01-04T10:00:00Z', [serie('curl', 10, 12), serie('remo', 40, 10, false)])
    expect(ejerciciosRealizados([s1, s3, s2])).toEqual(['curl', 'sentadilla', 'dominada'])
  })

  it('sesiones terminadas en los últimos N días', () => {
    const ahora = new Date('2026-01-08T12:00:00Z')
    expect(sesionesEnDias([s1, s2, enCurso], 7, ahora)).toBe(1)
    expect(sesionesEnDias([s1, s2, enCurso], 30, ahora)).toBe(2)
  })

  it('texto de la serie', () => {
    expect(textoSerie({ kg: 60, reps: 8 })).toBe('60 kg × 8')
    expect(textoSerie({ kg: 0, reps: 12 })).toBe('12 reps')
  })
})
