import { useState, type FormEvent } from 'react'
import { claveDia } from '../../domain/calendario'
import { borrarPago, registrarPago, usePagos } from '../../data/repos/pagos'
import { DIAS_AVISO_PAGO, estadoPago, fechaDePago, leerMonto, MAX_MONTO, textoDias } from '../../domain/pagos'

const fechaLarga = (d: Date) => d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })

/** Tarjeta de Perfil: registrar el pago del mes y ver cuándo vence. */
export function PagoGym() {
  const pagos = usePagos()
  // Se fija al montar (la pantalla no queda abierta de un día para otro)
  const [hoy] = useState(() => claveDia(new Date()))
  const [fecha, setFecha] = useState(hoy)
  const [monto, setMonto] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)
  if (pagos === undefined) return null
  const estado = estadoPago(pagos)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const d = fechaDePago(fecha)
    const m = leerMonto(monto)
    if (!d) return setMensaje('Elige una fecha que no sea futura')
    if (m === undefined) return setMensaje(`Escribe un monto entre 0 y ${MAX_MONTO.toLocaleString('es')}, o déjalo vacío`)
    await registrarPago(d, m)
    setMonto('')
    setMensaje('✓ Pago registrado')
  }

  async function borrarUltimo() {
    const id = estado?.ultimo.id
    if (id !== undefined && confirm('¿Borrar el último pago registrado?')) {
      await borrarPago(id)
      setMensaje(null)
    }
  }

  const color = !estado ? '' : estado.dias < 0 ? 'text-red-400' : estado.dias <= DIAS_AVISO_PAGO ? 'text-amber-300' : 'text-lime-300'

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-xl bg-neutral-900 p-4">
      <h2 className="font-semibold">💳 Pago del gym</h2>
      {estado ? (
        <div className="text-sm text-neutral-300">
          <p>
            Pagaste el {fechaLarga(new Date(estado.ultimo.fecha))}
            {estado.ultimo.monto !== undefined && ` (${estado.ultimo.monto.toLocaleString('es')})`}.
          </p>
          <p>
            Vence el <strong className="text-neutral-100">{fechaLarga(estado.vence)}</strong>:{' '}
            <strong className={color}>{textoDias(estado.dias)}</strong>
          </p>
        </div>
      ) : (
        <p className="text-sm text-neutral-400">Registra tu pago y te diremos cuándo vence.</p>
      )}
      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-neutral-400">Fecha del pago</span>
          <input
            type="date"
            value={fecha}
            max={hoy}
            onChange={(e) => setFecha(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3"
          />
        </label>
        <label className="flex w-28 flex-col gap-1">
          <span className="text-sm text-neutral-400">Monto (opcional)</span>
          <input
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3"
          />
        </label>
      </div>
      <button type="submit" className="min-h-12 rounded-xl bg-lime-400 font-bold text-neutral-950">
        {fecha === hoy ? 'Pagué hoy' : 'Registrar pago'}
      </button>
      {estado && (
        <button type="button" onClick={borrarUltimo} className="min-h-11 text-sm text-neutral-400 underline">
          Borrar el último pago
        </button>
      )}
      {mensaje && (
        <p role="status" className="text-sm text-neutral-300">
          {mensaje}
        </p>
      )}
    </form>
  )
}

/** Aviso en Entrenar cuando el pago vence pronto o ya venció. */
export function AvisoPago() {
  const pagos = usePagos()
  const estado = pagos && estadoPago(pagos)
  if (!estado || estado.dias > DIAS_AVISO_PAGO) return null
  return (
    <a
      href="#/perfil"
      className="mb-4 flex min-h-12 items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm text-amber-100"
    >
      💳 Pago del gym: {textoDias(estado.dias).toLowerCase()}. <span className="font-semibold underline">Registrar pago</span>
    </a>
  )
}
