/**
 * Cuántos parámetros de modelo cabe en cada equipo.
 *
 * La aritmética completa es una división:
 *
 *     parámetros máximos = (memoria total × fracción útil) ÷ bytes por parámetro
 *
 * Lo que hace útil el resultado no es la división, sino las tres cosas que
 * deja fuera y hay que decir en voz alta:
 *
 * 1. **La caché KV no está contada.** Un modelo de lenguaje guarda el estado
 *    de la conversación aparte de sus pesos, y ese estado crece con la
 *    longitud del contexto. En contextos largos puede ocupar varios GB, así
 *    que el techo real queda por debajo del calculado.
 * 2. **Es un techo, no una recomendación.** Un modelo que ocupa el 95 % de la
 *    memoria cabe y funciona mal.
 * 3. **Caber no es ir rápido.** Esto responde "¿entra?". Los TOPS responden
 *    "¿a qué velocidad?", y son preguntas independientes.
 */

import { HARDWARE, type Hardware } from '../data/hardware.ts'
import {
  BYTES_POR_PARAMETRO,
  MEMORIA,
  type Cuantizacion,
  type MemoriaEquipo,
} from '../data/memoria.ts'

/** Memoria efectivamente disponible para los pesos, en bytes. */
export const bytesUtiles = (m: MemoriaEquipo) => m.totalGb * 1e9 * m.fraccionUtil

/** Techo de parámetros para una cuantización dada. */
export const parametrosMaximos = (m: MemoriaEquipo, q: Cuantizacion) =>
  bytesUtiles(m) / BYTES_POR_PARAMETRO[q]

export interface CapacidadEquipo {
  hardware: Hardware
  memoria: MemoriaEquipo
  bytesUtiles: number
  /** Techo de parámetros por cuantización. */
  maximos: Record<Cuantizacion, number>
  /** Cuántos TOPS tiene para mover ese modelo. */
  topsMax: number
}

export function capacidades(universo: Hardware[] = HARDWARE): CapacidadEquipo[] {
  return universo
    .filter((h) => MEMORIA[h.id])
    .map((h) => {
      const memoria = MEMORIA[h.id]
      return {
        hardware: h,
        memoria,
        bytesUtiles: bytesUtiles(memoria),
        maximos: {
          fp16: parametrosMaximos(memoria, 'fp16'),
          int8: parametrosMaximos(memoria, 'int8'),
          int4: parametrosMaximos(memoria, 'int4'),
        },
        topsMax: h.topsMax,
      }
    })
}

/**
 * Formatea un número de parámetros en la unidad con la que se habla de
 * modelos: "8 B" por ocho mil millones, "250 k" por doscientos cincuenta mil.
 */
export function formatearParametros(n: number): string {
  if (n >= 1e9) {
    const b = n / 1e9
    return `${b >= 10 ? Math.round(b) : b.toFixed(1).replace(/\.0$/, '')} B`
  }
  if (n >= 1e6) {
    const m = n / 1e6
    return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, '')} M`
  }
  if (n >= 1e3) return `${Math.round(n / 1e3)} k`
  return String(Math.round(n))
}

/** Quita los ceros decimales sobrantes sin tocar los enteros: 4.00 → 4, 40 → 40. */
function sinCerosSobrantes(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s
}

/** Memoria en la unidad que toca: KB, MB o GB según la magnitud. */
export function formatearMemoria(gb: number): string {
  if (gb >= 1) return `${sinCerosSobrantes(gb.toFixed(2))} GB`
  const mb = gb * 1000
  if (mb >= 1) return `${sinCerosSobrantes(mb.toFixed(mb >= 10 ? 0 : 2))} MB`
  return `${Math.round(mb * 1000)} KB`
}

/**
 * Modelos de referencia, para poder situar los techos en algo reconocible.
 *
 * No es una lista de recomendaciones: es una regla graduada. Al ver que un
 * equipo tiene techo de 22 B en INT4, saber que Llama 3 8B son 8 000 millones
 * dice más que el número suelto.
 */
export interface ModeloReferencia {
  nombre: string
  parametros: number
  tipo: 'lenguaje' | 'vision' | 'audio'
  nota: string
}

export const MODELOS_REFERENCIA: ModeloReferencia[] = [
  {
    nombre: 'Detector de palabra clave',
    parametros: 20_000,
    tipo: 'audio',
    nota: 'El suelo del TinyML: reconoce una orden concreta y nada más.',
  },
  {
    nombre: 'MobileNet v2',
    parametros: 3_500_000,
    tipo: 'vision',
    nota: 'Clasificación de imagen pensada desde el principio para el borde.',
  },
  {
    nombre: 'YOLOv8n',
    parametros: 3_200_000,
    tipo: 'vision',
    nota: 'Detección de objetos en su variante más pequeña.',
  },
  {
    nombre: 'ResNet-50',
    parametros: 25_600_000,
    tipo: 'vision',
    nota: 'El clásico de clasificación, todavía la referencia en control de calidad.',
  },
  {
    nombre: 'YOLOv8l',
    parametros: 43_700_000,
    tipo: 'vision',
    nota: 'Detección grande, para cuando el defecto es sutil.',
  },
  {
    nombre: 'Whisper large',
    parametros: 1_550_000_000,
    tipo: 'audio',
    nota: 'Transcripción de voz de calidad alta.',
  },
  {
    nombre: 'Modelo de lenguaje de 8 B',
    parametros: 8_000_000_000,
    tipo: 'lenguaje',
    nota: 'El tamaño habitual cuando se quiere lenguaje corriendo en el borde.',
  },
  {
    nombre: 'Modelo de lenguaje de 70 B',
    parametros: 70_000_000_000,
    tipo: 'lenguaje',
    nota: 'Calidad de asistente completo. Solo cabe en INT4 y en muy pocos equipos de la matriz.',
  },
]

/** Qué modelos de referencia caben en un equipo, con una cuantización dada. */
export function referenciasQueCaben(c: CapacidadEquipo, q: Cuantizacion): ModeloReferencia[] {
  return MODELOS_REFERENCIA.filter((m) => m.parametros <= c.maximos[q])
}
