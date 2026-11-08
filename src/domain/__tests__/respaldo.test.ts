import { describe, expect, it } from 'vitest'
import {
  crearRespaldo,
  necesitaCopia,
  nombreArchivo,
  resumenRespaldo,
  textoUltimaCopia,
  validarRespaldo,
  VERSION_RESPALDO,
  type DatosUsuario,
} from '../respaldo'
import type { WorkoutSession } from '../tipos'

const datos: DatosUsuario = {
  perfil: [{ id: 1, nombre: '', objetivo: 'musculo', diasPorSemana: 3, minutosPorSesion: 60, equipo: ['gym'], actualizado: '2026-01-01T00:00:00Z' }],
  pesosCorporales: [{ id: 1, fecha: '2026-01-01T00:00:00Z', kg: 75.5 }],
  rutinas: [{ id: 2, nombre: 'Full Body', creada: '2026-01-01T00:00:00Z', dias: [] }],
  sesiones: [
    {
      id: 3, fecha: '2026-01-02T10:00:00Z', estado: 'terminada', rutinaId: 2, diaNombre: 'A', ejercicios: [],
      series: [{ ejercicioId: 'sentadilla', serie: 1, kg: 60, reps: 8, completada: true }],
    },
  ],
  medidas: [{ id: 4, fecha: '2026-01-03T10:00:00Z', cm: { cintura: 85 } }],
}
const ahora = new Date('2026-11-08T12:00:00Z')
// Simula guardar el archivo y volver a leerlo
const idaYVuelta = (v: unknown): unknown => JSON.parse(JSON.stringify(v))

describe('respaldo', () => {
  it('crea un respaldo con versión y fecha, y su nombre de archivo', () => {
    const r = crearRespaldo(datos, ahora)
    expect(r).toMatchObject({ app: 'gymcoach', version: VERSION_RESPALDO, creado: ahora.toISOString() })
    expect(nombreArchivo(ahora)).toBe('gymcoach-2026-11-08.json')
  })

  it('un respaldo exportado se vuelve a importar sin perder nada', () => {
    const r = crearRespaldo(datos, ahora)
    const v = validarRespaldo(idaYVuelta(r))
    expect(v.ok).toBe(true)
    if (v.ok) expect(v.respaldo).toEqual(r)
  })

  it('acepta un respaldo vacío (app recién instalada)', () => {
    const v = validarRespaldo(idaYVuelta(crearRespaldo({ perfil: [], pesosCorporales: [], rutinas: [], sesiones: [], medidas: [] })))
    expect(v.ok).toBe(true)
  })

  it('rechaza archivos que no son de GymCoach o de una versión más nueva', () => {
    expect(validarRespaldo(null).ok).toBe(false)
    expect(validarRespaldo([]).ok).toBe(false)
    expect(validarRespaldo({ app: 'otra' }).ok).toBe(false)
    const futuro = { ...crearRespaldo(datos), version: VERSION_RESPALDO + 1 }
    const v = validarRespaldo(futuro)
    expect(v.ok === false && v.error).toMatch(/más nueva/)
  })

  it('rechaza secciones faltantes o datos dañados, indicando dónde', () => {
    const { sesiones: _, ...sinSesiones } = crearRespaldo(datos)
    expect(validarRespaldo(sinSesiones)).toEqual({ ok: false, error: 'Falta la sección de sesiones.' })

    const r = idaYVuelta(crearRespaldo(datos)) as Record<string, unknown>
    const daniado = { ...r, pesosCorporales: [{ fecha: '2026-01-01', kg: 'setenta' }] }
    expect(validarRespaldo(daniado)).toEqual({ ok: false, error: 'Hay un dato dañado en peso corporal (n.º 1).' })

    const serieMala = { ...r, sesiones: [{ ...datos.sesiones[0], series: [{ ejercicioId: 'x', kg: 1 }] }] }
    expect(validarRespaldo(serieMala).ok).toBe(false)
  })

  it('rechaza sesiones con id repetido', () => {
    const r = crearRespaldo({ ...datos, sesiones: [datos.sesiones[0], datos.sesiones[0]] })
    expect(validarRespaldo(idaYVuelta(r)).ok).toBe(false)
  })

  it('resume lo que trae (solo sesiones terminadas)', () => {
    const conEnCurso = { ...datos, sesiones: [...datos.sesiones, { ...datos.sesiones[0], id: 4, estado: 'en_curso' as const }] }
    expect(resumenRespaldo(conEnCurso)).toBe('1 sesión, 1 rutina, 1 registro de peso y 1 registro de medidas')
    expect(resumenRespaldo({ ...datos, rutinas: [], sesiones: [], medidas: [] })).toBe('0 sesiones, 0 rutinas y 1 registro de peso')
  })

  it('acepta copias v1 (sin medidas) y las deja con medidas vacías', () => {
    const { medidas: _, ...sinMedidas } = crearRespaldo(datos)
    const v = validarRespaldo({ ...idaYVuelta(sinMedidas) as object, version: 1 })
    expect(v.ok && v.respaldo.medidas).toEqual([])
    expect(v.ok && v.respaldo.sesiones).toHaveLength(1)
  })

  it('en v2 las medidas son obligatorias y se validan', () => {
    const { medidas: _, ...sinMedidas } = crearRespaldo(datos)
    expect(validarRespaldo(idaYVuelta(sinMedidas))).toEqual({ ok: false, error: 'Falta la sección de medidas.' })
    const mala = { ...crearRespaldo(datos), medidas: [{ fecha: '2026-01-01', cm: { oreja: 5 } }] }
    expect(validarRespaldo(idaYVuelta(mala))).toEqual({ ok: false, error: 'Hay un dato dañado en medidas (n.º 1).' })
  })
})

describe('recordatorio de copia', () => {
  const ses = (fecha: string, estado: WorkoutSession['estado'] = 'terminada'): WorkoutSession => ({
    fecha, fin: fecha, estado, diaNombre: 'A', ejercicios: [], series: [],
  })
  const ahora = new Date('2026-03-20T12:00:00Z')

  it('sin ninguna copia avisa desde 3 sesiones terminadas', () => {
    const dos = [ses('2026-03-01T10:00:00Z'), ses('2026-03-02T10:00:00Z'), ses('2026-03-03T10:00:00Z', 'en_curso')]
    expect(necesitaCopia(undefined, dos, ahora)).toBe(false)
    expect(necesitaCopia(undefined, [...dos, ses('2026-03-04T10:00:00Z')], ahora)).toBe(true)
  })
  it('con copia: avisa a los 14 días solo si hay sesiones después de ella', () => {
    const copia = '2026-03-05T12:00:00Z' // hace 15 días
    expect(necesitaCopia(copia, [ses('2026-03-01T10:00:00Z')], ahora)).toBe(false)
    expect(necesitaCopia(copia, [ses('2026-03-10T10:00:00Z')], ahora)).toBe(true)
    expect(necesitaCopia('2026-03-10T12:00:00Z', [ses('2026-03-15T10:00:00Z')], ahora)).toBe(false) // hace 10 días
  })
  it('texto de la última copia', () => {
    expect(textoUltimaCopia(undefined, ahora)).toBe('nunca')
    expect(textoUltimaCopia('2026-03-20T08:00:00Z', ahora)).toBe('hoy')
    expect(textoUltimaCopia('2026-03-19T12:00:00Z', ahora)).toBe('ayer')
    expect(textoUltimaCopia('2026-03-05T12:00:00Z', ahora)).toBe('hace 15 días')
  })
})
