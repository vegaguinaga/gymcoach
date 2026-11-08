import { useEffect, useRef, useState } from 'react'
import { modificarSesion } from '../../data/repos/sesiones'
import { finDescanso, segundosRestantes } from '../../domain/sesion'
import { avisarFin } from './aviso'

function formato(seg: number): string {
  return `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`
}

/** Temporizador de descanso fijo encima de la barra inferior. */
export function BarraDescanso({ id, hasta }: { id: number; hasta?: string }) {
  const [restantes, setRestantes] = useState(() => segundosRestantes(hasta))
  const anterior = useRef(restantes)

  useEffect(() => {
    const tick = () => {
      const r = segundosRestantes(hasta)
      // Solo avisa si lo vimos llegar a 0 (no al reabrir la app con el descanso ya vencido)
      if (anterior.current > 0 && r === 0) avisarFin()
      if (hasta && r === 0) void modificarSesion(id, () => ({ descansoHasta: undefined }))
      anterior.current = r
      setRestantes(r)
    }
    tick()
    if (!hasta) return
    const t = setInterval(tick, 250)
    return () => clearInterval(t)
  }, [hasta, id])

  if (!hasta || restantes === 0) return null

  const ajustar = (seg: number) =>
    modificarSesion(id, () => ({ descansoHasta: finDescanso(Math.max(1, restantes + seg)) }))

  return (
    <div
      role="timer"
      aria-label="Descanso"
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] border-t border-neutral-800 bg-neutral-950/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2">
        <div className="flex-1">
          <p className="text-xs text-neutral-400">Descanso</p>
          <p className="text-3xl font-bold tabular-nums text-lime-300">{formato(restantes)}</p>
        </div>
        <button type="button" onClick={() => ajustar(-15)} className="min-h-11 min-w-11 rounded-lg bg-neutral-800 px-2 font-semibold">
          −15
        </button>
        <button type="button" onClick={() => ajustar(15)} className="min-h-11 min-w-11 rounded-lg bg-neutral-800 px-2 font-semibold">
          +15
        </button>
        <button
          type="button"
          onClick={() => modificarSesion(id, () => ({ descansoHasta: undefined }))}
          className="min-h-11 rounded-lg bg-neutral-800 px-3 font-semibold"
        >
          Saltar
        </button>
      </div>
    </div>
  )
}
