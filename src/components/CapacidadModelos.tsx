import { useState } from 'react'
import {
  CartesianGrid,
  Label,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { abrev } from '../data/hardware'
import {
  DESCRIPCION_CUANTIZACION,
  NOMBRE_CUANTIZACION,
  BYTES_POR_PARAMETRO,
  type Cuantizacion,
} from '../data/memoria'
import {
  capacidades,
  formatearMemoria,
  formatearParametros,
  MODELOS_REFERENCIA,
} from '../lib/modelos'
import { useVizTokens } from '../theme/palette'
import { ChartCard, DataTable } from './viz/ChartCard'
import { tooltipRecharts } from './viz/VizTooltip'
import { Termino, TextoConGlosario } from './Glosario'

const CUANTIZACIONES: Cuantizacion[] = ['fp16', 'int8', 'int4']

/** Dos referencias en el gráfico: más líneas lo convierten en una reja. */
const REFERENCIAS_EN_GRAFICO = ['ResNet-50', 'Modelo de lenguaje de 8 B']

/**
 * Qué modelos de IA soporta cada equipo.
 *
 * El gráfico es un diagrama de puntos sobre eje logarítmico, no barras: los
 * techos van de 150 000 a 80 000 millones de parámetros, seis órdenes de
 * magnitud. Una barra mide desde el cero, y en escala logarítmica el cero no
 * existe, así que la longitud de la barra mentiría.
 */
export function CapacidadModelos() {
  const t = useVizTokens()
  const [q, setQ] = useState<Cuantizacion>('int8')
  const equipos = capacidades()

  const datos = equipos.map((c) => ({
    nombre: abrev(c.hardware),
    completo: c.hardware.categoria,
    x: c.maximos[q],
    memoria: formatearMemoria(c.memoria.totalGb),
    tipoMemoria: c.memoria.tipo,
    util: formatearMemoria(Number((c.bytesUtiles / 1e9).toFixed(4))),
    tops: c.topsMax,
  }))

  const Contenido = tooltipRecharts((payload) => {
    const d = payload[0]?.payload as (typeof datos)[number] | undefined
    if (!d) return null
    return {
      titulo: d.completo,
      subtitulo: `${d.memoria} de ${d.tipoMemoria}`,
      filas: [
        {
          etiqueta: `Techo en ${NOMBRE_CUANTIZACION[q]}`,
          valor: `${formatearParametros(d.x)} parámetros`,
          color: t['series-1'],
        },
        { etiqueta: 'Memoria útil para pesos', valor: d.util },
        { etiqueta: 'Capacidad de cómputo', valor: d.tops === 0 ? 'sin IA' : `${d.tops} TOPS` },
      ],
    }
  })

  const referencias = MODELOS_REFERENCIA.filter((m) => REFERENCIAS_EN_GRAFICO.includes(m.nombre))

  return (
    <div className="space-y-6">
      {/* ------------------------- La explicación ------------------------ */}
      <section className="card p-4 sm:p-5">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          Qué modelos de IA soporta cada equipo
        </h3>

        <div className="mt-3 grid gap-5 lg:grid-cols-3">
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              La memoria decide si cabe
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Un modelo hay que cargarlo entero en memoria antes de poder usarlo. El techo de
              parámetros es una división: memoria disponible entre bytes que ocupa cada parámetro.
              Si no cabe, no hay <Termino id="tops" /> que lo arregle.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              Los TOPS deciden si va rápido
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Son dos preguntas distintas y se confunden siempre. Un equipo de 64 GB y pocos TOPS
              carga un modelo grande y responde con lentitud; uno de 275 TOPS y 8 GB ni siquiera
              llega a cargarlo.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              La cuantización es la palanca
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Bajar de <Termino id="fp32">FP16</Termino> a <Termino id="int8" /> parte el modelo por
              la mitad; bajar a INT4 lo parte en cuatro. Es lo que permite meter un modelo de 8 000
              millones en un equipo de borde, a cambio de algo de precisión.
            </p>
          </div>
        </div>

        <p
          className="mt-4 rounded-lg border border-[var(--border)] p-3 text-[13px] leading-relaxed"
          style={{ color: 'var(--status-serious)' }}
        >
          <span aria-hidden="true">⚠ </span>
          <strong className="text-[var(--text-primary)]">Es un techo, no una recomendación.</strong>{' '}
          <span className="text-[var(--text-secondary)]">
            El cálculo cuenta solo los pesos. Un modelo de lenguaje guarda además la{' '}
            <Termino id="cache-kv" />, que crece con la longitud del contexto y puede ocupar varios
            gigabytes más. Un modelo que llena el 95 % de la memoria cabe y funciona mal: para
            trabajar cómodo, apunta a la mitad del techo.
          </span>
        </p>
      </section>

      {/* --------------------------- El gráfico -------------------------- */}
      <ChartCard
        titulo={`Techo de parámetros en ${NOMBRE_CUANTIZACION[q]}`}
        descripcion={
          <>
            Modelo más grande que cabe en cada equipo, en número de parámetros. Eje logarítmico
            porque los techos recorren seis órdenes de magnitud. Las líneas marcan dos modelos
            conocidos, para situar la escala.
          </>
        }
        alto={340}
        accion={
          <div
            role="tablist"
            aria-label="Cuantización"
            className="flex rounded-lg border border-[var(--border)] p-0.5"
          >
            {CUANTIZACIONES.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={q === c}
                onClick={() => setQ(c)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  q === c
                    ? 'bg-[var(--series-1)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {NOMBRE_CUANTIZACION[c]}
              </button>
            ))}
          </div>
        }
        tabla={
          <DataTable
            columnas={[
              'Categoría',
              'Memoria total',
              'Útil para pesos',
              `Techo ${NOMBRE_CUANTIZACION[q]}`,
              'TOPS',
            ]}
            filas={datos.map((d) => [
              d.completo,
              d.memoria,
              d.util,
              formatearParametros(d.x),
              d.tops === 0 ? '—' : d.tops,
            ])}
          />
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 24, right: 60, bottom: 32, left: 4 }}>
            <CartesianGrid stroke={t['grid']} horizontal={false} />
            <XAxis
              type="number"
              dataKey="x"
              scale="log"
              domain={[1e4, 2e11]}
              ticks={[1e4, 1e6, 1e8, 1e10]}
              tickFormatter={(v: number) => formatearParametros(v)}
              tick={{ fill: t['text-muted'], fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: t['axis'] }}
            >
              <Label
                value="Parámetros que caben (escala logarítmica)"
                position="insideBottom"
                offset={-20}
                style={{ fill: t['text-muted'], fontSize: 11 }}
              />
            </XAxis>
            <YAxis
              type="category"
              dataKey="nombre"
              width={128}
              tick={{ fill: t['text-secondary'], fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <ZAxis range={[110, 110]} />
            {referencias.map((m) => (
              <ReferenceLine
                key={m.nombre}
                x={m.parametros}
                stroke={t['axis']}
                strokeWidth={1}
                label={{
                  value: m.nombre.replace('Modelo de lenguaje de ', ''),
                  position: 'top',
                  fill: t['text-muted'],
                  fontSize: 10,
                }}
              />
            ))}
            <Tooltip content={Contenido} cursor={{ stroke: t['grid'] }} />
            <Scatter
              data={datos}
              fill={t['series-1']}
              stroke={t['surface-1']}
              strokeWidth={2}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="x"
                position="right"
                offset={10}
                formatter={(v) => (typeof v === 'number' ? formatearParametros(v) : '')}
                fill={t['text-secondary']}
                fontSize={10}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)]">
          {NOMBRE_CUANTIZACION[q]}, {BYTES_POR_PARAMETRO[q]}{' '}
          {BYTES_POR_PARAMETRO[q] === 1 ? 'byte' : 'bytes'} por parámetro:{' '}
        </strong>
        {DESCRIPCION_CUANTIZACION[q]}
      </p>

      {/* --------------------- Detalle por categoría --------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {equipos.map((c) => (
          <article key={c.hardware.id} className="card p-4">
            <header className="mb-3">
              <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">
                {c.hardware.categoria}
              </h4>
              <p className="tnum text-[12px] text-[var(--text-secondary)]">
                {formatearMemoria(c.memoria.totalGb)} · {c.memoria.tipo} · techo de{' '}
                {formatearParametros(c.maximos[q])} en {NOMBRE_CUANTIZACION[q]}
              </p>
            </header>

            <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
              <TextoConGlosario texto={c.memoria.nota} />
            </p>

            <p className="mt-3 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              Ejecuta en la práctica
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {c.memoria.modelosTipicos.map((m, i) => (
                <li key={i}>
                  <TextoConGlosario texto={m} />
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              Lo que no puede
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              <TextoConGlosario texto={c.memoria.fueraDeAlcance} />
            </p>
          </article>
        ))}
      </div>

      {/* ------------------------ Regla graduada ------------------------- */}
      <section className="card p-4 sm:p-5">
        <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">
          Tamaño de los modelos de referencia
        </h4>
        <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Para situar los techos de arriba en algo reconocible. No es una lista de recomendaciones:
          es una regla graduada.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th scope="col" className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">
                  Modelo
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold text-[var(--text-secondary)]">
                  Parámetros
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold text-[var(--text-secondary)]">
                  Ocupa en {NOMBRE_CUANTIZACION[q]}
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">
                  Para qué sirve
                </th>
              </tr>
            </thead>
            <tbody>
              {MODELOS_REFERENCIA.map((m) => (
                <tr key={m.nombre} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-3 text-[var(--text-primary)]">{m.nombre}</td>
                  <td className="tnum py-2 pr-3 text-right text-[var(--text-secondary)]">
                    {formatearParametros(m.parametros)}
                  </td>
                  <td className="tnum py-2 pr-3 text-right text-[var(--text-secondary)]">
                    {formatearMemoria(
                      Number(((m.parametros * BYTES_POR_PARAMETRO[q]) / 1e9).toFixed(4)),
                    )}
                  </td>
                  <td className="py-2 pr-3 text-[var(--text-secondary)]">{m.nota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
