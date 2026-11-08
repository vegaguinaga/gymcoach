import { useRegisterSW } from 'virtual:pwa-register/react'

/** Aviso cuando hay una versión nueva de la app (no recarga sola para no cortar una sesión). */
export function AvisoActualizacion() {
  const {
    needRefresh: [hayNueva, setHayNueva],
    updateServiceWorker,
  } = useRegisterSW()

  if (!hayNueva) return null
  return (
    <div
      role="status"
      className="fixed inset-x-3 top-3 z-50 flex items-center gap-2 rounded-xl border border-lime-400/40 bg-neutral-900 p-3 shadow-lg"
    >
      <p className="flex-1 text-sm">Hay una versión nueva de GymCoach.</p>
      <button
        type="button"
        onClick={() => setHayNueva(false)}
        className="min-h-11 rounded-lg px-3 text-sm text-neutral-400"
      >
        Luego
      </button>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="min-h-11 rounded-lg bg-lime-400 px-3 text-sm font-semibold text-neutral-950"
      >
        Actualizar
      </button>
    </div>
  )
}
