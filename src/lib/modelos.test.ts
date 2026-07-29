/**
 * Pruebas del cálculo de capacidad de modelos.
 *
 *   npm run test:modelos
 *
 * La aritmética es una división, pero el resultado se presenta como consejo de
 * compra: si el techo de un equipo sale mal, alguien elige un módulo que no
 * puede cargar el modelo que necesita. Y un error de factor 1000 en una
 * unidad —confundir MB con GB— es invisible a ojo.
 */

import { HARDWARE } from '../data/hardware.ts'
import { BYTES_POR_PARAMETRO, MEMORIA, type Cuantizacion } from '../data/memoria.ts'
import {
  MODELOS_REFERENCIA,
  capacidades,
  formatearMemoria,
  formatearParametros,
  parametrosMaximos,
  referenciasQueCaben,
} from './modelos.ts'

let fallos = 0
function comprueba(nombre: string, cond: boolean, extra = '') {
  if (cond) {
    console.log(`  ok    ${nombre}`)
  } else {
    fallos++
    console.log(`  FALLA ${nombre} ${extra}`)
  }
}

const caps = capacidades()
console.log(`\nCapacidad: ${caps.length} equipos con datos de memoria\n`)

/* Cobertura e integridad --------------------------------------------- */

comprueba('todos los equipos de la matriz tienen memoria documentada', caps.length === HARDWARE.length)
comprueba(
  'ninguna clave de MEMORIA sobra',
  Object.keys(MEMORIA).every((id) => HARDWARE.some((h) => h.id === id)),
)
comprueba(
  'fracción útil dentro de (0, 1]',
  Object.values(MEMORIA).every((m) => m.fraccionUtil > 0 && m.fraccionUtil <= 1),
)
comprueba('memoria total positiva', Object.values(MEMORIA).every((m) => m.totalGb > 0))
comprueba(
  'cada equipo lista modelos y lo que no puede',
  Object.values(MEMORIA).every((m) => m.modelosTipicos.length > 0 && m.fueraDeAlcance.length > 20),
)

/* La aritmética ------------------------------------------------------- */

comprueba(
  'INT8 dobla a FP16 en todos los equipos',
  caps.every((c) => Math.abs(c.maximos.int8 - c.maximos.fp16 * 2) < 1),
)
comprueba(
  'INT4 cuadruplica a FP16 en todos los equipos',
  caps.every((c) => Math.abs(c.maximos.int4 - c.maximos.fp16 * 4) < 1),
)
comprueba(
  'más memoria útil nunca da menos techo',
  [...caps]
    .sort((a, b) => a.bytesUtiles - b.bytesUtiles)
    .every((c, i, arr) => i === 0 || c.maximos.int8 >= arr[i - 1].maximos.int8),
)

// Comprobación cruzada con la unidad, que es donde se cuelan los factores 1000.
const gpuEnt = caps.find((c) => c.hardware.id === 'gpu-enterprise')!
comprueba(
  'GPU Enterprise: 48 GB × 0,85 ÷ 1 byte = 40,8 B parámetros en INT8',
  Math.abs(gpuEnt.maximos.int8 - 40.8e9) < 1e8,
  `salió ${gpuEnt.maximos.int8.toExponential(2)}`,
)
const mcu = caps.find((c) => c.hardware.id === 'mcu-basico')!
comprueba(
  'MCU básico: 0,25 MB × 0,6 ÷ 1 byte = 150 k parámetros en INT8',
  Math.abs(mcu.maximos.int8 - 150_000) < 100,
  `salió ${mcu.maximos.int8}`,
)

/* Coherencia con la realidad ------------------------------------------ */

comprueba(
  'la GPU Enterprise puede con un modelo de 70 B en INT4',
  gpuEnt.maximos.int4 >= 70e9,
)
comprueba(
  'la GPU Enterprise NO puede con un 70 B en FP16',
  gpuEnt.maximos.fp16 < 70e9,
)
comprueba('el MCU básico no puede con MobileNet v2', mcu.maximos.int8 < 3_500_000)
comprueba(
  'el MCU Edge AI sí puede con un autoencoder de 100 k',
  caps.find((c) => c.hardware.id === 'mcu-edge-ai')!.maximos.int8 >= 100_000,
)
comprueba(
  'el Jetson Orin integrado puede con un modelo de 8 B en INT4',
  caps.find((c) => c.hardware.id === 'edge-ai-integrado')!.maximos.int4 >= 8e9,
)

/* Referencias --------------------------------------------------------- */

comprueba('todos los modelos de referencia tienen parámetros positivos', MODELOS_REFERENCIA.every((m) => m.parametros > 0))
comprueba(
  'nombres de referencia sin duplicar',
  new Set(MODELOS_REFERENCIA.map((m) => m.nombre)).size === MODELOS_REFERENCIA.length,
)
// Si algo cabe en FP16, tiene que caber también en INT8 y en INT4.
comprueba(
  'lo que cabe en FP16 cabe en INT8 y en INT4',
  caps.every((c) => {
    const fp16 = referenciasQueCaben(c, 'fp16').map((m) => m.nombre)
    const int8 = new Set(referenciasQueCaben(c, 'int8').map((m) => m.nombre))
    const int4 = new Set(referenciasQueCaben(c, 'int4').map((m) => m.nombre))
    return fp16.every((n) => int8.has(n) && int4.has(n))
  }),
)

/* Formato ------------------------------------------------------------- */

const casosFormato: [number, string][] = [
  [20_000, '20 k'],
  [3_500_000, '3.5 M'],
  [43_700_000, '44 M'],
  [1_550_000_000, '1.6 B'],
  [8_000_000_000, '8 B'],
  [70_000_000_000, '70 B'],
]
for (const [n, esperado] of casosFormato) {
  comprueba(`formatearParametros(${n}) = «${esperado}»`, formatearParametros(n) === esperado, `salió «${formatearParametros(n)}»`)
}
comprueba('formatearMemoria(48) = «48 GB»', formatearMemoria(48) === '48 GB')
comprueba('formatearMemoria(0.004) = «4 MB»', formatearMemoria(0.004) === '4 MB', `salió «${formatearMemoria(0.004)}»`)
comprueba(
  'formatearMemoria(0.00025) = «250 KB»',
  formatearMemoria(0.00025) === '250 KB',
  `salió «${formatearMemoria(0.00025)}»`,
)

/* Tabla resumen: informativo ------------------------------------------ */

console.log('\n  Techo de parámetros por equipo:')
console.log(`    ${'Categoría'.padEnd(26)} ${'memoria'.padStart(9)} ${'FP16'.padStart(8)} ${'INT8'.padStart(8)} ${'INT4'.padStart(8)}`)
for (const c of caps) {
  const q = (x: Cuantizacion) => formatearParametros(parametrosMaximos(c.memoria, x)).padStart(8)
  console.log(
    `    ${c.hardware.categoria.slice(0, 26).padEnd(26)} ${formatearMemoria(c.memoria.totalGb).padStart(9)} ${q('fp16')} ${q('int8')} ${q('int4')}`,
  )
}
console.log(`\n  (bytes por parámetro — FP16: ${BYTES_POR_PARAMETRO.fp16}, INT8: ${BYTES_POR_PARAMETRO.int8}, INT4: ${BYTES_POR_PARAMETRO.int4})`)

console.log(`\n${fallos === 0 ? 'TODO OK' : `${fallos} FALLO(S)`}\n`)
process.exit(fallos === 0 ? 0 : 1)
