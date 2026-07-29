import { useEffect, useState } from 'react'
import type { CasoUso } from '../data/useCases'
import { generarInforme, historialInformes, type Informe, type TipoInforme } from '../lib/agent'
import { firebaseHabilitado } from '../lib/firebase'
import { paraInforme, type Resultado } from '../lib/scoring'
import { Markdown } from './Markdown'

const TIPOS: { id: TipoInforme; nombre: string; descripcion: string }[] = [
  {
    id: 'ejecutivo',
    nombre: 'Ejecutivo',
    descripcion: 'Una página para quien aprueba el presupuesto. Decisión, costo y riesgo.',
  },
  {
    id: 'tecnico',
    nombre: 'Técnico',
    descripcion: 'Para quien lo va a instalar. Integración, térmica y plan de despliegue.',
  },
  {
    id: 'comparativo',
    nombre: 'Comparativo',
    descripcion: 'Contrasta las tres primeras opciones y dice cuándo cambiar de una a otra.',
  },
]

/**
 * Panel del agente generador de informes.
 *
 * El agente no calcula: recibe el resultado ya evaluado por `scoring.ts` y
 * redacta la interpretación. Así los números del informe son exactamente los
 * mismos que muestran los gráficos.
 */
export function AgentPanel({ caso, resultados }: { caso: CasoUso; resultados: Resultado[] }) {
  const [tipo, setTipo] = useState<TipoInforme>('ejecutivo')
  const [notas, setNotas] = useState('')
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [informe, setInforme] = useState<Informe | null>(null)
  const [historial, setHistorial] = useState<Informe[]>([])

  useEffect(() => {
    if (!firebaseHabilitado) return
    historialInformes().then(setHistorial).catch(() => setHistorial([]))
  }, [informe])

  async function generar() {
    setGenerando(true)
    setError(null)
    try {
      const datos = paraInforme(caso, resultados)
      setInforme(await generarInforme(datos, tipo, notas))
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo generar el informe. Revisa la consola del navegador.',
      )
    } finally {
      setGenerando(false)
    }
  }

  function descargar() {
    if (!informe) return
    const blob = new Blob([informe.markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `informe-${informe.casoId}-${informe.tipo}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="card p-4 sm:p-5">
      <header className="mb-4">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          Agente de informes
        </h3>
        <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Redacta el informe de selección para <strong>{caso.nombre}</strong> a partir del ranking
          calculado arriba. Los números vienen del motor de puntuación, no del modelo.
        </p>
      </header>

      <div className="no-print space-y-4">
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-[var(--text-primary)]">
            Tipo de informe
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {TIPOS.map((t) => (
              <label
                key={t.id}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  tipo === t.id
                    ? 'border-[var(--series-1)] bg-[var(--surface-page)]'
                    : 'border-[var(--border)] hover:border-[var(--axis)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipo-informe"
                    checked={tipo === t.id}
                    onChange={() => setTipo(t.id)}
                    className="size-3.5 accent-[var(--series-1)]"
                  />
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">
                    {t.nombre}
                  </span>
                </span>
                <span className="mt-1.5 block text-[12px] leading-snug text-[var(--text-secondary)]">
                  {t.descripcion}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="notas"
            className="mb-1.5 block text-[13px] font-medium text-[var(--text-primary)]"
          >
            Restricciones del proyecto{' '}
            <span className="font-normal text-[var(--text-muted)]">(opcional)</span>
          </label>
          <textarea
            id="notas"
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej.: 12 estaciones, gabinete cerrado sin ventilación forzada, presupuesto total de 8.000 USD, integración con un PLC Siemens existente."
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={generar}
            disabled={generando}
            className="rounded-lg bg-[var(--series-1)] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generando ? 'Generando…' : 'Generar informe'}
          </button>
          {informe && (
            <button
              onClick={descargar}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Descargar .md
            </button>
          )}
          {!firebaseHabilitado && (
            <span className="text-[12px] text-[var(--text-muted)]">
              Sin Firebase configurado: se usa la plantilla determinista local.
            </span>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-[var(--border)] p-3 text-[13px]"
            style={{ color: 'var(--status-critical)' }}
          >
            <span aria-hidden="true">⚠</span>
            <span>
              <strong>Error al generar.</strong> {error}
            </span>
          </p>
        )}
      </div>

      {informe && (
        <article className="mt-6 border-t border-[var(--border)] pt-5">
          <div className="no-print mb-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span className="rounded border border-[var(--border)] px-1.5 py-0.5">
              {informe.origen === 'claude' ? `Redactado por ${informe.modelo}` : 'Plantilla local'}
            </span>
            <span>{new Date(informe.creadoEn).toLocaleString('es')}</span>
          </div>
          <Markdown texto={informe.markdown} />
        </article>
      )}

      {historial.length > 1 && (
        <div className="no-print mt-6 border-t border-[var(--border)] pt-4">
          <h4 className="mb-2 text-[13px] font-semibold text-[var(--text-primary)]">
            Informes anteriores
          </h4>
          <ul className="space-y-1.5">
            {historial
              .filter((h) => h.id !== informe?.id)
              .slice(0, 8)
              .map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => setInforme(h)}
                    className="text-left text-[12px] text-[var(--text-secondary)] hover:text-[var(--series-1)]"
                  >
                    {h.casoNombre} · {h.tipo} ·{' '}
                    <span className="tnum">{new Date(h.creadoEn).toLocaleDateString('es')}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  )
}
