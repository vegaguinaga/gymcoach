import { describe, expect, it } from 'vitest'
import { generarRutina } from '../generador'
import type { Exercise, Profile, Routine, WorkoutSession } from '../tipos'
import { rangoSemanal, seriesHechasSemana, seriesPorGrupo, volumenSemanal } from '../volumen'
import biblioteca from '../../data/exercises.json'

const ejercicios = biblioteca as Exercise[]
const ej = (id: string, principal: Exercise['grupoPrincipal'], secundarios: Exercise['gruposSecundarios'] = []): Exercise => ({
  id, nombre: id, grupoPrincipal: principal, gruposSecundarios: secundarios, equipo: 'gym', tipo: 'compuesto',
  instrucciones: [], erroresComunes: [], alternativas: [],
})
const lib = [ej('press', 'pecho', ['triceps', 'hombros']), ej('remo', 'espalda', ['biceps'])]
const plan = (ejercicioId: string, series: number) => ({ ejercicioId, series, repsMin: 6, repsMax: 10, rpe: 7, descansoSeg: 150 })

describe('seriesPorGrupo', () => {
  it('el principal cuenta 1 y cada secundario 0.5; los grupos sin series quedan en 0', () => {
    const rutina: Routine = { nombre: 'R', creada: '', dias: [{ nombre: 'A', ejercicios: [plan('press', 3), plan('remo', 3)] }, { nombre: 'B', ejercicios: [plan('press', 2)] }] }
    const c = seriesPorGrupo(rutina, lib)
    expect(c.pecho).toBe(5)
    expect(c.triceps).toBe(2.5)
    expect(c.espalda).toBe(3)
    expect(c.biceps).toBe(1.5)
    expect(c.cuadriceps).toBe(0)
  })
  it('ignora ejercicios que no están en la biblioteca', () => {
    const rutina: Routine = { nombre: 'R', creada: '', dias: [{ nombre: 'A', ejercicios: [plan('borrado', 3)] }] }
    expect(Object.values(seriesPorGrupo(rutina, lib)).every((n) => n === 0)).toBe(true)
  })
  it('una rutina generada de 4 días deja pecho, espalda y cuádriceps entre 9 y 16', () => {
    const perfil: Profile = { id: 1, nombre: '', objetivo: 'musculo', diasPorSemana: 4, minutosPorSesion: 60, equipo: ['gym', 'mancuernas', 'peso_corporal'], actualizado: '' }
    const c = seriesPorGrupo(generarRutina(perfil, ejercicios), ejercicios)
    for (const g of ['pecho', 'espalda', 'cuadriceps'] as const) {
      expect(c[g]).toBeGreaterThanOrEqual(9)
      expect(c[g]).toBeLessThanOrEqual(16)
    }
  })
})

describe('seriesHechasSemana', () => {
  const sesion = (fecha: Date, estado: WorkoutSession['estado'] = 'terminada'): WorkoutSession => ({
    fecha: fecha.toISOString(), estado, diaNombre: 'A', ejercicios: [],
    series: [
      { ejercicioId: 'press', serie: 1, kg: 40, reps: 8, completada: true },
      { ejercicioId: 'press', serie: 2, kg: 40, reps: 8, completada: false },
      { ejercicioId: 'remo', serie: 1, kg: 40, reps: 8, completada: true },
    ],
  })
  const domingo = new Date(2026, 10, 8, 20)

  it('cuenta solo series completadas de sesiones terminadas desde el lunes', () => {
    const c = seriesHechasSemana([
      sesion(new Date(2026, 10, 2, 9)), // lunes: cuenta
      sesion(new Date(2026, 10, 1, 9)), // domingo anterior: no
      sesion(new Date(2026, 10, 7, 9), 'en_curso'), // en curso: no
    ], lib, domingo)
    expect(c.pecho).toBe(1)
    expect(c.triceps).toBe(0.5)
    expect(c.espalda).toBe(1)
    expect(c.biceps).toBe(0.5)
  })
})

describe('volumenSemanal', () => {
  it('grupos grandes: corto < 10, bien 10–16, alto > 16; pequeños desde 6', () => {
    expect(rangoSemanal('pecho')).toEqual({ min: 10, max: 16 })
    expect(rangoSemanal('biceps')).toEqual({ min: 6, max: 16 })
    const c = { pecho: 9.5, espalda: 10, hombros: 16, biceps: 6, triceps: 5.5, cuadriceps: 16.5, isquios: 0, gluteos: 12, gemelos: 0, core: 8 }
    const estado = Object.fromEntries(volumenSemanal(c).map((v) => [v.grupo, v.estado]))
    expect(estado).toEqual({
      pecho: 'corto', espalda: 'bien', hombros: 'bien', biceps: 'bien', triceps: 'corto',
      cuadriceps: 'alto', isquios: 'corto', gluteos: 'bien', gemelos: 'corto', core: 'bien',
    })
  })
})
