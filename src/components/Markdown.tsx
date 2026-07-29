import { Fragment, type ReactNode } from 'react'

/**
 * Renderizador mínimo de Markdown para los informes.
 *
 * Construye nodos de React en vez de inyectar HTML, así que el texto del
 * modelo nunca se interpreta como marcado. Cubre lo que el agente produce:
 * encabezados, énfasis, código en línea, listas, citas y tablas.
 */

/** Divide una línea en texto, **negrita** y `código`. */
function inline(texto: string, clave: string): ReactNode[] {
  const partes: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let ultimo = 0
  let m: RegExpExecArray | null
  let i = 0

  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index))
    const t = m[0]
    if (t.startsWith('**')) {
      partes.push(
        <strong key={`${clave}-b${i}`} className="font-semibold text-[var(--text-primary)]">
          {t.slice(2, -2)}
        </strong>,
      )
    } else {
      partes.push(
        <code
          key={`${clave}-c${i}`}
          className="rounded bg-[var(--surface-page)] px-1 py-0.5 text-[0.9em]"
        >
          {t.slice(1, -1)}
        </code>,
      )
    }
    ultimo = m.index + t.length
    i++
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo))
  return partes
}

const esSeparadorTabla = (l: string) => /^\|[\s:|-]+\|$/.test(l.trim())
const celdas = (l: string) =>
  l
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())

export function Markdown({ texto }: { texto: string }) {
  const lineas = texto.split('\n')
  const bloques: ReactNode[] = []
  let i = 0

  while (i < lineas.length) {
    const linea = lineas[i]
    const recortada = linea.trim()

    if (recortada === '') {
      i++
      continue
    }

    // Tabla: cabecera + separador + filas.
    if (recortada.startsWith('|') && esSeparadorTabla(lineas[i + 1] ?? '')) {
      const cabecera = celdas(recortada)
      const filas: string[][] = []
      i += 2
      while (i < lineas.length && lineas[i].trim().startsWith('|')) {
        filas.push(celdas(lineas[i]))
        i++
      }
      bloques.push(
        <div key={`t${i}`} className="my-4 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {cabecera.map((c, j) => (
                  <th
                    key={j}
                    scope="col"
                    className={`py-2 pr-3 font-semibold text-[var(--text-secondary)] ${
                      j === 0 ? 'text-left' : 'text-right'
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f, j) => (
                <tr key={j} className="border-b border-[var(--border)] last:border-0">
                  {f.map((c, k) => (
                    <td
                      key={k}
                      className={`py-2 pr-3 ${
                        k === 0
                          ? 'text-left text-[var(--text-primary)]'
                          : 'tnum text-right text-[var(--text-secondary)]'
                      }`}
                    >
                      {inline(c, `t${j}-${k}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // Encabezados.
    const h = /^(#{1,4})\s+(.*)$/.exec(recortada)
    if (h) {
      const nivel = h[1].length
      const contenido = inline(h[2], `h${i}`)
      const clases: Record<number, string> = {
        1: 'mt-1 mb-3 text-xl font-semibold tracking-tight',
        2: 'mt-6 mb-2 text-base font-semibold',
        3: 'mt-5 mb-2 text-[15px] font-semibold',
        4: 'mt-4 mb-1.5 text-[14px] font-semibold',
      }
      const Tag = (`h${Math.min(nivel + 1, 5)}` as unknown) as 'h2'
      bloques.push(
        <Tag key={`h${i}`} className={`${clases[nivel]} text-[var(--text-primary)]`}>
          {contenido}
        </Tag>,
      )
      i++
      continue
    }

    // Cita.
    if (recortada.startsWith('>')) {
      const partes: string[] = []
      while (i < lineas.length && lineas[i].trim().startsWith('>')) {
        partes.push(lineas[i].trim().replace(/^>\s?/, ''))
        i++
      }
      bloques.push(
        <blockquote
          key={`q${i}`}
          className="my-3 border-l-2 border-[var(--axis)] pl-3 text-[13px] italic text-[var(--text-secondary)]"
        >
          {inline(partes.join(' '), `q${i}`)}
        </blockquote>,
      )
      continue
    }

    // Listas.
    const vinetaRe = /^([-*]|\d+\.)\s+/
    if (vinetaRe.test(recortada)) {
      const ordenada = /^\d+\./.test(recortada)
      const items: string[] = []
      while (i < lineas.length && vinetaRe.test(lineas[i].trim())) {
        items.push(lineas[i].trim().replace(vinetaRe, ''))
        i++
      }
      const Tag = ordenada ? 'ol' : 'ul'
      bloques.push(
        <Tag
          key={`l${i}`}
          className={`my-3 space-y-1.5 pl-5 text-[14px] leading-relaxed text-[var(--text-secondary)] ${
            ordenada ? 'list-decimal' : 'list-disc'
          }`}
        >
          {items.map((it, j) => (
            <li key={j}>{inline(it, `l${i}-${j}`)}</li>
          ))}
        </Tag>,
      )
      continue
    }

    // Párrafo: acumula hasta la línea vacía.
    const parrafo: string[] = []
    while (
      i < lineas.length &&
      lineas[i].trim() !== '' &&
      !/^(#{1,4}\s|>|[-*]\s|\d+\.\s|\|)/.test(lineas[i].trim())
    ) {
      parrafo.push(lineas[i].trim())
      i++
    }
    if (parrafo.length) {
      bloques.push(
        <p key={`p${i}`} className="my-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
          {inline(parrafo.join(' '), `p${i}`)}
        </p>,
      )
    }
  }

  return <div className="max-w-prose">{bloques.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>
}
