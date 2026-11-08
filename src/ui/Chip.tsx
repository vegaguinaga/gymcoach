import type { ReactNode } from 'react'

/** Botón seleccionable (filtros, opciones múltiples). Táctil ≥ 44px. */
export function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-full border px-4 text-sm ${
        activo
          ? 'border-lime-400 bg-lime-400 font-semibold text-neutral-950'
          : 'border-neutral-700 bg-neutral-900 text-neutral-200'
      }`}
    >
      {children}
    </button>
  )
}
