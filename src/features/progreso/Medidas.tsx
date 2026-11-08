// Medidas corporales: registrar las de hoy, ver la última de cada zona con su cambio y su gráfica.
import { useState } from 'react'
import { borrarMedidas, registrarMedidas, useMedidas } from '../../data/repos/medidas'
import { AYUDA_MEDIDA, ETIQUETA_MEDIDA, LIMITES_CM, normalizarMedidas, resumenMedidas, serieMedida, textoCambio } from '../../domain/medidas'
import { MEDIDAS, type Medida } from '../../domain/tipos'
import { Chip } from '../../ui/Chip'
import { GraficaLinea } from './GraficaLinea'
import { fechaCorta } from './formato'

export function Medidas() {
  const registros = useMedidas()
  const [elegida, setElegida] = useState<Medida>('cintura')
  const [abierto, setAbierto] = useState(false)

  if (registros === undefined) return <p className="text-neutral-400">Cargando…</p>

  const resumen = resumenMedidas(registros)
  const medidas = resumen.map((r) => r.medida)
  const medida = medidas.includes(elegida) ? elegida : medidas[0]
  const ultimo = registros.at(-1)

  return (
    <section className="flex flex-col gap-4" aria-labelledby="titulo-medidas">
      <h2 id="titulo-medidas" className="text-lg font-semibold">
        Medidas
      </h2>

      {resumen.length > 0 ? (
        <dl className="grid grid-cols-2 gap-2">
          {resumen.map((r) => (
            <div key={r.medida} className="rounded-xl bg-neutral-900 p-3">
              <dt className="text-xs text-neutral-400">{ETIQUETA_MEDIDA[r.medida]}</dt>
              <dd className="text-xl font-bold tabular-nums">{r.actual.toLocaleString('es')} cm</dd>
              <dd className="text-xs text-neutral-400 tabular-nums">
                {r.cambioTotal === null ? fechaCorta(r.fecha) : `${textoCambio(r.cambioTotal)} desde el inicio`}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="rounded-xl bg-neutral-900 p-4 text-sm text-neutral-300">
          Las medidas muestran cambios que la báscula no ve: si ganas músculo y pierdes grasa, el peso puede no moverse.
          Mídete cada 2–4 semanas, en ayunas y en el mismo sitio.
        </p>
      )}

      {abierto ? (
        <FormularioMedidas alTerminar={() => setAbierto(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="min-h-12 rounded-xl bg-lime-400 font-bold text-neutral-950"
        >
          ➕ Registrar medidas de hoy
        </button>
      )}

      {medida && (
        <>
          <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Medida de la gráfica">
            {medidas.map((m) => (
              <Chip key={m} activo={m === medida} onClick={() => setElegida(m)}>
                {ETIQUETA_MEDIDA[m]}
              </Chip>
            ))}
          </div>
          <GraficaLinea datos={serieMedida(registros, medida)} unidad="cm" titulo={ETIQUETA_MEDIDA[medida]} />
        </>
      )}

      {ultimo?.id !== undefined && (
        <button
          type="button"
          onClick={() => {
            if (confirm(`¿Borrar las medidas del ${fechaCorta(ultimo.fecha)}?`)) void borrarMedidas(ultimo.id as number)
          }}
          className="min-h-11 text-sm text-neutral-400 underline-offset-4 active:underline"
        >
          Borrar el último registro ({fechaCorta(ultimo.fecha)})
        </button>
      )}
    </section>
  )
}

function FormularioMedidas({ alTerminar }: { alTerminar: () => void }) {
  const [valores, setValores] = useState<Partial<Record<Medida, string>>>({})
  const [error, setError] = useState<string | null>(null)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    const entrada = Object.fromEntries(
      MEDIDAS.map((m) => [m, valores[m]?.trim() ? Number(valores[m]?.replace(',', '.')) : undefined]),
    ) as Partial<Record<Medida, number | undefined>>
    const r = normalizarMedidas(entrada)
    if (!r.ok) return setError(r.error)
    await registrarMedidas(r.cm)
    alTerminar()
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3 rounded-xl bg-neutral-900 p-4">
      <p className="text-sm text-neutral-400">En cm. Rellena solo las que midas; las demás puedes dejarlas vacías.</p>
      {MEDIDAS.map((m) => (
        <label key={m} className="flex flex-col gap-1">
          <span className="font-medium">{ETIQUETA_MEDIDA[m]}</span>
          <span className="text-xs text-neutral-500">{AYUDA_MEDIDA[m]}</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={LIMITES_CM.min}
            max={LIMITES_CM.max}
            value={valores[m] ?? ''}
            onChange={(e) => setValores({ ...valores, [m]: e.target.value })}
            className="min-h-12 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-base"
          />
        </label>
      ))}
      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={alTerminar} className="min-h-12 flex-1 rounded-xl bg-neutral-800">
          Cancelar
        </button>
        <button type="submit" className="min-h-12 flex-1 rounded-xl bg-lime-400 font-bold text-neutral-950">
          Guardar
        </button>
      </div>
    </form>
  )
}
