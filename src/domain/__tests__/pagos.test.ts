import { describe, expect, it } from 'vitest'
import { estadoPago, fechaDePago, leerMonto, textoDias, vencimiento } from '../pagos'

const local = (a: number, m: number, d: number, h = 12) => new Date(a, m - 1, d, h)

describe('vencimiento', () => {
  it('es el mismo día del mes siguiente', () => {
    expect(vencimiento(local(2026, 11, 16))).toEqual(local(2026, 12, 16, 0))
    expect(vencimiento(local(2026, 12, 5))).toEqual(local(2027, 1, 5, 0))
  })
  it('si el día no existe usa el último del mes', () => {
    expect(vencimiento(local(2026, 1, 31))).toEqual(local(2026, 2, 28, 0))
    expect(vencimiento(local(2028, 1, 30))).toEqual(local(2028, 2, 29, 0))
    expect(vencimiento(local(2026, 3, 31))).toEqual(local(2026, 4, 30, 0))
  })
})

describe('estadoPago', () => {
  it('sin pagos es null', () => expect(estadoPago([])).toBeNull())
  it('usa el pago más reciente y cuenta días de calendario', () => {
    const pagos = [{ fecha: local(2026, 9, 1).toISOString() }, { fecha: local(2026, 10, 20).toISOString(), monto: 30 }]
    const e = estadoPago(pagos, local(2026, 11, 16, 23))
    expect(e?.ultimo.monto).toBe(30)
    expect(e?.vence).toEqual(local(2026, 11, 20, 0))
    expect(e?.dias).toBe(4)
    expect(estadoPago(pagos, local(2026, 11, 20, 1))?.dias).toBe(0)
    expect(estadoPago(pagos, local(2026, 11, 25))?.dias).toBe(-5)
  })
})

describe('textos y entradas', () => {
  it('textoDias', () => {
    expect([0, 1, 4, -1, -5].map(textoDias)).toEqual(['Vence hoy', 'Vence mañana', 'Faltan 4 días', 'Venció ayer', 'Venció hace 5 días'])
  })
  it('fechaDePago rechaza fechas inválidas o futuras', () => {
    const hoy = local(2026, 11, 16)
    expect(fechaDePago('2026-11-16', hoy)).toEqual(local(2026, 11, 16))
    expect(fechaDePago('2026-11-17', hoy)).toBeNull()
    expect(fechaDePago('2026-02-30', hoy)).toBeNull()
    expect(fechaDePago('', hoy)).toBeNull()
  })
  it('leerMonto', () => {
    expect(leerMonto('')).toBeNull()
    expect(leerMonto('25,5')).toBe(25.5)
    expect(leerMonto('0')).toBeUndefined()
    expect(leerMonto('abc')).toBeUndefined()
  })
})
