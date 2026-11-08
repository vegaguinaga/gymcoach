import { describe, expect, it } from 'vitest'
import { claveDia, inicioSemana, mesCalendario, rachaSemanas, sesionesPorDia } from '../calendario'
import type { WorkoutSession } from '../tipos'

// Fechas en hora local (sin "Z") para que el test no dependa de la zona horaria
const sesion = (fecha: string): WorkoutSession => ({
  fecha: new Date(fecha).toISOString(), estado: 'terminada', diaNombre: 'A', ejercicios: [], series: [],
})

describe('claveDia e inicioSemana', () => {
  it('formatea en hora local', () => {
    expect(claveDia(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
  it('la semana empieza el lunes (también si es domingo)', () => {
    expect(claveDia(inicioSemana(new Date(2026, 10, 8, 20)))).toBe('2026-11-02') // domingo
    expect(claveDia(inicioSemana(new Date(2026, 10, 2, 9)))).toBe('2026-11-02') // lunes
    expect(claveDia(inicioSemana(new Date(2026, 0, 1)))).toBe('2025-12-29') // cruza el año
  })
})

describe('mesCalendario', () => {
  it('noviembre 2026 empieza en domingo: 6 huecos y 6 semanas', () => {
    const semanas = mesCalendario(2026, 10, [], new Date(2026, 10, 8))
    expect(semanas).toHaveLength(6)
    expect(semanas[0].slice(0, 6)).toEqual([null, null, null, null, null, null])
    expect(semanas[0][6]?.dia).toBe(1)
    expect(semanas.flat().filter(Boolean)).toHaveLength(30)
    expect(semanas.every((s) => s.length === 7)).toBe(true)
  })
  it('marca hoy y pone las sesiones en su día', () => {
    const s = [sesion('2026-11-03T18:00'), sesion('2026-11-03T07:00'), sesion('2026-10-31T10:00')]
    const dias = mesCalendario(2026, 10, s, new Date(2026, 10, 8)).flat()
    const tres = dias.find((d) => d?.dia === 3)
    expect(tres?.sesiones.map((x) => new Date(x.fecha).getHours())).toEqual([7, 18])
    expect(dias.find((d) => d?.hoy)?.dia).toBe(8)
    expect(dias.reduce((n, d) => n + (d?.sesiones.length ?? 0), 0)).toBe(2)
  })
  it('febrero de 2027 (empieza en lunes) entra justo en 4 semanas', () => {
    expect(mesCalendario(2027, 1, [])).toHaveLength(4)
  })
})

describe('sesionesPorDia', () => {
  it('agrupa por día local y ordena', () => {
    const m = sesionesPorDia([sesion('2026-11-03T18:00'), sesion('2026-11-04T08:00'), sesion('2026-11-03T07:00')])
    expect([...m.keys()]).toEqual(['2026-11-03', '2026-11-04'])
    expect(m.get('2026-11-03')).toHaveLength(2)
  })
})

describe('rachaSemanas', () => {
  const ahora = new Date(2026, 10, 8, 12) // domingo 8 nov; semana del 2 nov
  it('sin sesiones es 0', () => {
    expect(rachaSemanas([], ahora)).toBe(0)
  })
  it('cuenta semanas seguidas incluyendo la actual', () => {
    const s = [sesion('2026-11-03T10:00'), sesion('2026-10-28T10:00'), sesion('2026-10-20T10:00'), sesion('2026-10-21T10:00')]
    expect(rachaSemanas(s, ahora)).toBe(3)
  })
  it('la semana en curso sin sesión no rompe la racha', () => {
    const s = [sesion('2026-10-28T10:00'), sesion('2026-10-20T10:00')]
    expect(rachaSemanas(s, ahora)).toBe(2)
  })
  it('una semana vacía corta la racha', () => {
    const s = [sesion('2026-11-03T10:00'), sesion('2026-10-20T10:00')]
    expect(rachaSemanas(s, ahora)).toBe(1)
  })
  it('se cuenta igual si la semana cruza de mes o de año', () => {
    const s = [sesion('2026-01-02T10:00'), sesion('2025-12-26T10:00')]
    expect(rachaSemanas(s, new Date(2026, 0, 3))).toBe(2)
  })
})
