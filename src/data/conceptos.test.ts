/**
 * Pruebas de los conceptos de columna.
 *
 *   npm run test:conceptos
 *
 * Lo que puede fallar aquí en silencio son dos cosas. Una, que el texto de
 * ayuda se quede desfasado respecto a la tabla: por eso `enLaMatriz` se
 * comprueba contra los datos de verdad y no contra una cadena esperada. Y dos,
 * que un `terminoId` apunte a un término que ya no existe en el glosario: eso
 * deja un enlace muerto en el panel sin romper el render.
 */

import {
  CONCEPTOS_BASE,
  CONCEPTOS_COLUMNA,
  conceptoBasePorId,
  conceptoColumnaPorId,
} from './conceptos.ts'
import { glosarioPorId } from './glosario.ts'
import { HARDWARE } from './hardware.ts'
import { DISPOSITIVOS } from './dispositivos.ts'
import { CASOS_USO } from './useCases.ts'
import { MEMORIA } from './memoria.ts'
import { segmentarGlosario } from '../lib/glosarioTexto.ts'

let fallos = 0
function comprueba(nombre: string, cond: boolean, extra = '') {
  if (cond) {
    console.log(`  ok    ${nombre}`)
  } else {
    fallos++
    console.log(`  FALLA ${nombre} ${extra}`)
  }
}

console.log(
  `\nConceptos: ${CONCEPTOS_BASE.length} de base + ${CONCEPTOS_COLUMNA.length} columnas\n`,
)

/* El bloque de base -------------------------------------------------- */

const idsBase = CONCEPTOS_BASE.map((c) => c.id)
comprueba('ids de base sin duplicar', new Set(idsBase).size === idsBase.length)
comprueba('el índice de base cubre todas las entradas', conceptoBasePorId.size === idsBase.length)
comprueba('el recorrido guiado tiene al menos seis pasos', CONCEPTOS_BASE.length >= 6)

comprueba(
  'todas las de base con los cuatro campos',
  CONCEPTOS_BASE.every(
    (c) =>
      c.pregunta.trim().length > 10 &&
      c.enUnaFrase.length > 30 &&
      c.analogia.length > 40 &&
      c.detalle.length > 60,
  ),
  CONCEPTOS_BASE.filter((c) => c.analogia.length <= 40)
    .map((c) => c.id)
    .join(', '),
)

// El primer paso es lo primero que ve alguien que no sabe nada: si empieza
// hablando de TOPS o de watts, el recorrido arranca por donde no debe.
comprueba(
  'el primer paso no arranca con siglas',
  !/TOPS|TFLOPS|TDP|NPU|SOM|IPC/.test(CONCEPTOS_BASE[0].enUnaFrase),
)

comprueba(
  'la respuesta en una frase es una sola frase',
  CONCEPTOS_BASE.every((c) => c.enUnaFrase.trimEnd().split('. ').length <= 2),
  CONCEPTOS_BASE.filter((c) => c.enUnaFrase.trimEnd().split('. ').length > 2)
    .map((c) => c.id)
    .join(', '),
)

/* Integridad de las columnas ---------------------------------------- */

const ids = CONCEPTOS_COLUMNA.map((c) => c.id)
comprueba('ids sin duplicar', new Set(ids).size === ids.length)
comprueba('el índice cubre todas las entradas', conceptoColumnaPorId.size === ids.length)

comprueba(
  'todas con los tres textos sustanciales',
  CONCEPTOS_COLUMNA.every(
    (c) => c.queMide.length > 40 && c.comoSeLee.length > 40 && c.ojo.length > 40,
  ),
  CONCEPTOS_COLUMNA.filter((c) => c.ojo.length <= 40)
    .map((c) => c.id)
    .join(', '),
)

// `llano` es la versión para quien no sabe nada: si se alarga, ya no lo es.
comprueba(
  'todas con su versión en lenguaje llano, y breve',
  CONCEPTOS_COLUMNA.every((c) => c.llano.length > 30 && c.llano.length < 220),
  CONCEPTOS_COLUMNA.filter((c) => c.llano.length >= 220)
    .map((c) => c.id)
    .join(', '),
)

comprueba(
  'todas con su cifra real de la matriz',
  CONCEPTOS_COLUMNA.every((c) => c.enLaMatriz.trim().length > 0),
)

comprueba(
  'los textos acaban en punto',
  [
    ...CONCEPTOS_COLUMNA.flatMap((c) => [c.llano, c.queMide, c.comoSeLee, c.ojo]),
    ...CONCEPTOS_BASE.flatMap((c) => [c.enUnaFrase, c.analogia, c.detalle]),
  ].every((t) => t.trimEnd().endsWith('.')),
)

/* Las dos mitades de la tabla ---------------------------------------- */

// La línea vertical de la matriz separa la hoja original de lo que añadieron
// los otros módulos, y el tablero pinta esa misma división en dos bloques: si
// una de las dos mitades se queda vacía, el bloque sale sin botones.
const deHoja = CONCEPTOS_COLUMNA.filter((c) => !c.añadida)
const añadidas = CONCEPTOS_COLUMNA.filter((c) => c.añadida)
comprueba('hay columnas en las dos mitades', deHoja.length > 0 && añadidas.length > 0)
comprueba(
  'las añadidas van después de las de la hoja',
  CONCEPTOS_COLUMNA.findIndex((c) => c.añadida) === deHoja.length,
)

/* Enlaces al glosario ------------------------------------------------ */

const enlaces = CONCEPTOS_COLUMNA.filter((c) => c.terminoId)
comprueba('hay columnas enlazadas al glosario', enlaces.length >= 4)
for (const c of enlaces) {
  comprueba(`«${c.titulo}» enlaza a un término que existe`, glosarioPorId.has(c.terminoId!), c.terminoId)
}

/* Las cifras siguen a los datos, no al revés ------------------------- */

const cifra = (id: string) => conceptoColumnaPorId.get(id)!.enLaMatriz

comprueba(
  `precio cita los extremos reales (${cifra('precio')})`,
  cifra('precio').includes(String(Math.min(...HARDWARE.map((h) => h.precioMin)))) &&
    cifra('precio').includes(Math.max(...HARDWARE.map((h) => h.precioMax)).toLocaleString('es')),
)

comprueba(
  `tdp cita el techo real (${cifra('tdp')})`,
  cifra('tdp').includes(String(Math.max(...HARDWARE.map((h) => h.tdpMax)))),
)

comprueba(
  `tops cuenta las filas con acelerador (${cifra('tops')})`,
  cifra('tops').includes(String(HARDWARE.filter((h) => h.topsMax > 0).length)),
)

comprueba(
  `categoría cuenta las filas y los equipos (${cifra('categoria')})`,
  cifra('categoria').includes(String(HARDWARE.length)) &&
    cifra('categoria').includes(String(DISPOSITIVOS.length)),
)

comprueba(
  `equipos cuenta el catálogo completo (${cifra('equipos')})`,
  cifra('equipos').includes(String(DISPOSITIVOS.length)),
)

comprueba(
  `uso cuenta los casos evaluados (${cifra('uso')})`,
  cifra('uso').includes(String(CASOS_USO.length)),
)

comprueba(
  `almacenamiento cuenta sobre las filas con ficha de memoria (${cifra('almacenamiento')})`,
  cifra('almacenamiento').includes(String(Object.keys(MEMORIA).length)),
)

/* El marcado automático se aplica de verdad -------------------------- */

// Los textos se pintan con `TextoConGlosario`: si ninguno tuviera términos
// reconocibles, el panel explicaría siglas con más siglas sin definir.
const marcados = CONCEPTOS_COLUMNA.filter((c) =>
  [c.queMide, c.comoSeLee, c.ojo].some((t) =>
    segmentarGlosario(t).some((p) => typeof p !== 'string'),
  ),
)
comprueba(
  `${marcados.length} de ${CONCEPTOS_COLUMNA.length} columnas marcan algún término`,
  marcados.length >= CONCEPTOS_COLUMNA.length - 2,
)

comprueba(
  'los textos se reconstruyen sin alterarse',
  [
    ...CONCEPTOS_COLUMNA.flatMap((c) => [c.llano, c.queMide, c.comoSeLee, c.ojo]),
    ...CONCEPTOS_BASE.flatMap((c) => [c.enUnaFrase, c.analogia, c.detalle]),
  ].every(
    (t) =>
      segmentarGlosario(t)
        .map((p) => (typeof p === 'string' ? p : p.texto))
        .join('') === t,
  ),
)

console.log(`\n${fallos === 0 ? 'TODO OK' : `${fallos} FALLO(S)`}\n`)
process.exit(fallos === 0 ? 0 : 1)
