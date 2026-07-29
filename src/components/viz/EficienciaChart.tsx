import {
  CartesianGrid,
  Label,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { HARDWARE, abrev, precioMedio, tdpMedio, topsPorWatt } from '../../data/hardware'
import { Termino, TextoConGlosario } from '../Glosario'
import { useVizTokens } from '../../theme/palette'
import { ChartCard, DataTable } from './ChartCard'
import { tooltipRecharts } from './VizTooltip'

/**
 * Eficiencia frente a precio.
 *
 * Una sola serie con etiquetas directas en cada punto, no siete hues: en una
 * forma de todos-contra-todos (dispersión) la paleta solo garantiza tres
 * slots, y aquí la identidad la lleva la etiqueta.
 *
 * Eje X en escala logarítmica porque el precio recorre dos órdenes de
 * magnitud ($20 a $7.000): en escala lineal los cinco equipos económicos se
 * apilarían sobre el eje.
 */
export function EficienciaChart() {
  const t = useVizTokens()

  // Solo los equipos con aceleración de IA: TOPS/W no está definido sin TOPS.
  const datos = HARDWARE.filter((h) => h.topsMax > 0).map((h) => ({
    id: h.id,
    nombre: abrev(h),
    completo: h.categoria,
    x: precioMedio(h),
    y: Number(topsPorWatt(h).toFixed(2)),
    tops: h.topsMax,
    watts: tdpMedio(h),
  }))

  const Contenido = tooltipRecharts((payload) => {
    const d = payload[0]?.payload as (typeof datos)[number] | undefined
    if (!d) return null
    return {
      titulo: d.completo,
      filas: [
        { etiqueta: 'Eficiencia', valor: `${d.y} TOPS/W`, color: t['series-1'] },
        { etiqueta: 'Precio medio', valor: `$${d.x.toLocaleString('es')}` },
        { etiqueta: 'Techo de IA', valor: `${d.tops} TOPS` },
        { etiqueta: 'Consumo medio', valor: `${d.watts} W` },
      ],
    }
  })

  return (
    <ChartCard
      titulo="Eficiencia energética frente a precio"
      descripcion={
        <TextoConGlosario texto="TOPS/W contra precio medio por unidad. Arriba a la izquierda es la esquina buena: mucha inferencia por watt sin pagar de más. Eje de precio en escala logarítmica." />
      }
      alto={320}
      tabla={
        <DataTable
          columnas={[
            'Categoría',
            <Termino key="tw" id="tops-watt" />,
            'Precio medio USD',
            <Termino key="t" id="tops" />,
            'Consumo medio W',
          ]}
          filas={datos.map((d) => [d.completo, d.y, d.x.toLocaleString('es'), d.tops, d.watts])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 24, bottom: 32, left: 8 }}>
          <CartesianGrid stroke={t['grid']} strokeDasharray="0" vertical={false} />
          <XAxis
            type="number"
            dataKey="x"
            scale="log"
            domain={[20, 6000]}
            ticks={[30, 100, 300, 1000, 3000]}
            tickFormatter={(v: number) => `$${v.toLocaleString('es')}`}
            tick={{ fill: t['text-muted'], fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: t['axis'] }}
          >
            <Label
              value="Precio medio por unidad (USD, escala log)"
              position="insideBottom"
              offset={-20}
              style={{ fill: t['text-muted'], fontSize: 11 }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            tick={{ fill: t['text-muted'], fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          >
            <Label
              value="TOPS / W"
              angle={-90}
              position="insideLeft"
              style={{ fill: t['text-muted'], fontSize: 11, textAnchor: 'middle' }}
            />
          </YAxis>
          <ZAxis range={[90, 90]} />
          <Tooltip content={Contenido} />
          <Scatter
            data={datos}
            fill={t['series-1']}
            // Anillo de superficie de 2px: separa puntos que se solapan sin
            // dibujarles un borde de contorno.
            stroke={t['surface-1']}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {/* Serie única: la identidad la llevan estas etiquetas, no el color. */}
            <LabelList
              dataKey="nombre"
              position="top"
              offset={10}
              fill={t['text-secondary']}
              fontSize={10}
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
