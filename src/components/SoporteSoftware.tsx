import { useState } from 'react'
import { HARDWARE, abrev } from '../data/hardware'
import {
  ETIQUETA_NIVEL,
  GLIFO_NIVEL,
  RUNTIMES_AGRUPADOS,
  SOPORTE,
  TAREAS,
  runtimePorId,
  type Nivel,
  type Runtime,
} from '../data/software'
import { TextoConGlosario } from './Glosario'

const COLOR_NIVEL: Record<Nivel, string> = {
  si: 'var(--status-good)',
  limitado: 'var(--status-warning)',
  no: 'var(--text-muted)',
}

/**
 * Celda de soporte.
 *
 * El nivel se codifica con glifo **y** color, nunca con color solo: el
 * amarillo de «con límites» no llega a 3:1 sobre la superficie clara, y de
 * todos modos un lector daltónico no debe depender del tono. El texto
 * accesible lleva la etiqueta completa.
 */
function Celda({ nivel, nota, titulo }: { nivel: Nivel; nota?: string; titulo: string }) {
  return (
    <td className="px-2 py-2 text-center align-middle">
      <span
        title={nota ? `${titulo}: ${ETIQUETA_NIVEL[nivel]}. ${nota}` : `${titulo}: ${ETIQUETA_NIVEL[nivel]}`}
        className="inline-flex cursor-help items-center gap-1"
        style={{ color: COLOR_NIVEL[nivel] }}
      >
        <span aria-hidden="true" className="text-[13px] leading-none">
          {GLIFO_NIVEL[nivel]}
        </span>
        {nota && (
          <span aria-hidden="true" className="text-[9px] leading-none text-[var(--text-muted)]">
            *
          </span>
        )}
      </span>
      <span className="sr-only">
        {ETIQUETA_NIVEL[nivel]}
        {nota ? `. ${nota}` : ''}
      </span>
    </td>
  )
}

function Leyenda() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--text-secondary)]">
      {(['si', 'limitado', 'no'] as Nivel[]).map((n) => (
        <li key={n} className="flex items-center gap-1.5">
          <span aria-hidden="true" style={{ color: COLOR_NIVEL[n] }}>
            {GLIFO_NIVEL[n]}
          </span>
          {ETIQUETA_NIVEL[n]}
        </li>
      ))}
      <li className="text-[var(--text-muted)]">
        <span aria-hidden="true">*</span> pasa el cursor para ver el matiz
      </li>
    </ul>
  )
}

/** Ficha de un runtime: qué es y para qué se usa. */
function FichaRuntime({ r, onCerrar }: { r: Runtime; onCerrar: () => void }) {
  const soportan = HARDWARE.filter((h) => SOPORTE[h.id]?.runtimes[r.id]?.n === 'si')
  const limitados = HARDWARE.filter((h) => SOPORTE[h.id]?.runtimes[r.id]?.n === 'limitado')

  return (
    <div className="mt-4 rounded-lg border border-[var(--series-1)] p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">{r.nombre}</h4>
        <button
          onClick={onCerrar}
          aria-label="Cerrar la ficha"
          className="no-print shrink-0 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Cerrar
        </button>
      </div>
      <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
        <TextoConGlosario texto={r.queEs} />
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Se usa para: </span>
        <TextoConGlosario texto={r.seUsaPara} />
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Funciona en: </span>
        {soportan.length > 0 ? soportan.map(abrev).join(', ') : 'ninguna categoría de la matriz'}
        {limitados.length > 0 && (
          <>
            {' · '}
            <span className="font-semibold text-[var(--text-primary)]">con límites en: </span>
            {limitados.map(abrev).join(', ')}
          </>
        )}
      </p>
    </div>
  )
}

/**
 * Qué software de IA corre en cada equipo.
 *
 * La tabla va traspuesta —el software en las filas, los equipos en las
 * columnas— porque la pregunta que trae aquí a la gente es «¿dónde puedo usar
 * Ollama?», no «¿qué corre este equipo?». Con ocho columnas cabe en pantalla;
 * con dieciocho no cabría.
 */
export function SoporteSoftware() {
  const [abierto, setAbierto] = useState<string | null>(null)
  const runtimeAbierto = abierto ? runtimePorId.get(abierto) : undefined

  return (
    <div className="space-y-6">
      {/* --------------------- El malentendido central -------------------- */}
      <section className="card p-4 sm:p-5">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          Qué software de IA corre en cada equipo
        </h3>
        <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Qué puedes instalar en cada categoría y para qué sirve cada herramienta. Pulsa el nombre
          de un programa para ver qué es y dónde funciona.
        </p>

        <div
          className="mt-4 rounded-lg border border-[var(--border)] p-3"
          style={{ borderColor: 'var(--status-serious)' }}
        >
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">
            La frontera de esta tabla no está en los TOPS
          </p>
          <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Está entre las dos primeras filas de la matriz —los microcontroladores, que no tienen
            sistema operativo— y el resto, que corren Linux. Todo lo que se instala con un comando
            vive al otro lado de esa línea.
          </p>
          <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">
              Por eso un Arduino no puede usar Ollama.
            </strong>{' '}
            No es cuestión de potencia: Ollama es un programa de escritorio que necesita un sistema
            operativo, disco para guardar modelos de varios gigabytes y esa memoria libre. Un
            Arduino Uno tiene 32 KB y ejecuta un único programa que tú compilas y grabas. No hay
            dónde instalarlo. El primer equipo de la matriz donde Ollama arranca de verdad es la
            Raspberry Pi 5, y aun ahí va en CPU y despacio.
          </p>
        </div>
      </section>

      {/* ---------------------- La matriz de soporte ---------------------- */}
      <section className="card p-4 sm:p-5">
        <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">
            Soporte por categoría
          </h4>
          <Leyenda />
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className="py-2 pr-3 text-left font-semibold text-[var(--text-secondary)]">
                  Software
                </th>
                {HARDWARE.map((h) => (
                  <th
                    key={h.id}
                    scope="col"
                    className="px-2 py-2 text-center align-bottom text-[11px] font-semibold leading-tight text-[var(--text-secondary)]"
                  >
                    {abrev(h)}
                  </th>
                ))}
              </tr>
            </thead>
            {RUNTIMES_AGRUPADOS.map((grupo) => (
              <tbody key={grupo.categoria}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={HARDWARE.length + 1}
                    className="pb-1 pt-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                  >
                    {grupo.nombre}
                  </th>
                </tr>
                {grupo.runtimes.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      <button
                        onClick={() => setAbierto(abierto === r.id ? null : r.id)}
                        aria-expanded={abierto === r.id}
                        className={`text-left underline decoration-dotted underline-offset-2 hover:decoration-solid ${
                          abierto === r.id
                            ? 'font-semibold text-[var(--series-1)]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {r.nombre}
                      </button>
                    </th>
                    {HARDWARE.map((h) => {
                      const s = SOPORTE[h.id]?.runtimes[r.id]
                      return (
                        <Celda
                          key={h.id}
                          nivel={s?.n ?? 'no'}
                          nota={s?.nota}
                          titulo={`${r.nombre} en ${h.categoria}`}
                        />
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>

        {runtimeAbierto && <FichaRuntime r={runtimeAbierto} onCerrar={() => setAbierto(null)} />}
      </section>

      {/* -------------------------- Para qué sirve ------------------------ */}
      <section className="card p-4 sm:p-5">
        <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">
              Para qué se usa cada equipo
            </h4>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              La misma lectura, pero por tarea en vez de por programa.
            </p>
          </div>
          <Leyenda />
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className="py-2 pr-3 text-left font-semibold text-[var(--text-secondary)]">
                  Tarea
                </th>
                {HARDWARE.map((h) => (
                  <th
                    key={h.id}
                    scope="col"
                    className="px-2 py-2 text-center align-bottom text-[11px] font-semibold leading-tight text-[var(--text-secondary)]"
                  >
                    {abrev(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TAREAS.map((t) => (
                <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    <span className="block text-[var(--text-primary)]">{t.nombre}</span>
                    <span className="block text-[11px] leading-snug text-[var(--text-muted)]">
                      {t.descripcion}
                    </span>
                  </th>
                  {HARDWARE.map((h) => (
                    <Celda
                      key={h.id}
                      nivel={SOPORTE[h.id]?.tareas[t.id] ?? 'no'}
                      titulo={`${t.nombre} en ${h.categoria}`}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --------------------- Resumen por categoría ---------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {HARDWARE.map((h) => {
          const s = SOPORTE[h.id]
          if (!s) return null
          return (
            <article key={h.id} className="card p-4">
              <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">
                {h.categoria}
              </h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                <TextoConGlosario texto={s.resumen} />
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
