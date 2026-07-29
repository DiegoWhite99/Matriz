import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Resultado } from '../../lib/scoring'
import { useVizTokens } from '../../theme/palette'
import { ChartCard, DataTable } from './ChartCard'
import { tooltipRecharts } from './VizTooltip'

/**
 * Descomposición del puntaje del equipo recomendado.
 *
 * Responde "¿por qué ganó?": cuántos de sus puntos vienen de cada criterio.
 * Una sola medida, un solo color.
 */
export function AportesChart({ resultado }: { resultado: Resultado }) {
  const t = useVizTokens()

  const datos = resultado.aportes.map((a) => ({
    nombre: a.nombre,
    aporte: Number(a.aporte.toFixed(1)),
    calificacion: a.calificacion,
    peso: Math.round(a.peso * 100),
  }))

  const Contenido = tooltipRecharts((payload) => {
    const d = payload[0]?.payload as (typeof datos)[number] | undefined
    if (!d) return null
    return {
      titulo: d.nombre,
      filas: [
        { etiqueta: 'Puntos aportados', valor: String(d.aporte), color: t['series-1'] },
        { etiqueta: 'Calificación', valor: `${d.calificacion} / 100` },
        { etiqueta: 'Peso en el caso', valor: `${d.peso} %` },
      ],
    }
  })

  return (
    <ChartCard
      titulo={`De dónde salen los ${resultado.puntaje.toFixed(1)} puntos`}
      descripcion={`Descomposición del puntaje de ${resultado.hardware.categoria}: peso del criterio × calificación del equipo.`}
      alto={300}
      tabla={
        <DataTable
          columnas={['Criterio', 'Peso %', 'Calificación', 'Puntos']}
          filas={datos.map((d) => [d.nombre, d.peso, d.calificacion, d.aporte])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 4, right: 48, bottom: 4, left: 4 }}
          barCategoryGap={6}
        >
          <XAxis
            type="number"
            tick={{ fill: t['text-muted'], fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: t['axis'] }}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={150}
            tick={{ fill: t['text-secondary'], fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={Contenido} cursor={{ fill: t['grid'], fillOpacity: 0.4 }} />
          <Bar
            dataKey="aporte"
            fill={t['series-1']}
            radius={[0, 4, 4, 0]}
            maxBarSize={16}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="aporte"
              position="right"
              offset={8}
              fill={t['text-secondary']}
              fontSize={11}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
