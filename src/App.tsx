import { useMemo, useState, type ReactNode } from 'react'
import { AgentPanel } from './components/AgentPanel'
import { BuscadorPanel } from './components/BuscadorPanel'
import { CapacidadModelos } from './components/CapacidadModelos'
import { CatalogoDispositivos } from './components/CatalogoDispositivos'
import { ConceptosCategorias } from './components/ConceptosCategorias'
import { GlosarioPanel, Termino, TextoConGlosario } from './components/Glosario'
import { SoporteSoftware } from './components/SoporteSoftware'
import { MatrixTable } from './components/MatrixTable'
import { StatTiles } from './components/StatTiles'
import { TableroConceptos } from './components/TableroConceptos'
import { AportesChart } from './components/viz/AportesChart'
import { EficienciaChart } from './components/viz/EficienciaChart'
import { MAX_COMPARAR, PerfilRadar } from './components/viz/PerfilRadar'
import { RankingChart } from './components/viz/RankingChart'
import { byId } from './data/hardware'
import { CASOS_USO } from './data/useCases'
import { evaluar } from './lib/scoring'

function ThemeToggle() {
  const [tema, setTema] = useState<'light' | 'dark'>(
    () => (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light',
  )

  function alternar() {
    const siguiente = tema === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = siguiente
    localStorage.setItem('mhia-theme', siguiente)
    setTema(siguiente)
  }

  return (
    <button
      onClick={alternar}
      aria-label={`Cambiar a modo ${tema === 'light' ? 'oscuro' : 'claro'}`}
      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    >
      {tema === 'light' ? 'Modo oscuro' : 'Modo claro'}
    </button>
  )
}

export default function App() {
  const [casoId, setCasoId] = useState(CASOS_USO[3].id) // visión en envasado: el caso más ilustrativo
  const [seleccion, setSeleccion] = useState<string[]>(['edge-ai-integrado', 'gpu-ipc'])
  const [categoriaCatalogo, setCategoriaCatalogo] = useState<string | null>(null)

  const caso = CASOS_USO.find((c) => c.id === casoId)!
  const resultados = useMemo(() => evaluar(caso), [caso])
  const ganador = resultados.find((r) => r.viable)
  const equipos = seleccion.map(byId).filter((h): h is NonNullable<typeof h> => Boolean(h))

  /** Al pulsar un consejo en la matriz, cambia el caso y baja al análisis. */
  function elegirCaso(id: string) {
    setCasoId(id)
    document.getElementById('analisis')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /** Desde la matriz: filtra el catálogo por esa fila y baja hasta él. */
  function verDispositivos(id: string) {
    setCategoriaCatalogo(id)
    document.getElementById('dispositivos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function toggle(id: string) {
    setSeleccion((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_COMPARAR
          ? prev
          : [...prev, id],
    )
  }

  const restricciones: { clave: string; contenido: ReactNode }[] = [
    caso.restricciones.presupuestoMaxUsd && {
      clave: 'precio',
      contenido: `≤ $${caso.restricciones.presupuestoMaxUsd.toLocaleString('es')} por unidad`,
    },
    caso.restricciones.tdpMaxW && {
      clave: 'tdp',
      contenido: (
        <>
          ≤ {caso.restricciones.tdpMaxW} W <Termino id="tdp">de TDP</Termino>
        </>
      ),
    },
    caso.restricciones.topsMin && {
      clave: 'tops',
      contenido: (
        <>
          ≥ {caso.restricciones.topsMin} <Termino id="tops" />
        </>
      ),
    },
  ].filter(Boolean) as { clave: string; contenido: ReactNode }[]

  return (
    <div className="min-h-full">
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight text-[var(--text-primary)]">
              Matriz de Hardware IA
            </h1>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Selección de hardware para inteligencia artificial industrial
            </p>
          </div>
          <div className="no-print">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Antes de la tabla, qué significa cada una de sus columnas. Es lo
            único que va por delante de la matriz: sus cabeceras son dos
            palabras y sus celdas están llenas de siglas, así que sin esto la
            primera lectura es una lectura equivocada. */}
        <TableroConceptos />

        {/* La matriz, la fuente de verdad de la página: no depende del caso
            seleccionado y desde ella se llega a todo lo demás. Pulsando una
            categoría despliega sus equipos concretos sin moverse de aquí. */}
        <MatrixTable
          seleccion={seleccion}
          onToggle={toggle}
          maxSeleccion={MAX_COMPARAR}
          onElegirCaso={elegirCaso}
          onVerDispositivos={verDispositivos}
        />

        {/* Justo debajo, qué significan los nombres de la primera columna. */}
        <ConceptosCategorias />

        {/* Y después los dispositivos con nombre de producto: la matriz dice
            qué clase de equipo hace falta, pero lo que se compra tiene nombre. */}
        <CatalogoDispositivos categoria={categoriaCatalogo} onCategoria={setCategoriaCatalogo} />

        <CapacidadModelos />

        <SoporteSoftware />

        {/* Una sola fila de filtros, justo encima de lo que condiciona: de
            aquí abajo todo se recalcula con el caso seleccionado. */}
        <section id="analisis" className="no-print card p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[280px] flex-1">
              <label
                htmlFor="caso"
                className="mb-1.5 block text-[13px] font-medium text-[var(--text-primary)]"
              >
                Caso de uso
              </label>
              <select
                id="caso"
                value={casoId}
                onChange={(e) => setCasoId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-[13px] text-[var(--text-primary)]"
              >
                {CASOS_USO.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            {restricciones.length > 0 && (
              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-primary)]">
                  Restricciones duras
                </span>
                <ul className="flex flex-wrap gap-1.5">
                  {restricciones.map((r) => (
                    <li
                      key={r.clave}
                      className="tnum rounded-md border border-[var(--border)] px-2 py-1 text-[12px] text-[var(--text-secondary)]"
                    >
                      {r.contenido}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <p className="mt-3 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
            <TextoConGlosario texto={caso.contexto} />
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <RankingChart resultados={resultados} />
          {ganador ? (
            <AportesChart resultado={ganador} />
          ) : (
            <section className="card flex min-h-[280px] items-center justify-center p-6">
              <p className="max-w-sm text-center text-sm text-[var(--text-secondary)]">
                Ninguna categoría de la matriz cumple las restricciones de este caso.
              </p>
            </section>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PerfilRadar seleccion={equipos} />
          <EficienciaChart />
        </div>

        <BuscadorPanel onElegirCaso={elegirCaso} />

        <AgentPanel caso={caso} resultados={resultados} />

        {/* Cifras de contexto al cierre: son el resumen de la matriz, no el
            punto de entrada. */}
        <StatTiles />

        <GlosarioPanel />
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-6 sm:px-6">
        <p className="mx-auto max-w-7xl text-[12px] leading-relaxed text-[var(--text-muted)]">
          Datos de precio, consumo y rendimiento tomados de la matriz de hardware IA. Las
          calificaciones por criterio traducen las columnas de puntos fuertes y limitaciones a una
          escala 0–100 comparable; su justificación está documentada en{' '}
          <code>src/data/hardware.ts</code>. Verifica precios y especificaciones con el fabricante
          antes de comprar.
        </p>
      </footer>
    </div>
  )
}
