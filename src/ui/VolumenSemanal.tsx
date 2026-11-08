// Barras de series semanales por grupo muscular.
// Sin `hechas`: muestra el volumen de la rutina con su estado (corto / bien / alto).
// Con `hechas`: muestra lo hecho esta semana frente a lo planificado.
import { ETIQUETA_GRUPO } from '../domain/biblioteca'
import type { GrupoMuscular } from '../domain/tipos'
import { MAX_SERIES_SEMANA, volumenSemanal, type EstadoVolumen } from '../domain/volumen'

const ESCALA = 20 // series que ocupan el ancho completo
const COLOR: Record<EstadoVolumen, string> = { corto: 'bg-amber-400', bien: 'bg-lime-400', alto: 'bg-rose-400' }
const TEXTO: Record<EstadoVolumen, string> = { corto: 'corto', bien: 'bien', alto: 'alto' }

const fmt = (n: number) => n.toLocaleString('es', { maximumFractionDigits: 1 })
const pct = (n: number) => `${Math.min(100, (n / ESCALA) * 100)}%`

export function VolumenSemanal({ plan, hechas }: { plan: Record<GrupoMuscular, number>; hechas?: Record<GrupoMuscular, number> }) {
  const grupos = volumenSemanal(plan)
  const visibles = hechas ? grupos.filter((g) => g.series > 0 || hechas[g.grupo] > 0) : grupos
  const cortos = grupos.filter((g) => g.estado === 'corto').map((g) => ETIQUETA_GRUPO[g.grupo])
  const altos = grupos.filter((g) => g.estado === 'alto').map((g) => ETIQUETA_GRUPO[g.grupo])

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {visibles.map((g) => (
          <li key={g.grupo} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span>{ETIQUETA_GRUPO[g.grupo]}</span>
              <span className="tabular-nums text-neutral-300">
                {hechas ? `${fmt(hechas[g.grupo])} de ${fmt(g.series)}` : `${fmt(g.series)} · ${TEXTO[g.estado]}`}
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-neutral-800" aria-hidden="true">
              {hechas ? (
                <>
                  <div className="absolute inset-y-0 left-0 rounded-full bg-neutral-600" style={{ width: pct(g.series) }} />
                  <div className="absolute inset-y-0 left-0 rounded-full bg-lime-400" style={{ width: pct(hechas[g.grupo]) }} />
                </>
              ) : (
                <>
                  <div className={`absolute inset-y-0 left-0 rounded-full ${COLOR[g.estado]}`} style={{ width: pct(g.series) }} />
                  {/* Marcas del rango recomendado */}
                  <div className="absolute -inset-y-0.5 w-0.5 bg-neutral-400" style={{ left: pct(g.min) }} />
                  <div className="absolute -inset-y-0.5 w-0.5 bg-neutral-400" style={{ left: pct(g.max) }} />
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {hechas ? (
        <p className="text-xs text-neutral-400">Series hechas desde el lunes frente a las de tu rutina. Los grupos secundarios cuentan media serie.</p>
      ) : (
        <>
          <p className="text-xs text-neutral-400">
            Series por semana. Las marcas indican lo recomendado: 10–{MAX_SERIES_SEMANA} en grupos grandes y 6–{MAX_SERIES_SEMANA} en
            bíceps, tríceps, gemelos y core. Los grupos secundarios cuentan media serie.
          </p>
          {cortos.length > 0 && (
            <p className="rounded-lg bg-amber-400/10 p-2 text-sm text-amber-200">
              Quedan cortos: {cortos.join(', ')}. Puedes subir series o añadir un ejercicio con «✏️ Editar día».
            </p>
          )}
          {altos.length > 0 && (
            <p className="rounded-lg bg-rose-400/10 p-2 text-sm text-rose-200">
              Mucho volumen en {altos.join(', ')}: para empezar, mejor no pasar de {MAX_SERIES_SEMANA} series.
            </p>
          )}
        </>
      )}
    </div>
  )
}
