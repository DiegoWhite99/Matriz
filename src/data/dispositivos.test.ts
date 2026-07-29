/**
 * Pruebas del catálogo de dispositivos.
 *
 *   npm run test:dispositivos
 *
 * Son 40 fichas escritas a mano con precio, consumo, memoria y TOPS. Un cero
 * de más en un precio o un GB donde iban MB no se ve leyendo, pero cambia por
 * completo qué equipo parece razonable. Estas pruebas comparan cada ficha
 * contra los rangos que declara su fila de la matriz.
 */

import { HARDWARE, byId } from './hardware.ts'
import { DISPOSITIVOS, FORMATOS, dispositivosDe } from './dispositivos.ts'
import { MEMORIA } from './memoria.ts'

let fallos = 0
function comprueba(nombre: string, cond: boolean, extra = '') {
  if (cond) {
    console.log(`  ok    ${nombre}`)
  } else {
    fallos++
    console.log(`  FALLA ${nombre} ${extra}`)
  }
}

console.log(`\nCatálogo: ${DISPOSITIVOS.length} dispositivos en ${HARDWARE.length} categorías\n`)

/* Integridad ---------------------------------------------------------- */

comprueba('ids sin duplicar', new Set(DISPOSITIVOS.map((d) => d.id)).size === DISPOSITIVOS.length)
comprueba(
  'nombres sin duplicar',
  new Set(DISPOSITIVOS.map((d) => d.nombre)).size === DISPOSITIVOS.length,
)
comprueba(
  'toda categoriaId existe en la matriz',
  DISPOSITIVOS.every((d) => Boolean(byId(d.categoriaId))),
  DISPOSITIVOS.filter((d) => !byId(d.categoriaId)).map((d) => d.id).join(', '),
)
comprueba('todo formato está en la lista de formatos', DISPOSITIVOS.every((d) => FORMATOS.includes(d.formato)))
comprueba(
  'ninguna categoría de la matriz se queda sin dispositivos',
  HARDWARE.every((h) => dispositivosDe(h.id).length > 0),
  HARDWARE.filter((h) => dispositivosDe(h.id).length === 0).map((h) => h.id).join(', '),
)
comprueba(
  'cada categoría tiene al menos cuatro opciones',
  HARDWARE.every((h) => dispositivosDe(h.id).length >= 4),
  HARDWARE.filter((h) => dispositivosDe(h.id).length < 4)
    .map((h) => `${h.id}=${dispositivosDe(h.id).length}`)
    .join(', '),
)

/* Valores con sentido -------------------------------------------------- */

comprueba('consumo positivo', DISPOSITIVOS.every((d) => d.tdpW > 0))
comprueba('memoria no negativa', DISPOSITIVOS.every((d) => d.memoriaGb >= 0))
comprueba(
  'precio positivo cuando se declara',
  DISPOSITIVOS.every((d) => d.precioUsd === null || d.precioUsd > 0),
)
comprueba(
  'TOPS positivos cuando se declaran',
  DISPOSITIVOS.every((d) => d.topsInt8 === null || d.topsInt8 > 0),
)
comprueba(
  'cada ficha explica qué la distingue',
  DISPOSITIVOS.every((d) => d.destacado.length > 40),
)
comprueba(
  'cada ficha nombra procesador y tipo de memoria',
  DISPOSITIVOS.every((d) => d.procesador.length > 5 && d.memoriaTipo.length > 3),
)

/* Coherencia con la fila de la matriz ---------------------------------- */

/*
 * Los accesorios quedan fuera de las tres comprobaciones de rango. Su precio y
 * su consumo son lo que SUMAN a un anfitrión, no lo que caracteriza a la fila:
 * los 3,5 W de un módulo M.2 no son «el consumo de un servidor de planta».
 */
const propios = DISPOSITIVOS.filter((d) => d.formato !== 'Accesorio')

const fueraDeRangoTdp: string[] = []
for (const d of propios) {
  const fila = byId(d.categoriaId)!
  // Margen holgado: un kit de desarrollo consume más que el módulo suelto, y
  // la matriz da el rango del equipo representativo, no de toda la fila.
  if (d.tdpW > fila.tdpMax * 2.5 || d.tdpW < fila.tdpMin / 5) {
    fueraDeRangoTdp.push(`${d.id} (${d.tdpW} W vs fila ${fila.tdpMin}-${fila.tdpMax} W)`)
  }
}
comprueba('el consumo encaja con la fila de la matriz', fueraDeRangoTdp.length === 0, fueraDeRangoTdp.join(' · '))

const fueraDeRangoPrecio: string[] = []
for (const d of propios) {
  if (d.precioUsd === null) continue
  const fila = byId(d.categoriaId)!
  if (d.precioUsd > fila.precioMax * 2.5 || d.precioUsd < fila.precioMin / 4) {
    fueraDeRangoPrecio.push(`${d.id} ($${d.precioUsd} vs fila $${fila.precioMin}-${fila.precioMax})`)
  }
}
comprueba('el precio encaja con la fila de la matriz', fueraDeRangoPrecio.length === 0, fueraDeRangoPrecio.join(' · '))

/*
 * La memoria se compara solo en las filas con sistema operativo. Dentro de los
 * microcontroladores la dispersión es de 250 veces —de los 32 KB de un Arduino
 * Uno a los 8 MB de un ESP32-S3— y esa fila ya tiene su propio tope de 20 MB
 * más abajo. Comparar contra el equipo representativo ahí no dice nada.
 */
const conSistemaOperativo = propios.filter(
  (d) => !['mcu-basico', 'mcu-edge-ai'].includes(d.categoriaId),
)
const memoriaExcesiva: string[] = []
for (const d of conSistemaOperativo) {
  const techo = MEMORIA[d.categoriaId]?.totalGb
  if (techo !== undefined && d.memoriaGb > techo * 2.5) {
    memoriaExcesiva.push(`${d.id} (${d.memoriaGb} GB vs fila ${techo} GB)`)
  }
}
comprueba('la memoria encaja con la fila de la matriz', memoriaExcesiva.length === 0, memoriaExcesiva.join(' · '))

/* Reglas de la matriz que no se pueden romper --------------------------- */

comprueba(
  'ningún microcontrolador declara TOPS',
  DISPOSITIVOS.filter((d) => ['mcu-basico', 'mcu-edge-ai'].includes(d.categoriaId)).every(
    (d) => d.topsInt8 === null,
  ),
)
comprueba(
  'ningún microcontrolador pasa de 20 MB de memoria',
  DISPOSITIVOS.filter((d) => ['mcu-basico', 'mcu-edge-ai'].includes(d.categoriaId)).every(
    (d) => d.memoriaGb <= 0.02,
  ),
)
comprueba(
  'toda GPU Enterprise pasa de 200 W',
  dispositivosDe('gpu-enterprise').every((d) => d.tdpW > 200),
)
comprueba(
  'toda tarjeta de IPC se queda por debajo de 250 W',
  dispositivosDe('gpu-ipc').every((d) => d.tdpW < 250),
)
comprueba(
  'los módulos SOM avisan de que necesitan placa base',
  DISPOSITIVOS.filter((d) => d.formato === 'Módulo SOM' && d.categoriaId !== 'sbc-economico').every(
    (d) => Boolean(d.advertencia) || d.destacado.toLowerCase().includes('placa'),
  ),
)

/* Resumen informativo --------------------------------------------------- */

console.log('\n  Dispositivos por categoría:')
for (const h of HARDWARE) {
  const ds = dispositivosDe(h.id)
  const precios = ds.map((d) => d.precioUsd).filter((p): p is number => p !== null)
  const rango = precios.length ? `$${Math.min(...precios)} – $${Math.max(...precios)}` : 'sin precio'
  console.log(`    ${h.categoria.slice(0, 28).padEnd(28)} ${String(ds.length).padStart(2)} · ${rango}`)
}

console.log(`\n${fallos === 0 ? 'TODO OK' : `${fallos} FALLO(S)`}\n`)
process.exit(fallos === 0 ? 0 : 1)
