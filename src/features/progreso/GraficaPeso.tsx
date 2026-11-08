import { usePesosCorporales } from '../../data/repos/perfil'
import { redondearKg } from '../../domain/unidades'
import { GraficaLinea } from './GraficaLinea'

export function GraficaPeso() {
  const pesos = usePesosCorporales()
  if (pesos === undefined) return <p className="text-neutral-400">Cargando…</p>

  const datos = pesos.map((p) => ({ fecha: p.fecha, valor: p.kg }))
  const primero = pesos.at(0)
  const ultimo = pesos.at(-1)
  const cambio = primero && ultimo ? redondearKg(ultimo.kg - primero.kg) : 0

  return (
    <div className="flex flex-col gap-4">
      {ultimo && (
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-neutral-900 p-3">
            <dt className="text-xs text-neutral-400">Peso actual</dt>
            <dd className="text-xl font-bold tabular-nums">{ultimo.kg} kg</dd>
          </div>
          <div className="rounded-xl bg-neutral-900 p-3">
            <dt className="text-xs text-neutral-400">Cambio total</dt>
            <dd className="text-xl font-bold tabular-nums">
              {cambio > 0 ? '+' : ''}
              {cambio} kg
            </dd>
          </div>
        </dl>
      )}
      <GraficaLinea datos={datos} unidad="kg" titulo="Peso corporal" />
      <a
        href="#/perfil"
        className="flex min-h-12 items-center justify-center rounded-xl border border-neutral-700 text-neutral-200 active:bg-neutral-800"
      >
        Registrar peso en Perfil
      </a>
    </div>
  )
}
