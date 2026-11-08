import { describe, expect, it } from 'vitest'
import { combinarMedidas, normalizarMedidas, resumenMedidas, serieMedida, textoCambio } from '../medidas'
import type { BodyMeasurement } from '../tipos'

const registros: BodyMeasurement[] = [
  { id: 2, fecha: '2026-02-01T10:00:00Z', cm: { cintura: 88, brazo: 33 } },
  { id: 1, fecha: '2026-01-01T10:00:00Z', cm: { cintura: 90 } },
  { id: 3, fecha: '2026-03-01T10:00:00Z', cm: { cintura: 86.5 } },
]

describe('normalizarMedidas', () => {
  it('ignora los campos vacíos y redondea a 1 decimal', () => {
    expect(normalizarMedidas({ cintura: 85.26, brazo: undefined, pecho: Number.NaN })).toEqual({ ok: true, cm: { cintura: 85.3 } })
  })
  it('pide al menos una medida', () => {
    expect(normalizarMedidas({})).toEqual({ ok: false, error: 'Escribe al menos una medida.' })
  })
  it('rechaza valores fuera de 10–250 cm', () => {
    expect(normalizarMedidas({ cintura: 85, brazo: 5 })).toEqual({ ok: false, error: 'Brazo: escribe un valor entre 10 y 250 cm.' })
    expect(normalizarMedidas({ muslo: 300 }).ok).toBe(false)
    expect(normalizarMedidas({ cadera: Infinity }).ok).toBe(false)
  })
})

describe('serieMedida y resumenMedidas', () => {
  it('serie ordenada por fecha y solo con los registros que tienen esa medida', () => {
    expect(serieMedida(registros, 'cintura').map((p) => p.valor)).toEqual([90, 88, 86.5])
    expect(serieMedida(registros, 'brazo')).toEqual([{ fecha: '2026-02-01T10:00:00Z', valor: 33 }])
    expect(serieMedida(registros, 'pecho')).toEqual([])
  })
  it('última medida de cada zona con el cambio respecto a la anterior y a la primera', () => {
    expect(resumenMedidas(registros)).toEqual([
      { medida: 'cintura', actual: 86.5, fecha: '2026-03-01T10:00:00Z', cambio: -1.5, cambioTotal: -3.5 },
      { medida: 'brazo', actual: 33, fecha: '2026-02-01T10:00:00Z', cambio: null, cambioTotal: null },
    ])
    expect(resumenMedidas([])).toEqual([])
  })
})

describe('combinarMedidas y textoCambio', () => {
  it('las medidas nuevas del día reemplazan a las anteriores y conservan las demás', () => {
    expect(combinarMedidas({ cintura: 90, brazo: 33 }, { cintura: 89 })).toEqual({ cintura: 89, brazo: 33 })
    expect(combinarMedidas(undefined, { pecho: 100 })).toEqual({ pecho: 100 })
  })
  it('formatea el cambio con signo', () => {
    expect(textoCambio(1.5)).toBe('+1,5 cm')
    expect(textoCambio(-2)).toBe('−2 cm')
    expect(textoCambio(0)).toBe('=')
  })
})
