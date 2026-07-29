/**
 * Pruebas del motor de puntuación.
 *
 *   npm run test:scoring
 *
 * Este motor decide todo lo que la aplicación muestra como recomendación: el
 * ranking, la columna «Uso recomendado» de la matriz y los hechos que recibe
 * el agente. Un error aquí no se ve como un fallo, se ve como un consejo
 * plausible y equivocado, así que conviene comprobarlo.
 */

import { CRITERIOS, HARDWARE } from '../data/hardware.ts'
import { CASOS_USO, CORTO_CASO } from '../data/useCases.ts'
import {
  MARGEN_EMPATE,
  evaluar,
  mapaConsejos,
  metricasGlobales,
  normalizarPesos,
  paraInforme,
} from './scoring.ts'

let fallos = 0
function comprueba(nombre: string, cond: boolean, extra = '') {
  if (cond) {
    console.log(`  ok    ${nombre}`)
  } else {
    fallos++
    console.log(`  FALLA ${nombre} ${extra}`)
  }
}

const casi = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps

console.log(`\nMotor: ${HARDWARE.length} equipos, ${CASOS_USO.length} casos, ${CRITERIOS.length} criterios\n`)

/* Integridad de los datos ------------------------------------------- */

comprueba('ids de hardware sin duplicar', new Set(HARDWARE.map((h) => h.id)).size === HARDWARE.length)
comprueba('ids de caso sin duplicar', new Set(CASOS_USO.map((c) => c.id)).size === CASOS_USO.length)

comprueba(
  'todos los equipos califican los 8 criterios',
  HARDWARE.every((h) => CRITERIOS.every((c) => typeof h.calificaciones[c.id] === 'number')),
)
comprueba(
  'calificaciones dentro de 0–100',
  HARDWARE.every((h) => CRITERIOS.every((c) => h.calificaciones[c.id] >= 0 && h.calificaciones[c.id] <= 100)),
)
comprueba(
  'rangos coherentes (min <= max)',
  HARDWARE.every((h) => h.precioMin <= h.precioMax && h.tdpMin <= h.tdpMax && h.topsMin <= h.topsMax),
)
comprueba(
  'cada caso tiene nombre corto para la matriz',
  CASOS_USO.every((c) => typeof CORTO_CASO[c.id] === 'string'),
)
comprueba(
  'ningún caso pondera un criterio inexistente',
  CASOS_USO.every((c) => Object.keys(c.pesos).every((k) => CRITERIOS.some((cr) => cr.id === k))),
)

/* Normalización de pesos --------------------------------------------- */

for (const caso of CASOS_USO) {
  const pesos = normalizarPesos(caso)
  const suma = Object.values(pesos).reduce((a, b) => a + b, 0)
  comprueba(`pesos de «${CORTO_CASO[caso.id]}» suman 1`, casi(suma, 1), `suma=${suma}`)
}

/* Ranking ------------------------------------------------------------ */

for (const caso of CASOS_USO) {
  const r = evaluar(caso)
  const etiqueta = CORTO_CASO[caso.id]

  comprueba(`«${etiqueta}» evalúa los ${HARDWARE.length} equipos`, r.length === HARDWARE.length)

  // Un caso sin ninguna opción viable sería un caso mal definido.
  const viables = r.filter((x) => x.viable)
  comprueba(`«${etiqueta}» deja al menos una opción viable`, viables.length > 0)

  // Los viables van primero y en orden de puntaje descendente.
  const indiceUltimoViable = r.findLastIndex((x) => x.viable)
  const indicePrimerNoViable = r.findIndex((x) => !x.viable)
  comprueba(
    `«${etiqueta}» pone los viables antes que los descartados`,
    indicePrimerNoViable === -1 || indicePrimerNoViable > indiceUltimoViable,
  )
  comprueba(
    `«${etiqueta}» ordena los viables por puntaje`,
    viables.every((x, i) => i === 0 || viables[i - 1].puntaje >= x.puntaje),
  )
  comprueba(
    `«${etiqueta}» numera las posiciones 1..n sin huecos`,
    viables.every((x, i) => x.posicion === i + 1),
  )
  comprueba(
    `«${etiqueta}» no asigna posición a los descartados`,
    r.filter((x) => !x.viable).every((x) => x.posicion === 0),
  )
  comprueba(
    `«${etiqueta}» explica cada descarte`,
    r.filter((x) => !x.viable).every((x) => x.motivosDescarte.length > 0),
  )
  comprueba(
    `«${etiqueta}» mantiene los puntajes en 0–100`,
    r.every((x) => x.puntaje >= 0 && x.puntaje <= 100),
  )

  // El puntaje debe ser exactamente la suma de los aportes.
  comprueba(
    `«${etiqueta}» puntaje = suma de aportes`,
    r.every((x) => casi(x.puntaje, x.aportes.reduce((a, b) => a + b.aporte, 0), 1e-9)),
  )
}

/* Restricciones duras ------------------------------------------------ */

// Un caso con presupuesto de 300 USD no puede recomendar una GPU de 7.000.
const control = CASOS_USO.find((c) => c.id === 'control-actuadores')!
const rControl = evaluar(control)
comprueba(
  'presupuesto ajustado descarta las GPU',
  ['gpu-ipc', 'gpu-enterprise', 'edge-ai-potencia'].every(
    (id) => rControl.find((x) => x.hardware.id === id)?.viable === false,
  ),
)
comprueba(
  'control determinista lo gana un microcontrolador',
  ['mcu-basico', 'mcu-edge-ai'].includes(rControl.find((x) => x.posicion === 1)?.hardware.id ?? ''),
)

// Un caso que exige 200 TOPS no puede recomendar un microcontrolador.
const multicam = CASOS_USO.find((c) => c.id === 'inspeccion-multicamara')!
comprueba(
  'exigir 200 TOPS descarta los microcontroladores y el SBC',
  ['mcu-basico', 'mcu-edge-ai', 'sbc-economico'].every(
    (id) => evaluar(multicam).find((x) => x.hardware.id === id)?.viable === false,
  ),
)

/* Consejos de la matriz ---------------------------------------------- */

const consejos = mapaConsejos(CASOS_USO)

comprueba('hay un consejo por equipo', consejos.size === HARDWARE.length)
comprueba(
  'cada equipo suma los 8 casos entre gana, viable y descartado',
  HARDWARE.every((h) => {
    const c = consejos.get(h.id)!
    return c.gana.length + c.viable.length + c.descartado === CASOS_USO.length
  }),
)
comprueba(
  'cada caso tiene al menos un consejo',
  CASOS_USO.every(
    (caso) => HARDWARE.filter((h) => consejos.get(h.id)!.gana.includes(caso.id)).length >= 1,
  ),
)
// Si un caso "recomendara" media matriz, el margen de empate estaria mal puesto.
comprueba(
  'ningun caso recomienda mas de 3 equipos',
  CASOS_USO.every(
    (caso) => HARDWARE.filter((h) => consejos.get(h.id)!.gana.includes(caso.id)).length <= 3,
  ),
)
// Si un solo equipo ganara los ocho casos, la matriz no estaría discriminando.
const ganadores = new Set(HARDWARE.flatMap((h) => (consejos.get(h.id)!.gana.length ? [h.id] : [])))
comprueba(
  `los casos se reparten entre varios equipos (${ganadores.size} ganadores distintos)`,
  ganadores.size >= 3,
)
comprueba(
  'todo id de caso en un consejo existe',
  HARDWARE.every((h) => {
    const c = consejos.get(h.id)!
    return [...c.gana, ...c.viable].every((id) => CASOS_USO.some((x) => x.id === id))
  }),
)

/* Métricas globales -------------------------------------------------- */

const m = metricasGlobales()
comprueba('precio mínimo global correcto', m.precioMin === Math.min(...HARDWARE.map((h) => h.precioMin)))
comprueba('precio máximo global correcto', m.precioMax === Math.max(...HARDWARE.map((h) => h.precioMax)))
comprueba('líder de eficiencia tiene IA', m.liderEficiencia.topsMax > 0)
comprueba('líder de valor tiene IA', m.liderValor.topsMax > 0)
comprueba('cuenta de equipos con IA correcta', m.conIa === HARDWARE.filter((h) => h.topsMax > 0).length)

/* Paquete para el agente --------------------------------------------- */

const paquete = paraInforme(control, rControl)
comprueba('el paquete lleva todos los equipos', paquete.ranking.length === HARDWARE.length)
comprueba(
  'el paquete solo pondera criterios con peso > 0',
  paquete.caso.criteriosPonderados.every((c) => c.pesoPorcentaje > 0),
)
comprueba(
  'el paquete marca posición null en los descartados',
  paquete.ranking.filter((r) => !r.viable).every((r) => r.posicion === null),
)
comprueba(
  'el paquete no pierde los motivos de descarte',
  paquete.ranking.filter((r) => !r.viable).every((r) => r.motivosDescarte.length > 0),
)

/* Distancia entre la 1.ª y la 2.ª opción: informativo, no es un fallo */

console.log('\n  Distancia entre la 1.ª y la 2.ª opción viable de cada caso:')
for (const caso of CASOS_USO) {
  const v = evaluar(caso).filter((x) => x.viable)
  if (v.length < 2) continue
  const brecha = v[0].puntaje - v[1].puntaje
  const nota = brecha < MARGEN_EMPATE ? '  ← empate técnico, ambos se recomiendan' : ''
  console.log(`    ${CORTO_CASO[caso.id].padEnd(24)} ${brecha.toFixed(2).padStart(6)} pts${nota}`)
}

console.log(`\n${fallos === 0 ? 'TODO OK' : `${fallos} FALLO(S)`}\n`)
process.exit(fallos === 0 ? 0 : 1)
