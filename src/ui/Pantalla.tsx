import type { ReactNode } from 'react'

/** Contenedor común de cada pantalla: título y espacio para la barra inferior. */
export function Pantalla({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="mb-4 text-2xl font-bold">{titulo}</h1>
      {children}
    </main>
  )
}
