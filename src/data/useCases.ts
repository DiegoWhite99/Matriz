/**
 * Casos de uso industriales derivados de la columna H de la matriz
 * ("Aplicaciones Industriales Clave").
 *
 * Cada caso pondera los ocho criterios de `hardware.ts`. Los pesos no tienen
 * que sumar 1: el motor los normaliza. Lo que importa es la proporción entre
 * ellos, y cada `justificacion` explica de dónde sale esa proporción.
 */

import type { CriterioId } from './hardware'

export interface CasoUso {
  id: string
  nombre: string
  contexto: string
  /** Restricciones duras del caso: filtran antes de puntuar. */
  restricciones: {
    /** Watts máximos disponibles en el punto de instalación. */
    tdpMaxW?: number
    /** Presupuesto máximo por unidad en USD. */
    presupuestoMaxUsd?: number
    /** TOPS mínimos requeridos para la carga de inferencia. */
    topsMin?: number
  }
  pesos: Partial<Record<CriterioId, number>>
  justificacion: string
}

export const CASOS_USO: CasoUso[] = [
  {
    id: 'control-actuadores',
    nombre: 'Control determinista de actuadores y sensores',
    contexto:
      'Accionamiento de relés y válvulas con lectura de sensores analógicos/digitales en lazo cerrado. El ciclo debe cerrarse en un tiempo garantizado.',
    restricciones: { tdpMaxW: 25, presupuestoMaxUsd: 300 },
    pesos: {
      latenciaDeterminista: 35,
      costo: 20,
      eficienciaEnergetica: 15,
      gradoIndustrial: 15,
      ecosistemaSoftware: 10,
      iaThroughput: 5,
    },
    justificacion:
      'La latencia domina porque un ciclo perdido es un fallo de proceso. La IA es casi irrelevante: no hay inferencia en el lazo.',
  },
  {
    id: 'mantenimiento-predictivo',
    nombre: 'Mantenimiento predictivo (vibración y sonido)',
    contexto:
      'Nodos instalados sobre motores y bombas que analizan vibración y sonido con TinyML. Suelen ir alimentados por batería o cosecha de energía, en carcasas estancas.',
    restricciones: { tdpMaxW: 15, presupuestoMaxUsd: 900 },
    pesos: {
      eficienciaEnergetica: 25,
      iaThroughput: 20,
      gradoIndustrial: 20,
      costo: 15,
      latenciaDeterminista: 10,
      ecosistemaSoftware: 10,
    },
    justificacion:
      'La energía pesa más que la potencia bruta: el nodo vive años sin mantenimiento. TinyML necesita poca inferencia, pero el entorno exige grado industrial.',
  },
  {
    id: 'gateway-iot',
    nombre: 'Gateway IoT y HMI ligero',
    contexto:
      'Puente OPC-UA/Modbus hacia la nube, con panel de operador local. Se despliegan muchas unidades, así que el costo por punto manda.',
    restricciones: { presupuestoMaxUsd: 900 },
    pesos: {
      ecosistemaSoftware: 35,
      costo: 25,
      eficienciaEnergetica: 15,
      iaThroughput: 10,
      gradoIndustrial: 10,
      // Un gateway traduce protocolos, no cierra un lazo de control: si llega
      // un paquete diez milisegundos tarde no pasa nada. Con un peso mayor,
      // el ranking coronaba a un microcontrolador que no puede correr una
      // pila OPC-UA ni un panel de operador, contradiciendo la propia
      // justificación de este caso.
      latenciaDeterminista: 5,
    },
    justificacion:
      'El trabajo es de protocolos y drivers: gana el que tenga sistema operativo completo y librerías. El volumen de despliegue empuja el costo al segundo lugar.',
  },
  {
    id: 'vision-envasado',
    nombre: 'Visión artificial en línea de envasado',
    contexto:
      'Inspección en tiempo real sobre cinta en movimiento, una o dos cámaras, dentro de un gabinete en planta. Cadencia alta y falso-negativo costoso.',
    restricciones: { topsMin: 20, tdpMaxW: 100 },
    pesos: {
      iaThroughput: 30,
      escalabilidadVideo: 20,
      gradoIndustrial: 20,
      eficienciaEnergetica: 15,
      latenciaDeterminista: 10,
      costo: 5,
    },
    justificacion:
      'La inferencia es el cuello de botella y el gabinete de planta impone el rango térmico. El costo cede: una parada de línea cuesta más que el equipo.',
  },
  {
    id: 'robotica-movil',
    nombre: 'Robótica móvil (AMR / AGV)',
    contexto:
      'Vehículo autónomo alimentado por batería que navega y evita obstáculos. Cada watt sale de la autonomía del turno.',
    restricciones: { topsMin: 20, tdpMaxW: 75 },
    pesos: {
      eficienciaEnergetica: 30,
      iaThroughput: 25,
      gradoIndustrial: 20,
      latenciaDeterminista: 10,
      costo: 10,
      escalabilidadVideo: 5,
    },
    justificacion:
      'En un vehículo a batería la eficiencia es autonomía, no una preferencia. La vibración y el rango térmico hacen obligatorio el grado industrial.',
  },
  {
    id: 'inspeccion-multicamara',
    nombre: 'Inspección multisensor / multicámara 4K',
    contexto:
      'Celda de manufactura con varios flujos 4K simultáneos y fusión de sensores, procesados localmente sin salir a la red.',
    restricciones: { topsMin: 200 },
    pesos: {
      escalabilidadVideo: 30,
      iaThroughput: 30,
      computoGeneral: 15,
      gradoIndustrial: 15,
      eficienciaEnergetica: 5,
      costo: 5,
    },
    justificacion:
      'Video e inferencia pesan igual porque el límite es el ancho de banda de decodificación tanto como los TOPS.',
  },
  {
    id: 'servidor-planta',
    nombre: 'Servidor de planta (10–30 cámaras IP)',
    contexto:
      'Un IPC x86 en el cuarto de control concentra las cámaras de la planta y corre analítica predictiva. Rack con ventilación y energía de red.',
    restricciones: { topsMin: 200 },
    pesos: {
      escalabilidadVideo: 30,
      iaThroughput: 25,
      ecosistemaSoftware: 20,
      computoGeneral: 15,
      gradoIndustrial: 10,
    },
    justificacion:
      'Centralizar cámaras es un problema de escala y de integración con el SCADA existente: x86 pesa fuerte. La energía deja de ser restricción en rack.',
  },
  {
    id: 'gemelo-digital',
    nombre: 'Gemelo digital y entrenamiento on-premises',
    contexto:
      'Entrenamiento de modelos propios y simulación de planta completa (Omniverse, fluidos, estructuras) en sala técnica.',
    restricciones: { topsMin: 200 },
    pesos: {
      computoGeneral: 35,
      iaThroughput: 30,
      escalabilidadVideo: 15,
      ecosistemaSoftware: 15,
      costo: 5,
    },
    justificacion:
      'Entrenar y simular son cargas FP32 y de VRAM, no de INT8: el cómputo general pasa al primer lugar. La eficiencia no puntúa porque hay energía de sala técnica.',
  },
]

export const casoById = (id: string) => CASOS_USO.find((c) => c.id === id)

/**
 * Nombres cortos para las etiquetas de la matriz, donde "Control determinista
 * de actuadores y sensores" no cabe. El nombre completo sigue en el selector
 * de caso de uso.
 */
export const CORTO_CASO: Record<string, string> = {
  'control-actuadores': 'Control determinista',
  'mantenimiento-predictivo': 'Mantenimiento predictivo',
  'gateway-iot': 'Gateway IoT',
  'vision-envasado': 'Visión en envasado',
  'robotica-movil': 'Robótica móvil',
  'inspeccion-multicamara': 'Inspección 4K',
  'servidor-planta': 'Servidor de planta',
  'gemelo-digital': 'Gemelo digital',
}

export const cortoCaso = (id: string) => CORTO_CASO[id] ?? id
