import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts'
import { CRITERIOS, type Hardware } from '../../data/hardware'
import { useVizTokens } from '../../theme/palette'
import { ChartCard, DataTable } from './ChartCard'
import { VizTooltip } from './VizTooltip'

/**
 * Perfil de capacidades de los equipos seleccionados.
 *
 * Tope de tres series: la dispersión de un radar pone todas las series a
 * compararse entre sí, y en ese régimen la paleta solo garantiza separación
 * para los tres primeros slots. Con más, el `CompareView` obliga a elegir.
 */
export const MAX_COMPARAR = 3

export function PerfilRadar({ seleccion }: { seleccion: Hardware[] }) {
  const t = useVizTokens()
  const equipos = seleccion.slice(0, MAX_COMPARAR)
  const colores = [t['series-1'], t['series-2'], t['series-3']]

  const datos = CRITERIOS.map((c) => {
    const fila: Record<string, string | number> = { criterio: c.corto, nombre: c.nombre }
    equipos.forEach((h) => {
      fila[h.id] = h.calificaciones[c.id]
    })
    return fila
  })

  function Contenido({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null
    const criterio = CRITERIOS.find((c) => c.corto === label)
    return (
      <VizTooltip
        activo
        titulo={criterio?.nombre ?? String(label ?? '')}
        subtitulo={criterio?.descripcion}
        filas={payload.map((p) => ({
          etiqueta: equipos.find((h) => h.id === p.dataKey)?.categoria ?? String(p.dataKey ?? ''),
          valor: `${p.value ?? 0} / 100`,
          color: p.color,
        }))}
      />
    )
  }

  if (equipos.length === 0) {
    return (
      <section className="card flex min-h-[280px] items-center justify-center p-6">
        <p className="max-w-sm text-center text-sm text-[var(--text-secondary)]">
          Selecciona hasta {MAX_COMPARAR} categorías en la tabla para ver su perfil de capacidades.
        </p>
      </section>
    )
  }

  return (
    <ChartCard
      titulo="Perfil de capacidades"
      descripcion={`Calificación 0–100 en los ocho criterios. Un perfil ancho no es mejor: lo relevante es que sea ancho donde el caso de uso pesa. Máximo ${MAX_COMPARAR} categorías a la vez.`}
      alto={360}
      tabla={
        <DataTable
          columnas={['Criterio', ...equipos.map((h) => h.categoria)]}
          filas={CRITERIOS.map((c) => [c.nombre, ...equipos.map((h) => h.calificaciones[c.id])])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={datos} outerRadius="72%">
          <PolarGrid stroke={t['grid']} />
          <PolarAngleAxis
            dataKey="criterio"
            tick={{ fill: t['text-secondary'], fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            angle={90}
            tick={{ fill: t['text-muted'], fontSize: 9 }}
            axisLine={false}
            tickCount={5}
          />
          <Tooltip content={Contenido} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: t['text-secondary'], paddingTop: 8 }}
            formatter={(value) => (
              <span style={{ color: t['text-secondary'] }}>
                {equipos.find((h) => h.id === value)?.categoria ?? value}
              </span>
            )}
          />
          {equipos.map((h, i) => (
            <Radar
              key={h.id}
              name={h.id}
              dataKey={h.id}
              stroke={colores[i]}
              strokeWidth={2}
              fill={colores[i]}
              fillOpacity={0.12}
              isAnimationActive={false}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
