import { describe, expect, it } from 'vitest'
import { alternativasDe, filtrarEjercicios, fotosDe, normalizar, urlVideo, validarBiblioteca } from '../biblioteca'
import { EQUIPOS, GRUPOS_MUSCULARES, type Exercise } from '../tipos'
import datos from '../../data/exercises.json'

const biblioteca = datos as Exercise[]

function ej(parcial: Partial<Exercise> & Pick<Exercise, 'id'>): Exercise {
  return {
    nombre: parcial.id,
    grupoPrincipal: 'pecho',
    gruposSecundarios: [],
    equipo: 'gym',
    tipo: 'accesorio',
    instrucciones: ['a', 'b', 'c'],
    erroresComunes: ['x'],
    alternativas: [],
    ...parcial,
  }
}

describe('normalizar', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizar('  Glúteo Búlgara ')).toBe('gluteo bulgara')
  })
})

describe('filtrarEjercicios', () => {
  const lista = [
    ej({ id: 'a', nombre: 'Sentadilla búlgara', grupoPrincipal: 'cuadriceps', gruposSecundarios: ['gluteos'], equipo: 'mancuernas' }),
    ej({ id: 'b', nombre: 'Hip thrust', grupoPrincipal: 'gluteos', equipo: 'gym' }),
    ej({ id: 'c', nombre: 'Puente', grupoPrincipal: 'gluteos', equipo: 'peso_corporal' }),
  ]

  it('busca por nombre sin importar tildes', () => {
    expect(filtrarEjercicios(lista, { texto: 'bulgara' }).map((e) => e.id)).toEqual(['a'])
  })

  it('filtra por grupo e incluye secundarios, con principales primero', () => {
    expect(filtrarEjercicios(lista, { grupo: 'gluteos' }).map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('filtra por equipo y siempre incluye peso corporal', () => {
    expect(filtrarEjercicios(lista, { equipos: ['mancuernas'] }).map((e) => e.id)).toEqual(['c', 'a'])
  })
})

describe('alternativasDe', () => {
  it('ignora ids inexistentes', () => {
    const lista = [ej({ id: 'a', alternativas: ['b', 'zz'] }), ej({ id: 'b' })]
    expect(alternativasDe(lista[0], lista).map((e) => e.id)).toEqual(['b'])
  })
})

describe('fotosDe y urlVideo', () => {
  it('devuelve inicio y final solo si tiene fotos', () => {
    expect(fotosDe(ej({ id: 'a', fotos: true }))).toEqual(['ejercicios/a-0.webp', 'ejercicios/a-1.webp'])
    expect(fotosDe(ej({ id: 'a' }))).toEqual([])
  })

  it('arma la búsqueda de YouTube con el nombre codificado', () => {
    expect(urlVideo(ej({ id: 'a', nombre: 'Curl martillo' }))).toBe(
      'https://www.youtube.com/results?search_query=Curl%20martillo%20t%C3%A9cnica%20correcta',
    )
  })
})

describe('validarBiblioteca', () => {
  it('detecta ids repetidos y alternativas inexistentes', () => {
    const problemas = validarBiblioteca([ej({ id: 'a', alternativas: ['zz'] }), ej({ id: 'a' })])
    expect(problemas).toContain('id repetido: a')
    expect(problemas).toContain('a: alternativa inexistente zz')
  })
})

describe('exercises.json', () => {
  it('es una biblioteca válida', () => {
    expect(validarBiblioteca(biblioteca)).toEqual([])
  })

  it('tiene al menos 40 ejercicios con valores permitidos', () => {
    expect(biblioteca.length).toBeGreaterThanOrEqual(40)
    for (const e of biblioteca) {
      expect(EQUIPOS).toContain(e.equipo)
      expect(GRUPOS_MUSCULARES).toContain(e.grupoPrincipal)
      for (const g of e.gruposSecundarios) expect(GRUPOS_MUSCULARES).toContain(g)
    }
  })

  it('las fotos declaradas existen en public/ejercicios', () => {
    // Lista (sin cargar) los archivos de public/ejercicios
    const archivos = Object.keys(import.meta.glob('../../../public/ejercicios/*.webp'))
    const existentes = new Set(archivos.map((a) => a.replace('../../../public/', '')))
    for (const e of biblioteca) for (const ruta of fotosDe(e)) expect(existentes, ruta).toContain(ruta)
  })

  it('cada grupo muscular tiene al menos un ejercicio sin máquinas', () => {
    for (const g of GRUPOS_MUSCULARES) {
      const sinGym = filtrarEjercicios(biblioteca, { grupo: g, equipos: ['mancuernas'] })
      expect(sinGym.length, g).toBeGreaterThan(0)
    }
  })
})
