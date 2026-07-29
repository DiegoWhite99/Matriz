import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  GLOSARIO_AGRUPADO,
  glosarioPorId,
  tituloDe,
  type EntradaGlosario,
} from '../data/glosario'
import { segmentarGlosario } from '../lib/glosarioTexto'

/* ------------------------------------------------------------------ */
/* Término con definición                                              */
/* ------------------------------------------------------------------ */

const MARGEN = 12
const ANCHO_MAX = 320

/**
 * Palabra con marcador de definición.
 *
 * El marcador es un botón real, así que se abre con teclado igual que con el
 * ratón, y la definición se sitúa con posición fija en un portal: dentro de
 * `MatrixTable` el contenedor tiene scroll horizontal y un popover absoluto
 * quedaría recortado.
 *
 * Nada aquí es la única vía de acceso a la definición: `GlosarioPanel` las
 * lista todas como texto plano.
 */
export function Termino({ id, children }: { id: string; children?: ReactNode }) {
  const entrada = glosarioPorId.get(id)
  // Un id desconocido no debe romper el render: se degrada a texto llano.
  // La comprobación va en este envoltorio sin hooks, para que el componente
  // interno los invoque siempre en el mismo orden.
  if (!entrada) return <>{children ?? id}</>
  return <TerminoInterno entrada={entrada}>{children}</TerminoInterno>
}

function TerminoInterno({
  entrada,
  children,
}: {
  entrada: EntradaGlosario
  children?: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const [fijado, setFijado] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const disparador = useRef<HTMLButtonElement>(null)
  const globo = useRef<HTMLDivElement>(null)
  const temporizador = useRef<number | undefined>(undefined)
  const popId = useId()

  const cancelar = () => window.clearTimeout(temporizador.current)

  const abrir = useCallback(() => {
    cancelar()
    const r = disparador.current?.getBoundingClientRect()
    if (!r) return
    setPos({ top: r.bottom + 8, left: r.left })
    setAbierto(true)
  }, [])

  const cerrar = useCallback((forzar = false) => {
    cancelar()
    if (fijado && !forzar) return
    setAbierto(false)
    setFijado(false)
  }, [fijado])

  // Corrige la posición ya medida: en un efecto de layout, antes de pintar,
  // así que no se ve el salto.
  useLayoutEffect(() => {
    if (!abierto || !pos) return
    const caja = globo.current?.getBoundingClientRect()
    const r = disparador.current?.getBoundingClientRect()
    if (!caja || !r) return

    let left = r.left
    let top = r.bottom + 8
    if (left + caja.width > window.innerWidth - MARGEN) {
      left = window.innerWidth - caja.width - MARGEN
    }
    if (left < MARGEN) left = MARGEN
    if (top + caja.height > window.innerHeight - MARGEN) {
      const arriba = r.top - caja.height - 8
      top = arriba > MARGEN ? arriba : Math.max(MARGEN, window.innerHeight - caja.height - MARGEN)
    }
    if (Math.round(top) !== Math.round(pos.top) || Math.round(left) !== Math.round(pos.left)) {
      setPos({ top, left })
    }
  }, [abierto, pos])

  useEffect(() => {
    if (!abierto) return

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrar(true)
        disparador.current?.focus()
      }
    }
    const fuera = (e: PointerEvent) => {
      const t = e.target as Node
      if (!disparador.current?.contains(t) && !globo.current?.contains(t)) cerrar(true)
    }
    // Al desplazar o redimensionar, la posición medida deja de valer.
    const mover = () => cerrar(true)

    document.addEventListener('keydown', alTeclear)
    document.addEventListener('pointerdown', fuera)
    window.addEventListener('scroll', mover, true)
    window.addEventListener('resize', mover)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.removeEventListener('pointerdown', fuera)
      window.removeEventListener('scroll', mover, true)
      window.removeEventListener('resize', mover)
    }
  }, [abierto, cerrar])

  useEffect(() => cancelar, [])

  return (
    <>
      <button
        ref={disparador}
        type="button"
        aria-expanded={abierto}
        aria-describedby={abierto ? popId : undefined}
        onClick={() => {
          if (abierto && fijado) {
            cerrar(true)
          } else {
            setFijado(true)
            abrir()
          }
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === 'touch') return
          temporizador.current = window.setTimeout(abrir, 120)
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'touch') return
          cancelar()
          temporizador.current = window.setTimeout(() => cerrar(), 180)
        }}
        onFocus={abrir}
        onBlur={() => cerrar()}
        className="inline cursor-help rounded-sm text-left underline decoration-dotted decoration-from-font underline-offset-2 hover:decoration-solid"
        style={{ textDecorationColor: 'var(--text-muted)' }}
      >
        {children ?? tituloDe(entrada)}
        <sup className="ml-0.5 inline-flex select-none align-super">
          <span
            aria-hidden="true"
            className="inline-flex size-[13px] items-center justify-center rounded-full border border-[var(--axis)] text-[9px] font-semibold leading-none text-[var(--text-muted)]"
          >
            i
          </span>
        </sup>
        <span className="sr-only"> (ver definición)</span>
      </button>

      {abierto &&
        pos &&
        createPortal(
          <div
            ref={globo}
            id={popId}
            role="tooltip"
            onPointerEnter={cancelar}
            onPointerLeave={() => cerrar()}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: `min(${ANCHO_MAX}px, calc(100vw - ${MARGEN * 2}px))`,
              zIndex: 60,
            }}
            className="viz-tooltip !p-3"
          >
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              {tituloDe(entrada)}
              {entrada.expansion && (
                <span className="ml-1.5 font-normal text-[var(--text-muted)]">
                  · {entrada.expansion}
                </span>
              )}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              {entrada.definicion}
            </p>
            {entrada.implicacion && (
              <p className="mt-2 border-t border-[var(--border)] pt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">Al elegir: </span>
                {entrada.implicacion}
              </p>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Marcado automático de prosa                                         */
/* ------------------------------------------------------------------ */

/** Prosa con los términos del glosario ya marcados. */
export function TextoConGlosario({ texto }: { texto: string }) {
  const partes = useMemo(() => segmentarGlosario(texto), [texto])
  return (
    <>
      {partes.map((p, i) =>
        typeof p === 'string' ? (
          p
        ) : (
          <Termino key={`${p.id}-${i}`} id={p.id}>
            {p.texto}
          </Termino>
        ),
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Panel del glosario completo                                         */
/* ------------------------------------------------------------------ */

function Entrada({ e }: { e: EntradaGlosario }) {
  return (
    <div>
      <dt className="text-[13px] font-semibold text-[var(--text-primary)]">
        {tituloDe(e)}
        {e.expansion && (
          <span className="ml-1.5 font-normal text-[var(--text-muted)]">· {e.expansion}</span>
        )}
      </dt>
      <dd className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        {e.definicion}
        {e.implicacion && (
          <>
            {' '}
            <span className="font-medium text-[var(--text-primary)]">Al elegir:</span>{' '}
            {e.implicacion}
          </>
        )}
      </dd>
    </div>
  )
}

/**
 * Glosario completo como texto plano.
 *
 * Es la vía de acceso que no depende del ratón: ninguna definición debe estar
 * disponible solo al pasar el cursor.
 */
export function GlosarioPanel() {
  return (
    <section className="card overflow-hidden">
      <details>
        <summary className="cursor-pointer list-none p-4 sm:p-5">
          <span className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-[15px] font-semibold text-[var(--text-primary)]">
                Glosario
              </span>
              <span className="mt-1 block text-[13px] text-[var(--text-secondary)]">
                Las {GLOSARIO_AGRUPADO.reduce((n, g) => n + g.entradas.length, 0)} siglas y términos
                que aparecen en la matriz, con lo que implica cada uno al elegir.
              </span>
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"
            >
              Abrir / cerrar
            </span>
          </span>
        </summary>

        <div className="space-y-6 border-t border-[var(--border)] p-4 sm:p-5">
          {GLOSARIO_AGRUPADO.map((grupo) => (
            <div key={grupo.categoria}>
              <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {grupo.nombre}
              </h4>
              <dl className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
                {grupo.entradas.map((e) => (
                  <Entrada key={e.id} e={e} />
                ))}
              </dl>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
