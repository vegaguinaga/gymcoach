import type { ReactNode } from 'react'

/** Contenedor común de cada pantalla: título y espacio para la barra inferior. */
export function Pantalla({
  titulo,
  volver,
  children,
}: {
  titulo: string
  /** Hash al que vuelve el botón "atrás" (ej. '#/perfil'). Sin él no se muestra. */
  volver?: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto max-w-md px-4 pt-6 pb-24">
      <div className="mb-4 flex items-center gap-2">
        {volver && (
          <a
            href={volver}
            aria-label="Volver"
            className="-ml-2 flex size-11 items-center justify-center rounded-full text-2xl text-neutral-300 active:bg-neutral-800"
          >
            ‹
          </a>
        )}
        <h1 className="text-2xl font-bold">{titulo}</h1>
      </div>
      {children}
    </main>
  )
}
