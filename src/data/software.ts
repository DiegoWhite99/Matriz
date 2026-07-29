/**
 * Qué software de IA se puede instalar en cada equipo, y para qué se usa.
 *
 * COMO `memoria.ts`, ESTO NO SALE DE LA HOJA DE CÁLCULO. Es la pila de
 * software que corresponde a cada categoría, añadida aparte.
 *
 * ------------------------------------------------------------------
 * El malentendido que esta tabla existe para evitar
 * ------------------------------------------------------------------
 *
 * "¿Puedo usar Ollama en un Arduino?" es la pregunta más frecuente y la
 * respuesta es no, por una razón que no tiene que ver con la potencia:
 *
 *   Ollama es un programa de escritorio. Necesita un sistema operativo
 *   (Linux, Windows o macOS), un sistema de archivos donde guardar modelos de
 *   varios gigabytes, y esos gigabytes en RAM.
 *
 *   Un Arduino Uno no tiene sistema operativo. Tiene 32 KB de memoria y
 *   ejecuta un único programa que tú compilas y grabas en su flash. La
 *   diferencia con lo que Ollama necesita no es de grado: es de categoría.
 *
 * La frontera real de esta matriz no está en los TOPS. Está entre las dos
 * primeras filas —microcontroladores, sin sistema operativo— y el resto, que
 * corren Linux. Todo lo que se instala con `apt` o `pip` vive al otro lado de
 * esa línea.
 */

export type Nivel = 'si' | 'limitado' | 'no'

export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  si: 'Sí',
  limitado: 'Con límites',
  no: 'No',
}

/** Glifo que acompaña al color: el nivel nunca se codifica solo con color. */
export const GLIFO_NIVEL: Record<Nivel, string> = {
  si: '●',
  limitado: '◐',
  no: '○',
}

export interface Soporte {
  n: Nivel
  /** Por qué. Obligatorio cuando el nivel es `limitado` o sorprende. */
  nota?: string
}

export type CategoriaRuntime = 'microcontrolador' | 'linux' | 'nvidia' | 'servidor'

export const NOMBRE_CATEGORIA_RUNTIME: Record<CategoriaRuntime, string> = {
  microcontrolador: 'Sin sistema operativo (microcontroladores)',
  linux: 'Linux de propósito general',
  nvidia: 'Pila de NVIDIA (CUDA)',
  servidor: 'Servidor y entrenamiento',
}

export interface Runtime {
  id: string
  nombre: string
  /** Qué es, en una frase. Esta es la parte que la gente busca. */
  queEs: string
  categoria: CategoriaRuntime
  /** Para qué se usa en planta. */
  seUsaPara: string
}

export const RUNTIMES: Runtime[] = [
  /* ---------------------- Sin sistema operativo ---------------------- */
  {
    id: 'arduino',
    nombre: 'Arduino IDE + CMSIS-NN',
    queEs:
      'El entorno de Arduino con la librería de redes neuronales optimizada para procesadores ARM Cortex-M. Compilas el modelo dentro de tu programa y lo grabas en la flash del chip.',
    categoria: 'microcontrolador',
    seUsaPara: 'Control de actuadores y clasificación de señales de sensor.',
  },
  {
    id: 'tflite-micro',
    nombre: 'TensorFlow Lite Micro',
    queEs:
      'La versión de TensorFlow para chips sin sistema operativo. El intérprete ocupa unas decenas de KB y trabaja sobre un bloque de memoria fijo que le reservas tú.',
    categoria: 'microcontrolador',
    seUsaPara: 'Detección de palabra clave, gestos y anomalías de vibración.',
  },
  {
    id: 'edge-impulse',
    nombre: 'Edge Impulse',
    queEs:
      'Plataforma web que recoge los datos, entrena el modelo y te devuelve una librería lista para compilar en el equipo. Evita montar la cadena de entrenamiento tú mismo.',
    categoria: 'microcontrolador',
    seUsaPara: 'Mantenimiento predictivo y clasificación de sonido o vibración.',
  },
  {
    id: 'openmv',
    nombre: 'OpenMV + MicroPython',
    queEs:
      'Firmware que convierte una cámara con microcontrolador en un dispositivo programable en Python, con funciones de visión ya incluidas.',
    categoria: 'microcontrolador',
    seUsaPara: 'Verificación de presencia y lectura de códigos a baja resolución.',
  },

  /* ------------------------- Linux general --------------------------- */
  {
    id: 'tflite',
    nombre: 'LiteRT (TensorFlow Lite)',
    queEs:
      'El motor de inferencia de Google para Linux y móviles. Corre en la CPU y sabe delegar a un acelerador si lo hay.',
    categoria: 'linux',
    seUsaPara: 'Clasificación y detección de objetos en equipos de bajo consumo.',
  },
  {
    id: 'onnx',
    nombre: 'ONNX Runtime',
    queEs:
      'Motor que ejecuta modelos en formato ONNX, el formato intercambiable al que exportan PyTorch y TensorFlow. Sirve para no atarse al framework con el que se entrenó.',
    categoria: 'linux',
    seUsaPara: 'Desplegar en planta un modelo entrenado con otra herramienta.',
  },
  {
    id: 'opencv',
    nombre: 'OpenCV',
    queEs:
      'La librería de visión por computador de referencia: captura, filtros, calibración, medición y detección clásica. No es IA, pero rodea a toda la IA de visión.',
    categoria: 'linux',
    seUsaPara: 'Preprocesado de imagen, medición dimensional y verificación geométrica.',
  },
  {
    id: 'hailo',
    nombre: 'Hailo RT',
    queEs:
      'El software del acelerador Hailo-8 que lleva el HAT de IA de la Raspberry Pi. Ejecuta modelos de visión previamente compilados para ese chip.',
    categoria: 'linux',
    seUsaPara: 'Detección de objetos en tiempo real con muy poco consumo.',
  },
  {
    id: 'frigate',
    nombre: 'Frigate NVR',
    queEs:
      'Grabador de vídeo en red que aplica detección de objetos a cada cámara y solo guarda y avisa cuando encuentra algo.',
    categoria: 'linux',
    seUsaPara: 'Vigilancia de planta y verificación de accesos.',
  },
  {
    id: 'ollama',
    nombre: 'Ollama',
    queEs:
      'Programa que descarga y ejecuta modelos de lenguaje en local con un comando. Necesita sistema operativo, disco para modelos de varios GB y esa memoria libre.',
    categoria: 'linux',
    seUsaPara: 'Asistentes locales, resumen de informes y consulta de documentación sin salir a la nube.',
  },
  {
    id: 'llamacpp',
    nombre: 'llama.cpp',
    queEs:
      'El motor que Ollama usa por debajo, pero manejado directamente. Más trabajo de configuración, a cambio de correr en equipos donde Ollama no entra.',
    categoria: 'linux',
    seUsaPara: 'Modelos de lenguaje en equipos con poca memoria o sin GPU.',
  },
  {
    id: 'ros2',
    nombre: 'ROS 2',
    queEs:
      'El middleware estándar de robótica: conecta sensores, planificadores y actuadores como nodos que se comunican entre sí.',
    categoria: 'linux',
    seUsaPara: 'Navegación de vehículos autónomos y brazos manipuladores.',
  },

  /* ---------------------- Pila de NVIDIA (CUDA) ----------------------- */
  {
    id: 'tensorrt',
    nombre: 'NVIDIA TensorRT',
    queEs:
      'Compilador que reescribe un modelo para el chip NVIDIA concreto donde va a correr, fusionando operaciones y bajando la precisión. Suele multiplicar la velocidad por varias veces.',
    categoria: 'nvidia',
    seUsaPara: 'Exprimir la cadencia de inspección en línea sin cambiar de equipo.',
  },
  {
    id: 'deepstream',
    nombre: 'NVIDIA DeepStream',
    queEs:
      'Cadena de vídeo completa: decodifica varios flujos, les aplica los modelos y publica los resultados, todo sin sacar los fotogramas de la GPU.',
    categoria: 'nvidia',
    seUsaPara: 'Procesar decenas de cámaras a la vez en un solo equipo.',
  },
  {
    id: 'isaac',
    nombre: 'Isaac ROS',
    queEs:
      'Los paquetes de ROS 2 de NVIDIA acelerados por GPU: percepción, odometría visual y navegación.',
    categoria: 'nvidia',
    seUsaPara: 'Robótica móvil con percepción a bordo.',
  },

  /* --------------------- Servidor y entrenamiento --------------------- */
  {
    id: 'pytorch',
    nombre: 'PyTorch / TensorFlow',
    queEs:
      'Los frameworks con los que se entrenan los modelos. Inferir necesita memoria para los pesos; entrenar necesita varias veces esa cantidad para gradientes y estados del optimizador.',
    categoria: 'servidor',
    seUsaPara: 'Entrenar y ajustar modelos propios con datos de la planta.',
  },
  {
    id: 'triton',
    nombre: 'Triton / vLLM',
    queEs:
      'Servidores de inferencia: exponen el modelo como servicio, agrupan las peticiones de varios clientes y aprovechan la GPU al máximo.',
    categoria: 'servidor',
    seUsaPara: 'Dar servicio de IA a varias líneas o aplicaciones desde un equipo.',
  },
  {
    id: 'omniverse',
    nombre: 'Omniverse / Isaac Sim',
    queEs:
      'Plataforma de simulación con física y renderizado realista, para construir gemelos digitales y entrenar robots en un mundo virtual antes de tocar la planta.',
    categoria: 'servidor',
    seUsaPara: 'Gemelos digitales y validación de células de manufactura.',
  },
]

/* ------------------------------------------------------------------ */
/* Tareas: para qué se usa cada equipo                                 */
/* ------------------------------------------------------------------ */

export interface Tarea {
  id: string
  nombre: string
  descripcion: string
}

export const TAREAS: Tarea[] = [
  {
    id: 'control',
    nombre: 'Control',
    descripcion: 'Accionar relés y válvulas leyendo sensores, en tiempo garantizado.',
  },
  {
    id: 'senales',
    nombre: 'Señales',
    descripcion: 'Clasificar vibración, sonido o corriente para detectar una anomalía.',
  },
  {
    id: 'vision-basica',
    nombre: 'Visión básica',
    descripcion: 'Presencia, ausencia y clasificación gruesa a baja resolución.',
  },
  {
    id: 'verificacion',
    nombre: 'Verificación',
    descripcion:
      'Control de calidad visual: comprobar que la pieza está bien montada, completa y sin defecto.',
  },
  {
    id: 'vision-tiempo-real',
    nombre: 'Visión en tiempo real',
    descripcion: 'Detección sobre cinta en movimiento, a la cadencia de la línea.',
  },
  {
    id: 'multicamara',
    nombre: 'Multicámara',
    descripcion: 'Varios flujos simultáneos procesados en un solo equipo.',
  },
  {
    id: 'robotica',
    nombre: 'Robótica',
    descripcion: 'Navegación, evitación de obstáculos y manipulación.',
  },
  {
    id: 'voz',
    nombre: 'Voz',
    descripcion: 'Transcripción y órdenes habladas.',
  },
  {
    id: 'lenguaje',
    nombre: 'Modelos de lenguaje',
    descripcion: 'Asistentes locales, resumen de informes y consulta de documentación.',
  },
  {
    id: 'entrenamiento',
    nombre: 'Entrenamiento',
    descripcion: 'Entrenar o ajustar un modelo con datos propios.',
  },
  {
    id: 'simulacion',
    nombre: 'Simulación',
    descripcion: 'Gemelo digital, física y renderizado.',
  },
]

/* ------------------------------------------------------------------ */
/* La matriz de soporte                                                */
/* ------------------------------------------------------------------ */

export interface SoporteEquipo {
  /** Lo que hay que saber de este equipo antes de mirar la tabla. */
  resumen: string
  runtimes: Record<string, Soporte>
  tareas: Record<string, Nivel>
}

const NO_SO =
  'No tiene sistema operativo: no se instala software, se compila un programa y se graba.'

export const SOPORTE: Record<string, SoporteEquipo> = {
  'mcu-basico': {
    resumen:
      'Un programa único grabado en la flash, sin sistema operativo. Aquí no se instala nada: se compila. Sirve para control y para clasificar una señal de sensor, no para ver.',
    runtimes: {
      arduino: { n: 'si' },
      'tflite-micro': {
        n: 'limitado',
        nota: 'Corre en el Nano 33 BLE, que tiene 256 KB de RAM. En el Uno R4, con 32 KB, solo entran modelos triviales.',
      },
      'edge-impulse': { n: 'si' },
      openmv: { n: 'no', nota: 'No lleva cámara ni memoria para procesarla.' },
      tflite: { n: 'no', nota: NO_SO },
      onnx: { n: 'no', nota: NO_SO },
      opencv: { n: 'no', nota: 'Necesita megabytes de memoria por fotograma.' },
      hailo: { n: 'no', nota: 'El acelerador se conecta por PCIe a un equipo con Linux.' },
      frigate: { n: 'no', nota: NO_SO },
      ollama: {
        n: 'no',
        nota: 'Ollama es un programa de escritorio: necesita sistema operativo, disco y gigabytes de RAM. Este equipo tiene kilobytes y ningún sistema operativo. No es cuestión de potencia, es que no hay dónde instalarlo.',
      },
      llamacpp: {
        n: 'no',
        nota: 'El modelo de lenguaje más pequeño que existe es miles de veces mayor que toda la memoria del chip.',
      },
      ros2: { n: 'no', nota: 'Existe micro-ROS para microcontroladores, pero ROS 2 completo no.' },
      tensorrt: { n: 'no', nota: 'Es software de NVIDIA y necesita una GPU CUDA.' },
      deepstream: { n: 'no', nota: 'Es software de NVIDIA y necesita una GPU CUDA.' },
      isaac: { n: 'no', nota: 'Es software de NVIDIA y necesita una GPU CUDA.' },
      pytorch: { n: 'no', nota: NO_SO },
      triton: { n: 'no', nota: NO_SO },
      omniverse: { n: 'no', nota: NO_SO },
    },
    tareas: {
      control: 'si',
      senales: 'limitado',
      'vision-basica': 'no',
      verificacion: 'no',
      'vision-tiempo-real': 'no',
      multicamara: 'no',
      robotica: 'no',
      voz: 'limitado',
      lenguaje: 'no',
      entrenamiento: 'no',
      simulacion: 'no',
    },
  },

  'mcu-edge-ai': {
    resumen:
      'Sigue sin sistema operativo, pero ya lleva cámara y memoria suficiente para un modelo pequeño. Es el primer punto de la matriz donde hay verificación visual, aunque a baja resolución.',
    runtimes: {
      arduino: { n: 'si' },
      'tflite-micro': { n: 'si' },
      'edge-impulse': { n: 'si', nota: 'Es la plataforma con mejor soporte para esta familia.' },
      openmv: { n: 'si', nota: 'La Nicla Vision se programa en Python con OpenMV.' },
      tflite: { n: 'no', nota: NO_SO },
      onnx: { n: 'no', nota: NO_SO },
      opencv: {
        n: 'limitado',
        nota: 'OpenMV trae un subconjunto de funciones de visión, no la librería completa.',
      },
      hailo: { n: 'no', nota: 'El acelerador se conecta por PCIe a un equipo con Linux.' },
      frigate: { n: 'no', nota: NO_SO },
      ollama: { n: 'no', nota: 'Mismo motivo que la fila anterior: no hay sistema operativo.' },
      llamacpp: { n: 'no', nota: 'Ocho megabytes de RAM no dan para ningún modelo de lenguaje.' },
      ros2: { n: 'no', nota: 'Solo micro-ROS.' },
      tensorrt: { n: 'no' },
      deepstream: { n: 'no' },
      isaac: { n: 'no' },
      pytorch: { n: 'no', nota: NO_SO },
      triton: { n: 'no', nota: NO_SO },
      omniverse: { n: 'no', nota: NO_SO },
    },
    tareas: {
      control: 'si',
      senales: 'si',
      'vision-basica': 'si',
      verificacion: 'limitado',
      'vision-tiempo-real': 'no',
      multicamara: 'no',
      robotica: 'no',
      voz: 'limitado',
      lenguaje: 'no',
      entrenamiento: 'no',
      simulacion: 'no',
    },
  },

  'sbc-economico': {
    resumen:
      'Aquí empieza Linux, y con Linux se abre casi todo el catálogo de software. Es el primer equipo donde Ollama arranca de verdad, aunque en CPU y despacio. La detección rápida va en la NPU del HAT, que es otra cosa distinta.',
    runtimes: {
      arduino: { n: 'no', nota: 'No es un microcontrolador.' },
      'tflite-micro': { n: 'no', nota: 'Se usa LiteRT completo, que es mejor aquí.' },
      'edge-impulse': { n: 'si', nota: 'Soporta despliegue en Linux, no solo en microcontrolador.' },
      openmv: { n: 'no' },
      tflite: { n: 'si' },
      onnx: { n: 'si' },
      opencv: { n: 'si' },
      hailo: { n: 'si', nota: 'Requiere el HAT de IA; sin él la placa no tiene acelerador.' },
      frigate: {
        n: 'si',
        nota: 'Con el HAT es una de las combinaciones más usadas para vigilancia con detección.',
      },
      ollama: {
        n: 'limitado',
        nota: 'Arranca y funciona, pero solo en CPU: un modelo de 8 B en INT4 da unos pocos tokens por segundo. Sirve para procesos por lotes, no para conversar.',
      },
      llamacpp: {
        n: 'limitado',
        nota: 'Igual que Ollama pero con más control sobre la cuantización, que es lo que permite exprimir los 8 GB.',
      },
      ros2: { n: 'si', nota: 'Suficiente para robots lentos o de investigación.' },
      tensorrt: { n: 'no', nota: 'La GPU de la Raspberry no es NVIDIA.' },
      deepstream: { n: 'no', nota: 'La GPU de la Raspberry no es NVIDIA.' },
      isaac: { n: 'no', nota: 'La GPU de la Raspberry no es NVIDIA.' },
      pytorch: {
        n: 'limitado',
        nota: 'Se instala y sirve para inferir, pero entrenar aquí no es realista.',
      },
      triton: { n: 'no', nota: 'Pensado para GPU de servidor.' },
      omniverse: { n: 'no' },
    },
    tareas: {
      control: 'limitado',
      senales: 'si',
      'vision-basica': 'si',
      verificacion: 'si',
      'vision-tiempo-real': 'limitado',
      multicamara: 'limitado',
      robotica: 'limitado',
      voz: 'si',
      lenguaje: 'limitado',
      entrenamiento: 'no',
      simulacion: 'no',
    },
  },

  'cpu-npu': {
    resumen:
      'El único bloque de la matriz que corre sin recompilar el software x86 que la planta ya tiene instalado, y a la vez el único con acelerador de IA donde CUDA no existe: la pila de NVIDIA se cambia por OpenVINO en Intel, ROCm en AMD y Core ML en Apple. Ollama y llama.cpp son su terreno; TensorRT y DeepStream no.',
    runtimes: {
      arduino: { n: 'no', nota: 'No es un microcontrolador.' },
      'tflite-micro': { n: 'no', nota: 'Aquí se usa LiteRT completo.' },
      'edge-impulse': {
        n: 'limitado',
        nota: 'Despliega en x86 y en Linux, pero la plataforma nace para microcontroladores: en esta fila se le queda todo pequeño.',
      },
      openmv: { n: 'no' },
      tflite: { n: 'si' },
      onnx: {
        n: 'si',
        nota: 'Es el formato que mejor viaja entre las tres plataformas: proveedor OpenVINO en Intel, DirectML o ROCm en AMD y Core ML en Apple.',
      },
      opencv: { n: 'si' },
      hailo: {
        n: 'si',
        nota: 'Un módulo Hailo en la ranura M.2 libre es la forma habitual de añadir inferencia dedicada sin depender de la NPU del procesador.',
      },
      frigate: {
        n: 'si',
        nota: 'Con los codificadores integrados descargando la decodificación; es una de las combinaciones más usadas en mini PC.',
      },
      ollama: {
        n: 'si',
        nota: 'Con la GPU integrada por Vulkan o ROCm, y por Metal en Apple. La memoria unificada grande es justo su ventaja: un 70 B en INT4 entra, aunque responda a ritmo de lectura.',
      },
      llamacpp: { n: 'si', nota: 'Es donde mejor se aprovecha esta fila: elige backend y cuantización a mano.' },
      ros2: { n: 'si' },
      tensorrt: { n: 'no', nota: 'Es software de NVIDIA y necesita una GPU CUDA.' },
      deepstream: { n: 'no', nota: 'Es software de NVIDIA y necesita una GPU CUDA.' },
      isaac: { n: 'no', nota: 'Es software de NVIDIA y necesita una GPU CUDA.' },
      pytorch: {
        n: 'limitado',
        nota: 'Infiere y hace ajuste fino ligero, pero fuera de CUDA buena parte de los ejemplos y de las extensiones no funcionan tal cual: hay que pasar por ROCm, DirectML o MPS.',
      },
      triton: {
        n: 'limitado',
        nota: 'Está pensado para GPU de servidor. En su lugar se usa OpenVINO Model Server o vLLM sobre ROCm, con bastante menos rodaje.',
      },
      omniverse: { n: 'no', nota: 'Necesita una GPU NVIDIA RTX; la integrada no le sirve.' },
    },
    tareas: {
      control: 'no',
      senales: 'si',
      'vision-basica': 'si',
      verificacion: 'si',
      'vision-tiempo-real': 'si',
      multicamara: 'limitado',
      robotica: 'limitado',
      voz: 'si',
      lenguaje: 'si',
      entrenamiento: 'limitado',
      simulacion: 'no',
    },
  },

  'edge-ai-integrado': {
    resumen:
      'Linux con GPU NVIDIA integrada: se abre toda la pila CUDA. Ollama corre con aceleración de verdad y la visión en tiempo real es su terreno. Es el punto donde la matriz pasa de "puede detectar algo" a "puede inspeccionar en línea".',
    runtimes: {
      arduino: { n: 'no' },
      'tflite-micro': { n: 'no' },
      'edge-impulse': { n: 'limitado', nota: 'Soportado, pero se le queda pequeño.' },
      openmv: { n: 'no' },
      tflite: { n: 'si' },
      onnx: { n: 'si', nota: 'Con proveedor de ejecución CUDA o TensorRT.' },
      opencv: { n: 'si', nota: 'Compilable con aceleración CUDA.' },
      hailo: { n: 'no', nota: 'Redundante: ya lleva su propio acelerador.' },
      frigate: { n: 'si' },
      ollama: {
        n: 'si',
        nota: 'Con aceleración por GPU sobre la memoria unificada. Un modelo de 8 B en INT4 responde a ritmo conversacional.',
      },
      llamacpp: { n: 'si', nota: 'Compilado con CUDA.' },
      ros2: { n: 'si' },
      tensorrt: { n: 'si', nota: 'Es la forma normal de desplegar aquí: multiplica la cadencia.' },
      deepstream: { n: 'si', nota: 'Hasta unas pocas cámaras según resolución.' },
      isaac: { n: 'si' },
      pytorch: {
        n: 'limitado',
        nota: 'Inferencia y ajuste fino ligero con LoRA. Entrenar desde cero, no.',
      },
      triton: { n: 'limitado', nota: 'Funciona, pero está pensado para GPU de servidor.' },
      omniverse: { n: 'no', nota: 'Es un cliente de simulación, no corre en ARM.' },
    },
    tareas: {
      control: 'limitado',
      senales: 'si',
      'vision-basica': 'si',
      verificacion: 'si',
      'vision-tiempo-real': 'si',
      multicamara: 'limitado',
      robotica: 'si',
      voz: 'si',
      lenguaje: 'si',
      entrenamiento: 'limitado',
      simulacion: 'no',
    },
  },

  'edge-ai-potencia': {
    resumen:
      'Lo mismo que la fila anterior, pero con 64 GB unificados: varias cámaras 4K a la vez y modelos de lenguaje grandes en el mismo equipo. Sigue siendo ARM, así que el software x86 antiguo no entra.',
    runtimes: {
      arduino: { n: 'no' },
      'tflite-micro': { n: 'no' },
      'edge-impulse': { n: 'no', nota: 'Fuera de su ámbito.' },
      openmv: { n: 'no' },
      tflite: { n: 'si' },
      onnx: { n: 'si' },
      opencv: { n: 'si' },
      hailo: { n: 'no', nota: 'Redundante.' },
      frigate: { n: 'si' },
      ollama: { n: 'si', nota: 'Con 64 GB entra un modelo de 70 B en INT4.' },
      llamacpp: { n: 'si' },
      ros2: { n: 'si' },
      tensorrt: { n: 'si' },
      deepstream: { n: 'si', nota: 'Su caso de uso principal: varios flujos 4K simultáneos.' },
      isaac: { n: 'si' },
      pytorch: { n: 'limitado', nota: 'Ajuste fino sí; entrenamiento desde cero no.' },
      triton: { n: 'si' },
      omniverse: { n: 'no', nota: 'Necesita x86 con GPU de escritorio.' },
    },
    tareas: {
      control: 'limitado',
      senales: 'si',
      'vision-basica': 'si',
      verificacion: 'si',
      'vision-tiempo-real': 'si',
      multicamara: 'si',
      robotica: 'si',
      voz: 'si',
      lenguaje: 'si',
      entrenamiento: 'limitado',
      simulacion: 'limitado',
    },
  },

  'gpu-ipc': {
    resumen:
      'GPU NVIDIA dentro de un PC industrial x86. Es la combinación con el catálogo de software más amplio de toda la matriz: corre lo de Linux, lo de NVIDIA y lo de x86 que ya tengas instalado.',
    runtimes: {
      arduino: { n: 'no' },
      'tflite-micro': { n: 'no' },
      'edge-impulse': { n: 'no' },
      openmv: { n: 'no' },
      tflite: { n: 'si' },
      onnx: { n: 'si' },
      opencv: { n: 'si' },
      hailo: { n: 'no', nota: 'Redundante: la GPU es mucho más capaz.' },
      frigate: { n: 'si', nota: 'Con aceleración por GPU, decenas de cámaras.' },
      ollama: { n: 'si', nota: 'Memoria dedicada: un modelo de 13 B en INT8 va holgado.' },
      llamacpp: { n: 'si' },
      ros2: { n: 'si' },
      tensorrt: { n: 'si' },
      deepstream: { n: 'si', nota: 'Es el escenario para el que se diseñó: 10 a 30 cámaras IP.' },
      isaac: { n: 'si' },
      pytorch: { n: 'si', nota: 'Ajuste fino con LoRA sobre modelos de 7 B.' },
      triton: { n: 'si', nota: 'Da servicio a varias líneas desde un solo equipo.' },
      omniverse: { n: 'limitado', nota: 'Gemelos digitales ligeros; una escena de planta completa no.' },
    },
    tareas: {
      control: 'no',
      senales: 'si',
      'vision-basica': 'si',
      verificacion: 'si',
      'vision-tiempo-real': 'si',
      multicamara: 'si',
      robotica: 'limitado',
      voz: 'si',
      lenguaje: 'si',
      entrenamiento: 'limitado',
      simulacion: 'limitado',
    },
  },

  'gpu-enterprise': {
    resumen:
      'La única fila con memoria dedicada para entrenar, no solo para inferir. Todo el catálogo está disponible y el límite deja de ser el software: pasa a ser el consumo eléctrico y la refrigeración.',
    runtimes: {
      arduino: { n: 'no' },
      'tflite-micro': { n: 'no' },
      'edge-impulse': { n: 'no' },
      openmv: { n: 'no' },
      tflite: { n: 'si' },
      onnx: { n: 'si' },
      opencv: { n: 'si' },
      hailo: { n: 'no', nota: 'Redundante.' },
      frigate: { n: 'si' },
      ollama: { n: 'si', nota: 'Con 48 GB, un modelo de 70 B en INT4 y contexto amplio.' },
      llamacpp: { n: 'si' },
      ros2: { n: 'si' },
      tensorrt: { n: 'si' },
      deepstream: { n: 'si' },
      isaac: { n: 'si' },
      pytorch: {
        n: 'si',
        nota: 'La única fila donde entrenar un modelo de 7 a 13 B es realista.',
      },
      triton: { n: 'si' },
      omniverse: { n: 'si', nota: 'Gemelo digital de planta completa con física y renderizado.' },
    },
    tareas: {
      control: 'no',
      senales: 'si',
      'vision-basica': 'si',
      verificacion: 'si',
      'vision-tiempo-real': 'si',
      multicamara: 'si',
      robotica: 'limitado',
      voz: 'si',
      lenguaje: 'si',
      entrenamiento: 'si',
      simulacion: 'si',
    },
  },
}

export const runtimePorId = new Map(RUNTIMES.map((r) => [r.id, r]))
export const tareaPorId = new Map(TAREAS.map((t) => [t.id, t]))

export const RUNTIMES_AGRUPADOS = (
  ['microcontrolador', 'linux', 'nvidia', 'servidor'] as const
).map((categoria) => ({
  categoria,
  nombre: NOMBRE_CATEGORIA_RUNTIME[categoria],
  runtimes: RUNTIMES.filter((r) => r.categoria === categoria),
}))
