import { describe, expect, it } from 'vitest'
import {
  ajustarATiempo,
  cardioSugerido,
  diasEfectivos,
  generarRutina,
  minutosEstimados,
  plantillasPara,
  seriesDisponibles,
} from '../generador'
import { perfilPorDefecto } from '../perfil'
import type { EjercicioPlanificado, Exercise, Profile } from '../tipos'
import datos from '../../data/exercises.json'

const biblioteca = datos as Exercise[]
const porId = new Map(biblioteca.map((e) => [e.id, e]))

function perfil(cambios: Partial<Profile> = {}): Profile {
  return { ...perfilPorDefecto(new Date('2026-01-01')), ...cambios }
}

/** Series semanales donde el grupo es el principal. */
function seriesPrincipales(rutina: ReturnType<typeof generarRutina>, grupo: string): number {
  return rutina.dias
    .flatMap((d) => d.ejercicios)
    .filter((e) => porId.get(e.ejercicioId)?.grupoPrincipal === grupo)
    .reduce((s, e) => s + e.series, 0)
}

describe('split según días', () => {
  it('2–3 días: Full Body A/B alternadas', () => {
    expect(plantillasPara(2).semana.map((p) => p.nombre)).toEqual(['Full Body A', 'Full Body B'])
    expect(plantillasPara(3).semana.map((p) => p.nombre)).toEqual(['Full Body A', 'Full Body B', 'Full Body A'])
  })
  it('4 días: Torso / Pierna ×2', () => {
    expect(plantillasPara(4).semana.map((p) => p.nombre)).toEqual(['Torso A', 'Pierna A', 'Torso B', 'Pierna B'])
  })
  it('5 días: Empuje / Tirón / Pierna; 6 días se limita a 5', () => {
    expect(plantillasPara(5).nombre).toBe('Empuje / Tirón / Pierna')
    expect(diasEfectivos(6)).toBe(5)
    expect(generarRutina(perfil({ diasPorSemana: 6 }), biblioteca).dias).toHaveLength(5)
  })
})

describe('generarRutina', () => {
  it('genera tantos días como pide el perfil y solo con ids de la biblioteca', () => {
    for (const dias of [2, 3, 4, 5]) {
      const r = generarRutina(perfil({ diasPorSemana: dias }), biblioteca)
      expect(r.dias).toHaveLength(dias)
      for (const d of r.dias) {
        expect(d.ejercicios.length).toBeGreaterThanOrEqual(2)
        for (const e of d.ejercicios) expect(porId.has(e.ejercicioId)).toBe(true)
      }
    }
  })

  it('no repite un ejercicio dentro del mismo día', () => {
    for (const dias of [2, 3, 4, 5]) {
      for (const d of generarRutina(perfil({ diasPorSemana: dias }), biblioteca).dias) {
        const ids = d.ejercicios.map((e) => e.ejercicioId)
        expect(new Set(ids).size).toBe(ids.length)
      }
    }
  })

  it('respeta el equipo disponible', () => {
    const casos: Profile['equipo'][] = [['peso_corporal'], ['mancuernas', 'peso_corporal'], ['gym']]
    for (const equipo of casos) {
      for (const dias of [3, 4, 5]) {
        const r = generarRutina(perfil({ diasPorSemana: dias, equipo }), biblioteca)
        for (const e of r.dias.flatMap((d) => d.ejercicios))
          expect(equipo).toContain(porId.get(e.ejercicioId)?.equipo)
      }
    }
  })

  it('cada sesión cabe en los minutos del perfil', () => {
    for (const minutosPorSesion of [30, 45, 60, 90]) {
      for (const objetivo of ['musculo', 'perder_grasa'] as const) {
        const r = generarRutina(perfil({ minutosPorSesion, objetivo, diasPorSemana: 4 }), biblioteca)
        for (const d of r.dias) expect(minutosEstimados(d)).toBeLessThanOrEqual(minutosPorSesion)
      }
    }
  })

  it('prescribe compuestos 3×6–10 y accesorios 10–15', () => {
    const r = generarRutina(perfil(), biblioteca)
    for (const e of r.dias.flatMap((d) => d.ejercicios)) {
      if (porId.get(e.ejercicioId)?.tipo === 'compuesto') {
        expect([e.repsMin, e.repsMax, e.rpe]).toEqual([6, 10, 7])
        expect(e.descansoSeg).toBeGreaterThanOrEqual(120)
      } else {
        expect([e.repsMin, e.repsMax, e.rpe]).toEqual([10, 15, 8])
        expect(e.series).toBeLessThanOrEqual(3)
      }
    }
  })

  it('volumen semanal de 9–16 series en pecho, espalda y cuádriceps (3–5 días, 60 min)', () => {
    for (const dias of [3, 4, 5]) {
      const r = generarRutina(perfil({ diasPorSemana: dias }), biblioteca)
      for (const grupo of ['pecho', 'espalda', 'cuadriceps']) {
        const series = seriesPrincipales(r, grupo)
        expect(series, `${grupo} con ${dias} días`).toBeGreaterThanOrEqual(9)
        expect(series, `${grupo} con ${dias} días`).toBeLessThanOrEqual(16)
      }
    }
  })

  it('en pérdida de grasa sugiere cardio al final; en otros objetivos no', () => {
    expect(generarRutina(perfil({ objetivo: 'perder_grasa' }), biblioteca).dias[0].cardioMin).toBe(15)
    expect(generarRutina(perfil({ objetivo: 'musculo' }), biblioteca).dias[0].cardioMin).toBeUndefined()
  })

  it('los días repetidos son copias independientes', () => {
    const r = generarRutina(perfil({ diasPorSemana: 3 }), biblioteca)
    expect(r.dias[0]).toEqual(r.dias[2])
    r.dias[0].ejercicios[0].series = 99
    expect(r.dias[2].ejercicios[0].series).not.toBe(99)
  })
})

describe('tiempo', () => {
  it('cardioSugerido: 10–20 min solo en pérdida de grasa y si hay tiempo', () => {
    expect(cardioSugerido({ objetivo: 'perder_grasa', minutosPorSesion: 30 })).toBe(0)
    expect(cardioSugerido({ objetivo: 'perder_grasa', minutosPorSesion: 45 })).toBe(10)
    expect(cardioSugerido({ objetivo: 'perder_grasa', minutosPorSesion: 90 })).toBe(20)
    expect(cardioSugerido({ objetivo: 'fuerza', minutosPorSesion: 90 })).toBe(0)
  })

  it('seriesDisponibles descuenta calentamiento y cardio (2.5 min por serie)', () => {
    expect(seriesDisponibles(60, 0)).toBe(22)
    expect(seriesDisponibles(60, 15)).toBe(16)
    expect(seriesDisponibles(3, 0)).toBe(0)
  })

  it('ajustarATiempo recorta primero accesorios y deja al menos 2 ejercicios', () => {
    const p = (id: string, series = 3): EjercicioPlanificado => ({
      ejercicioId: id, series, repsMin: 6, repsMax: 10, rpe: 7, descansoSeg: 150,
    })
    const comp = (id: string) => id.startsWith('c')
    const lista = [p('c1'), p('c2'), p('a1'), p('a2')]

    expect(ajustarATiempo(lista, comp, 12)).toEqual(lista)
    expect(ajustarATiempo(lista, comp, 10).map((e) => e.series)).toEqual([3, 3, 2, 2])
    expect(ajustarATiempo(lista, comp, 8).map((e) => e.ejercicioId)).toEqual(['c1', 'c2', 'a1'])
    expect(ajustarATiempo(lista, comp, 4)).toEqual([p('c1', 2), p('c2', 2)])
    expect(ajustarATiempo(lista, comp, 0)).toHaveLength(2)
    expect(lista[0].series).toBe(3) // no muta la entrada
  })
})
