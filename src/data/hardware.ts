/**
 * Matriz de hardware para IA industrial.
 *
 * Fuente: "Matriz de hardware IA.xlsx" (columnas A–H). Los campos textuales
 * (`fortalezas`, `limitaciones`, `aplicaciones`) se transcriben de la hoja sin
 * reinterpretarlos. Los campos numéricos son la lectura de los rangos que la
 * hoja expresa en prosa ("$250 – $900", "7W – 25W", "40 – 157 TOPS").
 *
 * Las `calificaciones` (0–100) NO están en la hoja: son la traducción de las
 * columnas F y G (puntos fuertes / limitaciones) a ocho criterios comparables,
 * para que el motor de puntuación por caso de uso sea auditable. Cada valor
 * lleva su justificación en el comentario de la fila.
 *
 * La fila `cpu-npu` tampoco está en la hoja. Se añadió aparte y va marcada como
 * tal: sin ella la matriz solo comparaba microcontroladores, ARM y GPUs NVIDIA,
 * y dejaba fuera a Intel, AMD y Apple, que es donde está hoy el equipo de
 * planta con acelerador de IA incluido.
 */

export type CriterioId =
  | 'iaThroughput'
  | 'computoGeneral'
  | 'eficienciaEnergetica'
  | 'costo'
  | 'latenciaDeterminista'
  | 'gradoIndustrial'
  | 'ecosistemaSoftware'
  | 'escalabilidadVideo'

export interface Criterio {
  id: CriterioId
  nombre: string
  descripcion: string
  /** Etiqueta corta para ejes y radar, donde no cabe el nombre completo. */
  corto: string
}

export const CRITERIOS: Criterio[] = [
  {
    id: 'iaThroughput',
    nombre: 'Rendimiento de IA',
    corto: 'IA',
    descripcion: 'Capacidad de inferencia en TOPS INT8: cuántos modelos y a qué velocidad.',
  },
  {
    id: 'computoGeneral',
    nombre: 'Cómputo general',
    corto: 'Cómputo',
    descripcion: 'TFLOPS FP32 para simulación, entrenamiento y cálculo de propósito general.',
  },
  {
    id: 'eficienciaEnergetica',
    nombre: 'Eficiencia energética',
    corto: 'Energía',
    descripcion: 'Rendimiento por watt y viabilidad de operación con batería o refrigeración pasiva.',
  },
  {
    id: 'costo',
    nombre: 'Ventaja de costo',
    corto: 'Costo',
    descripcion: 'Inverso del precio unitario: 100 = la opción más económica de la matriz.',
  },
  {
    id: 'latenciaDeterminista',
    nombre: 'Latencia determinista',
    corto: 'Latencia',
    descripcion: 'Capacidad de responder en un tiempo garantizado sobre I/O físico.',
  },
  {
    id: 'gradoIndustrial',
    nombre: 'Grado industrial',
    corto: 'Industrial',
    descripcion: 'Rango térmico extendido, robustez mecánica y seguridad de hardware.',
  },
  {
    id: 'ecosistemaSoftware',
    nombre: 'Ecosistema de software',
    corto: 'Software',
    descripcion: 'Sistema operativo completo, compatibilidad x86, comunidad y herramientas.',
  },
  {
    id: 'escalabilidadVideo',
    nombre: 'Escalabilidad de video',
    corto: 'Video',
    descripcion: 'Número de flujos de cámara simultáneos que puede procesar.',
  },
]

export interface Hardware {
  id: string
  categoria: string
  representativo: string
  /** Precio aproximado en USD, tal como lo expresa la hoja. */
  precioMin: number
  precioMax: number
  /** Consumo (TDP) en watts. */
  tdpMin: number
  tdpMax: number
  /** TFLOPS FP32. Los microcontroladores están en el orden de MFLOPS. */
  tflopsFp32: number
  /** TOPS INT8 de IA. 0 = sin aceleración de IA. */
  topsMin: number
  topsMax: number
  /** Texto original de la columna E, que mezcla ambas unidades. */
  rendimientoTexto: string
  fortalezas: string[]
  limitaciones: string[]
  aplicaciones: string
  calificaciones: Record<CriterioId, number>
}

export const HARDWARE: Hardware[] = [
  {
    id: 'mcu-basico',
    categoria: 'Microcontroladores Básicos',
    representativo: 'Arduino Uno R4 / Nano 33 BLE',
    precioMin: 20,
    precioMax: 35,
    tdpMin: 0.1,
    tdpMax: 0.5,
    tflopsFp32: 0.00005,
    topsMin: 0,
    topsMax: 0,
    rendimientoTexto: '~0.00005 TFLOPS (MFLOPS). Sin TOPS de IA',
    fortalezas: [
      'Bajo costo extremo',
      'Encendido instantáneo',
      'I/O directo de muy baja latencia',
      'Mínimo consumo eléctrico',
    ],
    limitaciones: [
      'Sin sistema operativo',
      'Sin capacidad de IA/Visión',
      'Memoria RAM muy reducida (KB/MB)',
    ],
    aplicaciones:
      'Control determinista de relés/actuadores, lectura de sensores analógicos/digitales, prototipado rápido.',
    calificaciones: {
      iaThroughput: 2, // la hoja lo marca explícitamente sin capacidad de IA
      computoGeneral: 3, // orden de MFLOPS
      eficienciaEnergetica: 98, // < 0.5 W, el mínimo de la matriz
      costo: 100, // $20, la opción más económica
      latenciaDeterminista: 100, // sin SO: I/O directo, el techo de la matriz
      gradoIndustrial: 45, // robusto por simplicidad, sin certificación industrial
      ecosistemaSoftware: 55, // ecosistema Arduino enorme, pero sin SO ni RAM
      escalabilidadVideo: 0, // ningún flujo de cámara
    },
  },
  {
    id: 'mcu-edge-ai',
    categoria: 'Microcontroladores Edge AI',
    representativo: 'Arduino Portenta H7 / Nicla Vision',
    precioMin: 70,
    precioMax: 150,
    tdpMin: 0.5,
    tdpMax: 2,
    tflopsFp32: 0.001,
    topsMin: 0,
    topsMax: 0.1,
    rendimientoTexto: '~0.001 TFLOPS · < 0.1 TOPS (TinyML)',
    fortalezas: [
      'Consumo ultra bajo (batería/pasivo)',
      'Criptoprocesador de seguridad integrado',
      'Formato industrial robusto',
      'Ejecución de TinyML en el borde',
    ],
    limitaciones: [
      'Incapaz de procesar video continuo de alta resolución',
      'Ancho de banda y almacenamiento muy limitados',
    ],
    aplicaciones:
      'Mantenimiento predictivo por análisis de vibración/sonido, detección de presencia con cámaras de baja resolución, IoT industrial estanco.',
    calificaciones: {
      iaThroughput: 12, // TinyML: < 0.1 TOPS
      computoGeneral: 8,
      eficienciaEnergetica: 92, // 0.5–2 W, viable con batería
      costo: 82, // $70–150
      latenciaDeterminista: 92, // sigue siendo microcontrolador
      gradoIndustrial: 88, // formato industrial + criptoprocesador
      ecosistemaSoftware: 60, // Arduino PRO, sin Linux completo
      escalabilidadVideo: 10, // solo baja resolución
    },
  },
  {
    id: 'sbc-economico',
    categoria: 'SBCs Económicos',
    representativo: 'Raspberry Pi 5 (8GB) + HAT AI opcional',
    precioMin: 80,
    precioMax: 120,
    tdpMin: 5,
    tdpMax: 15,
    tflopsFp32: 0.1,
    topsMin: 13,
    topsMax: 26,
    rendimientoTexto: '~0.1 TFLOPS FP32 · 13–26 TOPS con HAT',
    fortalezas: [
      'Excelente relación costo/potencia',
      'Ecosistema masivo y Linux completo',
      'Añadiendo NPU externa es muy competitivo',
    ],
    limitaciones: [
      'Sin grado industrial nativo (requiere disipación/chasis)',
      'Memoria compartida y buses limitados',
    ],
    aplicaciones:
      'Gateways IoT (OPC-UA/Modbus a Cloud), HMI ligeros en planta, servidor local de recolección de datos, supervisión básica.',
    calificaciones: {
      iaThroughput: 35, // 13–26 TOPS solo con HAT externo
      computoGeneral: 25,
      eficienciaEnergetica: 62, // 5–15 W: eficiente, pero no de batería
      costo: 92, // $80–120
      latenciaDeterminista: 45, // Linux sin kernel de tiempo real
      gradoIndustrial: 30, // la hoja lo señala como limitación explícita
      ecosistemaSoftware: 90, // Linux completo + ecosistema masivo
      escalabilidadVideo: 30, // buses limitados
    },
  },
  /*
   * ------------------------------------------------------------------
   * Fila añadida, no transcrita
   * ------------------------------------------------------------------
   *
   * La hoja de cálculo salta del SBC económico directamente al Jetson, y ese
   * salto se lleva por delante toda una clase de equipo: el PC completo con
   * NPU en el propio procesador. Intel (Core Ultra), AMD (Ryzen AI) y Apple
   * (familia M) venden hoy la misma idea —CPU, GPU integrada y acelerador de
   * IA en un solo chip— y es la única fila de la matriz que corre el software
   * x86 que la planta ya tiene instalado sin recompilar nada.
   *
   * Los rangos numéricos son la envolvente de los tres fabricantes, no la
   * ficha de un modelo concreto; `rendimientoTexto` desglosa de dónde sale
   * cada extremo.
   */
  {
    id: 'cpu-npu',
    categoria: 'Procesadores con NPU (AI PC)',
    representativo: 'Intel Core Ultra 7 / AMD Ryzen AI Max+ 395 / Apple M4 Pro',
    precioMin: 600,
    precioMax: 2000,
    tdpMin: 20,
    tdpMax: 120,
    tflopsFp32: 8,
    topsMin: 38,
    topsMax: 126,
    rendimientoTexto:
      '~5–18 TFLOPS FP32 en la GPU integrada · 38–126 TOPS INT8 de plataforma, de los que solo 13–50 son de la NPU',
    fortalezas: [
      'Compatible con el software x86 que ya está instalado',
      'Equipo completo: no necesita anfitrión ni placa carrier',
      'Memoria unificada de hasta 128 GB para modelos de lenguaje',
      'Codificadores de vídeo integrados (Quick Sync / Apple Media Engine)',
    ],
    limitaciones: [
      'Sin CUDA: la pila de NVIDIA no corre, hay que pasar por OpenVINO, ROCm o Core ML',
      'Los TOPS de plataforma se reparten entre NPU, GPU integrada y CPU, y casi ningún programa usa las tres a la vez',
      'Grado industrial solo en las versiones IPC; un mini PC de consumo no lo tiene',
    ],
    aplicaciones:
      'Servidor de planta que corre el SCADA/MES y la IA en el mismo equipo, asistentes locales sobre documentación y órdenes de trabajo, HMI avanzada con inferencia integrada, prototipado de modelos antes de bajarlos al borde.',
    calificaciones: {
      // La cifra de plataforma (126 TOPS) suma tres aceleradores distintos, y
      // casi ningún runtime los aprovecha a la vez: por eso no se puntúa como
      // los 157 TOPS de un Jetson, que salen de una sola GPU.
      iaThroughput: 58,
      computoGeneral: 62, // 5–18 TFLOPS de GPU integrada más una CPU x86 completa
      // TOPS/W bajo (1,8 frente a los 9,8 de un Orin NX), pero en la gama de
      // 20–35 W el equipo funciona sin ventilador.
      eficienciaEnergetica: 42,
      costo: 38, // $600–2.000, entre el Jetson integrado y la GPU de IPC
      latenciaDeterminista: 35, // sistema operativo de propósito general y sin I/O industrial propio
      gradoIndustrial: 50, // hay IPC de riel DIN con Core Ultra, pero un Mac mini no es uno
      // x86 completo con Windows y Linux, que es el techo práctico; se queda
      // por debajo de la fila de GPU porque sin CUDA media documentación de IA
      // no se aplica tal cual.
      ecosistemaSoftware: 92,
      escalabilidadVideo: 55, // decodifica muchos flujos; el límite es inferir en todos
    },
  },
  {
    id: 'edge-ai-integrado',
    categoria: 'Edge AI Integrado',
    representativo: 'NVIDIA Jetson Orin Nano / NX',
    precioMin: 250,
    precioMax: 900,
    tdpMin: 7,
    tdpMax: 25,
    tflopsFp32: 0.6,
    topsMin: 40,
    topsMax: 157,
    rendimientoTexto: '~0.6 TFLOPS FP32 · 40–157 TOPS (INT8)',
    fortalezas: [
      'Alta densidad de TOPS por watt',
      'Módulos industriales SOM (-40 °C a 85 °C)',
      'Procesamiento paralelo directo en máquina',
    ],
    limitaciones: [
      'Arquitectura ARM (limitación con software x86 antiguo)',
      'Requiere placa base/carrier personalizada',
    ],
    aplicaciones:
      'Visión artificial en tiempo real en líneas de envasado, robótica móvil (AMRs/AGVs), control de calidad local de alta velocidad.',
    calificaciones: {
      iaThroughput: 68, // hasta 157 TOPS
      computoGeneral: 40,
      eficienciaEnergetica: 88, // la hoja destaca la densidad de TOPS/W
      costo: 55, // $250–900
      latenciaDeterminista: 70, // procesamiento directo en máquina
      gradoIndustrial: 92, // SOM de -40 a 85 °C
      ecosistemaSoftware: 70, // ARM: penalizado frente a x86
      escalabilidadVideo: 65,
    },
  },
  {
    id: 'edge-ai-potencia',
    categoria: 'Edge AI de Alta Potencia',
    representativo: 'NVIDIA Jetson AGX Orin (64GB)',
    precioMin: 1600,
    precioMax: 2000,
    tdpMin: 15,
    tdpMax: 75,
    tflopsFp32: 5.3,
    topsMin: 275,
    topsMax: 275,
    rendimientoTexto: '~5.3 TFLOPS FP32 · 275 TOPS (INT8)',
    fortalezas: [
      'Potencia equivalente a servidor en formato compacto',
      'Múltiples flujos de cámara 4K simultáneos',
      'Refrigeración pasiva posible',
    ],
    limitaciones: [
      'Precio elevado por unidad',
      'Requiere diseño térmico dedicado en gabinetes cerrados',
    ],
    aplicaciones:
      'Inspección multisensor/multicámara en tiempo real, vehículos autónomos pesados en minería/logística, analítica compleja en celda de manufactura.',
    calificaciones: {
      iaThroughput: 82, // 275 TOPS
      computoGeneral: 58,
      eficienciaEnergetica: 78, // 275 TOPS en 15–75 W sigue siendo excelente
      costo: 25, // $1.600–2.000
      latenciaDeterminista: 72,
      gradoIndustrial: 80, // compacto, pero exige diseño térmico dedicado
      ecosistemaSoftware: 70, // ARM
      escalabilidadVideo: 88, // múltiples 4K simultáneos
    },
  },
  {
    id: 'gpu-ipc',
    categoria: 'GPUs para IPC / Edge Server',
    representativo: 'NVIDIA RTX 4000 Ada SFF / L4',
    precioMin: 1200,
    precioMax: 2200,
    tdpMin: 70,
    tdpMax: 100,
    tflopsFp32: 28,
    topsMin: 240,
    topsMax: 485,
    rendimientoTexto: '~26–30 TFLOPS FP32 · 240–485 TOPS (INT8)',
    fortalezas: [
      'Memoria ECC (operación 24/7 sin fallos)',
      'Formato compacto de bajo perfil',
      'Compatible con software x86 / Windows / Linux',
    ],
    limitaciones: [
      'Requiere PC hospedadora (IPC industrial x86)',
      'Necesita ventilación dentro del gabinete',
    ],
    aplicaciones:
      'Servidores de planta procesando 10–30 cámaras IP, gemelos digitales ligeros on-site, analítica predictiva centralizada en Edge.',
    calificaciones: {
      iaThroughput: 90, // hasta 485 TOPS
      computoGeneral: 85, // 26–30 TFLOPS
      eficienciaEnergetica: 55, // 70–100 W
      costo: 32, // $1.200–2.200
      latenciaDeterminista: 55, // depende del host x86
      gradoIndustrial: 72, // ECC 24/7 y bajo perfil, pero necesita ventilación
      ecosistemaSoftware: 98, // x86/Windows/Linux, el techo de la matriz
      escalabilidadVideo: 95, // 10–30 cámaras IP
    },
  },
  {
    id: 'gpu-enterprise',
    categoria: 'GPUs Enterprise / High-End',
    representativo: 'NVIDIA RTX 4090 / RTX 6000 Ada',
    precioMin: 1600,
    precioMax: 7000,
    tdpMin: 300,
    tdpMax: 450,
    tflopsFp32: 87,
    topsMin: 1300,
    topsMax: 1300,
    rendimientoTexto: '~83–91 TFLOPS FP32 · 1.300+ TOPS (INT8)',
    fortalezas: [
      'Máxima potencia de entrenamiento e inferencia',
      'Enormes cantidades de VRAM (hasta 48GB+)',
      'Soporte para física y trazado de rayos en tiempo real',
    ],
    limitaciones: [
      'Consumo eléctrico y térmico masivo',
      'Requiere gabinetes con refrigeración activa y fuentes pesadas',
    ],
    aplicaciones:
      'Entrenamiento on-premises de modelos propios de IA, gemelos digitales de planta completa (NVIDIA Omniverse), simulación de fluidos y estructuras.',
    calificaciones: {
      iaThroughput: 100, // 1.300+ TOPS, el techo de la matriz
      computoGeneral: 100, // 83–91 TFLOPS, el techo de la matriz
      eficienciaEnergetica: 22, // 300–450 W
      costo: 10, // hasta $7.000
      latenciaDeterminista: 50,
      gradoIndustrial: 40, // refrigeración activa y fuentes pesadas
      ecosistemaSoftware: 98,
      escalabilidadVideo: 100,
    },
  },
]

export const byId = (id: string): Hardware | undefined => HARDWARE.find((h) => h.id === id)

/** Punto medio del rango de precio, para ejes y ratios. */
export const precioMedio = (h: Hardware) => (h.precioMin + h.precioMax) / 2

/** Punto medio del rango de consumo. */
export const tdpMedio = (h: Hardware) => (h.tdpMin + h.tdpMax) / 2

/** TOPS máximos declarados: el techo de inferencia del equipo. */
export const topsPico = (h: Hardware) => h.topsMax

/**
 * TOPS por watt. Métrica clave para el borde: define si el equipo puede
 * operar con refrigeración pasiva o batería. Los equipos sin IA dan 0.
 */
export const topsPorWatt = (h: Hardware) => (h.topsMax === 0 ? 0 : h.topsMax / tdpMedio(h))

/** TOPS por cada 100 USD. Relación rendimiento/precio de inferencia. */
export const topsPorCien = (h: Hardware) =>
  h.topsMax === 0 ? 0 : (h.topsMax / precioMedio(h)) * 100

/**
 * Etiquetas cortas para ejes de categoría, donde "Microcontroladores Edge AI"
 * no cabe sin empujar el área de trazado. El nombre completo sigue estando en
 * el tooltip y en la vista de tabla.
 */
export const ABREV: Record<string, string> = {
  'mcu-basico': 'MCU básico',
  'mcu-edge-ai': 'MCU Edge AI',
  'sbc-economico': 'SBC económico',
  'cpu-npu': 'CPU con NPU',
  'edge-ai-integrado': 'Edge AI integrado',
  'edge-ai-potencia': 'Edge AI potencia',
  'gpu-ipc': 'GPU IPC / Edge',
  'gpu-enterprise': 'GPU Enterprise',
}

export const abrev = (h: Hardware) => ABREV[h.id] ?? h.categoria

/** Índice estable en la matriz: fija el color de cada entidad. */
export const indiceDe = (id: string) => HARDWARE.findIndex((h) => h.id === id)
