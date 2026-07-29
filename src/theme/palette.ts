/**
 * Tokens de visualización leídos desde CSS.
 *
 * Recharts necesita colores como strings en props de JS, no como variables
 * CSS, así que se resuelven en tiempo de ejecución contra el <html> actual.
 * Un cambio de tema vuelve a resolverlos (ver `useVizTokens`).
 *
 * No introducir hexes nuevos aquí: la paleta de index.css está validada como
 * conjunto (banda de luminosidad, croma, separación CVD y contraste) y el
 * ORDEN de los slots es parte de esa validación.
 */

import { useEffect, useState } from 'react'

const NOMBRES = [
  'surface-1',
  'text-primary',
  'text-secondary',
  'text-muted',
  'grid',
  'axis',
  'series-1',
  'series-2',
  'series-3',
  'series-4',
  'series-5',
  'series-6',
  'series-7',
  'series-8',
  'seq-200',
  'seq-350',
  'seq-450',
  'seq-600',
  'status-good',
  'status-warning',
  'status-critical',
] as const

export type TokenName = (typeof NOMBRES)[number]
export type VizTokens = Record<TokenName, string>

function leerTokens(): VizTokens {
  const cs = getComputedStyle(document.documentElement)
  const out = {} as VizTokens
  for (const n of NOMBRES) out[n] = cs.getPropertyValue(`--${n}`).trim()
  return out
}

/** Los ocho slots categóricos en su orden validado. */
export function serieColores(t: VizTokens): string[] {
  return [
    t['series-1'],
    t['series-2'],
    t['series-3'],
    t['series-4'],
    t['series-5'],
    t['series-6'],
    t['series-7'],
    t['series-8'],
  ]
}

/**
 * Color de una categoría por su índice en la matriz.
 *
 * El color sigue a la entidad, nunca a su posición en el ranking: un filtro
 * que cambie el número de series no debe repintar a las supervivientes.
 */
export function colorDeIndice(t: VizTokens, indice: number): string {
  const c = serieColores(t)
  return c[indice % c.length]
}

export function useVizTokens(): VizTokens {
  const [tokens, setTokens] = useState<VizTokens>(() =>
    typeof document === 'undefined' ? ({} as VizTokens) : leerTokens(),
  )

  useEffect(() => {
    const refrescar = () => setTokens(leerTokens())
    refrescar()
    const obs = new MutationObserver(refrescar)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  return tokens
}
