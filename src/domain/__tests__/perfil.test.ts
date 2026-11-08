import { describe, expect, it } from 'vitest'
import { avisoDias, normalizarPesoCorporal, perfilPorDefecto, validarPerfil } from '../perfil'

describe('validarPerfil', () => {
  it('el perfil por defecto es válido', () => {
    expect(validarPerfil(perfilPorDefecto())).toEqual({})
  })

  it('rechaza días, minutos y equipo fuera de rango', () => {
    const p = { ...perfilPorDefecto(), diasPorSemana: 7, minutosPorSesion: 10, equipo: [] }
    expect(Object.keys(validarPerfil(p)).sort()).toEqual(['diasPorSemana', 'equipo', 'minutosPorSesion'])
  })

  it('rechaza días no enteros', () => {
    expect(validarPerfil({ ...perfilPorDefecto(), diasPorSemana: 3.5 }).diasPorSemana).toBeDefined()
  })
})

describe('normalizarPesoCorporal', () => {
  it('redondea a 1 decimal', () => {
    expect(normalizarPesoCorporal(72.46)).toBe(72.5)
  })

  it('rechaza valores imposibles', () => {
    expect(normalizarPesoCorporal(5)).toBeNull()
    expect(normalizarPesoCorporal(Number.NaN)).toBeNull()
  })
})

describe('avisoDias', () => {
  it('avisa solo con 6 días', () => {
    expect(avisoDias(5)).toBeNull()
    expect(avisoDias(6)).not.toBeNull()
  })
})
