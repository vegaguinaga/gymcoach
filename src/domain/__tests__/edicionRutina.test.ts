import { describe, expect, it } from 'vitest'
import {
  agregarEjercicio,
  editarPrescripcion,
  moverEjercicio,
  normalizarPrescripcion,
  quitarEjercicio,
  renombrarDia,
  renombrarRutina,
} from '../edicionRutina'
import type { EjercicioPlanificado, Exercise, Routine } from '../tipos'
import datos from '../../data/exercises.json'

const porId = new Map((datos as Exercise[]).map((e) => [e.id, e]))
const ej = (id: string) => {
  const e = porId.get(id)
  if (!e) throw new Error(`falta ${id}`)
  return e
}
const plan = (ejercicioId: string): EjercicioPlanificado => ({
  ejercicioId, series: 3, repsMin: 6, repsMax: 10, rpe: 7, descansoSeg: 150,
})
// Full Body A se repite en los días 1 y 3
const rutina: Routine = {
  id: 1,
  nombre: 'Full Body',
  creada: '2026-01-01T00:00:00Z',
  dias: [
    { nombre: 'Full Body A', ejercicios: [plan('A'), plan('B'), plan('C')] },
    { nombre: 'Full Body B', ejercicios: [plan('D'), plan('E')] },
    { nombre: 'Full Body A', ejercicios: [plan('A'), plan('B'), plan('C')] },
  ],
}
const ids = (r: Routine, dia: number) => r.dias[dia].ejercicios.map((e) => e.ejercicioId)

describe('normalizarPrescripcion', () => {
  it('limita series, reps, RPE y descanso (pasos de 15 s)', () => {
    expect(normalizarPrescripcion({ ...plan('A'), series: 9, repsMin: 0, repsMax: 50, rpe: 3, descansoSeg: 400 })).toEqual({
      ejercicioId: 'A', series: 6, repsMin: 1, repsMax: 30, rpe: 5, descansoSeg: 300,
    })
    expect(normalizarPrescripcion({ ...plan('A'), series: 0, descansoSeg: 92 }).descansoSeg).toBe(90)
    expect(normalizarPrescripcion({ ...plan('A'), series: 0 }).series).toBe(1)
  })
  it('el máximo de reps nunca queda por debajo del mínimo', () => {
    expect(normalizarPrescripcion({ ...plan('A'), repsMin: 12, repsMax: 10 })).toMatchObject({ repsMin: 12, repsMax: 12 })
  })
})

describe('editarPrescripcion', () => {
  it('cambia el ejercicio en todos los días con el mismo nombre y marca la rutina', () => {
    const r = editarPrescripcion(rutina, 0, 1, { series: 4, rpe: 8 })
    expect(r.dias[0].ejercicios[1]).toMatchObject({ series: 4, rpe: 8 })
    expect(r.dias[2].ejercicios[1]).toMatchObject({ series: 4, rpe: 8 })
    expect(r.dias[1]).toBe(rutina.dias[1])
    expect(r.personalizada).toBe(true)
    expect(rutina.personalizada).toBeUndefined()
  })
  it('bajar el máximo de reps arrastra el mínimo', () => {
    expect(editarPrescripcion(rutina, 0, 0, { repsMax: 5 }).dias[0].ejercicios[0]).toMatchObject({ repsMin: 5, repsMax: 5 })
  })
  it('posición inexistente no cambia nada', () => {
    expect(editarPrescripcion(rutina, 0, 9, { series: 4 })).toBe(rutina)
    expect(editarPrescripcion(rutina, 7, 0, { series: 4 })).toBe(rutina)
  })
})

describe('agregarEjercicio', () => {
  it('agrega al final con la prescripción de su tipo en los días iguales', () => {
    const r = agregarEjercicio(rutina, 0, ej('curl_mancuernas'))
    expect(ids(r, 0)).toEqual(['A', 'B', 'C', 'curl_mancuernas'])
    expect(ids(r, 2)).toEqual(ids(r, 0))
    expect(ids(r, 1)).toEqual(['D', 'E'])
    expect(r.dias[0].ejercicios[3]).toMatchObject({ repsMin: 10, repsMax: 15 })
  })
  it('no repite un ejercicio del día ni agrega la plancha', () => {
    const r = agregarEjercicio(rutina, 0, ej('curl_mancuernas'))
    expect(agregarEjercicio(r, 0, ej('curl_mancuernas'))).toBe(r)
    expect(agregarEjercicio(rutina, 0, ej('plancha'))).toBe(rutina)
  })
})

describe('quitarEjercicio y moverEjercicio', () => {
  it('quita en los días iguales', () => {
    const r = quitarEjercicio(rutina, 2, 1)
    expect(ids(r, 0)).toEqual(['A', 'C'])
    expect(ids(r, 2)).toEqual(['A', 'C'])
  })
  it('no deja un día vacío', () => {
    const uno = quitarEjercicio(rutina, 1, 0)
    expect(ids(uno, 1)).toEqual(['E'])
    expect(quitarEjercicio(uno, 1, 0)).toBe(uno)
  })
  it('mueve arriba y abajo, sin salirse', () => {
    expect(ids(moverEjercicio(rutina, 0, 2, -1), 2)).toEqual(['A', 'C', 'B'])
    expect(ids(moverEjercicio(rutina, 0, 0, 1), 0)).toEqual(['B', 'A', 'C'])
    expect(moverEjercicio(rutina, 0, 0, -1)).toBe(rutina)
    expect(moverEjercicio(rutina, 0, 2, 1)).toBe(rutina)
  })
})

describe('renombrar', () => {
  it('renombra solo ese día y limpia espacios', () => {
    const r = renombrarDia(rutina, 2, '  Pierna   y core ')
    expect(r.dias.map((d) => d.nombre)).toEqual(['Full Body A', 'Full Body B', 'Pierna y core'])
    // Ya no cambia junto al día 1
    expect(ids(quitarEjercicio(r, 0, 0), 2)).toEqual(['A', 'B', 'C'])
  })
  it('ignora nombres vacíos y recorta a 30 caracteres', () => {
    expect(renombrarDia(rutina, 0, '   ')).toBe(rutina)
    expect(renombrarRutina(rutina, 'x'.repeat(40)).nombre).toHaveLength(30)
    expect(renombrarRutina(rutina, 'Full Body')).toBe(rutina)
  })
})
