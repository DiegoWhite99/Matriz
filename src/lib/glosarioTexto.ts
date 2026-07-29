/**
 * Localización de términos del glosario dentro de prosa.
 *
 * Módulo sin JSX a propósito: así se puede probar directamente con Node
 * (`npm run test:glosario`) sin montar un entorno de React.
 */

import { FORMAS_ORDENADAS } from '../data/glosario.ts'

const ALFANUM = /[\p{L}\p{N}]/u

/** Un límite de palabra real: fin de cadena o carácter no alfanumérico. */
const esLimite = (ch: string | undefined) => ch === undefined || !ALFANUM.test(ch)

export type Segmento = string | { id: string; texto: string }

/**
 * Formas agrupadas por su carácter inicial.
 *
 * Sin este índice había que probar las 70 formas en cada posición del texto,
 * con un `slice` y un `toLowerCase` por intento: 15 KB de prosa tardaban casi
 * 300 ms. Agrupando por inicial quedan una o dos candidatas por posición.
 *
 * `FORMAS_ORDENADAS` ya viene de larga a corta, y agrupar preserva ese orden
 * dentro de cada cubo, que es lo que hace ganar "Edge AI" sobre "Edge".
 */
const POR_INICIAL = (() => {
  const mapa = new Map<string, typeof FORMAS_ORDENADAS>()
  for (const f of FORMAS_ORDENADAS) {
    const inicial = f.forma[0]
    // Una forma insensible a la caja puede empezar por cualquiera de las dos.
    const claves = f.sensible
      ? [inicial]
      : [...new Set([inicial.toLowerCase(), inicial.toUpperCase()])]
    for (const k of claves) {
      const cubo = mapa.get(k)
      if (cubo) cubo.push(f)
      else mapa.set(k, [f])
    }
  }
  return mapa
})()

/**
 * Parte el texto en tramos llanos y términos del glosario.
 *
 * Dos reglas deliberadas:
 *
 * - Solo se marca la **primera** aparición de cada término. Marcar las cinco
 *   veces que sale "TOPS" en un párrafo convierte la ayuda en ruido.
 * - Las formas se prueban de la más larga a la más corta, así "Edge AI" gana a
 *   "Edge" y "TOPS/W" a "TOPS".
 *
 * Las siglas se comparan respetando mayúsculas (ver `sensible` en el glosario):
 * sin eso, "SOM" cazaría "somos".
 */
export function segmentarGlosario(texto: string): Segmento[] {
  const usados = new Set<string>()
  const partes: Segmento[] = []
  let buffer = ''
  let i = 0

  while (i < texto.length) {
    let hallado: { id: string; texto: string } | null = null

    // Todas las formas empiezan por letra o dígito, así que una posición a
    // mitad de palabra no puede iniciar ninguna: se descarta sin más pruebas.
    const candidatas = esLimite(texto[i - 1]) ? POR_INICIAL.get(texto[i]) : undefined

    if (candidatas) {
      for (const f of candidatas) {
        if (usados.has(f.id)) continue
        const fin = i + f.forma.length
        if (fin > texto.length) continue
        if (!esLimite(texto[fin])) continue
        const trozo = texto.slice(i, fin)
        const coincide = f.sensible
          ? trozo === f.forma
          : trozo.toLowerCase() === f.forma.toLowerCase()
        if (!coincide) continue
        hallado = { id: f.id, texto: trozo }
        break
      }
    }

    if (hallado) {
      if (buffer) {
        partes.push(buffer)
        buffer = ''
      }
      partes.push(hallado)
      usados.add(hallado.id)
      i += hallado.texto.length
    } else {
      buffer += texto[i]
      i++
    }
  }

  if (buffer) partes.push(buffer)
  return partes
}
