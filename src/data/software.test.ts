/**
 * Pruebas de la matriz de soporte de software.
 *
 *   npm run test:software
 *
 * Una matriz de 7 equipos × 18 programas son 126 celdas escritas a mano. Un
 * hueco no se ve: la interfaz lo pinta como «No» y nadie se entera de que en
 * realidad nadie lo decidió. Estas pruebas exigen que cada celda exista.
 */

import { HARDWARE } from './hardware.ts'
import { RUNTIMES, SOPORTE, TAREAS, runtimePorId, tareaPorId } from './software.ts'

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
  `\nSoporte: ${HARDWARE.length} equipos × ${RUNTIMES.length} programas = ${HARDWARE.length * RUNTIMES.length} celdas, más ${HARDWARE.length * TAREAS.length} de tareas\n`,
)

/* Cobertura: ninguna celda sin decidir ------------------------------- */

comprueba(
  'todos los equipos de la matriz tienen soporte documentado',
  HARDWARE.every((h) => Boolean(SOPORTE[h.id])),
  HARDWARE.filter((h) => !SOPORTE[h.id]).map((h) => h.id).join(', '),
)

const huecosRuntime: string[] = []
for (const h of HARDWARE) {
  for (const r of RUNTIMES) {
    if (!SOPORTE[h.id]?.runtimes[r.id]) huecosRuntime.push(`${h.id}/${r.id}`)
  }
}
comprueba('ninguna celda de programa sin rellenar', huecosRuntime.length === 0, huecosRuntime.join(', '))

const huecosTarea: string[] = []
for (const h of HARDWARE) {
  for (const t of TAREAS) {
    if (!SOPORTE[h.id]?.tareas[t.id]) huecosTarea.push(`${h.id}/${t.id}`)
  }
}
comprueba('ninguna celda de tarea sin rellenar', huecosTarea.length === 0, huecosTarea.join(', '))

/* Integridad de los catálogos ---------------------------------------- */

comprueba('ids de programa sin duplicar', new Set(RUNTIMES.map((r) => r.id)).size === RUNTIMES.length)
comprueba('ids de tarea sin duplicar', new Set(TAREAS.map((t) => t.id)).size === TAREAS.length)
comprueba(
  'ningún soporte referencia un programa inexistente',
  Object.values(SOPORTE).every((s) => Object.keys(s.runtimes).every((id) => runtimePorId.has(id))),
)
comprueba(
  'ningún soporte referencia una tarea inexistente',
  Object.values(SOPORTE).every((s) => Object.keys(s.tareas).every((id) => tareaPorId.has(id))),
)
comprueba(
  'cada programa explica qué es y para qué sirve',
  RUNTIMES.every((r) => r.queEs.length > 40 && r.seUsaPara.length > 15),
)
comprueba(
  'cada equipo tiene un resumen sustancial',
  Object.values(SOPORTE).every((s) => s.resumen.length > 60),
)

/* Los «limitado» tienen que explicarse ------------------------------- */

const limitadosSinNota: string[] = []
for (const h of HARDWARE) {
  for (const r of RUNTIMES) {
    const s = SOPORTE[h.id]?.runtimes[r.id]
    if (s?.n === 'limitado' && !s.nota) limitadosSinNota.push(`${h.id}/${r.id}`)
  }
}
comprueba(
  'todo «con límites» explica cuál es el límite',
  limitadosSinNota.length === 0,
  limitadosSinNota.join(', '),
)

/* Coherencia con la realidad ----------------------------------------- */

// Lo que motivó toda esta sección.
comprueba(
  'ningún microcontrolador soporta Ollama',
  ['mcu-basico', 'mcu-edge-ai'].every((id) => SOPORTE[id].runtimes.ollama.n === 'no'),
)
comprueba(
  'el «no» de Ollama en microcontrolador viene explicado',
  ['mcu-basico', 'mcu-edge-ai'].every((id) => Boolean(SOPORTE[id].runtimes.ollama.nota)),
)
comprueba(
  'ningún microcontrolador soporta software de Linux',
  ['mcu-basico', 'mcu-edge-ai'].every((id) =>
    ['tflite', 'onnx', 'frigate', 'pytorch', 'triton'].every(
      (r) => SOPORTE[id].runtimes[r].n === 'no',
    ),
  ),
)
comprueba(
  'la pila de NVIDIA solo corre donde hay GPU NVIDIA',
  ['mcu-basico', 'mcu-edge-ai', 'sbc-economico'].every((id) =>
    ['tensorrt', 'deepstream', 'isaac'].every((r) => SOPORTE[id].runtimes[r].n === 'no'),
  ),
)
comprueba(
  'los equipos con GPU NVIDIA sí soportan TensorRT',
  ['edge-ai-integrado', 'edge-ai-potencia', 'gpu-ipc', 'gpu-enterprise'].every(
    (id) => SOPORTE[id].runtimes.tensorrt.n === 'si',
  ),
)
comprueba(
  'solo la GPU Enterprise entrena sin límites',
  SOPORTE['gpu-enterprise'].tareas.entrenamiento === 'si' &&
    HARDWARE.filter((h) => h.id !== 'gpu-enterprise').every(
      (h) => SOPORTE[h.id].tareas.entrenamiento !== 'si',
    ),
)
comprueba(
  'el MCU básico no hace visión de ningún tipo',
  ['vision-basica', 'verificacion', 'vision-tiempo-real', 'multicamara'].every(
    (t) => SOPORTE['mcu-basico'].tareas[t] === 'no',
  ),
)
comprueba(
  'el control determinista se pierde al subir a Linux',
  SOPORTE['mcu-basico'].tareas.control === 'si' &&
    SOPORTE['gpu-enterprise'].tareas.control === 'no',
)
// La capacidad de lenguaje debe crecer con la memoria, no ir a saltos.
const ordenLenguaje = ['mcu-basico', 'mcu-edge-ai', 'sbc-economico', 'edge-ai-integrado']
const valor = { no: 0, limitado: 1, si: 2 } as const
comprueba(
  'la capacidad de lenguaje crece de forma monótona con la memoria',
  ordenLenguaje.every(
    (id, i) =>
      i === 0 ||
      valor[SOPORTE[id].tareas.lenguaje] >= valor[SOPORTE[ordenLenguaje[i - 1]].tareas.lenguaje],
  ),
)

/* Resumen informativo -------------------------------------------------- */

console.log('\n  Programas soportados por equipo:')
for (const h of HARDWARE) {
  const s = SOPORTE[h.id]
  const si = RUNTIMES.filter((r) => s.runtimes[r.id].n === 'si').length
  const lim = RUNTIMES.filter((r) => s.runtimes[r.id].n === 'limitado').length
  console.log(
    `    ${h.categoria.slice(0, 28).padEnd(28)} ${String(si).padStart(2)} sí · ${String(lim).padStart(2)} con límites · ${String(RUNTIMES.length - si - lim).padStart(2)} no`,
  )
}

console.log(`\n${fallos === 0 ? 'TODO OK' : `${fallos} FALLO(S)`}\n`)
process.exit(fallos === 0 ? 0 : 1)
