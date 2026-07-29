/**
 * Memoria, almacenamiento y modelos de IA que puede ejecutar cada categoría.
 *
 * ESTE ARCHIVO NO SALE DE LA HOJA DE CÁLCULO. La matriz original no trae
 * memoria, disco ni modelos; son datos de ficha técnica del fabricante añadidos
 * aparte, para no mezclarlos con la transcripción de `hardware.ts`.
 *
 * ------------------------------------------------------------------
 * La idea que hay detrás
 * ------------------------------------------------------------------
 *
 * Lo que decide si un modelo **cabe** es la memoria, no los TOPS. Los TOPS
 * deciden a qué velocidad corre una vez que cabe. Son dos preguntas distintas
 * y se confunden constantemente:
 *
 *   ¿Cabe?      → memoria disponible ÷ bytes por parámetro
 *   ¿Va rápido? → TOPS
 *
 * Un equipo con 275 TOPS y 8 GB no puede ejecutar un modelo de 70 000 millones
 * de parámetros por muchos TOPS que tenga: no hay dónde ponerlo. Y al revés,
 * un equipo con 64 GB y pocos TOPS lo carga pero responde a un token cada
 * varios segundos.
 *
 * El segundo factor es la **cuantización**: cuántos bytes ocupa cada
 * parámetro. Bajar de FP16 a INT4 cuadruplica el modelo que cabe en la misma
 * memoria, a cambio de algo de precisión.
 *
 * ------------------------------------------------------------------
 * Y el almacenamiento, que es otra pregunta
 * ------------------------------------------------------------------
 *
 * Antes de cargarse en memoria, el modelo es un archivo en disco: un 8 B en
 * INT4 son unos 4,5 GB, y un 70 B pasa de 35 GB. Ahí es donde se decide si el
 * equipo puede tener varios modelos instalados, si guarda vídeo para revisar
 * un falso rechazo y si el registro histórico cabe sin salir a la red.
 *
 * `almacenamiento` es lo que ADMITE cada categoría, no lo que trae puesto: en
 * este bloque de la matriz el disco casi nunca viene incluido y es una partida
 * aparte del presupuesto.
 */

export type Cuantizacion = 'fp16' | 'int8' | 'int4'

export const BYTES_POR_PARAMETRO: Record<Cuantizacion, number> = {
  fp16: 2,
  int8: 1,
  int4: 0.5,
}

export const NOMBRE_CUANTIZACION: Record<Cuantizacion, string> = {
  fp16: 'FP16',
  int8: 'INT8',
  int4: 'INT4',
}

export const DESCRIPCION_CUANTIZACION: Record<Cuantizacion, string> = {
  fp16: 'Precisión media, 2 bytes por parámetro. Es como sale el modelo del entrenamiento.',
  int8: 'Un byte por parámetro. La pérdida de calidad es pequeña y es el formato habitual en planta.',
  int4: 'Medio byte por parámetro. Cuadruplica el modelo que cabe, con pérdida notable en tareas de razonamiento.',
}

export interface MemoriaEquipo {
  /** Memoria física total del equipo representativo, en GB. */
  totalGb: number
  tipo: string
  /**
   * Fracción que queda de verdad para los pesos del modelo.
   *
   * El resto se lo comen el sistema operativo, el framework de inferencia y
   * las activaciones intermedias. En memoria unificada la penalización es
   * mayor porque el sistema y el modelo comparten el mismo banco; en una GPU
   * con memoria dedicada, casi toda es para el modelo.
   */
  fraccionUtil: number
  /** Por qué esa fracción y qué más compite por la memoria. */
  nota: string
  /** Almacenamiento que admite la categoría, en corto para la celda. */
  almacenamiento: string
  /** Qué se le puede poner de verdad, y qué condiciona esa elección. */
  almacenamientoNota: string
  /** Modelos concretos que este equipo ejecuta en la práctica. */
  modelosTipicos: string[]
  /** Lo que NO puede ejecutar, que suele ser la parte útil. */
  fueraDeAlcance: string
}

/**
 * Datos por categoría, tomados de la ficha del equipo representativo de cada
 * fila de la matriz. Cuando la fila nombra dos equipos se usa el de mayor
 * memoria, que es el que fija el techo.
 *
 * ADVERTENCIA: los modelos de IA cambian cada pocos meses y estas listas
 * envejecen. Son un punto de partida, no una garantía. Verifica con el
 * buscador de la aplicación o con el fabricante antes de comprometer un
 * diseño.
 */
export const MEMORIA: Record<string, MemoriaEquipo> = {
  'mcu-basico': {
    // Arduino Nano 33 BLE: 1 MB de flash, 256 KB de SRAM. Los pesos van en
    // flash; la SRAM es para activaciones.
    totalGb: 0.00025,
    tipo: 'Flash y SRAM en el propio chip',
    fraccionUtil: 0.6,
    nota: 'El intérprete de TinyML necesita su propio espacio de trabajo en SRAM, y el programa de control comparte la misma flash que el modelo.',
    almacenamiento: 'Flash interna · microSD',
    almacenamientoNota:
      'De 256 KB a 4 MB de flash en el propio chip, y ahí va el programa entero. Para registrar datos se le añade una microSD por SPI, que es lenta pero suficiente para un histórico de sensores.',
    modelosTipicos: [
      'Detección de una palabra clave concreta (~20 000 parámetros)',
      'Clasificación de gestos a partir del acelerómetro',
      'Detección de anomalía con un umbral aprendido sobre una señal',
    ],
    fueraDeAlcance:
      'Cualquier cosa con imágenes. Aquí no entra ni la red de visión más recortada.',
  },

  'mcu-edge-ai': {
    // Portenta H7: 8 MB de SDRAM y 16 MB de flash externa.
    totalGb: 0.004,
    tipo: 'SDRAM y flash externa',
    fraccionUtil: 0.6,
    nota: 'Aunque la flash externa es de 16 MB, el modelo tiene que caber también en la SDRAM al ejecutarse, y ahí compite con el búfer de la cámara.',
    almacenamiento: 'Flash QSPI · microSD',
    almacenamientoNota:
      'De 2 a 16 MB de flash QSPI externa, donde vive el modelo, y ranura microSD en los formatos industriales. No hay sistema de archivos de propósito general: se escribe a mano lo que se guarda.',
    modelosTipicos: [
      'MobileNet v1 con multiplicador 0,25 a baja resolución',
      'FOMO: detección de objetos por posición, sin caja delimitadora',
      'Autoencoder de vibración para mantenimiento predictivo (~100 000 parámetros)',
      'Clasificación de sonido con una red convolucional pequeña',
    ],
    fueraDeAlcance:
      'Vídeo continuo, detección con caja delimitadora precisa y cualquier modelo de lenguaje.',
  },

  'sbc-economico': {
    // Raspberry Pi 5 de 8 GB. El HAT de IA lleva su propio acelerador.
    totalGb: 8,
    tipo: 'LPDDR4X compartida con el sistema',
    fraccionUtil: 0.6,
    nota: 'El sistema operativo, el escritorio y el búfer de vídeo salen del mismo banco de 8 GB que el modelo.',
    almacenamiento: 'microSD · eMMC · NVMe M.2',
    almacenamientoNota:
      'Arranca de microSD, que es la causa más frecuente de fallo en planta: se corrompe con los cortes de luz. En producción se pasa a eMMC (en los módulos) o a una NVMe M.2 por PCIe, que además multiplica la velocidad de carga del modelo.',
    modelosTipicos: [
      'En la NPU del HAT: YOLOv8n y YOLOv8s, MobileNet v2 y v3, ResNet-50',
      'En la CPU: modelos de lenguaje de 7 000 a 8 000 millones de parámetros en INT4, a pocos tokens por segundo',
      'Whisper en sus variantes pequeñas para transcripción no urgente',
    ],
    fueraDeAlcance:
      'La NPU del HAT está pensada para redes de visión compiladas: no ejecuta modelos de lenguaje. Estos corren en la CPU, y ahí la velocidad no da para uso interactivo.',
  },

  'cpu-npu': {
    // AMD Ryzen AI Max+ 395 en su configuración de 128 GB, el techo de la fila.
    // Un Apple M4 Max llega a la misma cifra; los Core Ultra se quedan en 64.
    totalGb: 128,
    tipo: 'LPDDR5X unificada entre CPU, GPU integrada y NPU',
    fraccionUtil: 0.7,
    nota: 'La plataforma limita cuánta memoria unificada puede reservar el acelerador: AMD deja asignar 96 de los 128 GB y macOS ronda ese mismo porcentaje. El resto se lo queda el sistema.',
    almacenamiento: 'NVMe M.2 · SATA',
    almacenamientoNota:
      'Una o dos ranuras NVMe M.2 y SATA en la mayoría de mini PC e IPC, así que el disco se dimensiona al gusto. En los Mac va soldado y se decide al comprar: ampliarlo después no es una opción.',
    modelosTipicos: [
      'Modelos de lenguaje de 70 000 millones de parámetros en INT4, con la memoria unificada como VRAM',
      'Modelos de visión y lenguaje grandes, del tipo que no cabe en una GPU de 24 GB',
      'YOLOv8 en variantes n a m sobre una o dos cámaras, en la NPU o en la GPU integrada',
      'Whisper large y transcripción continua sin salir del equipo',
    ],
    fueraDeAlcance:
      'Velocidad. Cabe más modelo que en ninguna otra fila —la memoria unificada es enorme— pero el ancho de banda y los TOPS repartidos hacen que un 70 B responda a ritmo de lectura, no de conversación. Y sin CUDA, lo que hay que revisar antes es si el runtime existe para esta plataforma.',
  },

  'edge-ai-integrado': {
    // Jetson Orin NX de 16 GB, el techo de la fila.
    totalGb: 16,
    tipo: 'LPDDR5 unificada entre CPU y GPU',
    fraccionUtil: 0.7,
    nota: 'La memoria unificada evita copiar datos entre CPU y GPU, pero el sistema operativo vive en el mismo banco.',
    almacenamiento: 'eMMC · NVMe M.2 · microSD',
    almacenamientoNota:
      'De 16 a 64 GB de eMMC en el propio módulo, NVMe M.2 en la placa carrier y microSD en los kits de desarrollo. La eMMC del módulo se llena enseguida: JetPack y CUDA ya ocupan una parte importante.',
    modelosTipicos: [
      'YOLOv8 en sus variantes m y l, en tiempo real sobre una o dos cámaras',
      'Modelos de lenguaje de 7 000 a 13 000 millones de parámetros en INT4',
      'Whisper en variantes media y grande',
      'Segmentación semántica y modelos de pose para robótica',
    ],
    fueraDeAlcance:
      'Entrenar. Tiene memoria para inferir modelos grandes, pero el entrenamiento necesita varias veces esa cantidad para gradientes y estados del optimizador.',
  },

  'edge-ai-potencia': {
    totalGb: 64,
    tipo: 'LPDDR5 unificada entre CPU y GPU',
    fraccionUtil: 0.7,
    nota: 'Con 64 GB unificados la memoria deja de ser el límite en el borde; el límite pasa a ser el ancho de banda y el sobre térmico.',
    almacenamiento: 'eMMC · NVMe M.2 (PCIe Gen4)',
    almacenamientoNota:
      '64 GB de eMMC en el módulo y una o dos NVMe M.2 por PCIe Gen4 en la carrier. Con varias cámaras 4K el disco deja de ser un detalle: grabar los flujos para revisar un rechazo pide NVMe, no eMMC.',
    modelosTipicos: [
      'Varias instancias de YOLOv8l sobre flujos 4K simultáneos',
      'Modelos de lenguaje de 70 000 millones de parámetros en INT4, con contexto corto',
      'Modelos de visión y lenguaje tipo LLaVA de 13 000 millones',
      'Fusión de varios sensores con modelos distintos cargados a la vez',
    ],
    fueraDeAlcance:
      'Entrenamiento desde cero. Sirve para ajuste fino ligero, no para entrenar un modelo grande.',
  },

  'gpu-ipc': {
    // NVIDIA L4 de 24 GB, el techo de la fila.
    totalGb: 24,
    tipo: 'GDDR6 dedicada con ECC',
    fraccionUtil: 0.85,
    nota: 'La memoria es exclusiva de la GPU: el sistema operativo corre en la RAM del PC hospedador y no compite por ella.',
    almacenamiento: 'El del IPC: NVMe · SATA',
    almacenamientoNota:
      'La tarjeta no lleva almacenamiento: usa el del PC industrial que la hospeda —NVMe M.2, SATA de 2,5" y bahías con RAID según el chasis—. Con 10 a 30 cámaras, el disco se elige por lo que hay que retener, no por lo que ocupa el modelo.',
    modelosTipicos: [
      'Entre 10 y 30 flujos de cámara con YOLOv8 según resolución y cadencia',
      'Modelos de lenguaje de 13 000 millones en INT8 o de 30 000 millones en INT4',
      'Modelos de segmentación grandes y de detección de alta resolución',
      'Ajuste fino con LoRA sobre modelos de 7 000 millones',
    ],
    fueraDeAlcance:
      'Entrenamiento completo de un modelo grande, y cualquier carga que necesite más de 24 GB en un solo dispositivo.',
  },

  'gpu-enterprise': {
    // RTX 6000 Ada de 48 GB, el techo de la fila.
    totalGb: 48,
    tipo: 'GDDR6 dedicada con ECC',
    fraccionUtil: 0.85,
    nota: 'Es la única fila de la matriz con memoria dedicada suficiente para entrenar, no solo para inferir.',
    almacenamiento: 'El del servidor: NVMe en RAID',
    almacenamientoNota:
      'Igual que la fila anterior, pero entrenando el disco pasa a ser el cuello de botella: si el almacenamiento no alimenta a la GPU lo bastante rápido, se paga una tarjeta de 7.000 dólares para que espere. De ahí el NVMe en RAID.',
    modelosTipicos: [
      'Entrenamiento completo de modelos de 7 000 a 13 000 millones de parámetros',
      'Inferencia de modelos de 70 000 millones en INT4 con contexto amplio',
      'Generación de imagen tipo Stable Diffusion XL',
      'Simulación y renderizado de gemelos digitales en Omniverse',
    ],
    fueraDeAlcance:
      'Entrenar un modelo de frontera. Para eso hacen falta varias GPU de centro de datos conectadas entre sí.',
  },
}

export const memoriaDe = (id: string): MemoriaEquipo | undefined => MEMORIA[id]
