import { useState, type FormEvent } from 'react'
import { guardarPerfil, registrarPeso, usePerfil, useUltimoPeso } from '../../data/repos/perfil'
import { ETIQUETA_EQUIPO } from '../../domain/biblioteca'
import { avisoDias, ETIQUETA_OBJETIVO, LIMITES, perfilPorDefecto, validarPerfil } from '../../domain/perfil'
import { EQUIPOS, OBJETIVOS, type Equipo, type Profile } from '../../domain/tipos'
import { AvisoSeguridad } from '../../ui/AvisoSeguridad'
import { Chip } from '../../ui/Chip'
import { Pantalla } from '../../ui/Pantalla'
import { TusDatos } from './TusDatos'

const OPCIONES_MINUTOS = [30, 45, 60, 75, 90]

export function PantallaPerfil() {
  const perfil = usePerfil()

  return (
    <Pantalla titulo="Perfil">
      <div className="flex flex-col gap-6">
        {perfil === undefined ? (
          <p className="text-neutral-400">Cargando…</p>
        ) : (
          // Se monta cuando ya cargó: arranca con lo guardado (o los valores por defecto)
          <FormularioPerfil inicial={perfil ?? perfilPorDefecto()} nuevo={!perfil} />
        )}
        <PesoCorporal />
        <a
          href="#/ejercicios"
          className="flex min-h-14 items-center justify-between rounded-xl bg-neutral-900 px-4 font-semibold"
        >
          <span>📚 Biblioteca de ejercicios</span>
          <span aria-hidden="true" className="text-neutral-500">›</span>
        </a>
        <TusDatos />
        <AvisoSeguridad />
      </div>
    </Pantalla>
  )
}

function FormularioPerfil({ inicial, nuevo }: { inicial: Profile; nuevo: boolean }) {
  const [p, setP] = useState(inicial)
  const [guardado, setGuardado] = useState(false)
  const errores = validarPerfil(p)
  const valido = Object.keys(errores).length === 0
  const aviso = avisoDias(p.diasPorSemana)

  function cambiar(cambios: Partial<Profile>) {
    setP((previo) => ({ ...previo, ...cambios }))
    setGuardado(false)
  }

  function alternarEquipo(eq: Equipo) {
    cambiar({ equipo: p.equipo.includes(eq) ? p.equipo.filter((e) => e !== eq) : [...p.equipo, eq] })
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!valido) return
    await guardarPerfil({ ...p, nombre: p.nombre.trim() })
    setGuardado(true)
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      {nuevo && (
        <p className="rounded-xl bg-lime-400/10 p-3 text-sm text-lime-200">
          Cuéntanos un poco de ti para armar tu rutina.
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-neutral-400">Nombre (opcional)</span>
        <input
          value={p.nombre}
          onChange={(e) => cambiar({ nombre: e.target.value })}
          maxLength={40}
          autoComplete="given-name"
          className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-neutral-400">Objetivo</legend>
        <div className="grid grid-cols-2 gap-2">
          {OBJETIVOS.map((o) => (
            <Chip key={o} activo={p.objetivo === o} onClick={() => cambiar({ objetivo: o })}>
              {ETIQUETA_OBJETIVO[o]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-neutral-400">Días por semana</legend>
        <div className="flex items-center gap-4">
          <BotonPaso
            etiqueta="Menos días"
            disabled={p.diasPorSemana <= LIMITES.dias.min}
            onClick={() => cambiar({ diasPorSemana: p.diasPorSemana - 1 })}
          >
            −
          </BotonPaso>
          <output aria-live="polite" className="w-10 text-center text-3xl font-bold">
            {p.diasPorSemana}
          </output>
          <BotonPaso
            etiqueta="Más días"
            disabled={p.diasPorSemana >= LIMITES.dias.max}
            onClick={() => cambiar({ diasPorSemana: p.diasPorSemana + 1 })}
          >
            +
          </BotonPaso>
        </div>
        {aviso && <p className="mt-2 text-sm text-amber-300">{aviso}</p>}
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-neutral-400">Minutos por sesión</span>
        <select
          value={p.minutosPorSesion}
          onChange={(e) => cambiar({ minutosPorSesion: Number(e.target.value) })}
          className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3"
        >
          {OPCIONES_MINUTOS.map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="mb-2 text-sm text-neutral-400">Equipo disponible</legend>
        <div className="flex flex-wrap gap-2">
          {EQUIPOS.map((eq) => (
            <Chip key={eq} activo={p.equipo.includes(eq)} onClick={() => alternarEquipo(eq)}>
              {ETIQUETA_EQUIPO[eq]}
            </Chip>
          ))}
        </div>
        {errores.equipo && <p className="mt-2 text-sm text-red-400">{errores.equipo}</p>}
      </fieldset>

      <button
        type="submit"
        disabled={!valido}
        className="min-h-12 rounded-xl bg-lime-400 font-bold text-neutral-950 disabled:opacity-40"
      >
        {guardado ? '✓ Guardado' : 'Guardar perfil'}
      </button>
    </form>
  )
}

function BotonPaso({
  etiqueta,
  disabled,
  onClick,
  children,
}: {
  etiqueta: string
  disabled: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      disabled={disabled}
      onClick={onClick}
      className="size-12 rounded-full bg-neutral-800 text-2xl disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function PesoCorporal() {
  const ultimo = useUltimoPeso()
  const [texto, setTexto] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    // Acepta coma decimal ("72,5")
    const ok = await registrarPeso(Number(texto.replace(',', '.')))
    setMensaje(ok ? '✓ Peso registrado' : `Escribe un peso entre ${LIMITES.pesoKg.min} y ${LIMITES.pesoKg.max} kg`)
    if (ok) setTexto('')
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2 rounded-xl bg-neutral-900 p-4">
      <h2 className="font-semibold">Peso corporal</h2>
      {ultimo && (
        <p className="text-sm text-neutral-400">
          Último: <strong className="text-neutral-100">{ultimo.kg} kg</strong> (
          {new Date(ultimo.fecha).toLocaleDateString('es')})
        </p>
      )}
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Peso en kg</span>
          <input
            inputMode="decimal"
            placeholder="kg"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3"
          />
        </label>
        <button
          type="submit"
          disabled={!texto}
          className="min-h-11 rounded-lg bg-neutral-700 px-4 font-semibold disabled:opacity-40"
        >
          Registrar
        </button>
      </div>
      {mensaje && (
        <p role="status" className="text-sm text-neutral-300">
          {mensaje}
        </p>
      )}
    </form>
  )
}
