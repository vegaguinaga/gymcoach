import { describe, expect, it } from 'vitest'
import { seriesCalentamiento } from '../calentamiento'
import type { Exercise } from '../tipos'

const ej = (cambios: Partial<Exercise>): Exercise => ({
  id: 'x', nombre: 'X', grupoPrincipal: 'cuadriceps', gruposSecundarios: [], equipo: 'gym', tipo: 'compuesto',
  instrucciones: [], erroresComunes: [], alternativas: [], ...cambios,
})

describe('seriesCalentamiento', () => {
  it('compuesto pesado: 40 % × 8, 60 % × 5 y 80 % × 3', () => {
    expect(seriesCalentamiento(100, ej({}))).toEqual([
      { kg: 40, reps: 8 },
      { kg: 60, reps: 5 },
      { kg: 80, reps: 3 },
    ])
  })
  it('redondea al incremento del ejercicio (mancuernas de 2 en 2, barra de 2.5 en 2.5)', () => {
    expect(seriesCalentamiento(22, ej({ equipo: 'mancuernas' })).map((s) => s.kg)).toEqual([8, 14, 18])
    expect(seriesCalentamiento(47.5, ej({})).map((s) => s.kg)).toEqual([20, 27.5, 37.5])
  })
  it('con poco peso basta una serie suave al 50 %', () => {
    expect(seriesCalentamiento(15, ej({}))).toEqual([{ kg: 7.5, reps: 10 }])
  })
  it('descarta series repetidas o que llegan al peso de trabajo', () => {
    // 20 kg en mancuernas: 8, 12, 16
    expect(seriesCalentamiento(20, ej({ equipo: 'mancuernas' })).map((s) => s.kg)).toEqual([8, 12, 16])
    // 2 kg: el 50 % redondea a 2 kg (= trabajo) → nada
    expect(seriesCalentamiento(2, ej({ equipo: 'mancuernas' }))).toEqual([])
  })
  it('nada en accesorios, sin peso o sin ejercicio', () => {
    expect(seriesCalentamiento(50, ej({ tipo: 'accesorio' }))).toEqual([])
    expect(seriesCalentamiento(0, ej({ equipo: 'peso_corporal' }))).toEqual([])
    expect(seriesCalentamiento(50)).toEqual([])
  })
})
