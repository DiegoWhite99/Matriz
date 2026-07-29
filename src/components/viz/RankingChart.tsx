import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { abrev } from '../../data/hardware'
import type { Resultado } from '../../lib/scoring'
import { useVizTokens } from '../../theme/palette'
import { ChartCard, DataTable } from './ChartCard'
import { tooltipRecharts } from './VizTooltip'

/**
 * Ranking del caso de uso: una sola medida (el puntaje) sobre categorías.
 *
 * Un solo color para todas las barras — colorear cada barra distinto
 * duplicaría la longitud en el canal de color sin añadir información. Los
 * descartados por restricción se distinguen por tinta apagada más etiqueta,
 * nunca por color solo.
 */
export function RankingChart({ resultados }: { resultados: Resultado[] }) {
  const t = useVizTokens()

  const datos = resultados.map((r) => ({
    nombre: abrev(r.hardware),
    completo: r.hardware.categoria,
    representativo: r.hardware.representativo,
    puntaje: Number(r.puntaje.toFixed(1)),
    viable: r.viable,
    posicion: r.posicion,
    motivos: r.motivosDescarte,
  }))

  const Contenido = tooltipRecharts((payload) => {
    const d = payload[0]?.payload as (typeof datos)[number] | undefined
    if (!d) return null
    return {
      titulo: d.completo,
      subtitulo: d.representativo,
      filas: [
        { etiqueta: 'Puntaje', valor: `${d.puntaje} / 100`, color: t['series-1'] },
        {
          etiqueta: 'Estado',
          valor: d.viable ? `Viable · puesto ${d.posicion}` : 'No viable',
        },
        ...(d.viable ? [] : [{ etiqueta: 'Motivo', valor: d.motivos[0] ?? '—' }]),
      ],
    }
  })

  return (
    <ChartCard
      titulo="Ranking por caso de uso"
      descripcion="Puntaje ponderado sobre 100. Las barras apagadas incumplen una restricción dura del caso y quedan fuera del ranking."
      alto={340}
      tabla={
        <DataTable
          columnas={['Categoría', 'Puesto', 'Puntaje', 'Estado']}
          filas={datos.map((d) => [
            d.completo,
            d.viable ? d.posicion : '—',
            d.puntaje,
            d.viable ? 'Viable' : `No viable — ${d.motivos.join(' ')}`,
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 4, right: 56, bottom: 4, left: 4 }}
          barCategoryGap={6}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: t['text-muted'], fontSize: 11 }}
            stroke={t['axis']}
            tickLine={false}
            axisLine={{ stroke: t['axis'] }}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={128}
            tick={{ fill: t['text-secondary'], fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={Contenido} cursor={{ fill: t['grid'], fillOpacity: 0.4 }} />
          <Bar dataKey="puntaje" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
            {datos.map((d) => (
              <Cell
                key={d.nombre}
                fill={d.viable ? t['series-1'] : t['text-muted']}
                fillOpacity={d.viable ? 1 : 0.35}
              />
            ))}
            <LabelList
              dataKey="puntaje"
              position="right"
              offset={8}
              fill={t['text-secondary']}
              fontSize={11}
              className="tnum"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
