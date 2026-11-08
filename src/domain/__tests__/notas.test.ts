import { describe, expect, it } from 'vitest'
import { conNotaEjercicio, MAX_NOTA, normalizarNota, ultimaNota } from '../notas'
import type { WorkoutSession } from '../tipos'

const sesion = (fecha: string, notasEjercicio?: Record<string, string>, estado: WorkoutSession['estado'] = 'terminada'): WorkoutSession => ({
  fecha, estado, diaNombre: 'A', ejercicios: [], series: [], notasEjercicio,
})

describe('notas', () => {
  it('normaliza: recorta espacios y largo', () => {
    expect(normalizarNota('  asiento 4 \n')).toBe('asiento 4')
    expect(normalizarNota('x'.repeat(600))).toHaveLength(MAX_NOTA)
  })
  it('conNotaEjercicio cambia, borra las vacías y no muta el original', () => {
    const notas = { press: 'agarre ancho' }
    expect(conNotaEjercicio(notas, 'remo', ' polea 2 ')).toEqual({ press: 'agarre ancho', remo: 'polea 2' })
    expect(conNotaEjercicio(notas, 'press', '   ')).toBeUndefined()
    expect(conNotaEjercicio(undefined, 'press', 'ok')).toEqual({ press: 'ok' })
    expect(notas).toEqual({ press: 'agarre ancho' })
  })
  it('ultimaNota: la más reciente de sesiones terminadas', () => {
    const historial = [
      sesion('2026-01-01T10:00:00Z', { press: 'vieja' }),
      sesion('2026-01-05T10:00:00Z', { press: 'nueva' }),
      sesion('2026-01-03T10:00:00Z', { remo: 'otra' }),
      sesion('2026-01-09T10:00:00Z', { press: 'en curso' }, 'en_curso'),
    ]
    expect(ultimaNota('press', historial)).toEqual({ texto: 'nueva', fecha: '2026-01-05T10:00:00Z' })
    expect(ultimaNota('sentadilla', historial)).toBeNull()
  })
})
