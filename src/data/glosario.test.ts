/**
 * Pruebas del glosario y del segmentador.
 *
 *   npm run test:glosario
 *
 * Se ejecuta con el stripping de tipos de Node, sin framework: el segmentador
 * es la única lógica del proyecto que puede fallar de forma silenciosa —marcar
 * "somos" como SOM, perder texto al reconstruir, o entrar en bucle— y eso hay
 * que cazarlo antes de que llegue a la interfaz.
 */

import { FORMAS_ORDENADAS, GLOSARIO } from './glosario.ts'
import { segmentarGlosario } from '../lib/glosarioTexto.ts'

type Marca = { id: string; texto: string }

const marcados = (t: string): Marca[] =>
  segmentarGlosario(t).filter((p): p is Marca => typeof p !== 'string')

const reconstruye = (t: string) =>
  segmentarGlosario(t)
    .map((p) => (typeof p === 'string' ? p : p.texto))
    .join('')

let fallos = 0
function comprueba(nombre: string, cond: boolean, extra = '') {
  if (cond) {
    console.log(`  ok    ${nombre}`)
  } else {
    fallos++
    console.log(`  FALLA ${nombre} ${extra}`)
  }
}

console.log(`\nGlosario: ${GLOSARIO.length} entradas, ${FORMAS_ORDENADAS.length} formas\n`)

/* Integridad de los datos ------------------------------------------- */

const ids = GLOSARIO.map((e) => e.id)
comprueba('ids sin duplicar', new Set(ids).size === ids.length)

const formas = FORMAS_ORDENADAS.map((f) => f.forma.toLowerCase())
const dup = formas.filter((f, i) => formas.indexOf(f) !== i)
comprueba('formas sin duplicar', dup.length === 0, JSON.stringify(dup))

comprueba(
  'todas con definición sustancial',
  GLOSARIO.every((e) => e.definicion.trim().length > 20),
)
comprueba(
  'todas con al menos una forma no vacía',
  GLOSARIO.every((e) => e.formas.length > 0 && e.formas[0].trim() !== ''),
)
comprueba(
  'formas ordenadas de larga a corta',
  FORMAS_ORDENADAS.every((f, i) => i === 0 || FORMAS_ORDENADAS[i - 1].forma.length >= f.forma.length),
)

/* El texto nunca se altera ------------------------------------------- */

const textos = [
  'TOPS/W contra precio medio por unidad. Eje de precio en escala logarítmica.',
  'Inspección en tiempo real sobre cinta en movimiento, una o dos cámaras, dentro de un gabinete en planta.',
  'Puente OPC-UA/Modbus hacia la nube, con panel de operador local.',
  'Nodos sobre motores y bombas que analizan vibración y sonido con TinyML.',
  'Vehículo autónomo alimentado por batería que navega y evita obstáculos.',
  'Celda de manufactura con varios flujos 4K simultáneos y fusión de sensores.',
  'Un IPC x86 en el cuarto de control concentra las cámaras IP de la planta.',
  'Entrenamiento de modelos propios y simulación de planta completa (Omniverse) en sala técnica.',
  'Accionamiento de relés y válvulas. El ciclo debe cerrarse en un tiempo garantizado.',
  '',
  'una frase corriente sin nada que marcar',
]
for (const t of textos) {
  comprueba(`reconstruye «${t.slice(0, 38)}…»`, reconstruye(t) === t)
}

/* Prioridad de la forma más larga ------------------------------------ */

comprueba(
  'TOPS/W gana a TOPS',
  marcados('El equipo da 40 TOPS/W de eficiencia.').some(
    (m) => m.id === 'tops-watt' && m.texto === 'TOPS/W',
  ),
)
comprueba(
  'Edge AI gana a Edge',
  marcados('Los módulos Edge AI integrados.')[0]?.texto === 'Edge AI',
)
comprueba(
  'cámaras IP gana a IoT/IP suelto',
  marcados('Concentra 30 cámaras IP de planta.').some((m) => m.id === 'camara-ip'),
)

/* Solo la primera aparición ------------------------------------------ */

comprueba('solo la primera aparición', marcados('TOPS y más TOPS y aún más TOPS.').length === 1)

/* Sin falsos positivos ----------------------------------------------- */

comprueba('«somos» no dispara SOM', !marcados('Nosotros somos el equipo.').some((m) => m.id === 'som'))
comprueba(
  '«amarillo» no dispara AMR',
  !marcados('El cable amarillo va al relé.').some((m) => m.id === 'amr'),
)
comprueba(
  'sigla pegada a letras no dispara',
  !marcados('varios IPCsintaxis raros').some((m) => m.id === 'ipc'),
)
comprueba(
  'sigla en minúscula no dispara',
  !marcados('un tops cualquiera en minúscula').some((m) => m.id === 'tops'),
)

/* Límites de palabra que sí deben disparar --------------------------- */

comprueba('«(TDP)» dispara', marcados('el consumo (TDP) del equipo').some((m) => m.id === 'tdp'))
comprueba('«TOPS.» dispara', marcados('rinde 275 TOPS.').some((m) => m.id === 'tops'))
comprueba(
  '«OPC-UA/Modbus» dispara ambos',
  (() => {
    const m = marcados('Puente OPC-UA/Modbus a la nube')
    return m.some((x) => x.id === 'opc-ua') && m.some((x) => x.id === 'modbus')
  })(),
)

/* Rendimiento -------------------------------------------------------- */

const largo = textos.join(' ').repeat(20)
const t0 = process.hrtime.bigint()
segmentarGlosario(largo)
const ms = Number(process.hrtime.bigint() - t0) / 1e6
comprueba(`rendimiento: ${largo.length} caracteres en ${ms.toFixed(1)} ms`, ms < 250)

console.log(`\n${fallos === 0 ? 'TODO OK' : `${fallos} FALLO(S)`}\n`)
process.exit(fallos === 0 ? 0 : 1)
