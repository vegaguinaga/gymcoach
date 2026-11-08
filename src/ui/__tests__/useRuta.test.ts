import { describe, expect, it } from 'vitest'
import { leerUbicacion } from '../useRuta'

describe('leerUbicacion', () => {
  it('lee ruta y parámetro', () => {
    expect(leerUbicacion('#/ejercicios/sentadilla')).toEqual({ ruta: 'ejercicios', param: 'sentadilla' })
  })

  it('sin parámetro', () => {
    expect(leerUbicacion('#/perfil')).toEqual({ ruta: 'perfil', param: undefined })
  })

  it('ruta desconocida o vacía va a rutina', () => {
    expect(leerUbicacion('#/nada').ruta).toBe('rutina')
    expect(leerUbicacion('').ruta).toBe('rutina')
  })
})
