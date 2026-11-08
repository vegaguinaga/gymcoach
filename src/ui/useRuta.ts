import { useEffect, useState } from 'react'

// Rutas de la app. Usamos el "hash" de la URL (#/perfil) en vez de una librería:
// pesa 0 KB, funciona offline y en cualquier hosting sin configurar nada.
// Formato: #/<ruta>/<param opcional>, ej. #/ejercicios/sentadilla
export const RUTAS = ['rutina', 'entrenar', 'progreso', 'perfil', 'ejercicios'] as const
export type Ruta = (typeof RUTAS)[number]

export interface UbicacionActual {
  ruta: Ruta
  /** Segundo segmento del hash, ej. el id de un ejercicio */
  param?: string
}

export function leerUbicacion(hash: string): UbicacionActual {
  const [primero = '', segundo] = hash.replace(/^#\/?/, '').split('/')
  const ruta = (RUTAS as readonly string[]).includes(primero) ? (primero as Ruta) : 'rutina'
  return { ruta, param: segundo ? decodeURIComponent(segundo) : undefined }
}

/** Devuelve la ruta actual y se actualiza cuando cambia el hash (incluido el botón Atrás). */
export function useRuta(): UbicacionActual {
  const [ubicacion, setUbicacion] = useState(() => leerUbicacion(window.location.hash))

  useEffect(() => {
    const alCambiar = () => {
      setUbicacion(leerUbicacion(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  return ubicacion
}
