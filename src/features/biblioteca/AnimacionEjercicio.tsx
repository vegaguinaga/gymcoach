import { useEffect, useState } from 'react'

const INTERVALO_MS = 1200

/**
 * Alterna las fotos de inicio y final para mostrar el movimiento.
 * Si el usuario pidió "reducir movimiento" en su sistema, no se anima sola:
 * se cambia de foto tocándola.
 */
export function AnimacionEjercicio({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [indice, setIndice] = useState(0)
  const [pausada, setPausada] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )

  useEffect(() => {
    if (pausada || fotos.length < 2) return
    const t = window.setInterval(() => setIndice((i) => (i + 1) % fotos.length), INTERVALO_MS)
    return () => window.clearInterval(t)
  }, [pausada, fotos.length])

  return (
    <figure className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => {
          setPausada(true)
          setIndice((i) => (i + 1) % fotos.length)
        }}
        aria-label={`${nombre}: ${indice === 0 ? 'posición inicial' : 'posición final'}. Toca para cambiar.`}
        className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-white"
      >
        {/* Ambas fotos cargadas y superpuestas: el cambio es instantáneo, sin parpadeo */}
        {fotos.map((src, i) => (
          <img
            key={src}
            src={`${import.meta.env.BASE_URL}${src}`}
            alt=""
            width={480}
            height={320}
            decoding="async"
            className={`absolute inset-0 size-full object-contain ${i === indice ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <span className="absolute bottom-2 left-2 rounded-full bg-neutral-950/70 px-2 py-0.5 text-xs text-white">
          {indice === 0 ? 'Inicio' : 'Final'}
        </span>
      </button>
      {pausada && fotos.length > 1 && (
        <button
          type="button"
          onClick={() => setPausada(false)}
          className="min-h-11 self-start text-sm text-lime-400"
        >
          ▶ Reanudar animación
        </button>
      )}
    </figure>
  )
}
