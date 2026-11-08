import { useEffect, useState } from 'react'

// Rutas de la app. Usamos el "hash" de la URL (#/perfil) en vez de una librería:
// pesa 0 KB, funciona offline y en cualquier hosting sin configurar nada.
export const RUTAS = ['rutina', 'entrenar', 'progreso', 'perfil'] as const
export type Ruta = (typeof RUTAS)[number]

function leerRuta(): Ruta {
  const valor = window.location.hash.replace(/^#\/?/, '')
  return (RUTAS as readonly string[]).includes(valor) ? (valor as Ruta) : 'rutina'
}

/** Devuelve la ruta actual y se actualiza cuando cambia el hash (incluido el botón Atrás). */
export function useRuta(): Ruta {
  const [ruta, setRuta] = useState<Ruta>(leerRuta)

  useEffect(() => {
    const alCambiar = () => setRuta(leerRuta())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  return ruta
}
