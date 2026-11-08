import { useEjercicio, useEjercicios } from '../../data/repos/ejercicios'
import {
  alternativasDe,
  ETIQUETA_EQUIPO,
  ETIQUETA_GRUPO,
  ETIQUETA_TIPO,
  fotosDe,
  urlVideo,
} from '../../domain/biblioteca'
import { AvisoSeguridad } from '../../ui/AvisoSeguridad'
import { Pantalla } from '../../ui/Pantalla'
import { AnimacionEjercicio } from './AnimacionEjercicio'

export function FichaEjercicio({ id }: { id: string }) {
  const ejercicio = useEjercicio(id)
  const todos = useEjercicios()

  if (ejercicio === undefined) return <Pantalla titulo="Cargando…" volver="#/ejercicios">{null}</Pantalla>
  if (ejercicio === null)
    return (
      <Pantalla titulo="No encontrado" volver="#/ejercicios">
        <p className="text-neutral-400">Este ejercicio no existe.</p>
      </Pantalla>
    )

  const alternativas = alternativasDe(ejercicio, todos ?? [])
  const fotos = fotosDe(ejercicio)

  return (
    <Pantalla titulo={ejercicio.nombre} volver="#/ejercicios">
      <div className="flex flex-col gap-5">
        <ul className="flex flex-wrap gap-2 text-xs" aria-label="Características">
          {[ETIQUETA_GRUPO[ejercicio.grupoPrincipal], ETIQUETA_TIPO[ejercicio.tipo], ETIQUETA_EQUIPO[ejercicio.equipo]].map(
            (t) => (
              <li key={t} className="rounded-full bg-neutral-800 px-3 py-1">
                {t}
              </li>
            ),
          )}
        </ul>
        {ejercicio.gruposSecundarios.length > 0 && (
          <p className="text-sm text-neutral-400">
            También trabaja: {ejercicio.gruposSecundarios.map((g) => ETIQUETA_GRUPO[g]).join(', ')}
          </p>
        )}

        {fotos.length > 0 && (
          // key: al saltar a una alternativa, la animación empieza de cero
          <AnimacionEjercicio key={ejercicio.id} fotos={fotos} nombre={ejercicio.nombre} />
        )}
        <a
          href={urlVideo(ejercicio)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-700 font-semibold"
        >
          ▶ Ver video en YouTube <span className="text-xs font-normal text-neutral-400">(requiere internet)</span>
        </a>

        <section>
          <h2 className="mb-2 font-semibold">Cómo se hace</h2>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-neutral-200">
            {ejercicio.instrucciones.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Errores comunes</h2>
          <ul className="flex flex-col gap-1 text-neutral-200">
            {ejercicio.erroresComunes.map((err) => (
              <li key={err}>⚠️ {err}</li>
            ))}
          </ul>
        </section>

        {alternativas.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold">Alternativas</h2>
            <ul className="flex flex-col gap-2">
              {alternativas.map((a) => (
                <li key={a.id}>
                  <a
                    href={`#/ejercicios/${encodeURIComponent(a.id)}`}
                    className="flex min-h-11 items-center justify-between rounded-xl bg-neutral-900 px-4"
                  >
                    <span>{a.nombre}</span>
                    <span className="text-xs text-neutral-400">{ETIQUETA_EQUIPO[a.equipo]}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <AvisoSeguridad compuesto={ejercicio.tipo === 'compuesto'} />
      </div>
    </Pantalla>
  )
}
