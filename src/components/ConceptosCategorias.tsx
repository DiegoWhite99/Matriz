import { HARDWARE } from '../data/hardware'
import { Termino } from './Glosario'

/**
 * Qué es cada clase de equipo de la primera columna.
 *
 * La matriz nombra sus filas con la jerga del sector —SBC, Edge AI, Edge
 * Server, IPC, AI PC— y quien llega a decidir una compra no tiene por qué
 * conocerla. El glosario ya define cada término, pero una definición a la que
 * hay que ir a buscar llega tarde: estas seis clases son la primera columna de
 * la tabla que acaba de leer, así que van aquí, visibles y en orden.
 *
 * El orden es el de la matriz, de menos a más potencia, porque la progresión
 * *es* la explicación: cada escalón añade algo y pierde algo.
 */

interface Clase {
  titulo: string
  /** Filas de la matriz que caen en esta clase, para anclar la explicación. */
  filas: string[]
  queEs: React.ReactNode
  gana: string
  pierde: string
}

const CLASES: Clase[] = [
  {
    titulo: 'Microcontrolador',
    filas: ['mcu-basico', 'mcu-edge-ai'],
    queEs: (
      <>
        Un <Termino id="mcu">chip único</Termino> con procesador, memoria y entradas/salidas, que
        ejecuta un solo programa sin sistema operativo. No se le instala software: se le compila y
        se le graba.
      </>
    ),
    gana: 'Responde siempre en el mismo tiempo y consume menos de un watt.',
    pierde: 'Con kilobytes de memoria, la IA que cabe es TinyML: señales, no vídeo.',
  },
  {
    titulo: 'SBC',
    filas: ['sbc-economico'],
    queEs: (
      <>
        <Termino id="sbc">Un computador completo en una sola placa</Termino>: procesador, memoria y
        puertos soldados juntos, con Linux en una microSD. Una Raspberry Pi.
      </>
    ),
    gana: 'Todo el software de un PC por 100 dólares, y una NPU añadible por HAT.',
    pierde: 'El determinismo, y el grado industrial: el chasis y el calor son tu problema.',
  },
  {
    titulo: 'AI PC',
    filas: ['cpu-npu'],
    queEs: (
      <>
        Un PC de verdad cuyo procesador ya trae una <Termino id="npu" /> integrada:{' '}
        <Termino id="ai-pc">Intel Core Ultra, AMD Ryzen AI o Apple M</Termino>. CPU, gráficos y
        acelerador de IA en un solo chip.
      </>
    ),
    gana: 'Corre el software x86 que la planta ya tiene, sin recompilar nada.',
    pierde: 'No hay CUDA: toca OpenVINO, ROCm o Core ML, con mucha menos documentación.',
  },
  {
    titulo: 'Edge AI',
    filas: ['edge-ai-integrado', 'edge-ai-potencia'],
    queEs: (
      <>
        <Termino id="edge">Procesar donde se generan los datos</Termino> —en la máquina, en la celda,
        en el vehículo— en vez de mandarlos a un servidor. Un módulo Jetson dentro del equipo.
      </>
    ),
    gana: 'Sin latencia de red y sin depender del enlace: la línea no para si cae.',
    pierde: 'Es ARM, así que el software x86 antiguo no entra, y necesita placa carrier.',
  },
  {
    titulo: 'Edge Server e IPC',
    filas: ['gpu-ipc'],
    queEs: (
      <>
        Un <Termino id="edge-server">servidor en la propia planta</Termino> que concentra el trabajo
        de muchas cámaras. La tarjeta va dentro de un <Termino id="ipc" />, que es un PC x86 hecho
        para armario: riel DIN, 24 V y rango térmico ampliado.
      </>
    ),
    gana: 'Centralizar 10 o 30 cámaras sale más barato que un equipo en cada una.',
    pierde: 'Son dos compras, no una: la tarjeta sin el PC industrial no va a ningún sitio.',
  },
  {
    titulo: 'GPU Enterprise',
    filas: ['gpu-enterprise'],
    queEs: (
      <>
        La <Termino id="gpu" /> de sala técnica, con 48 GB o más de <Termino id="vram" /> y 300 a 600
        W. Es la única clase de la matriz que puede <Termino id="entrenamiento">entrenar</Termino>,
        no solo inferir.
      </>
    ),
    gana: 'Entrena modelos propios y simula la planta completa.',
    pierde: 'Su consumo es una obra eléctrica, y no cabe en un gabinete cerrado.',
  },
]

const categoriaDe = (id: string) => HARDWARE.find((h) => h.id === id)?.categoria ?? id

export function ConceptosCategorias() {
  return (
    <section className="card p-4 sm:p-5">
      <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
        Qué es cada clase de equipo
      </h3>
      <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-[var(--text-secondary)]">
        Las seis clases de la primera columna, de menos a más potencia. La progresión es la
        explicación: cada escalón añade capacidad de IA y pierde algo del anterior, casi siempre
        determinismo, eficiencia o compatibilidad.
      </p>

      <ol className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CLASES.map((c, i) => (
          <li key={c.titulo} className="rounded-lg border border-[var(--border)] p-3">
            <p className="flex items-baseline gap-2">
              <span className="tnum text-[11px] font-semibold text-[var(--text-muted)]">
                {i + 1}
              </span>
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                {c.titulo}
              </span>
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">
              {c.filas.map(categoriaDe).join(' · ')}
            </p>

            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {c.queEs}
            </p>

            <dl className="mt-2.5 space-y-1 text-[12px] leading-snug">
              <div className="flex gap-1.5">
                <dt className="shrink-0 font-medium text-[var(--text-primary)]">Gana:</dt>
                <dd className="text-[var(--text-secondary)]">{c.gana}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="shrink-0 font-medium text-[var(--text-primary)]">Cede:</dt>
                <dd className="text-[var(--text-secondary)]">{c.pierde}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </section>
  )
}
