import { useMemo, useState } from 'react'
import { HARDWARE, abrev, byId, indiceDe } from '../data/hardware'
import {
  DISPOSITIVOS,
  EXPLICACION_FORMATO,
  FORMATOS,
  type Dispositivo,
  type Formato,
} from '../data/dispositivos'
import { formatearMemoria } from '../lib/modelos'
import { colorDeIndice, useVizTokens } from '../theme/palette'
import { Termino, TextoConGlosario } from './Glosario'

type OrdenId = 'precio' | 'tops' | 'consumo' | 'memoria'

const ORDENES: { id: OrdenId; nombre: string }[] = [
  { id: 'precio', nombre: 'Precio' },
  { id: 'tops', nombre: 'Capacidad de IA' },
  { id: 'memoria', nombre: 'Memoria' },
  { id: 'consumo', nombre: 'Consumo' },
]

/** Topes del deslizador de presupuesto, en dólares. */
const PRESUPUESTOS = [50, 150, 500, 1000, 2500, 10000]

function ordenar(lista: Dispositivo[], orden: OrdenId): Dispositivo[] {
  const copia = [...lista]
  switch (orden) {
    case 'precio':
      // Sin precio conocido, al final: no se puede comparar contra nada.
      return copia.sort((a, b) => (a.precioUsd ?? Infinity) - (b.precioUsd ?? Infinity))
    case 'tops':
      return copia.sort((a, b) => (b.topsInt8 ?? 0) - (a.topsInt8 ?? 0))
    case 'memoria':
      return copia.sort((a, b) => b.memoriaGb - a.memoriaGb)
    case 'consumo':
      return copia.sort((a, b) => a.tdpW - b.tdpW)
  }
}

/*
  La misma rejilla en la cabecera y en cada fila. Está en una constante porque
  si las dos dejan de coincidir, los números quedan bajo la etiqueta de al lado
  y no hay forma de notarlo leyendo el código de una sola de ellas.

  En móvil solo caben nombre y precio: el consumo, la memoria y los TOPS se ven
  al abrir la ficha. Meter cinco columnas de cifras en 360 px las deja en dos
  caracteres por celda.
*/
const REJILLA =
  'grid grid-cols-[minmax(0,1fr)_72px_14px] sm:grid-cols-[minmax(0,1fr)_76px_72px_84px_92px_14px] items-center gap-x-3'

/** Celda numérica de la lista: alineada a la derecha y sin partirse en dos líneas. */
const CELDA = 'tnum whitespace-nowrap text-right text-[12.5px] text-[var(--text-secondary)]'

/** Cabecera de una columna numérica: misma alineación que sus celdas. */
const CABECERA =
  'whitespace-nowrap text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]'

/** Segunda línea de una cabecera: la unidad, sin gastar ancho de columna. */
function Sub({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-normal normal-case tracking-normal text-[var(--text-muted)]">
      {children}
    </span>
  )
}

const precioTexto = (d: Dispositivo) =>
  d.precioUsd === null ? 'cotizar' : `$${d.precioUsd.toLocaleString('es')}`

const iaTexto = (d: Dispositivo) =>
  d.topsInt8 === null || d.topsInt8 === 0 ? '—' : `${d.topsInt8.toLocaleString('es')}`

/** Triángulo dibujado: el glifo del sistema a 10 px no se lee como «esto se abre». */
function Chevron({ abierta }: { abierta: boolean }) {
  return (
    <svg
      viewBox="0 0 8 8"
      aria-hidden="true"
      className={`size-2 shrink-0 justify-self-end text-[var(--text-muted)] transition-transform duration-200 ${
        abierta ? 'rotate-90' : ''
      }`}
    >
      <path d="M2 0.5 L6.5 4 L2 7.5 Z" fill="currentColor" />
    </svg>
  )
}

/**
 * La ficha técnica completa, dentro de la propia lista.
 *
 * Repite las cuatro cifras que ya se ven en la fila, y es a propósito: en móvil
 * la fila solo muestra el precio, y una ficha técnica que no trae todos los
 * datos obliga a cerrarla para consultar el que falta.
 */
function FichaTecnica({
  d,
  color,
  onVerFila,
}: {
  d: Dispositivo
  color: string
  onVerFila: () => void
}) {
  const categoria = byId(d.categoriaId)

  const specs: [string, React.ReactNode][] = [
    ['Precio', d.precioUsd === null ? 'solo por cotización' : `$${d.precioUsd.toLocaleString('es')}`],
    ['Consumo', `${d.tdpW} W`],
    ['Capacidad de IA', d.topsInt8 === null ? 'sin acelerador' : `${d.topsInt8} TOPS INT8`],
    ['Procesador', d.procesador],
    ['Memoria', `${formatearMemoria(d.memoriaGb)} · ${d.memoriaTipo}`],
    ['Rango térmico', d.rangoTermico ?? 'no especificado por el fabricante'],
    ['Formato', d.formato],
  ]

  return (
    <div
      className="border-l-2 px-4 py-3 sm:px-5"
      style={{ borderColor: color, background: 'var(--surface-page)' }}
    >
      {categoria && (
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[12px] text-[var(--text-muted)]">
            Fila de la matriz:{' '}
            <span className="text-[var(--text-secondary)]">{categoria.categoria}</span>
          </p>
          <button
            type="button"
            onClick={onVerFila}
            className="no-print text-[12px] text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            Ver solo los equipos de esta fila
          </button>
        </div>
      )}

      <p className="max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
        <TextoConGlosario texto={d.destacado} />
      </p>

      <dl className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {specs.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-[12px] leading-snug">
            <dt className="w-[104px] shrink-0 text-[var(--text-muted)]">{k}</dt>
            <dd className="min-w-0 flex-1 text-[var(--text-secondary)]">{v}</dd>
          </div>
        ))}
      </dl>

      {d.advertencia && (
        <p className="mt-3 max-w-prose rounded-md border border-[var(--border)] bg-[var(--surface-1)] p-2 text-[12px] leading-relaxed">
          <span aria-hidden="true" style={{ color: 'var(--status-serious)' }}>
            ⚠{' '}
          </span>
          <span className="text-[var(--text-secondary)]">
            <TextoConGlosario texto={d.advertencia} />
          </span>
        </p>
      )}
    </div>
  )
}

/** Una línea de la lista, con su ficha desplegable debajo. */
function FilaDispositivo({
  d,
  color,
  abierta,
  onAlternar,
  onVerFila,
}: {
  d: Dispositivo
  color: string
  abierta: boolean
  onAlternar: () => void
  onVerFila: () => void
}) {
  const idFicha = `ficha-${d.id}`

  return (
    <li className="border-b border-[var(--border)] last:border-0">
      <h4>
        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={abierta}
          aria-controls={idFicha}
          className={`${REJILLA} w-full px-4 py-2.5 text-left transition-colors sm:px-5 ${
            abierta ? 'bg-[var(--surface-page)]' : 'hover:bg-[var(--surface-page)]'
          }`}
        >
          <span className="flex min-w-0 items-baseline gap-2">
            <span
              aria-hidden="true"
              className="mt-1 inline-block size-2 shrink-0 rounded-full"
              style={{ background: color }}
            />
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-medium leading-snug text-[var(--text-primary)]">
                {d.nombre}
                {/* El aviso se ve antes de abrir: si no, hay que desplegar los
                    46 para saber cuáles tienen letra pequeña. */}
                {d.advertencia && (
                  <span
                    title="Tiene una advertencia"
                    className="ml-1.5 text-[11px]"
                    style={{ color: 'var(--status-serious)' }}
                  >
                    <span aria-hidden="true">⚠</span>
                    <span className="sr-only">(con advertencia)</span>
                  </span>
                )}
              </span>
              <span className="block truncate text-[11px] leading-snug text-[var(--text-muted)]">
                {d.fabricante} · {d.formato}
              </span>
            </span>
          </span>

          <span className={`${CELDA} font-medium text-[var(--text-primary)]`}>
            {precioTexto(d)}
          </span>
          <span className={`${CELDA} hidden sm:block`}>{d.tdpW} W</span>
          <span className={`${CELDA} hidden sm:block`}>{formatearMemoria(d.memoriaGb)}</span>
          <span
            className={`${CELDA} hidden sm:block`}
            title={d.topsInt8 === null ? 'Sin acelerador de IA' : `${d.topsInt8} TOPS INT8`}
          >
            {iaTexto(d)}
          </span>

          <Chevron abierta={abierta} />
        </button>
      </h4>

      <div className="acordeon" data-abierto={abierta} id={idFicha}>
        <div>
          {/* `inert` mientras está plegada: si no, el tabulador recorre los
              enlaces de 46 fichas invisibles. */}
          <div inert={!abierta}>
            <FichaTecnica d={d} color={color} onVerFila={onVerFila} />
          </div>
        </div>
      </div>
    </li>
  )
}

/**
 * Catálogo de dispositivos concretos.
 *
 * La matriz decide la **clase** de equipo; esto decide **cuál**. Sin esta
 * lista, la aplicación te dice «necesitas un Edge AI Integrado» y te deja ahí,
 * que es justo donde no se puede comprar nada.
 *
 * Cada fila lleva el punto de color de su categoría en la matriz, así que el
 * puente entre las dos vistas es visual y no hay que explicarlo.
 *
 * ------------------------------------------------------------------
 * Lista de una línea, y la ficha al pulsar
 * ------------------------------------------------------------------
 *
 * Antes eran 46 tarjetas con la ficha completa desplegada, tres por fila. Cada
 * tarjeta estaba bien y el conjunto no servía para nada: ocupaba nueve
 * pantallas, así que comparar el precio del séptimo equipo con el del trigésimo
 * era imposible y encontrar uno concreto, un ejercicio de desplazamiento.
 *
 * Ahora la unidad es la línea —nombre, fabricante, precio, consumo, memoria y
 * TOPS— y los 46 equipos entran en dos pantallas con las cifras alineadas en
 * columna, que es la única forma de que un número se pueda comparar con el de
 * arriba. La ficha técnica sigue completa, pero aparece al pulsar y solo la del
 * equipo que se está mirando.
 */
export function CatalogoDispositivos({
  categoria,
  onCategoria,
}: {
  /** Controlado desde App: la matriz apunta aquí al pulsar «Ver N equipos». */
  categoria: string | null
  onCategoria: (id: string | null) => void
}) {
  const t = useVizTokens()
  const setCategoria = onCategoria
  const [formato, setFormato] = useState<Formato | null>(null)
  const [presupuesto, setPresupuesto] = useState<number | null>(null)
  const [soloIa, setSoloIa] = useState(false)
  const [orden, setOrden] = useState<OrdenId>('precio')
  /*
    Una sola ficha abierta a la vez. Permitir varias devuelve la vista al muro
    de tarjetas que esta lista vino a sustituir: con 46 equipos, lo que hace
    falta es poder recorrerlos, y para eso la lista tiene que seguir siendo
    corta mientras se compara.
  */
  const [abierta, setAbierta] = useState<string | null>(null)

  const lista = useMemo(() => {
    let r = DISPOSITIVOS
    if (categoria) r = r.filter((d) => d.categoriaId === categoria)
    if (formato) r = r.filter((d) => d.formato === formato)
    if (presupuesto !== null) r = r.filter((d) => d.precioUsd !== null && d.precioUsd <= presupuesto)
    if (soloIa) r = r.filter((d) => d.topsInt8 !== null && d.topsInt8 > 0)
    return ordenar(r, orden)
  }, [categoria, formato, presupuesto, soloIa, orden])

  const hayFiltro = categoria !== null || formato !== null || presupuesto !== null || soloIa

  return (
    <div className="space-y-4">
      <section id="dispositivos" className="card p-4 sm:p-5">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          Dispositivos que puedes usar
        </h3>
        <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
          {DISPOSITIVOS.length} equipos concretos, con nombre de producto y precio orientativo, en
          una lista de una línea por equipo.{' '}
          <strong className="text-[var(--text-primary)]">Pulsa cualquiera</strong> y se abre su ficha
          técnica: procesador, tipo de memoria, rango térmico y lo que hay que saber antes de
          elegirlo. Cada uno pertenece a una fila de la matriz, así que hereda su análisis: el punto
          de color es el mismo en las dos vistas.
        </p>

        {/* Una sola fila de filtros, por encima de todo lo que condiciona. */}
        <div className="no-print mt-4 space-y-3">
          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-[var(--text-primary)]">
              Categoría de la matriz
            </span>
            <ul className="flex flex-wrap gap-1.5">
              <li>
                <button
                  onClick={() => setCategoria(null)}
                  aria-pressed={categoria === null}
                  className={`rounded-md border px-2.5 py-1 text-[12px] transition-colors ${
                    categoria === null
                      ? 'border-[var(--series-1)] bg-[var(--series-1)] text-white'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Todas
                </button>
              </li>
              {HARDWARE.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => setCategoria(categoria === h.id ? null : h.id)}
                    aria-pressed={categoria === h.id}
                    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition-colors ${
                      categoria === h.id
                        ? 'border-[var(--series-1)] font-medium text-[var(--text-primary)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block size-2 rounded-full"
                      style={{ background: colorDeIndice(t, indiceDe(h.id)) }}
                    />
                    {abrev(h)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <label
                htmlFor="formato"
                className="mb-1.5 block text-[12px] font-medium text-[var(--text-primary)]"
              >
                Formato
              </label>
              <select
                id="formato"
                value={formato ?? ''}
                onChange={(e) => setFormato((e.target.value || null) as Formato | null)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)]"
              >
                <option value="">Cualquiera</option>
                {FORMATOS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="presupuesto"
                className="mb-1.5 block text-[12px] font-medium text-[var(--text-primary)]"
              >
                Presupuesto por unidad
              </label>
              <select
                id="presupuesto"
                value={presupuesto ?? ''}
                onChange={(e) => setPresupuesto(e.target.value ? Number(e.target.value) : null)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)]"
              >
                <option value="">Sin límite</option>
                {PRESUPUESTOS.map((p) => (
                  <option key={p} value={p}>
                    Hasta ${p.toLocaleString('es')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="orden"
                className="mb-1.5 block text-[12px] font-medium text-[var(--text-primary)]"
              >
                Ordenar por
              </label>
              <select
                id="orden"
                value={orden}
                onChange={(e) => setOrden(e.target.value as OrdenId)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)]"
              >
                {ORDENES.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2 pb-1.5 text-[12px] text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={soloIa}
                onChange={(e) => setSoloIa(e.target.checked)}
                className="size-4 accent-[var(--series-1)]"
              />
              Solo con acelerador de IA
            </label>

            {hayFiltro && (
              <button
                onClick={() => {
                  setCategoria(null)
                  setFormato(null)
                  setPresupuesto(null)
                  setSoloIa(false)
                }}
                className="pb-1.5 text-[12px] text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
              >
                Quitar filtros
              </button>
            )}
          </div>

          {formato && (
            <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">{formato}: </strong>
              {EXPLICACION_FORMATO[formato]}
            </p>
          )}
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-muted)]">
          <strong className="text-[var(--text-secondary)]">Los precios son orientativos</strong>, de
          lista y sin impuestos ni envío. Envejecen rápido y varían por distribuidor: están para
          ordenar magnitudes, no para cotizar. Refréscalos con el buscador de precios antes de
          comprometer un presupuesto.
        </p>
      </section>

      <p className="tnum text-[12px] text-[var(--text-secondary)]">
        {lista.length} de {DISPOSITIVOS.length} dispositivos
        {presupuesto !== null && ' · los que no publican precio quedan fuera al filtrar por presupuesto'}
      </p>

      {lista.length === 0 ? (
        <section className="card flex min-h-[160px] items-center justify-center p-6">
          <p className="max-w-sm text-center text-[13px] text-[var(--text-secondary)]">
            Ningún dispositivo cumple los cuatro filtros a la vez. Suele ser el presupuesto contra
            el acelerador de IA: lo más barato con <Termino id="tops" /> de la lista ronda los 25
            dólares.
          </p>
        </section>
      ) : (
        <section className="card overflow-hidden">
          <div
            className={`${REJILLA} border-b border-[var(--border)] bg-[var(--surface-page)] px-4 py-2 sm:px-5`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Equipo
            </span>
            <span className={CABECERA}>
              Precio
              <Sub>USD</Sub>
            </span>
            <span className={`${CABECERA} hidden sm:block`}>
              Consumo
              <Sub>W</Sub>
            </span>
            <span className={`${CABECERA} hidden sm:block`}>Memoria</span>
            <span className={`${CABECERA} hidden sm:block`}>
              <Termino id="tops">IA</Termino>
              <Sub>TOPS</Sub>
            </span>
            <span />
          </div>

          <ul>
            {lista.map((d) => (
              <FilaDispositivo
                key={d.id}
                d={d}
                color={colorDeIndice(t, indiceDe(d.categoriaId))}
                abierta={abierta === d.id}
                onAlternar={() => setAbierta(abierta === d.id ? null : d.id)}
                onVerFila={() => setCategoria(d.categoriaId)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
