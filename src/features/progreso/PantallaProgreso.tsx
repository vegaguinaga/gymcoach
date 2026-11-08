// Pantalla Progreso. Se carga con lazy() desde App: así Recharts solo se descarga al abrirla.
import { useState } from 'react'
import { useEjercicios } from '../../data/repos/ejercicios'
import { useSesionesTerminadas } from '../../data/repos/sesiones'
import { ejerciciosRealizados, recordsPorEjercicio, sesionesEnDias } from '../../domain/progreso'
import { Chip } from '../../ui/Chip'
import { Pantalla } from '../../ui/Pantalla'
import { DetalleSesion } from './DetalleSesion'
import { GraficaEjercicio } from './GraficaEjercicio'
import { GraficaPeso } from './GraficaPeso'
import { Historial } from './Historial'

const SECCIONES = { historial: 'Historial', ejercicios: 'Ejercicios', peso: 'Peso' } as const
type Seccion = keyof typeof SECCIONES

export default function PantallaProgreso({ param }: { param?: string }) {
  const sesiones = useSesionesTerminadas()
  const lista = useEjercicios()
  const [seccion, setSeccion] = useState<Seccion>('historial')

  if (sesiones === undefined || lista === undefined)
    return (
      <Pantalla titulo="Progreso">
        <p className="text-neutral-400">Cargando…</p>
      </Pantalla>
    )

  const ejercicios = new Map(lista.map((e) => [e.id, e]))
  const id = Number(param)
  if (param && Number.isInteger(id)) return <DetalleSesion id={id} ejercicios={ejercicios} />

  const resumen = [
    { etiqueta: 'Sesiones (7 días)', valor: sesionesEnDias(sesiones, 7) },
    { etiqueta: 'Sesiones (30 días)', valor: sesionesEnDias(sesiones, 30) },
    { etiqueta: 'Ejercicios con récord', valor: recordsPorEjercicio(sesiones).size },
  ]

  return (
    <Pantalla titulo="Progreso">
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-3 gap-2">
          {resumen.map((r) => (
            <div key={r.etiqueta} className="rounded-xl bg-neutral-900 p-3 text-center">
              <dt className="text-xs text-neutral-400">{r.etiqueta}</dt>
              <dd className="text-2xl font-bold tabular-nums">{r.valor}</dd>
            </div>
          ))}
        </dl>

        <div className="flex gap-2" role="group" aria-label="Secciones de progreso">
          {(Object.keys(SECCIONES) as Seccion[]).map((k) => (
            <Chip key={k} activo={k === seccion} onClick={() => setSeccion(k)}>
              {SECCIONES[k]}
            </Chip>
          ))}
        </div>

        {seccion === 'historial' && <Historial sesiones={sesiones} />}
        {seccion === 'ejercicios' && (
          <GraficaEjercicio sesiones={sesiones} ids={ejerciciosRealizados(sesiones)} ejercicios={ejercicios} />
        )}
        {seccion === 'peso' && <GraficaPeso />}
      </div>
    </Pantalla>
  )
}
