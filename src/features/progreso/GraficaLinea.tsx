// Gráfica de línea común (una sola serie, sin doble eje). Solo se carga en la pantalla Progreso.
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fechaCorta } from './formato'

export interface PuntoGrafica {
  fecha: string
  valor: number
}

const TINTA_SUAVE = '#a3a3a3' // neutral-400
const REJILLA = '#262626' // neutral-800
const LINEA = '#a3e635' // lime-400 (color de acento de la app)

export function GraficaLinea({ datos, unidad, titulo }: { datos: PuntoGrafica[]; unidad: string; titulo: string }) {
  if (datos.length < 2)
    return (
      <p className="rounded-xl bg-neutral-900 p-4 text-sm text-neutral-400">
        {datos.length === 0 ? 'Aún no hay datos.' : 'Con un registro más verás la gráfica.'}
      </p>
    )

  return (
    <figure className="h-56 w-full" aria-label={`Gráfica: ${titulo}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={REJILLA} vertical={false} />
          <XAxis
            dataKey="fecha"
            tickFormatter={fechaCorta}
            tick={{ fill: TINTA_SUAVE, fontSize: 12 }}
            stroke={REJILLA}
            minTickGap={24}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: TINTA_SUAVE, fontSize: 12 }}
            stroke={REJILLA}
            width={48}
            allowDecimals={false}
          />
          <Tooltip
            labelFormatter={(f) => fechaCorta(String(f))}
            formatter={(v) => [`${Number(v).toLocaleString('es')} ${unidad}`, titulo]}
            contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8 }}
            labelStyle={{ color: TINTA_SUAVE }}
            itemStyle={{ color: '#f5f5f5' }}
            cursor={{ stroke: '#525252' }}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke={LINEA}
            strokeWidth={2}
            dot={{ r: 4, fill: LINEA, stroke: '#0a0a0a', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  )
}
