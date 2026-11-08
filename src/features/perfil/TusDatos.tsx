import { useRef, useState, type ChangeEvent } from 'react'
import { descargarRespaldo, importarDatos } from '../../data/repos/respaldo'
import { resumenRespaldo, validarRespaldo } from '../../domain/respaldo'

/** Copia de seguridad: todo vive en este dispositivo, así que conviene guardarla de vez en cuando. */
export function TusDatos() {
  const archivo = useRef<HTMLInputElement>(null)
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function exportar() {
    setOcupado(true)
    try {
      await descargarRespaldo()
      setMensaje({ ok: true, texto: '✓ Copia descargada. Guárdala en tu nube o envíatela.' })
    } catch {
      setMensaje({ ok: false, texto: 'No se pudo crear la copia.' })
    } finally {
      setOcupado(false)
    }
  }

  async function importar(e: ChangeEvent<HTMLInputElement>) {
    const elegido = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!elegido) return
    setOcupado(true)
    try {
      let json: unknown
      try {
        json = JSON.parse(await elegido.text())
      } catch {
        setMensaje({ ok: false, texto: 'El archivo no se puede leer (no es un JSON válido).' })
        return
      }
      const v = validarRespaldo(json)
      if (!v.ok) {
        setMensaje({ ok: false, texto: v.error })
        return
      }
      const fecha = new Date(v.respaldo.creado).toLocaleDateString('es')
      const confirmado = confirm(
        `La copia del ${fecha} trae ${resumenRespaldo(v.respaldo)}.\n\n` +
          'Reemplazará TODOS tus datos actuales. Antes se descargará una copia de lo que tienes ahora. ¿Continuar?',
      )
      if (!confirmado) return
      // Red de seguridad: nunca se pierden datos, aunque se importe el archivo equivocado
      await descargarRespaldo()
      await importarDatos(v.respaldo)
      setMensaje({ ok: true, texto: `✓ Datos importados: ${resumenRespaldo(v.respaldo)}.` })
    } catch {
      setMensaje({ ok: false, texto: 'No se pudieron importar los datos. Tus datos actuales no cambiaron.' })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-neutral-900 p-4" aria-labelledby="tus-datos">
      <h2 id="tus-datos" className="font-semibold">
        Tus datos
      </h2>
      <p className="text-sm text-neutral-400">
        Todo se guarda solo en este teléfono. Descarga una copia de vez en cuando o para pasarte a otro dispositivo.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={exportar}
          disabled={ocupado}
          className="min-h-12 flex-1 rounded-xl bg-lime-400 font-semibold text-neutral-950 disabled:opacity-50"
        >
          Exportar copia
        </button>
        <button
          type="button"
          onClick={() => archivo.current?.click()}
          disabled={ocupado}
          className="min-h-12 flex-1 rounded-xl bg-neutral-800 font-semibold disabled:opacity-50"
        >
          Importar copia
        </button>
      </div>
      <input
        ref={archivo}
        type="file"
        accept="application/json,.json"
        onChange={importar}
        className="hidden"
        aria-label="Archivo de copia de GymCoach"
      />
      {mensaje && (
        <p role="status" className={`text-sm ${mensaje.ok ? 'text-lime-300' : 'text-amber-300'}`}>
          {mensaje.texto}
        </p>
      )}
    </section>
  )
}
