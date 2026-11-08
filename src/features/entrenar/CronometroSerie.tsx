// Cronómetro para ejercicios por tiempo (plancha): cuenta hacia arriba y, al parar,
// guarda los segundos en la siguiente serie sin marcar y la marca como hecha.
// Avisa (pitido + vibración) al llegar al objetivo de la serie. Estado local: si se recarga la app, se pierde.
import { useEffect, useRef, useState } from 'react'
import { textoCronometro } from '../../domain/medida'
import { avisarFin, prepararAviso } from './aviso'

export function CronometroSerie({ objetivo, serie, alParar }: { objetivo: number; serie: number; alParar: (segundos: number) => void }) {
  const [inicio, setInicio] = useState<number | null>(null)
  const [segundos, setSegundos] = useState(0)
  const avisado = useRef(false)

  useEffect(() => {
    if (inicio === null) return
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - inicio) / 1000)
      setSegundos(s)
      if (s >= objetivo && !avisado.current) {
        avisado.current = true
        avisarFin()
      }
    }, 250)
    return () => clearInterval(t)
  }, [inicio, objetivo])

  if (inicio === null)
    return (
      <button
        type="button"
        onClick={() => {
          prepararAviso()
          avisado.current = false
          setSegundos(0)
          setInicio(Date.now())
        }}
        className="mb-3 min-h-12 w-full rounded-xl bg-lime-400 font-bold text-neutral-950"
      >
        ▶ Cronómetro · serie {serie} ({objetivo} s)
      </button>
    )

  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl bg-neutral-950/60 p-3" role="timer" aria-live="off">
      <p className={`flex-1 text-3xl font-bold tabular-nums ${segundos >= objetivo ? 'text-lime-300' : ''}`}>
        {textoCronometro(segundos)}
        <span className="ml-2 text-sm font-normal text-neutral-400">/ {objetivo} s</span>
      </p>
      <button type="button" onClick={() => setInicio(null)} className="min-h-12 rounded-xl bg-neutral-800 px-3 text-sm">
        Cancelar
      </button>
      <button
        type="button"
        onClick={() => {
          setInicio(null)
          if (segundos > 0) alParar(segundos)
        }}
        className="min-h-12 rounded-xl bg-lime-400 px-4 font-bold text-neutral-950"
      >
        ⏹ Parar
      </button>
    </div>
  )
}
