import { useMemo, useState } from 'react'
import { useEjercicios } from '../../data/repos/ejercicios'
import { usePerfil } from '../../data/repos/perfil'
import { ETIQUETA_EQUIPO, ETIQUETA_GRUPO, ETIQUETA_TIPO, filtrarEjercicios } from '../../domain/biblioteca'
import { GRUPOS_MUSCULARES, type GrupoMuscular } from '../../domain/tipos'
import { Chip } from '../../ui/Chip'
import { Pantalla } from '../../ui/Pantalla'

export function PantallaBiblioteca() {
  const ejercicios = useEjercicios()
  const perfil = usePerfil()
  const [texto, setTexto] = useState('')
  const [grupo, setGrupo] = useState<GrupoMuscular | undefined>()
  const [soloMiEquipo, setSoloMiEquipo] = useState(true)

  const equipos = soloMiEquipo && perfil ? perfil.equipo : undefined
  const lista = useMemo(
    () => filtrarEjercicios(ejercicios ?? [], { texto, grupo, equipos }),
    [ejercicios, texto, grupo, equipos],
  )

  return (
    <Pantalla titulo="Ejercicios" volver="#/perfil">
      <label className="block">
        <span className="sr-only">Buscar ejercicio</span>
        <input
          type="search"
          placeholder="Buscar…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3"
        />
      </label>

      <div className="-mx-4 my-3 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Grupo muscular">
        <Chip activo={!grupo} onClick={() => setGrupo(undefined)}>
          Todos
        </Chip>
        {GRUPOS_MUSCULARES.map((g) => (
          <Chip key={g} activo={grupo === g} onClick={() => setGrupo(grupo === g ? undefined : g)}>
            {ETIQUETA_GRUPO[g]}
          </Chip>
        ))}
      </div>

      {perfil && (
        <label className="mb-3 flex min-h-11 items-center gap-3 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={soloMiEquipo}
            onChange={(e) => setSoloMiEquipo(e.target.checked)}
            className="size-5 accent-lime-400"
          />
          Solo con mi equipo
        </label>
      )}

      {ejercicios === undefined ? (
        <p className="text-neutral-400">Cargando…</p>
      ) : lista.length === 0 ? (
        <p className="text-neutral-400">No hay ejercicios con estos filtros.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((e) => (
            <li key={e.id}>
              <a
                href={`#/ejercicios/${encodeURIComponent(e.id)}`}
                className="flex min-h-14 flex-col justify-center rounded-xl bg-neutral-900 px-4 py-2"
              >
                <span className="font-semibold">{e.nombre}</span>
                <span className="text-xs text-neutral-400">
                  {ETIQUETA_GRUPO[e.grupoPrincipal]} · {ETIQUETA_TIPO[e.tipo]} · {ETIQUETA_EQUIPO[e.equipo]}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Pantalla>
  )
}
