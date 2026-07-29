import type { TooltipContentProps } from 'recharts'

export interface FilaTooltip {
  etiqueta: string
  valor: string
  /** Cuadro de color junto a la fila. El texto nunca lleva el color de la serie. */
  color?: string
}

/**
 * Tooltip con los tokens del tema.
 *
 * El texto usa tinta primaria/secundaria; el color de serie va solo en el
 * cuadrito, nunca en las letras.
 */
export function VizTooltip({
  activo,
  titulo,
  subtitulo,
  filas,
}: {
  activo: boolean
  titulo: string
  subtitulo?: string
  filas: FilaTooltip[]
}) {
  if (!activo) return null
  return (
    <div className="viz-tooltip">
      <div className="font-semibold">{titulo}</div>
      {subtitulo && (
        <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{subtitulo}</div>
      )}
      <div className="mt-1.5 space-y-1">
        {filas.map((f) => (
          <div key={f.etiqueta} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              {f.color && (
                <span
                  aria-hidden="true"
                  className="inline-block size-2 rounded-full"
                  style={{ background: f.color }}
                />
              )}
              {f.etiqueta}
            </span>
            <span className="tnum font-medium text-[var(--text-primary)]">{f.valor}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Adaptador para la prop `content` de Recharts.
 *
 * Se usan los genéricos por defecto de `TooltipContentProps` a propósito:
 * en Recharts 3 el tipo `ContentType` es invariante en ellos, así que
 * fijarlos a `<number, string>` haría incompatible la función.
 */
export function tooltipRecharts(
  render: (payload: NonNullable<TooltipContentProps['payload']>) => {
    titulo: string
    subtitulo?: string
    filas: FilaTooltip[]
  } | null,
) {
  return function Contenido({ active, payload }: TooltipContentProps) {
    if (!active || !payload || payload.length === 0) return null
    const datos = render(payload)
    if (!datos) return null
    return <VizTooltip activo {...datos} />
  }
}
