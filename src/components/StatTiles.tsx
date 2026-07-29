import type { ReactNode } from 'react'
import { abrev, topsPorCien, topsPorWatt } from '../data/hardware'
import { metricasGlobales } from '../lib/scoring'
import { Termino, TextoConGlosario } from './Glosario'

/**
 * Cifras de encabezado.
 *
 * Cuatro números que no merecen un gráfico: cada uno es un solo valor, y un
 * gráfico de una barra no es un gráfico. Figuras proporcionales (sin
 * tabular-nums) porque son números grandes aislados, no columnas.
 */
function Tile({
  etiqueta,
  valor,
  unidad,
  nota,
}: {
  etiqueta: string
  valor: string
  /** Admite JSX para marcar la unidad en el glosario. */
  unidad?: ReactNode
  nota: ReactNode
}) {
  return (
    <div className="card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {etiqueta}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-[28px] font-semibold leading-none text-[var(--text-primary)]">
          {valor}
        </span>
        {unidad && (
          <span className="text-[13px] font-medium text-[var(--text-secondary)]">{unidad}</span>
        )}
      </div>
      <p className="mt-2 text-[12px] leading-snug text-[var(--text-secondary)]">{nota}</p>
    </div>
  )
}

export function StatTiles() {
  const m = metricasGlobales()

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        etiqueta="Rango de inversión"
        valor={`$${m.precioMin} – $${m.precioMax.toLocaleString('es')}`}
        nota={`${m.total} categorías de hardware, de un microcontrolador a una GPU de entrenamiento.`}
      />
      <Tile
        etiqueta="Salto de capacidad de IA"
        valor={`${m.rangoTopsFactor}×`}
        nota={
          <>
            Entre el techo de <Termino id="tops" /> más bajo y el más alto de las {m.conIa}{' '}
            categorías con aceleración de IA.
          </>
        }
      />
      <Tile
        etiqueta="Mejor eficiencia"
        valor={topsPorWatt(m.liderEficiencia).toFixed(1)}
        unidad={<Termino id="tops-watt" />}
        nota={
          <TextoConGlosario
            texto={`${abrev(m.liderEficiencia)} — la opción para batería o refrigeración pasiva.`}
          />
        }
      />
      <Tile
        etiqueta="Mejor relación precio/IA"
        valor={topsPorCien(m.liderValor).toFixed(1)}
        unidad={<><Termino id="tops" /> por $100</>}
        nota={
          <TextoConGlosario
            texto={`${abrev(m.liderValor)} — el mayor rendimiento de inferencia por dólar invertido.`}
          />
        }
      />
    </div>
  )
}
