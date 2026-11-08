import { describe, expect, it } from 'vitest'
import { mejor1RM, unoRMEpley, volumen } from '../fuerza'
import {
  agregarSerie,
  finDescanso,
  nuevaSesion,
  quitarSerie,
  resumenSesion,
  segundosRestantes,
  seriesIniciales,
  siguienteDia,
  ultimasSeries,
} from '../sesion'
import type { DiaRutina, Routine, SetLog, WorkoutSession } from '../tipos'

const plan = (ejercicioId: string, series = 3, repsMin = 6) => ({
  ejercicioId, series, repsMin, repsMax: repsMin + 4, rpe: 7, descansoSeg: 150,
})
const diaA: DiaRutina = { nombre: 'A', ejercicios: [plan('sentadilla'), plan('curl', 2, 10)] }
const rutina: Routine = { id: 7, nombre: 'R', creada: '2026-01-01T00:00:00Z', dias: [diaA, { nombre: 'B', ejercicios: [] }] }

const serie = (ejercicioId: string, n: number, kg: number, reps: number, completada = true): SetLog => ({
  ejercicioId, serie: n, kg, reps, completada,
})
function sesion(cambios: Partial<WorkoutSession>): WorkoutSession {
  return { fecha: '2026-01-01T10:00:00Z', estado: 'terminada', diaNombre: 'A', ejercicios: [], series: [], ...cambios }
}

describe('fuerza', () => {
  it('Epley: kg × (1 + reps/30), solo con 1–12 reps', () => {
    expect(unoRMEpley(100, 10)).toBe(133.3)
    expect(unoRMEpley(100, 1)).toBe(100)
    expect(unoRMEpley(100, 13)).toBeNull()
    expect(unoRMEpley(0, 5)).toBeNull()
  })
  it('volumen y mejor 1RM solo cuentan series completadas', () => {
    const s = [serie('x', 1, 50, 10), serie('x', 2, 60, 5), serie('x', 3, 100, 10, false)]
    expect(volumen(s)).toBe(800)
    expect(mejor1RM(s)).toBe(70) // 60 × (1 + 5/30) = 70 > 50 × 1.333 = 66.7
    expect(mejor1RM([])).toBeNull()
  })
})

describe('siguienteDia', () => {
  it('empieza por el primero y luego rota', () => {
    expect(siguienteDia(rutina, null)).toBe(0)
    expect(siguienteDia(rutina, sesion({ rutinaId: 7, diaIndice: 0 }))).toBe(1)
    expect(siguienteDia(rutina, sesion({ rutinaId: 7, diaIndice: 1 }))).toBe(0)
  })
  it('si la última sesión era de otra rutina, vuelve al primero', () => {
    expect(siguienteDia(rutina, sesion({ rutinaId: 3, diaIndice: 0 }))).toBe(0)
  })
})

describe('series iniciales', () => {
  const historial = [
    sesion({ fecha: '2026-01-01T10:00:00Z', series: [serie('sentadilla', 1, 40, 8), serie('sentadilla', 2, 40, 7)] }),
    sesion({ fecha: '2026-01-03T10:00:00Z', series: [serie('sentadilla', 1, 45, 8), serie('sentadilla', 2, 45, 6, false)] }),
    sesion({ fecha: '2026-01-05T10:00:00Z', estado: 'en_curso', series: [serie('sentadilla', 1, 99, 1)] }),
  ]

  it('ultimasSeries toma la sesión terminada más reciente con series completadas', () => {
    expect(ultimasSeries('sentadilla', historial).map((s) => s.kg)).toEqual([45])
    expect(ultimasSeries('curl', historial)).toEqual([])
  })

  it('rellena con la sugerencia: mismo peso y +1 rep (repite la última serie si ahora hay más)', () => {
    const s = seriesIniciales(diaA, historial)
    expect(s.filter((x) => x.ejercicioId === 'sentadilla').map((x) => [x.serie, x.kg, x.reps])).toEqual([
      [1, 45, 9], [2, 45, 9], [3, 45, 9],
    ])
    expect(s.every((x) => !x.completada)).toBe(true)
  })

  it('ejercicio nuevo: 0 kg y el mínimo de reps', () => {
    const curl = seriesIniciales(diaA, historial).filter((x) => x.ejercicioId === 'curl')
    expect(curl.map((x) => [x.kg, x.reps])).toEqual([[0, 10], [0, 10]])
  })

  it('nuevaSesion copia el plan del día y queda en curso', () => {
    const s = nuevaSesion(rutina, 0, [], { ahora: new Date('2026-02-01T09:00:00Z') })
    expect(s).toMatchObject({ estado: 'en_curso', rutinaId: 7, diaIndice: 0, diaNombre: 'A', fecha: '2026-02-01T09:00:00.000Z' })
    expect(s.series).toHaveLength(5)
    expect(s.sugerencias?.sentadilla.tipo).toBe('nuevo')
    expect(s.descarga).toBeUndefined()
    s.ejercicios[0].series = 99
    expect(diaA.ejercicios[0].series).toBe(3)
  })

  it('nuevaSesion en descarga: la mitad de las series en el plan copiado y en las series', () => {
    const s = nuevaSesion(rutina, 0, historial, { descarga: true })
    expect(s.descarga).toBe(true)
    expect(s.ejercicios.map((e) => e.series)).toEqual([2, 1])
    expect(s.series.filter((x) => x.ejercicioId === 'sentadilla').map((x) => x.kg)).toEqual([45, 45])
  })
})

describe('agregar y quitar series', () => {
  const base = [serie('a', 1, 20, 10), serie('a', 2, 22.5, 8), serie('b', 1, 10, 12)]

  it('agregarSerie la pone tras la última del ejercicio copiando kg y reps', () => {
    const r = agregarSerie(base, 'a')
    expect(r.map((s) => `${s.ejercicioId}${s.serie}`)).toEqual(['a1', 'a2', 'a3', 'b1'])
    expect(r[2]).toEqual(serie('a', 3, 22.5, 8, false))
  })

  it('quitarSerie renumera solo ese ejercicio', () => {
    const r = quitarSerie(base, 0)
    expect(r.map((s) => `${s.ejercicioId}${s.serie}`)).toEqual(['a1', 'b1'])
    expect(r[0].kg).toBe(22.5)
    expect(quitarSerie(base, 9)).toBe(base)
  })
})

describe('temporizador de descanso', () => {
  const ahora = new Date('2026-01-01T10:00:00Z')
  it('calcula el fin y los segundos restantes', () => {
    const fin = finDescanso(90, ahora)
    expect(segundosRestantes(fin, ahora)).toBe(90)
    expect(segundosRestantes(fin, new Date('2026-01-01T10:01:00.5Z'))).toBe(30)
    expect(segundosRestantes(fin, new Date('2026-01-01T10:05:00Z'))).toBe(0)
    expect(segundosRestantes(undefined, ahora)).toBe(0)
  })
})

describe('resumenSesion', () => {
  it('duración, series, volumen y mejor 1RM por ejercicio', () => {
    const s = sesion({
      fecha: '2026-01-01T10:00:00Z',
      fin: '2026-01-01T10:47:20Z',
      series: [serie('a', 1, 50, 10), serie('a', 2, 50, 8), serie('b', 1, 0, 12), serie('b', 2, 10, 10, false)],
    })
    expect(resumenSesion(s)).toEqual({
      minutos: 47,
      seriesCompletadas: 3,
      seriesTotales: 4,
      volumenKg: 900,
      mejores: [{ ejercicioId: 'a', unoRM: 66.7 }],
    })
  })
})
