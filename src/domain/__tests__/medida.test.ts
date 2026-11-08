import { describe, expect, it } from 'vitest'
import { normalizarPrescripcion } from '../edicionRutina'
import { mejor1RM, volumen } from '../fuerza'
import { conUnidad, esPorTiempo, limitesReps, textoCronometro } from '../medida'
import { sugerencia } from '../progresion'
import { recordsNuevos, textoSerie } from '../progreso'
import type { EjercicioPlanificado, Exercise, SetLog, WorkoutSession } from '../tipos'
import datos from '../../data/exercises.json'

const biblioteca = datos as Exercise[]
const plancha = biblioteca.find((e) => e.id === 'plancha')
const plan: EjercicioPlanificado = { ejercicioId: 'plancha', series: 3, repsMin: 20, repsMax: 45, rpe: 8, descansoSeg: 60 }
const s = (reps: number, kg = 0, rpe?: number): SetLog => ({ ejercicioId: 'plancha', serie: 1, kg, reps, rpe, completada: true })
let dia = 0
const sesion = (series: SetLog[], id?: number): WorkoutSession => ({
  id, fecha: new Date(Date.UTC(2026, 0, ++dia, 10)).toISOString(), estado: 'terminada', diaNombre: 'A', ejercicios: [], series,
})

describe('medida', () => {
  it('la plancha se mide en segundos y está en la biblioteca', () => {
    expect(plancha).toBeDefined()
    expect(esPorTiempo('plancha')).toBe(true)
    expect(esPorTiempo('press_banca')).toBe(false)
    expect(conUnidad('plancha', 30)).toBe('30 s')
    expect(conUnidad('curl_barra', 12)).toBe('12 reps')
  })
  it('todos los ejercicios por tiempo existen en la biblioteca', () => {
    for (const id of ['plancha']) expect(biblioteca.some((e) => e.id === id && esPorTiempo(e.id))).toBe(true)
  })
  it('límites: reps 1–30; segundos 10–180 de 5 en 5', () => {
    expect(limitesReps('curl_barra')).toMatchObject({ min: 1, max: 30, paso: 1 })
    expect(limitesReps('plancha')).toMatchObject({ min: 10, max: 180, paso: 5 })
  })
  it('cronómetro m:ss', () => {
    expect(textoCronometro(0)).toBe('0:00')
    expect(textoCronometro(65.7)).toBe('1:05')
    expect(textoCronometro(-3)).toBe('0:00')
  })
})

describe('prescripción por tiempo', () => {
  it('normaliza en segundos y redondea a 5', () => {
    expect(normalizarPrescripcion({ ...plan, repsMin: 22, repsMax: 300 })).toMatchObject({ repsMin: 20, repsMax: 180 })
    expect(normalizarPrescripcion({ ...plan, repsMin: 3, repsMax: 2 })).toMatchObject({ repsMin: 10, repsMax: 10 })
  })
})

describe('progresión por tiempo', () => {
  it('nuevo: empieza en el mínimo de segundos', () => {
    expect(sugerencia(plan, plancha, [])).toMatchObject({ tipo: 'nuevo', kg: 0, reps: [20, 20, 20] })
    expect(sugerencia(plan, plancha, []).texto).toContain('20 s')
  })
  it('dentro del rango: +5 s por serie sin pasar del tope', () => {
    const r = sugerencia(plan, plancha, [sesion([s(30), s(42), s(25)])])
    expect(r).toMatchObject({ tipo: 'mantener', reps: [35, 45, 30] })
    expect(r.texto).toContain('5 s')
  })
  it('tope en todas las series: sube 5 s', () => {
    expect(sugerencia(plan, plancha, [sesion([s(45), s(45), s(50)])])).toMatchObject({ tipo: 'subir', kg: 0, reps: [50, 50, 55] })
  })
  it('con lastre al tope: sube kg y vuelve al mínimo de segundos', () => {
    const r = sugerencia(plan, plancha, [sesion([s(45, 5), s(45, 5), s(45, 5)])])
    expect(r).toMatchObject({ tipo: 'subir', kg: 6, reps: [20, 20, 20] })
    expect(r.texto).toContain('20 s')
  })
})

describe('fuerza y récords por tiempo', () => {
  it('no cuenta para 1RM ni volumen, aunque lleve lastre', () => {
    expect(mejor1RM([s(10, 10)])).toBeNull()
    expect(volumen([s(30, 10), { ...s(8, 50), ejercicioId: 'press_banca' }])).toBe(400)
  })
  it('el récord es el mayor tiempo y se muestra en segundos', () => {
    const previa = sesion([s(30)], 1)
    const hoy = sesion([s(40), s(35)], 2)
    expect(recordsNuevos(hoy, [previa, hoy])).toEqual([{ ejercicioId: 'plancha', tipo: 'serie', texto: '40 s' }])
    expect(textoSerie({ kg: 5, reps: 30 }, true)).toBe('5 kg × 30 s')
  })
})

describe('editar una serie por tiempo', () => {
  it('acepta hasta 600 s (las reps siguen hasta 100)', async () => {
    const { normalizarSerie } = await import('../edicionSesion')
    expect(normalizarSerie(s(150)).reps).toBe(150)
    expect(normalizarSerie(s(900)).reps).toBe(600)
    expect(normalizarSerie({ ...s(150), ejercicioId: 'curl_barra' }).reps).toBe(100)
  })
})
