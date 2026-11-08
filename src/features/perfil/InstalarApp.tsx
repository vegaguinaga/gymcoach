import { useState } from 'react'
import { detectarPlataforma, instalar, useInstalacion } from '../../ui/instalacion'

/** Tarjeta para instalar la app en la pantalla de inicio. No se muestra si ya está instalada. */
export function InstalarApp() {
  const { instalada, puedeInstalar } = useInstalacion()
  const [plataforma] = useState(() => detectarPlataforma(navigator.userAgent, navigator.maxTouchPoints))
  if (instalada || (plataforma === 'otra' && !puedeInstalar)) return null

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-neutral-900 p-4" aria-labelledby="instalar-app">
      <h2 id="instalar-app" className="font-semibold">
        📲 Instala la app
      </h2>
      <p className="text-sm text-neutral-400">Ábrela desde tu pantalla de inicio, a pantalla completa y sin internet.</p>
      {puedeInstalar ? (
        <button
          type="button"
          onClick={() => void instalar()}
          className="min-h-12 rounded-xl bg-lime-400 font-semibold text-neutral-950"
        >
          Instalar GymCoach
        </button>
      ) : plataforma === 'ios' ? (
        <ol className="list-inside list-decimal text-sm text-neutral-300">
          <li>Abre esta página en Safari.</li>
          <li>
            Toca <strong>Compartir</strong> (el cuadrado con la flecha ⬆️).
          </li>
          <li>
            Elige <strong>Agregar a inicio</strong> y luego <strong>Agregar</strong>.
          </li>
        </ol>
      ) : (
        <ol className="list-inside list-decimal text-sm text-neutral-300">
          <li>Abre esta página en Chrome.</li>
          <li>
            Toca el menú <strong>⋮</strong> (arriba a la derecha).
          </li>
          <li>
            Elige <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.
          </li>
        </ol>
      )}
    </section>
  )
}
