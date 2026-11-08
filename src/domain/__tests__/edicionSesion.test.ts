import { describe, expect, it } from 'vitest'
import { editarSerie, hayCambios, normalizarSerie } from '../edicionSesion'
import type { SetLog } from '../tipos'

const serie = (ejercicioId: string, n: number, kg: number, reps: number, completada = true): SetLog => ({
  ejercicioId, serie: n, kg, reps, completada,
})
const base = [serie('sentadilla', 1, 60, 8), serie('sentadilla', 2, 60, 7), serie('curl', 1, 10, 12)]

describe('normalizarSerie', () => {
  it('redondea kg a 1 decimal y reps a enteros', () => {
    expect(normalizarSerie(serie('a', 1, 62.46, 7.6))).toMatchObject({ kg: 62.5, reps: 8 })
  })
  it('limita kg, reps y RPE', () => {
    expect(normalizarSerie({ ...serie('a', 1, -5, 300), rpe: 14 })).toMatchObject({ kg: 0, reps: 100, rpe: 10 })
    expect(normalizarSerie(serie('a', 1, 900, -1))).toMatchObject({ kg: 500, reps: 0 })
  })
  it('valores no numéricos pasan a 0 y RPE vacío desaparece', () => {
    const s = normalizarSerie({ ...serie('a', 1, NaN, NaN), rpe: NaN })
    expect(s).toMatchObject({ kg: 0, reps: 0 })
    expect('rpe' in s).toBe(false)
  })
})

describe('editarSerie', () => {
  it('cambia solo la serie indicada', () => {
    const r = editarSerie(base, 1, { kg: 65, rpe: 9 })
    expect(r[1]).toMatchObject({ ejercicioId: 'sentadilla', serie: 2, kg: 65, reps: 7, rpe: 9 })
    expect(r[0]).toBe(base[0])
    expect(r[2]).toBe(base[2])
  })
  it('puede desmarcar una serie y quitar el RPE', () => {
    const r = editarSerie([{ ...base[0], rpe: 8 }], 0, { completada: false, rpe: undefined })
    expect(r[0].completada).toBe(false)
    expect(r[0].rpe).toBeUndefined()
  })
  it('índice fuera de rango no cambia nada', () => {
    expect(editarSerie(base, 9, { kg: 1 })).toBe(base)
  })
})

describe('hayCambios', () => {
  it('detecta cambios reales', () => {
    expect(hayCambios(base, base.map((s) => ({ ...s })))).toBe(false)
    expect(hayCambios(base, editarSerie(base, 0, { reps: 9 }))).toBe(true)
    expect(hayCambios(base, base.slice(1))).toBe(true)
  })
})
