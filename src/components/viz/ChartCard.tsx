import { useState, type ReactNode } from 'react'

/**
 * Contenedor de gráfico con vista de tabla obligatoria.
 *
 * La tabla no es un extra: tres slots de la paleta quedan bajo 3:1 de
 * contraste en modo claro, y la regla de alivio exige etiquetas visibles o
 * vista de tabla. Además ningún valor debe ser accesible solo por tooltip.
 */
export function ChartCard({
  titulo,
  descripcion,
  children,
  tabla,
  alto = 320,
  accion,
}: {
  titulo: string
  /** Admite JSX para poder marcar términos del glosario en la prosa. */
  descripcion?: ReactNode
  children: ReactNode
  tabla: ReactNode
  /** Alto del área de trazado. El contenedor crece para incluir el eje X. */
  alto?: number
  accion?: ReactNode
}) {
  const [vista, setVista] = useState<'grafico' | 'tabla'>('grafico')

  return (
    <section className="card p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-tight text-[var(--text-primary)]">
            {titulo}
          </h3>
          {descripcion && (
            <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {descripcion}
            </p>
          )}
        </div>
        <div className="no-print flex shrink-0 items-center gap-2">
          {accion}
          <div
            role="tablist"
            aria-label="Vista de los datos"
            className="flex rounded-lg border border-[var(--border)] p-0.5"
          >
            {(['grafico', 'tabla'] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={vista === v}
                onClick={() => setVista(v)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  vista === v
                    ? 'bg-[var(--series-1)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {v === 'grafico' ? 'Gráfico' : 'Tabla'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {vista === 'grafico' ? (
        <div style={{ height: alto }} className="w-full">
          {children}
        </div>
      ) : (
        <div className="overflow-x-auto">{tabla}</div>
      )}
    </section>
  )
}

/** Tabla compacta reutilizable para las vistas de tabla. */
export function DataTable({
  columnas,
  filas,
}: {
  /** Admite JSX para marcar términos del glosario en las cabeceras. */
  columnas: ReactNode[]
  filas: (string | number)[][]
}) {
  return (
    <table className="w-full min-w-[520px] border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-[var(--border)]">
          {columnas.map((c, i) => (
            <th
              key={i}
              scope="col"
              className={`py-2 pr-3 font-semibold text-[var(--text-secondary)] ${
                i === 0 ? 'text-left' : 'text-right'
              }`}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr key={i} className="border-b border-[var(--border)] last:border-0">
            {f.map((celda, j) => (
              <td
                key={j}
                className={`py-2 pr-3 ${
                  j === 0
                    ? 'text-left text-[var(--text-primary)]'
                    : 'tnum text-right text-[var(--text-secondary)]'
                }`}
              >
                {celda}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
