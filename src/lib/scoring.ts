/**
 * Motor de puntuación determinista.
 *
 * Todos los números que muestra la aplicación —y todos los que recibe el
 * agente— se calculan aquí, no en el modelo de lenguaje. El agente redacta
 * la interpretación; la aritmética es reproducible y auditable.
 */

import {
  CRITERIOS,
  HARDWARE,
  precioMedio,
  tdpMedio,
  topsPorCien,
  topsPorWatt,
  type CriterioId,
  type Hardware,
} from '../data/hardware.ts'
import type { CasoUso } from '../data/useCases.ts'

export interface AporteCriterio {
  criterio: CriterioId
  nombre: string
  /** Peso normalizado (0–1) del criterio en este caso de uso. */
  peso: number
  /** Calificación del equipo en el criterio (0–100). */
  calificacion: number
  /** peso × calificación: cuántos puntos del total aporta este criterio. */
  aporte: number
}

export interface Resultado {
  hardware: Hardware
  /** Puntaje ponderado 0–100 para el caso de uso. */
  puntaje: number
  /** Posición en el ranking, 1 = mejor. Solo se asigna a los viables. */
  posicion: number
  /** false si incumple alguna restricción dura del caso. */
  viable: boolean
  /** Restricciones incumplidas, en lenguaje natural. */
  motivosDescarte: string[]
  aportes: AporteCriterio[]
}

/** Convierte los pesos declarados del caso en pesos que suman 1. */
export function normalizarPesos(caso: CasoUso): Record<CriterioId, number> {
  const total = Object.values(caso.pesos).reduce((a, b) => a + (b ?? 0), 0)
  const out = {} as Record<CriterioId, number>
  for (const c of CRITERIOS) {
    const bruto = caso.pesos[c.id] ?? 0
    out[c.id] = total > 0 ? bruto / total : 0
  }
  return out
}

function evaluarRestricciones(h: Hardware, caso: CasoUso): string[] {
  const motivos: string[] = []
  const { tdpMaxW, presupuestoMaxUsd, topsMin } = caso.restricciones

  // Se compara contra el mínimo del rango: si ni la configuración más
  // austera entra en el presupuesto o en el sobre térmico, queda fuera.
  if (tdpMaxW !== undefined && h.tdpMin > tdpMaxW) {
    motivos.push(
      `Consumo mínimo de ${h.tdpMin} W sobre el límite de ${tdpMaxW} W del punto de instalación.`,
    )
  }
  if (presupuestoMaxUsd !== undefined && h.precioMin > presupuestoMaxUsd) {
    motivos.push(
      `Precio de entrada de $${h.precioMin.toLocaleString('es')} sobre el presupuesto de $${presupuestoMaxUsd.toLocaleString('es')} por unidad.`,
    )
  }
  // El techo de TOPS es lo que decide si puede con la carga de inferencia.
  if (topsMin !== undefined && h.topsMax < topsMin) {
    motivos.push(
      `Techo de ${h.topsMax} TOPS por debajo de los ${topsMin} TOPS que exige la carga de inferencia.`,
    )
  }
  return motivos
}

/** Evalúa toda la matriz contra un caso de uso y devuelve el ranking. */
export function evaluar(caso: CasoUso, universo: Hardware[] = HARDWARE): Resultado[] {
  const pesos = normalizarPesos(caso)

  const parciales = universo.map((h) => {
    const aportes: AporteCriterio[] = CRITERIOS.filter((c) => pesos[c.id] > 0).map((c) => ({
      criterio: c.id,
      nombre: c.nombre,
      peso: pesos[c.id],
      calificacion: h.calificaciones[c.id],
      aporte: pesos[c.id] * h.calificaciones[c.id],
    }))
    const motivosDescarte = evaluarRestricciones(h, caso)
    return {
      hardware: h,
      puntaje: aportes.reduce((a, b) => a + b.aporte, 0),
      viable: motivosDescarte.length === 0,
      motivosDescarte,
      aportes: aportes.sort((a, b) => b.aporte - a.aporte),
      posicion: 0,
    }
  })

  // Los viables se ordenan por puntaje; los descartados van al final,
  // también por puntaje, para que se vea qué tan cerca estuvieron.
  parciales.sort((a, b) => {
    if (a.viable !== b.viable) return a.viable ? -1 : 1
    return b.puntaje - a.puntaje
  })

  let pos = 0
  for (const r of parciales) {
    if (r.viable) r.posicion = ++pos
  }
  return parciales
}

export interface Consejo {
  /** Casos de uso donde este equipo es la primera opción o empata con ella. */
  gana: string[]
  /** Casos donde es viable pero claramente por detrás. */
  viable: string[]
  /** Casos que descarta por restricción dura. */
  descartado: number
}

/**
 * Margen dentro del cual dos equipos se consideran empatados.
 *
 * Existe porque el ranking puede separar a dos equipos por décimas: en
 * "Control determinista" los dos microcontroladores quedan a 0,15 puntos. Con
 * esa diferencia, presentar uno como "el recomendado" y el otro como
 * "alternativa" es inventar una precisión que las calificaciones no tienen.
 * Ambos reciben el consejo y quien decide lo hace por otros motivos.
 */
export const MARGEN_EMPATE = 2

/**
 * Para qué sirve cada equipo, según el propio motor de puntuación.
 *
 * Se evalúan los ocho casos de uso una sola vez y se anota dónde queda primero
 * cada equipo. Es un consejo derivado del cálculo, no una opinión escrita a
 * mano: si cambias un peso o una calificación, el consejo cambia con él.
 */
export function mapaConsejos(casos: CasoUso[], universo: Hardware[] = HARDWARE): Map<string, Consejo> {
  const mapa = new Map<string, Consejo>(
    universo.map((h) => [h.id, { gana: [], viable: [], descartado: 0 }]),
  )

  for (const caso of casos) {
    const resultados = evaluar(caso, universo)
    const mejor = resultados.find((r) => r.viable)?.puntaje ?? Number.POSITIVE_INFINITY

    for (const r of resultados) {
      const c = mapa.get(r.hardware.id)
      if (!c) continue
      if (!r.viable) c.descartado++
      else if (r.puntaje >= mejor - MARGEN_EMPATE) c.gana.push(caso.id)
      else c.viable.push(caso.id)
    }
  }
  return mapa
}

export interface MetricasGlobales {
  /** Rango de precios de toda la matriz. */
  precioMin: number
  precioMax: number
  /** Rango de consumo. */
  tdpMin: number
  tdpMax: number
  /** Factor entre el mayor y el menor techo de TOPS con IA. */
  rangoTopsFactor: number
  /** Equipo con mejor TOPS/W. */
  liderEficiencia: Hardware
  /** Equipo con mejor TOPS por 100 USD. */
  liderValor: Hardware
  /** Cuántos equipos de la matriz tienen aceleración de IA. */
  conIa: number
  total: number
}

export function metricasGlobales(universo: Hardware[] = HARDWARE): MetricasGlobales {
  const conIa = universo.filter((h) => h.topsMax > 0)
  const topsList = conIa.map((h) => h.topsMax)

  return {
    precioMin: Math.min(...universo.map((h) => h.precioMin)),
    precioMax: Math.max(...universo.map((h) => h.precioMax)),
    tdpMin: Math.min(...universo.map((h) => h.tdpMin)),
    tdpMax: Math.max(...universo.map((h) => h.tdpMax)),
    rangoTopsFactor: Math.round(Math.max(...topsList) / Math.min(...topsList)),
    liderEficiencia: [...conIa].sort((a, b) => topsPorWatt(b) - topsPorWatt(a))[0],
    liderValor: [...conIa].sort((a, b) => topsPorCien(b) - topsPorCien(a))[0],
    conIa: conIa.length,
    total: universo.length,
  }
}

/**
 * Empaqueta el resultado de una evaluación en el formato que consume el
 * agente. Solo números y hechos: el modelo no recalcula nada.
 */
export function paraInforme(caso: CasoUso, resultados: Resultado[]) {
  return {
    caso: {
      id: caso.id,
      nombre: caso.nombre,
      contexto: caso.contexto,
      restricciones: caso.restricciones,
      criteriosPonderados: Object.entries(normalizarPesos(caso))
        .filter(([, p]) => p > 0)
        .map(([id, p]) => ({
          criterio: CRITERIOS.find((c) => c.id === id)?.nombre ?? id,
          pesoPorcentaje: Math.round(p * 100),
        }))
        .sort((a, b) => b.pesoPorcentaje - a.pesoPorcentaje),
      justificacionPesos: caso.justificacion,
    },
    ranking: resultados.map((r) => ({
      posicion: r.viable ? r.posicion : null,
      viable: r.viable,
      motivosDescarte: r.motivosDescarte,
      categoria: r.hardware.categoria,
      representativo: r.hardware.representativo,
      puntaje: Number(r.puntaje.toFixed(1)),
      precioUsd: `${r.hardware.precioMin}–${r.hardware.precioMax}`,
      consumoW: `${r.hardware.tdpMin}–${r.hardware.tdpMax}`,
      topsInt8: r.hardware.topsMax,
      tflopsFp32: r.hardware.tflopsFp32,
      topsPorWatt: Number(topsPorWatt(r.hardware).toFixed(2)),
      topsPor100Usd: Number(topsPorCien(r.hardware).toFixed(2)),
      precioMedioUsd: precioMedio(r.hardware),
      consumoMedioW: tdpMedio(r.hardware),
      fortalezas: r.hardware.fortalezas,
      limitaciones: r.hardware.limitaciones,
      aplicacionesDeLaMatriz: r.hardware.aplicaciones,
      criteriosQueMasAportan: r.aportes.slice(0, 3).map((a) => ({
        criterio: a.nombre,
        calificacion: a.calificacion,
        pesoPorcentaje: Math.round(a.peso * 100),
        puntosAportados: Number(a.aporte.toFixed(1)),
      })),
    })),
  }
}

export type DatosInforme = ReturnType<typeof paraInforme>
