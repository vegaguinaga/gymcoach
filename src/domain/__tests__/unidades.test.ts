import { describe, expect, it } from 'vitest'
import { redondearKg } from '../unidades'

describe('redondearKg', () => {
  it('redondea a 1 decimal', () => {
    expect(redondearKg(62.46)).toBe(62.5)
    expect(redondearKg(62.44)).toBe(62.4)
  })

  it('deja igual los enteros', () => {
    expect(redondearKg(80)).toBe(80)
  })
})
