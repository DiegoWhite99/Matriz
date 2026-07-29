import { useMemo, useState } from 'react'
import { HARDWARE, indiceDe, topsPorWatt, type Hardware } from '../data/hardware'
import { dispositivosDe, type Dispositivo } from '../data/dispositivos'
import { MEMORIA } from '../data/memoria'
import { CASOS_USO, cortoCaso } from '../data/useCases'
import { formatearMemoria, formatearParametros, parametrosMaximos } from '../lib/modelos'
import { mapaConsejos } from '../lib/scoring'
import { colorDeIndice, useVizTokens } from '../theme/palette'
import { Termino } from './Glosario'

/**
 * Celda numérica: alineada a la derecha, sin partir el rango en dos líneas y
 * con el padding justo. El horizontal se mantiene bajo porque doce columnas a
 * 16 px por lado son 200 px de puro aire que empujan la tabla fuera de la
 * pantalla.
 */
const NUM = 'tnum whitespace-nowrap px-2.5 py-3 text-right align-middle text-[var(--text-secondary)]'
const TH_NUM =
  'whitespace-nowrap px-2.5 py-2.5 text-right align-bottom font-semibold text-[var(--text-secondary)]'

/** Columnas que ocupa la fila desplegable: todas. */
const COLUMNAS = 12

/** Segunda línea de una cabecera: la unidad o el formato, sin gastar ancho. */
function Sub({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-normal leading-tight text-[var(--text-muted)]">
      {children}
    </span>
  )
}

interface Fila {
  h: Hardware
  dispositivos: Dispositivo[]
  precioDesde: number | null
  memoriaGb: number | null
  memoriaTipo: string | null
  almacenamiento: string | null
  almacenamientoNota: string | null
  modeloMax: number | null
}

/**
 * Los equipos concretos de una categoría, dentro de la propia tabla.
 *
 * Se despliegan al pulsar el nombre de la categoría. La alternativa era mandar
 * al catálogo de más abajo, y eso obliga a perder de vista la fila que se
 * estaba comparando: aquí la lista aparece pegada a los números que la
 * justifican.
 */
function EquiposDesplegados({
  fila,
  color,
  onVerFichas,
}: {
  fila: Fila
  color: string
  onVerFichas?: () => void
}) {
  return (
    <div
      className="border-l-2 px-4 py-3 sm:px-5"
      style={{ borderColor: color, background: 'var(--surface-page)' }}
    >
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">
          {fila.dispositivos.length} equipos concretos de «{fila.h.categoria}»
        </p>
        {onVerFichas && (
          <button
            type="button"
            onClick={onVerFichas}
            className="no-print text-[12px] text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            Ver las fichas completas en el catálogo
          </button>
        )}
      </div>

      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {fila.dispositivos.map((d) => (
          <li
            key={d.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-2.5"
          >
            <p className="text-[13px] font-medium leading-snug text-[var(--text-primary)]">
              {d.nombre}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {d.fabricante} · {d.formato}
            </p>
            <dl className="tnum mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--text-secondary)]">
              <div className="flex gap-1">
                <dt className="text-[var(--text-muted)]">$</dt>
                <dd>{d.precioUsd === null ? 'por cotización' : d.precioUsd.toLocaleString('es')}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-[var(--text-muted)]">W</dt>
                <dd>{d.tdpW}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-[var(--text-muted)]">Mem.</dt>
                <dd>{formatearMemoria(d.memoriaGb)}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-[var(--text-muted)]">IA</dt>
                <dd>{d.topsInt8 === null ? 'sin acelerador' : `${d.topsInt8} TOPS`}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * La matriz, conectada con el resto de la aplicación.
 *
 * Las columnas a la derecha de la línea vertical no salen de la hoja de
 * cálculo: son la memoria, el almacenamiento que admite, el techo de modelo y
 * los dispositivos concretos que añadieron los módulos posteriores. Están aquí
 * porque la pregunta «¿cuál elijo?» se responde comparando todo eso a la vez.
 *
 * Todo lo secundario —el tipo de memoria, la unidad de cada cifra, el detalle
 * del almacenamiento— vive en el atributo `title` en vez de ocupar una segunda
 * línea dentro de la celda. Esa segunda línea era lo que hacía las filas el
 * triple de altas y empujaba la tabla fuera de la pantalla.
 */
export function MatrixTable({
  seleccion,
  onToggle,
  maxSeleccion,
  onElegirCaso,
  onVerDispositivos,
}: {
  seleccion: string[]
  onToggle: (id: string) => void
  maxSeleccion: number
  onElegirCaso?: (casoId: string) => void
  onVerDispositivos?: (categoriaId: string) => void
}) {
  const t = useVizTokens()
  const [desplegada, setDesplegada] = useState<string | null>(null)

  const consejos = useMemo(() => mapaConsejos(CASOS_USO), [])

  const filas: Fila[] = useMemo(
    () =>
      HARDWARE.map((h) => {
        const ds = dispositivosDe(h.id)
        const precios = ds.map((d) => d.precioUsd).filter((p): p is number => p !== null)
        const mem = MEMORIA[h.id]
        return {
          h,
          dispositivos: ds,
          precioDesde: precios.length ? Math.min(...precios) : null,
          memoriaGb: mem?.totalGb ?? null,
          memoriaTipo: mem?.tipo ?? null,
          almacenamiento: mem?.almacenamiento ?? null,
          almacenamientoNota: mem?.almacenamientoNota ?? null,
          modeloMax: mem ? parametrosMaximos(mem, 'int4') : null,
        }
      }),
    [],
  )

  return (
    <section className="card overflow-hidden">
      <header className="border-b border-[var(--border)] p-4 sm:p-5">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          Matriz de hardware IA
        </h3>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[var(--text-secondary)]">
          A la izquierda de la línea, la hoja de cálculo original. A la derecha, lo que aportan los
          demás módulos. <strong className="text-[var(--text-primary)]">Pulsa una categoría</strong>{' '}
          para ver los equipos concretos que puedes comprar en esa fila; pasa el cursor sobre una
          cifra para ver su detalle, y marca hasta {maxSeleccion} filas para compararlas en el perfil
          de capacidades.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1140px] table-fixed border-collapse text-[13px]">
          <colgroup>
            <col className="w-9" />
            <col className="w-[200px]" />
            <col className="w-[78px]" />
            <col className="w-[68px]" />
            <col className="w-[64px]" />
            <col className="w-[80px]" />
            <col className="w-[58px]" />
            <col className="w-[70px]" />
            <col className="w-[124px]" />
            <col className="w-[74px]" />
            <col className="w-[92px]" />
            <col />
          </colgroup>

          <thead>
            <tr className="border-b border-[var(--border)] align-bottom">
              <th scope="col" className="py-2.5 pl-4" aria-label="Comparar" />
              <th
                scope="col"
                className="px-2.5 py-2.5 text-left align-bottom font-semibold text-[var(--text-secondary)]"
              >
                Categoría
              </th>
              <th scope="col" className={TH_NUM}>
                Precio
                <Sub>USD</Sub>
              </th>
              <th scope="col" className={TH_NUM}>
                <Termino id="tdp">TDP</Termino>
                <Sub>W</Sub>
              </th>
              <th scope="col" className={TH_NUM}>
                <Termino id="tflops" />
                <Sub>FP32</Sub>
              </th>
              <th scope="col" className={TH_NUM}>
                <Termino id="tops" />
                <Sub>INT8</Sub>
              </th>
              <th scope="col" className={TH_NUM}>
                <Termino id="tops-watt">TOPS/W</Termino>
              </th>

              {/* A partir de aquí, columnas que cruzan con el resto de módulos. */}
              <th scope="col" className={`${TH_NUM} border-l border-[var(--border)]`}>
                Memoria
              </th>
              <th
                scope="col"
                className="px-2.5 py-2.5 text-left align-bottom font-semibold text-[var(--text-secondary)]"
              >
                Almacenamiento
                <Sub>compatible</Sub>
              </th>
              <th scope="col" className={TH_NUM}>
                Modelo
                <Sub>máx. INT4</Sub>
              </th>
              <th scope="col" className={TH_NUM}>
                Equipos
                <Sub>desde</Sub>
              </th>
              <th
                scope="col"
                className="px-2.5 py-2.5 pr-4 text-left align-bottom font-semibold text-[var(--text-secondary)]"
              >
                Uso recomendado
              </th>
            </tr>
          </thead>

          <tbody>
            {filas.map((f) => {
              const { h } = f
              const marcado = seleccion.includes(h.id)
              const lleno = seleccion.length >= maxSeleccion && !marcado
              const consejo = consejos.get(h.id)
              const color = colorDeIndice(t, indiceDe(h.id))
              const abierta = desplegada === h.id
              const idPanel = `equipos-${h.id}`

              return [
                /*
                  La línea separadora vive en la fila desplegable, no aquí: así
                  cada categoría cierra con una sola línea esté abierta o
                  cerrada, y la última no dibuja ninguna porque ya la pone el
                  borde superior del pie.
                */
                <tr
                  key={h.id}
                  className={`${abierta ? 'border-b border-[var(--border)]' : ''} ${
                    marcado || abierta ? 'bg-[var(--surface-page)]' : 'hover:bg-[var(--surface-page)]'
                  }`}
                >
                  <td className="py-3 pl-4 align-middle">
                    <input
                      type="checkbox"
                      checked={marcado}
                      disabled={lleno}
                      onChange={() => onToggle(h.id)}
                      aria-label={`Comparar ${h.categoria}`}
                      className="size-4 cursor-pointer accent-[var(--series-1)] disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </td>

                  {/* El nombre de la categoría despliega sus equipos concretos. */}
                  <td className="px-2.5 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => setDesplegada(abierta ? null : h.id)}
                      aria-expanded={abierta}
                      aria-controls={idPanel}
                      title={`${abierta ? 'Ocultar' : 'Ver'} los ${f.dispositivos.length} equipos de esta categoría`}
                      className="flex w-full items-start gap-2 text-left"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1 inline-block size-2 shrink-0 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="min-w-0">
                        <span className="block font-medium leading-snug text-[var(--text-primary)] underline decoration-dotted decoration-from-font underline-offset-2 hover:decoration-solid">
                          {h.categoria}
                          {/* Triángulo dibujado, no un carácter: los glifos ▸ y ▾
                              del sistema salen a 10 px como un punto y no se
                              leen como «esto se abre». */}
                          <svg
                            viewBox="0 0 8 8"
                            aria-hidden="true"
                            className={`ml-1.5 inline-block size-2 text-[var(--text-muted)] transition-transform ${
                              abierta ? 'rotate-90' : ''
                            }`}
                          >
                            <path d="M2 0.5 L6.5 4 L2 7.5 Z" fill="currentColor" />
                          </svg>
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] leading-snug text-[var(--text-muted)]">
                          {h.representativo}
                        </span>
                      </span>
                    </button>
                  </td>

                  <td className={NUM} title={`De $${h.precioMin} a $${h.precioMax} por unidad`}>
                    {h.precioMin}–{h.precioMax}
                  </td>
                  <td className={NUM} title={`Consumo de ${h.tdpMin} a ${h.tdpMax} watts`}>
                    {h.tdpMin}–{h.tdpMax}
                  </td>
                  <td className={NUM} title={`${h.tflopsFp32} TFLOPS en coma flotante de 32 bits`}>
                    {h.tflopsFp32 < 0.01 ? h.tflopsFp32.toExponential(0) : h.tflopsFp32}
                  </td>
                  <td className={NUM} title={h.rendimientoTexto}>
                    {h.topsMax === 0
                      ? '—'
                      : `${h.topsMin === h.topsMax ? '' : `${h.topsMin}–`}${h.topsMax}`}
                  </td>
                  <td className={NUM} title="TOPS INT8 por watt consumido">
                    {h.topsMax === 0 ? '—' : topsPorWatt(h).toFixed(1)}
                  </td>

                  <td
                    className={`${NUM} border-l border-[var(--border)] text-[var(--text-primary)]`}
                    title={f.memoriaTipo ?? undefined}
                  >
                    {f.memoriaGb === null ? '—' : formatearMemoria(f.memoriaGb)}
                  </td>

                  {/* Lo que admite de disco: casi nunca viene incluido, y es
                      una partida aparte del presupuesto. */}
                  <td
                    className="px-2.5 py-3 align-middle text-[12px] leading-snug text-[var(--text-secondary)]"
                    title={f.almacenamientoNota ?? undefined}
                  >
                    {f.almacenamiento ?? '—'}
                  </td>

                  <td
                    className={`${NUM} text-[var(--text-primary)]`}
                    title={
                      f.modeloMax === null
                        ? undefined
                        : `Hasta ${formatearParametros(f.modeloMax)} de parámetros con cuantización INT4`
                    }
                  >
                    {f.modeloMax === null ? '—' : formatearParametros(f.modeloMax)}
                  </td>

                  {/* El puente con el catálogo: cuántos equipos reales hay y el
                      precio más bajo que existe de verdad, no el de la hoja. */}
                  <td className="px-2.5 py-3 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => onVerDispositivos?.(h.id)}
                      title={`Filtrar el catálogo por los ${f.dispositivos.length} equipos de esta fila`}
                      className="tnum whitespace-nowrap rounded-md border px-2 py-1 text-[12px] font-medium text-[var(--text-primary)] transition-colors hover:opacity-80"
                      style={{ borderColor: color }}
                    >
                      {f.dispositivos.length}
                      {f.precioDesde !== null && (
                        <span className="font-normal text-[var(--text-secondary)]">
                          {' · $'}
                          {f.precioDesde.toLocaleString('es')}
                        </span>
                      )}
                    </button>
                  </td>

                  {/*
                    Dos etiquetas por línea, en rejilla y no en flujo libre: con
                    `flex-wrap` una fila metía tres etiquetas cortas en una línea
                    y la siguiente solo dos, y esa irregularidad ensanchaba la
                    columna hasta desplazar la tabla.
                  */}
                  <td className="px-2.5 py-3 pr-4 align-middle">
                    {consejo && consejo.gana.length > 0 ? (
                      <ul className="grid grid-cols-2 gap-1">
                        {consejo.gana.map((casoId) => (
                          <li key={casoId} className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onElegirCaso?.(casoId)}
                              title={`Ver el análisis de ${cortoCaso(casoId)}`}
                              className="h-full w-full rounded border px-1.5 py-0.5 text-left text-[11px] font-medium leading-snug text-[var(--text-primary)] transition-colors hover:opacity-80"
                              style={{ borderColor: color }}
                            >
                              {cortoCaso(casoId)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[11px] leading-snug text-[var(--text-muted)]">
                        {consejo && consejo.viable.length > 0
                          ? `Alternativa en ${consejo.viable.length} caso${consejo.viable.length === 1 ? '' : 's'}`
                          : 'Fuera de restricciones'}
                      </span>
                    )}
                  </td>
                </tr>,

                <tr
                  key={`${h.id}-equipos`}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td id={idPanel} colSpan={COLUMNAS} className="p-0">
                    {abierta && (
                      <EquiposDesplegados
                        fila={f}
                        color={color}
                        onVerFichas={
                          onVerDispositivos ? () => onVerDispositivos(h.id) : undefined
                        }
                      />
                    )}
                  </td>
                </tr>,
              ]
            })}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-[var(--border)] px-4 py-3">
        <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">
          <strong className="text-[var(--text-secondary)]">Equipos</strong> es el número de
          dispositivos concretos de esa fila y el precio del más barato: no coincide con la columna{' '}
          <strong className="text-[var(--text-secondary)]">Precio</strong> porque esa es la del
          equipo representativo de la hoja. Pulsa el nombre de la categoría para desplegarlos aquí
          mismo, o el número para filtrar el catálogo completo.
        </p>
      </footer>
    </section>
  )
}
