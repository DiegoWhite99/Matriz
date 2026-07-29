import { useState } from 'react'
import { CASOS_USO, cortoCaso } from '../data/useCases'
import { byId } from '../data/hardware'
import {
  AYUDA_MODO,
  ETIQUETA_MODO,
  buscar,
  comoBloqueMatriz,
  type DatosEspecificaciones,
  type DatosPrecios,
  type DatosRequisito,
  type EquipoEncontrado,
  SinBackend,
  type ModoBusqueda,
  type Respuesta,
} from '../lib/buscador'
import { Termino, TextoConGlosario } from './Glosario'

const MODOS: ModoBusqueda[] = ['requisito', 'especificaciones', 'precios']

const EJEMPLOS: Record<ModoBusqueda, string> = {
  requisito:
    '20 cámaras 4K en un gabinete cerrado sin ventilación forzada, presupuesto de 8.000 USD, integrar con un PLC Siemens existente',
  especificaciones: 'NVIDIA Jetson Orin NX 16GB',
  precios: 'Raspberry Pi 5 8GB AI HAT+ 26 TOPS',
}

const dato = (v: number | null, unidad = '') =>
  v === null ? <span className="text-[var(--text-muted)]">sin dato</span> : `${v}${unidad}`

/* ------------------------------------------------------------------ */
/* Resultados por modo                                                 */
/* ------------------------------------------------------------------ */

function FichaEquipo({ e }: { e: EquipoEncontrado }) {
  const [copiado, setCopiado] = useState(false)
  const categoria = byId(e.categoriaSugerida)

  async function copiar() {
    await navigator.clipboard.writeText(comoBloqueMatriz(e))
    setCopiado(true)
    window.setTimeout(() => setCopiado(false), 2000)
  }

  const filas: [string, React.ReactNode][] = [
    ['Precio USD', e.precioUsdMin === null ? dato(null) : `${e.precioUsdMin}–${e.precioUsdMax ?? e.precioUsdMin}`],
    ['Consumo W', e.tdpMinW === null ? dato(null) : `${e.tdpMinW}–${e.tdpMaxW ?? e.tdpMinW}`],
    ['TFLOPS FP32', dato(e.tflopsFp32)],
    ['TOPS INT8', dato(e.topsInt8Max)],
    ['Rango térmico', e.rangoTermico ?? dato(null)],
    ['Arquitectura', e.arquitectura ?? dato(null)],
  ]

  return (
    <article className="rounded-lg border border-[var(--border)] p-4">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">{e.nombre}</h4>
          <p className="text-[12px] text-[var(--text-secondary)]">
            {e.fabricante}
            {categoria ? ` · encaja en ${categoria.categoria}` : ' · categoría nueva'}
          </p>
        </div>
        <button
          onClick={copiar}
          className="no-print shrink-0 rounded-lg border border-[var(--border)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {copiado ? 'Copiado' : 'Copiar para hardware.ts'}
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {filas.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{k}</dt>
            <dd className="tnum text-[13px] text-[var(--text-primary)]">{v}</dd>
          </div>
        ))}
      </dl>

      {e.fortalezas.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Fortalezas</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {e.fortalezas.map((f, i) => (
              <li key={i}>
                <TextoConGlosario texto={f} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {e.limitaciones.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Limitaciones
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {e.limitaciones.map((f, i) => (
              <li key={i}>
                <TextoConGlosario texto={f} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {e.datosFaltantes.length > 0 && (
        <p
          className="mt-3 rounded-md border border-[var(--border)] p-2 text-[12px] leading-relaxed"
          style={{ color: 'var(--status-serious)' }}
        >
          <span aria-hidden="true">⚠ </span>
          <strong>No se encontró en las fuentes:</strong>{' '}
          <span className="text-[var(--text-secondary)]">{e.datosFaltantes.join(', ')}.</span>{' '}
          <span className="text-[var(--text-secondary)]">
            Verifícalo con el fabricante antes de añadirlo a la matriz.
          </span>
        </p>
      )}

      {e.fuentes.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12px] text-[var(--text-secondary)]">
            Fuente de cada dato ({e.fuentes.length})
          </summary>
          <ul className="mt-1.5 space-y-1">
            {e.fuentes.map((f, i) => (
              <li key={i} className="text-[12px] leading-snug">
                <span className="text-[var(--text-primary)]">{f.dato}:</span>{' '}
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-[var(--series-1)] underline"
                >
                  {f.url}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  )
}

function VistaEspecificaciones({ d }: { d: DatosEspecificaciones }) {
  return (
    <div className="space-y-4">
      <p className="max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
        <TextoConGlosario texto={d.resumen} />
      </p>
      {d.equipos.map((e, i) => (
        <FichaEquipo key={i} e={e} />
      ))}
    </div>
  )
}

function VistaPrecios({ d }: { d: DatosPrecios }) {
  if (d.hallazgos.length === 0) {
    return (
      <p className="text-[13px] text-[var(--text-secondary)]">
        No se encontró ningún precio en USD con proveedor identificable. {d.notas}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th scope="col" className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">
                Equipo
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold text-[var(--text-secondary)]">
                Precio USD
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">
                Proveedor
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">
                Disponibilidad
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">
                Fuente
              </th>
            </tr>
          </thead>
          <tbody>
            {d.hallazgos.map((h, i) => (
              <tr key={i} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2 pr-3 text-[var(--text-primary)]">{h.equipo}</td>
                <td className="tnum py-2 pr-3 text-right text-[var(--text-primary)]">
                  {h.precioUsd === null ? '—' : `$${h.precioUsd.toLocaleString('es')}`}
                </td>
                <td className="py-2 pr-3 text-[var(--text-secondary)]">{h.proveedor}</td>
                <td className="py-2 pr-3 text-[var(--text-secondary)]">
                  {h.disponibilidad}
                  {h.fechaObservada && (
                    <span className="ml-1 text-[11px] text-[var(--text-muted)]">
                      ({h.fechaObservada})
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--series-1)] underline"
                  >
                    ver
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {d.notas && (
        <p className="max-w-prose text-[12px] leading-relaxed text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Comparabilidad: </strong>
          {d.notas}
        </p>
      )}
    </div>
  )
}

function VistaRequisito({
  d,
  onElegirCaso,
  onBuscarTermino,
}: {
  d: DatosRequisito
  onElegirCaso?: (id: string) => void
  onBuscarTermino: (t: string) => void
}) {
  const r = d.restriccionesDetectadas
  const categoria = byId(d.categoriaRecomendada)
  const caso = d.casoUsoSugerido ? CASOS_USO.find((c) => c.id === d.casoUsoSugerido) : null

  const detectadas: [string, React.ReactNode][] = [
    ['Presupuesto', r.presupuestoMaxUsd === null ? null : `≤ $${r.presupuestoMaxUsd.toLocaleString('es')}`],
    ['Consumo', r.tdpMaxW === null ? null : `≤ ${r.tdpMaxW} W`],
    ['Inferencia', r.topsMin === null ? null : <>≥ {r.topsMin} <Termino id="tops" /></>],
    ['Cámaras', r.numeroCamaras === null ? null : String(r.numeroCamaras)],
  ]
  const conValor = detectadas.filter(([, v]) => v !== null)

  return (
    <div className="space-y-4">
      {conValor.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Restricciones detectadas en tu texto
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {conValor.map(([k, v]) => (
              <li
                key={k}
                className="tnum rounded-md border border-[var(--border)] px-2 py-1 text-[12px] text-[var(--text-secondary)]"
              >
                <span className="text-[var(--text-muted)]">{k}: </span>
                {v}
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.notas && (
        <p className="max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
          <TextoConGlosario texto={r.notas} />
        </p>
      )}

      <div className="rounded-lg border border-[var(--border)] p-4">
        <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          Categoría recomendada
        </p>
        <p className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">
          {categoria?.categoria ?? d.categoriaRecomendada}
        </p>
        {categoria && (
          <p className="text-[12px] text-[var(--text-secondary)]">{categoria.representativo}</p>
        )}
        <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
          <TextoConGlosario texto={d.razon} />
        </p>
        {caso && (
          <button
            onClick={() => onElegirCaso?.(caso.id)}
            className="no-print mt-3 rounded-lg bg-[var(--series-1)] px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
          >
            Ver el análisis de «{cortoCaso(caso.id)}»
          </button>
        )}
      </div>

      {d.riesgos.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Riesgos de esta elección
          </p>
          <ul className="list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {d.riesgos.map((x, i) => (
              <li key={i}>
                <TextoConGlosario texto={x} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.terminosDeBusqueda.length > 0 && (
        <div className="no-print">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Buscar modelos concretos
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {d.terminosDeBusqueda.map((t) => (
              <li key={t}>
                <button
                  onClick={() => onBuscarTermino(t)}
                  className="rounded-md border border-[var(--series-1)] px-2 py-1 text-[12px] text-[var(--text-primary)] hover:opacity-80"
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

/**
 * Buscador: escribes lo que necesitas y trae los datos.
 *
 * El cupo gratuito de Google son 100 consultas al día, así que la interfaz lo
 * muestra siempre: es un recurso finito y el usuario debe verlo antes de
 * agotarlo, no después.
 */
export function BuscadorPanel({ onElegirCaso }: { onElegirCaso?: (id: string) => void }) {
  const [modo, setModo] = useState<ModoBusqueda>('requisito')
  const [consulta, setConsulta] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pasos, setPasos] = useState<string[] | null>(null)
  const [resp, setResp] = useState<Respuesta | null>(null)

  async function ejecutar(modoUsado: ModoBusqueda, texto: string) {
    if (texto.trim().length < 3) {
      setError('Escribe al menos tres caracteres.')
      setPasos(null)
      return
    }
    setCargando(true)
    setError(null)
    setPasos(null)
    try {
      setResp(await buscar(modoUsado, texto.trim()))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La búsqueda falló.')
      // Solo la falta de backend tiene una receta concreta que ofrecer.
      setPasos(e instanceof SinBackend ? e.pasos : null)
      setResp(null)
    } finally {
      setCargando(false)
    }
  }

  /** Un término sugerido salta al modo de especificaciones y busca. */
  function buscarTermino(t: string) {
    setModo('especificaciones')
    setConsulta(t)
    void ejecutar('especificaciones', t)
  }

  return (
    <section className="card p-4 sm:p-5">
      <header className="mb-4">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          Buscar hardware en la web
        </h3>
        <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Escribe lo que necesitas. Google encuentra las páginas, el agente las lee y extrae los
          datos con la fuente de cada cifra. Lo que no esté en la fuente vuelve marcado como{' '}
          <em>sin dato</em>, nunca rellenado de memoria.
        </p>
      </header>

      <div className="no-print space-y-4">
        <div
          role="tablist"
          aria-label="Modo de búsqueda"
          className="flex flex-wrap gap-2"
        >
          {MODOS.map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={modo === m}
              onClick={() => setModo(m)}
              className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                modo === m
                  ? 'border-[var(--series-1)] bg-[var(--series-1)] text-white'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {ETIQUETA_MODO[m]}
            </button>
          ))}
        </div>

        <p className="max-w-prose text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {AYUDA_MODO[modo]}
        </p>

        <div>
          <label htmlFor="consulta" className="sr-only">
            Qué necesitas
          </label>
          <textarea
            id="consulta"
            rows={modo === 'requisito' ? 3 : 2}
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={(e) => {
              // Enter busca; Mayús+Enter añade línea. En el modo requisito el
              // texto es largo, así que se invierte.
              if (e.key === 'Enter' && (modo !== 'requisito' ? !e.shiftKey : e.ctrlKey)) {
                e.preventDefault()
                void ejecutar(modo, consulta)
              }
            }}
            placeholder={EJEMPLOS[modo]}
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => void ejecutar(modo, consulta)}
            disabled={cargando}
            className="rounded-lg bg-[var(--series-1)] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? 'Buscando…' : 'Buscar'}
          </button>
          <button
            onClick={() => setConsulta(EJEMPLOS[modo])}
            className="text-[12px] text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            Usar el ejemplo
          </button>
          {resp && (
            <span className="tnum text-[12px] text-[var(--text-muted)]">
              Cupo de Google: {resp.cuota.usadas}/{resp.cuota.techo} hoy
              {resp.deCache && ' · este resultado vino de caché'}
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[var(--border)] p-3 text-[13px]"
          >
            <p className="flex items-start gap-2" style={{ color: 'var(--status-critical)' }}>
              <span aria-hidden="true">⚠</span>
              <span>{error}</span>
            </p>
            {pasos && (
              <>
                <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
                  Para dejarlo funcionando en tu máquina, sin cuenta de Firebase ni plan de pago:
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  {pasos.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
                <p className="mt-2 text-[12px] text-[var(--text-muted)]">
                  El resto de la aplicación —la matriz, la capacidad de modelos, el soporte de
                  software y los gráficos— no necesita nada de esto y ya está funcionando.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {resp && (
        <div className="mt-6 border-t border-[var(--border)] pt-5">
          {resp.modo === 'requisito' ? (
            <VistaRequisito
              d={resp.datos as DatosRequisito}
              onElegirCaso={onElegirCaso}
              onBuscarTermino={buscarTermino}
            />
          ) : resp.modo === 'precios' ? (
            <VistaPrecios d={resp.datos as DatosPrecios} />
          ) : (
            <VistaEspecificaciones d={resp.datos as DatosEspecificaciones} />
          )}

          {resp.fuentes.length > 0 && (
            <details className="mt-5 border-t border-[var(--border)] pt-4">
              <summary className="cursor-pointer text-[12px] text-[var(--text-secondary)]">
                Páginas que devolvió Google ({resp.fuentes.length})
              </summary>
              <ul className="mt-2 space-y-2">
                {resp.fuentes.map((f) => (
                  <li key={f.url} className="text-[12px] leading-snug">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--series-1)] underline"
                    >
                      {f.titulo}
                    </a>
                    <span className="ml-1 text-[var(--text-muted)]">{f.dominio}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  )
}
