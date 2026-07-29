import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CONCEPTOS_BASE,
  CONCEPTOS_COLUMNA,
  conceptoBasePorId,
  conceptoColumnaPorId,
  type ConceptoBase,
  type ConceptoColumna,
} from '../data/conceptos'
import {
  GLOSARIO_AGRUPADO,
  NOMBRE_CATEGORIA,
  glosarioPorId,
  tituloDe,
  type CategoriaGlosario,
  type EntradaGlosario,
} from '../data/glosario'
import { TextoConGlosario } from './Glosario'

/**
 * Tablero de conceptos, encima de la matriz.
 *
 * Es lo único que va por delante de la tabla, y va por delante porque la tabla
 * no se explica sola: cabeceras de dos palabras, siglas en cada celda y once
 * columnas que cruzan cuatro módulos de datos. Quien llega sin conocer la jerga
 * la lee mal, y la lee mal antes de llegar al glosario del final.
 *
 * ------------------------------------------------------------------
 * Está diseñado para quien no sabe nada del tema
 * ------------------------------------------------------------------
 *
 * Tres decisiones que salen de ahí:
 *
 * 1. **Empieza por preguntas, no por siglas.** El primer grupo del menú son
 *    ocho preguntas en el orden en que se hacen —para qué sirve esto, qué es un
 *    modelo, qué diferencia hay entre entrenar e inferir— cada una con una
 *    comparación cotidiana. Explicar «TOPS» a quien no sabe qué es inferir no
 *    explica nada.
 * 2. **Menú vertical y no una nube de botones.** Una pregunta entera no cabe en
 *    una pastilla, y un menú deja ver la estructura: cinco grupos, y dentro el
 *    orden en que conviene leerlos.
 * 3. **Se puede recorrer sin decidir nada.** Los botones «Anterior» y
 *    «Siguiente» llevan de la mano por los 67 conceptos en orden, abriendo el
 *    grupo que toque. Quien no sabe qué buscar no tiene que elegir.
 *
 * Las animaciones viven en `index.css` y son deliberadamente cortas: mueven
 * opacidad y transformación, nunca el tamaño de la caja, para que el contenido
 * de debajo no salte mientras se lee. Todas se apagan con
 * `prefers-reduced-motion`.
 */

type GrupoId = 'base' | 'columnas' | CategoriaGlosario

interface Grupo {
  id: GrupoId
  nombre: string
  /** Para qué sirve el grupo, en una línea, dentro del propio menú. */
  pista: string
}

const GRUPOS: Grupo[] = [
  { id: 'base', nombre: 'Empieza aquí', pista: 'Lo básico, sin siglas' },
  { id: 'columnas', nombre: 'Las columnas de la tabla', pista: 'Qué mide cada cabecera' },
  { id: 'unidades', nombre: NOMBRE_CATEGORIA.unidades, pista: 'Las cifras y sus unidades' },
  { id: 'arquitectura', nombre: NOMBRE_CATEGORIA.arquitectura, pista: 'Tipos de equipo y de chip' },
  { id: 'industrial', nombre: NOMBRE_CATEGORIA.industrial, pista: 'El vocabulario de planta' },
]

interface Item {
  /** Prefijado por tipo: los ids de los tres orígenes se solapan. */
  id: string
  grupo: GrupoId
  etiqueta: string
  /** La unidad de la columna o la expansión de la sigla. */
  sufijo?: string
  /** Número de paso, solo en el grupo guiado. */
  paso?: number
  /** Todo el texto contra el que filtra el buscador. */
  busqueda: string
}

/**
 * Los 67 conceptos en un solo array y en orden de lectura.
 *
 * Plano y no anidado a propósito: es lo que hace que «Siguiente» pueda cruzar
 * de un grupo al siguiente sin lógica especial en los bordes.
 */
const ITEMS: Item[] = [
  ...CONCEPTOS_BASE.map((c, i) => ({
    id: `base:${c.id}`,
    grupo: 'base' as GrupoId,
    etiqueta: c.pregunta,
    paso: i + 1,
    busqueda: `${c.pregunta} ${c.enUnaFrase} ${c.analogia}`,
  })),
  ...CONCEPTOS_COLUMNA.map((c) => ({
    id: `col:${c.id}`,
    grupo: 'columnas' as GrupoId,
    etiqueta: c.titulo,
    sufijo: c.unidad,
    busqueda: `${c.titulo} ${c.unidad ?? ''} ${c.llano} ${c.queMide}`,
  })),
  ...GLOSARIO_AGRUPADO.flatMap((g) =>
    g.entradas.map((e) => ({
      id: `glo:${e.id}`,
      grupo: g.categoria as GrupoId,
      etiqueta: tituloDe(e),
      sufijo: e.expansion,
      busqueda: `${e.formas.join(' ')} ${e.expansion ?? ''} ${e.definicion}`,
    })),
  ),
]

const itemPorId = new Map(ITEMS.map((it) => [it.id, it]))

type Detalle =
  | { tipo: 'base'; c: ConceptoBase; paso: number }
  | { tipo: 'columna'; c: ConceptoColumna; indice: number }
  | { tipo: 'termino'; e: EntradaGlosario }

function detalleDe(id: string): Detalle | null {
  const [tipo, clave] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)]
  if (tipo === 'base') {
    const c = conceptoBasePorId.get(clave)
    return c ? { tipo: 'base', c, paso: CONCEPTOS_BASE.indexOf(c) + 1 } : null
  }
  if (tipo === 'col') {
    const c = conceptoColumnaPorId.get(clave)
    return c ? { tipo: 'columna', c, indice: CONCEPTOS_COLUMNA.indexOf(c) } : null
  }
  const e = glosarioPorId.get(clave)
  return e ? { tipo: 'termino', e } : null
}

/** Sin tildes y en minúsculas: nadie escribe «cuantización» con tilde al buscar. */
const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

const sinMovimiento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
      {children}
    </p>
  )
}

function Bloque({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {etiqueta}
      </dt>
      <dd className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        {children}
      </dd>
    </div>
  )
}

/** La idea en lenguaje corriente, destacada sobre el desarrollo técnico. */
function Llano({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div
      className="mt-3 rounded-lg border-l-2 bg-[var(--surface-1)] p-3"
      style={{ borderColor: 'var(--series-1)' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {etiqueta}
      </p>
      <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-primary)]">{children}</p>
    </div>
  )
}

/** Triángulo dibujado: los glifos del sistema a 10 px no se leen como «se abre». */
function Chevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      viewBox="0 0 8 8"
      aria-hidden="true"
      className={`size-2 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
        abierto ? 'rotate-90' : ''
      }`}
    >
      <path d="M2 0.5 L6.5 4 L2 7.5 Z" fill="currentColor" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Tablero                                                             */
/* ------------------------------------------------------------------ */

export function TableroConceptos() {
  const [id, setId] = useState(ITEMS[0].id)
  const [abiertos, setAbiertos] = useState<Set<GrupoId>>(() => new Set<GrupoId>(['base']))
  const [filtro, setFiltro] = useState('')
  const [menuMovil, setMenuMovil] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const montado = useRef(false)

  const detalle = useMemo(() => detalleDe(id), [id])
  const indice = useMemo(() => ITEMS.findIndex((it) => it.id === id), [id])
  const anterior = indice > 0 ? ITEMS[indice - 1] : null
  const siguiente = indice < ITEMS.length - 1 ? ITEMS[indice + 1] : null

  /** Resultados por grupo. Con el buscador vacío, el menú entero. */
  const porGrupo = useMemo(() => {
    const q = normalizar(filtro.trim())
    const coincide = (it: Item) => q === '' || normalizar(it.busqueda).includes(q)
    return GRUPOS.map((g) => ({
      grupo: g,
      items: ITEMS.filter((it) => it.grupo === g.id && coincide(it)),
    }))
  }, [filtro])

  const buscando = filtro.trim() !== ''
  const encontrados = porGrupo.reduce((n, g) => n + g.items.length, 0)

  /*
    En pantalla ancha el panel está al lado y no hay nada que desplazar; en
    móvil queda debajo del menú y puede caer fuera de la vista. `block: 'nearest'`
    resuelve las dos: si ya se ve, no mueve nada.
  */
  useEffect(() => {
    if (!montado.current) {
      montado.current = true
      return
    }
    panel.current?.scrollIntoView({
      block: 'nearest',
      behavior: sinMovimiento() ? 'auto' : 'smooth',
    })
  }, [id])

  /** Elegir un concepto abre su grupo: si no, el menú no muestra dónde estás. */
  function elegir(itemId: string) {
    const it = itemPorId.get(itemId)
    if (!it) return
    setId(itemId)
    setAbiertos((prev) => new Set(prev).add(it.grupo))
  }

  function alternarGrupo(g: GrupoId) {
    setAbiertos((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(g)) siguiente.delete(g)
      else siguiente.add(g)
      return siguiente
    })
  }

  return (
    <section className="no-print card overflow-hidden">
      <header className="border-b border-[var(--border)] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
              Empieza por aquí: qué significa todo lo de abajo
            </h3>
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[var(--text-secondary)]">
              La tabla que viene después compara ocho clases de computador para poner inteligencia
              artificial en una fábrica. Si es la primera vez que lees algo así,{' '}
              <strong className="text-[var(--text-primary)]">
                pulsa «¿Para qué sirve esta página?»
              </strong>{' '}
              y ve dando a «Siguiente»: son {CONCEPTOS_BASE.length} preguntas cortas y después ya
              están las {CONCEPTOS_COLUMNA.length} columnas y las siglas, cada una con lo que implica
              al elegir.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFiltro('')
              elegir(ITEMS[0].id)
            }}
            className="shrink-0 rounded-lg border border-[var(--text-primary)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-page)]"
          >
            Llévame de la mano
          </button>
        </div>
      </header>

      {/* En móvil el menú empieza plegado: lo primero tiene que ser la
          explicación, no una lista de 67 nombres. */}
      <div className="border-b border-[var(--border)] p-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMenuMovil((v) => !v)}
          aria-expanded={menuMovil}
          aria-controls="menu-conceptos"
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[13px] font-medium text-[var(--text-primary)]"
        >
          <span>
            {menuMovil ? 'Ocultar la lista' : `Ver la lista de ${ITEMS.length} conceptos`}
          </span>
          <Chevron abierto={menuMovil} />
        </button>
      </div>

      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ---------------------------------------------------------- */}
        {/* Menú                                                       */}
        {/* ---------------------------------------------------------- */}
        <nav
          id="menu-conceptos"
          aria-label="Conceptos"
          className={`${menuMovil ? 'block' : 'hidden'} border-b border-[var(--border)] p-3 lg:block lg:max-h-[620px] lg:overflow-y-auto lg:border-b-0 lg:border-r`}
        >
          <div className="relative">
            <label htmlFor="buscar-concepto" className="sr-only">
              Buscar un concepto
            </label>
            <input
              id="buscar-concepto"
              type="search"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar: TOPS, memoria, borde…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          {buscando && (
            <p className="anim-aparecer mt-2 text-[12px] text-[var(--text-muted)]">
              {encontrados === 0
                ? 'Nada con esas letras. Prueba con menos.'
                : `${encontrados} de ${ITEMS.length} conceptos`}
            </p>
          )}

          <div className="mt-3 space-y-1">
            {porGrupo.map(({ grupo, items }) => {
              // Buscando, los grupos con resultados se abren solos: obligar a
              // desplegar a mano lo que ya has filtrado es un paso de más.
              const abierto = buscando ? items.length > 0 : abiertos.has(grupo.id)
              if (buscando && items.length === 0) return null

              return (
                <div key={grupo.id}>
                  <button
                    type="button"
                    onClick={() => alternarGrupo(grupo.id)}
                    aria-expanded={abierto}
                    className="item-menu flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--surface-page)]"
                  >
                    <Chevron abierto={abierto} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold leading-snug text-[var(--text-primary)]">
                        {grupo.nombre}
                      </span>
                      <span className="block truncate text-[11px] leading-snug text-[var(--text-muted)]">
                        {grupo.pista}
                      </span>
                    </span>
                    <span className="tnum shrink-0 text-[11px] text-[var(--text-muted)]">
                      {items.length}
                    </span>
                  </button>

                  <div className="acordeon" data-abierto={abierto}>
                    <div>
                      {/* `inert` mientras está plegado: si no, el tabulador
                          recorre 67 botones invisibles. */}
                      <ul className="pb-1 pl-4" inert={!abierto}>
                        {items.map((it, i) => {
                          const activo = it.id === id
                          return (
                            <li
                              key={it.id}
                              className={abierto ? 'anim-lateral' : undefined}
                              style={
                                abierto
                                  ? { animationDelay: `${Math.min(i, 12) * 18}ms` }
                                  : undefined
                              }
                            >
                              <button
                                type="button"
                                onClick={() => elegir(it.id)}
                                aria-current={activo ? 'true' : undefined}
                                title={it.sufijo ? `${it.etiqueta} · ${it.sufijo}` : it.etiqueta}
                                className={`item-menu flex w-full items-baseline gap-2 border-l-2 py-1.5 pl-2.5 pr-2 text-left transition-colors ${
                                  activo
                                    ? 'border-[var(--series-1)] bg-[var(--surface-page)]'
                                    : 'border-transparent hover:border-[var(--axis)] hover:bg-[var(--surface-page)]'
                                }`}
                              >
                                {it.paso && (
                                  <span className="tnum shrink-0 text-[11px] font-semibold text-[var(--text-muted)]">
                                    {it.paso}
                                  </span>
                                )}
                                <span
                                  className={`min-w-0 flex-1 truncate text-[12.5px] leading-snug ${
                                    activo
                                      ? 'font-semibold text-[var(--text-primary)]'
                                      : 'text-[var(--text-secondary)]'
                                  }`}
                                >
                                  {it.etiqueta}
                                  {it.sufijo && (
                                    <span className="ml-1.5 font-normal text-[var(--text-muted)]">
                                      {it.sufijo}
                                    </span>
                                  )}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </nav>

        {/* ---------------------------------------------------------- */}
        {/* Panel                                                      */}
        {/* ---------------------------------------------------------- */}
        <div ref={panel} className="flex flex-col bg-[var(--surface-page)]">
          {/* La barra dice cuánto queda sin gastar una línea de texto. */}
          <div className="h-0.5 w-full bg-[var(--grid)]">
            <div
              className="h-full transition-[width] duration-500 ease-out"
              style={{
                width: `${((indice + 1) / ITEMS.length) * 100}%`,
                background: 'var(--series-1)',
              }}
            />
          </div>

          {/*
            `aria-live` solo en el texto, no en la barra ni en la navegación: el
            foco se queda en el botón pulsado, así que sin esto un lector de
            pantalla no diría que el panel cambió, pero anunciar también «3 de
            67 · Anterior · Siguiente» en cada salto es ruido.
          */}
          <div
            role="region"
            aria-live="polite"
            aria-label="Explicación del concepto seleccionado"
            className="flex-1 p-4 sm:p-5"
          >
            {/* La `key` fuerza el remontaje: la animación se repite en cada
                concepto en vez de dispararse solo la primera vez. */}
            <div key={id} className="anim-aparecer">
              {!detalle && (
                <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                  Elige un concepto en la lista.
                </p>
              )}

              {detalle?.tipo === 'base' && (
                <>
                  <Overline>
                    Empieza aquí · paso {detalle.paso} de {CONCEPTOS_BASE.length}
                  </Overline>
                  <h4 className="mt-1 text-[17px] font-semibold leading-snug text-[var(--text-primary)]">
                    {detalle.c.pregunta}
                  </h4>
                  <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-[var(--text-primary)]">
                    <TextoConGlosario texto={detalle.c.enUnaFrase} />
                  </p>

                  <Llano etiqueta="Piénsalo así">
                    <TextoConGlosario texto={detalle.c.analogia} />
                  </Llano>

                  <dl className="mt-3 max-w-prose">
                    <Bloque etiqueta="Con más detalle">
                      <TextoConGlosario texto={detalle.c.detalle} />
                    </Bloque>
                  </dl>
                </>
              )}

              {detalle?.tipo === 'columna' && (
                <>
                  <Overline>
                    Columna {detalle.indice + 1} de {CONCEPTOS_COLUMNA.length} ·{' '}
                    {detalle.c.añadida ? 'añadida por otros módulos' : 'de la hoja original'}
                  </Overline>
                  <h4 className="mt-1 text-[17px] font-semibold text-[var(--text-primary)]">
                    {detalle.c.titulo}
                    {detalle.c.unidad && (
                      <span className="ml-1.5 text-[14px] font-normal text-[var(--text-muted)]">
                        {detalle.c.unidad}
                      </span>
                    )}
                  </h4>

                  <p className="tnum mt-2 inline-block rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2 py-1 text-[12px] text-[var(--text-secondary)]">
                    <span className="text-[var(--text-muted)]">En la matriz: </span>
                    {detalle.c.enLaMatriz}
                  </p>

                  <Llano etiqueta="En palabras llanas">
                    <TextoConGlosario texto={detalle.c.llano} />
                  </Llano>

                  <dl className="mt-3 max-w-prose space-y-2.5">
                    <Bloque etiqueta="Qué mide">
                      <TextoConGlosario texto={detalle.c.queMide} />
                    </Bloque>
                    <Bloque etiqueta="Cómo se lee">
                      <TextoConGlosario texto={detalle.c.comoSeLee} />
                    </Bloque>
                    <Bloque etiqueta="Ojo con">
                      <TextoConGlosario texto={detalle.c.ojo} />
                    </Bloque>
                  </dl>

                  {detalle.c.terminoId && (
                    <button
                      type="button"
                      onClick={() => elegir(`glo:${detalle.c.terminoId}`)}
                      className="mt-3 text-[12px] text-[var(--text-secondary)] underline decoration-dotted underline-offset-2 transition-colors hover:text-[var(--text-primary)] hover:decoration-solid"
                    >
                      Ver la definición de la unidad en el glosario
                    </button>
                  )}
                </>
              )}

              {detalle?.tipo === 'termino' && (
                <>
                  <Overline>{NOMBRE_CATEGORIA[detalle.e.categoria]}</Overline>
                  <h4 className="mt-1 text-[17px] font-semibold text-[var(--text-primary)]">
                    {tituloDe(detalle.e)}
                    {detalle.e.expansion && (
                      <span className="ml-1.5 text-[14px] font-normal text-[var(--text-muted)]">
                        · {detalle.e.expansion}
                      </span>
                    )}
                  </h4>

                  {/* Sin marcado automático: una definición no se marca a sí misma. */}
                  <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-[var(--text-primary)]">
                    {detalle.e.definicion}
                  </p>

                  {detalle.e.implicacion && (
                    <dl className="mt-3 max-w-prose">
                      <Bloque etiqueta="Al elegir">{detalle.e.implicacion}</Bloque>
                    </dl>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Recorrido secuencial: la salida para quien no sabe qué preguntar. */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-4 py-3 sm:px-5">
            <span className="tnum text-[11px] text-[var(--text-muted)]">
              {indice + 1} de {ITEMS.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => anterior && elegir(anterior.id)}
                disabled={!anterior}
                className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[12px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => siguiente && elegir(siguiente.id)}
                disabled={!siguiente}
                title={siguiente?.etiqueta}
                className="flex max-w-[280px] items-center gap-1.5 rounded-lg border border-[var(--text-primary)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)] disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:font-normal disabled:opacity-40"
              >
                <span className="truncate">
                  Siguiente{siguiente && `: ${siguiente.etiqueta}`}
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
