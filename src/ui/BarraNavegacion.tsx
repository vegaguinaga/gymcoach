import type { Ruta } from './useRuta'

const ITEMS: { ruta: Ruta; texto: string; icono: string }[] = [
  { ruta: 'rutina', texto: 'Rutina', icono: '📋' },
  { ruta: 'entrenar', texto: 'Entrenar', icono: '🏋️' },
  { ruta: 'progreso', texto: 'Progreso', icono: '📈' },
  { ruta: 'perfil', texto: 'Perfil', icono: '👤' },
]

/** Barra inferior fija: cómoda para usar con el pulgar en el celular. */
export function BarraNavegacion({ actual }: { actual: Ruta }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 border-t border-neutral-800 bg-neutral-900 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map((item) => {
          const activo = item.ruta === actual
          return (
            <li key={item.ruta}>
              <a
                href={`#/${item.ruta}`}
                aria-current={activo ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                  activo ? 'text-lime-400' : 'text-neutral-400'
                }`}
              >
                <span aria-hidden="true" className="text-xl">
                  {item.icono}
                </span>
                {item.texto}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
