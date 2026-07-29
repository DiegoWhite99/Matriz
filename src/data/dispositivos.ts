/**
 * Catálogo de dispositivos concretos.
 *
 * La matriz habla de categorías —«SBCs Económicos», «Edge AI Integrado»— y eso
 * sirve para decidir la clase de equipo. Pero llega el momento de comprar y
 * hace falta un nombre de producto. Este archivo es esa lista.
 *
 * COMO `memoria.ts` Y `software.ts`, NO SALE DE LA HOJA DE CÁLCULO. Cada
 * dispositivo se ancla a una categoría de la matriz con `categoriaId`, así que
 * hereda su análisis: si la matriz dice que «Edge AI Integrado» gana en visión
 * de envasado, eso vale para todos los dispositivos de esa fila.
 *
 * ------------------------------------------------------------------
 * Sobre los precios
 * ------------------------------------------------------------------
 *
 * Son orientativos y de lista, en dólares, sin impuestos ni envío. Envejecen
 * rápido y varían mucho por distribuidor y por país. Están para ordenar
 * magnitudes —distinguir un equipo de 20 dólares de uno de 7.000—, no para
 * cotizar. Usa el buscador de precios de la aplicación antes de comprometer un
 * presupuesto.
 */

export type Formato =
  | 'Placa de desarrollo'
  | 'Kit de desarrollo'
  | 'Módulo SOM'
  | 'Mini PC'
  | 'Equipo industrial'
  | 'Tarjeta PCIe'
  | 'Accesorio'

export interface Dispositivo {
  id: string
  nombre: string
  fabricante: string
  /** Fila de la matriz a la que pertenece. */
  categoriaId: string
  formato: Formato
  /** Precio orientativo en USD. `null` si no tiene precio público estable. */
  precioUsd: number | null
  /** Consumo típico en watts. */
  tdpW: number
  /** Memoria para el modelo, en GB. Los microcontroladores van en fracciones. */
  memoriaGb: number
  memoriaTipo: string
  /** TOPS INT8 de IA. `null` cuando el fabricante no declara la cifra. */
  topsInt8: number | null
  procesador: string
  /** Rango de temperatura de operación, si el fabricante lo especifica. */
  rangoTermico: string | null
  /** Por qué está en la lista: qué lo distingue de sus vecinos. */
  destacado: string
  /** Lo que hay que saber antes de elegirlo. Suele ser lo más útil. */
  advertencia?: string
}

export const DISPOSITIVOS: Dispositivo[] = [
  /* ================= Microcontroladores Básicos ================= */
  {
    id: 'uno-r4-minima',
    nombre: 'Arduino Uno R4 Minima',
    fabricante: 'Arduino',
    categoriaId: 'mcu-basico',
    formato: 'Placa de desarrollo',
    precioUsd: 20,
    tdpW: 0.3,
    memoriaGb: 0.000032,
    memoriaTipo: '32 KB SRAM · 256 KB flash',
    topsInt8: null,
    procesador: 'Renesas RA4M1 (Cortex-M4 a 48 MHz)',
    rangoTermico: '-40 a 85 °C',
    destacado: 'El punto de entrada. Control de relés y lectura de sensores con respuesta predecible.',
    advertencia: 'Con 32 KB de RAM no entra ningún modelo útil. Es para control, no para IA.',
  },
  {
    id: 'uno-r4-wifi',
    nombre: 'Arduino Uno R4 WiFi',
    fabricante: 'Arduino',
    categoriaId: 'mcu-basico',
    formato: 'Placa de desarrollo',
    precioUsd: 27,
    tdpW: 0.5,
    memoriaGb: 0.000032,
    memoriaTipo: '32 KB SRAM · 256 KB flash',
    topsInt8: null,
    procesador: 'Renesas RA4M1 + ESP32-S3 para radio',
    rangoTermico: '-40 a 85 °C',
    destacado: 'El mismo que el Minima con WiFi y Bluetooth, para enviar lecturas sin cablear.',
  },
  {
    id: 'nano-33-ble-sense',
    nombre: 'Arduino Nano 33 BLE Sense Rev2',
    fabricante: 'Arduino',
    categoriaId: 'mcu-basico',
    formato: 'Placa de desarrollo',
    precioUsd: 45,
    tdpW: 0.1,
    memoriaGb: 0.000256,
    memoriaTipo: '256 KB SRAM · 1 MB flash',
    topsInt8: null,
    procesador: 'Nordic nRF52840 (Cortex-M4F a 64 MHz)',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'Trae micrófono, acelerómetro, giróscopo y sensores de ambiente en la placa. Es el equipo de TinyML por defecto.',
    advertencia:
      'Sus 256 KB son ocho veces los del Uno: aquí sí entra un detector de palabra clave o un clasificador de vibración.',
  },
  {
    id: 'pico-2-w',
    nombre: 'Raspberry Pi Pico 2 W',
    fabricante: 'Raspberry Pi',
    categoriaId: 'mcu-basico',
    formato: 'Placa de desarrollo',
    precioUsd: 7,
    tdpW: 0.2,
    memoriaGb: 0.00052,
    memoriaTipo: '520 KB SRAM · 4 MB flash',
    topsInt8: null,
    procesador: 'RP2350 (doble Cortex-M33 a 150 MHz)',
    rangoTermico: '-20 a 85 °C',
    destacado: 'El más barato de la lista con memoria suficiente para TinyML. Difícil de superar en costo por punto.',
  },
  {
    id: 'esp32-s3-devkit',
    nombre: 'ESP32-S3-DevKitC-1',
    fabricante: 'Espressif',
    categoriaId: 'mcu-basico',
    formato: 'Placa de desarrollo',
    precioUsd: 15,
    tdpW: 0.5,
    memoriaGb: 0.008,
    memoriaTipo: '512 KB SRAM · 8 MB PSRAM',
    topsInt8: null,
    procesador: 'Xtensa LX7 doble núcleo a 240 MHz con instrucciones vectoriales',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'Sus instrucciones vectoriales aceleran las redes pequeñas, y los 8 MB de PSRAM permiten imágenes que en otros microcontroladores no caben.',
  },
  {
    id: 'nucleo-h743',
    nombre: 'STM32 Nucleo-H743ZI2',
    fabricante: 'STMicroelectronics',
    categoriaId: 'mcu-basico',
    formato: 'Placa de desarrollo',
    precioUsd: 27,
    tdpW: 0.5,
    memoriaGb: 0.001,
    memoriaTipo: '1 MB SRAM · 2 MB flash',
    topsInt8: null,
    procesador: 'STM32H743 (Cortex-M7 a 480 MHz)',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'El microcontrolador más potente sin sistema operativo de la lista, y con el camino más corto hacia un diseño propio en producción.',
  },

  /* ================ Microcontroladores Edge AI ================== */
  {
    id: 'portenta-h7',
    nombre: 'Arduino Portenta H7',
    fabricante: 'Arduino',
    categoriaId: 'mcu-edge-ai',
    formato: 'Placa de desarrollo',
    precioUsd: 103,
    tdpW: 1.5,
    memoriaGb: 0.008,
    memoriaTipo: '8 MB SDRAM · 16 MB flash',
    topsInt8: null,
    procesador: 'STM32H747 (Cortex-M7 a 480 MHz + Cortex-M4 a 240 MHz)',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'Dos núcleos: uno corre el control en tiempo real y el otro el modelo, sin que se estorben. Formato industrial y criptoprocesador.',
  },
  {
    id: 'nicla-vision',
    nombre: 'Arduino Nicla Vision',
    fabricante: 'Arduino',
    categoriaId: 'mcu-edge-ai',
    formato: 'Placa de desarrollo',
    precioUsd: 115,
    tdpW: 1,
    memoriaGb: 0.008,
    memoriaTipo: '8 MB SDRAM · 16 MB flash',
    topsInt8: null,
    procesador: 'STM32H747 con cámara de 2 MP integrada',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'Cámara, micrófono y acelerómetro en 23 × 23 mm. Es el equipo más pequeño de la matriz que hace verificación visual.',
    advertencia:
      'La resolución útil para inferencia es muy baja. Sirve para presencia y ausencia, no para detectar un defecto fino.',
  },
  {
    id: 'nicla-voice',
    nombre: 'Arduino Nicla Voice',
    fabricante: 'Arduino',
    categoriaId: 'mcu-edge-ai',
    formato: 'Placa de desarrollo',
    precioUsd: 105,
    tdpW: 0.5,
    memoriaGb: 0.002,
    memoriaTipo: '2 MB flash en el procesador neuronal',
    topsInt8: null,
    procesador: 'Syntiant NDP120 (procesador de decisión neuronal) + nRF52832',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'Su procesador neuronal escucha permanentemente con un consumo de microamperios. Pensado para nodos que viven años con una pila.',
  },
  {
    id: 'portenta-c33',
    nombre: 'Arduino Portenta C33',
    fabricante: 'Arduino',
    categoriaId: 'mcu-edge-ai',
    formato: 'Placa de desarrollo',
    precioUsd: 60,
    tdpW: 1,
    memoriaGb: 0.000512,
    memoriaTipo: '512 KB SRAM · 2 MB flash',
    topsInt8: null,
    procesador: 'Renesas RA6M5 (Cortex-M33 a 200 MHz)',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'La entrada económica a la gama industrial de Arduino: el mismo formato y conectores que el Portenta H7, a la mitad de precio.',
  },
  {
    id: 'grove-vision-ai-v2',
    nombre: 'Grove Vision AI V2',
    fabricante: 'Seeed Studio',
    categoriaId: 'mcu-edge-ai',
    formato: 'Placa de desarrollo',
    precioUsd: 25,
    tdpW: 0.5,
    memoriaGb: 0.0025,
    memoriaTipo: '2,5 MB SRAM en el chip',
    topsInt8: null,
    procesador: 'Himax WiseEye2 (Cortex-M55 + acelerador Ethos-U55)',
    rangoTermico: null,
    destacado:
      'Lleva un acelerador de red neuronal de verdad por 25 dólares. La opción más barata de la matriz que hace detección de objetos.',
  },
  {
    id: 'alif-ensemble-e7',
    nombre: 'Alif Ensemble E7 DevKit',
    fabricante: 'Alif Semiconductor',
    categoriaId: 'mcu-edge-ai',
    formato: 'Kit de desarrollo',
    precioUsd: 180,
    tdpW: 1,
    memoriaGb: 0.0135,
    memoriaTipo: '13,5 MB SRAM en el chip',
    topsInt8: null,
    procesador: 'Doble Cortex-M55 con dos aceleradores Ethos-U55',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'El techo de lo que se puede hacer sin sistema operativo: 13,5 MB de memoria en el chip y dos aceleradores neuronales.',
  },

  /* ===================== SBCs Económicos ======================== */
  {
    id: 'rpi5-4gb',
    nombre: 'Raspberry Pi 5 (4 GB)',
    fabricante: 'Raspberry Pi',
    categoriaId: 'sbc-economico',
    formato: 'Placa de desarrollo',
    precioUsd: 60,
    tdpW: 12,
    memoriaGb: 4,
    memoriaTipo: 'LPDDR4X compartida',
    topsInt8: null,
    procesador: 'Broadcom BCM2712 (cuatro Cortex-A76 a 2,4 GHz)',
    rangoTermico: '0 a 50 °C',
    destacado: 'La entrada a Linux. Suficiente para un gateway de protocolos o un panel de operador.',
    advertencia:
      'Con 4 GB no queda margen para modelos de lenguaje. Si vas a probar Ollama, ve directo a la de 16 GB.',
  },
  {
    id: 'rpi5-8gb',
    nombre: 'Raspberry Pi 5 (8 GB)',
    fabricante: 'Raspberry Pi',
    categoriaId: 'sbc-economico',
    formato: 'Placa de desarrollo',
    precioUsd: 80,
    tdpW: 12,
    memoriaGb: 8,
    memoriaTipo: 'LPDDR4X compartida',
    topsInt8: null,
    procesador: 'Broadcom BCM2712 (cuatro Cortex-A76 a 2,4 GHz)',
    rangoTermico: '0 a 50 °C',
    destacado:
      'El equipo representativo de esta fila en la matriz. Con el HAT de IA es la combinación más usada para visión de bajo costo.',
    advertencia:
      'El rango térmico de 0 a 50 °C es el problema real en planta: un gabinete cerrado en verano lo supera.',
  },
  {
    id: 'rpi5-16gb',
    nombre: 'Raspberry Pi 5 (16 GB)',
    fabricante: 'Raspberry Pi',
    categoriaId: 'sbc-economico',
    formato: 'Placa de desarrollo',
    precioUsd: 120,
    tdpW: 12,
    memoriaGb: 16,
    memoriaTipo: 'LPDDR4X compartida',
    topsInt8: null,
    procesador: 'Broadcom BCM2712 (cuatro Cortex-A76 a 2,4 GHz)',
    rangoTermico: '0 a 50 °C',
    destacado:
      'La única Raspberry con memoria para un modelo de lenguaje mediano. Sigue corriendo en CPU, así que va despacio.',
  },
  {
    id: 'rpi-ai-hat-26',
    nombre: 'Raspberry Pi AI HAT+ (26 TOPS)',
    fabricante: 'Raspberry Pi',
    categoriaId: 'sbc-economico',
    formato: 'Accesorio',
    precioUsd: 110,
    tdpW: 5,
    memoriaGb: 0,
    memoriaTipo: 'usa la de la placa anfitriona',
    topsInt8: 26,
    procesador: 'Acelerador Hailo-8',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'Es de donde salen los TOPS de esta fila de la matriz. Sin él, la Raspberry no tiene aceleración de IA.',
    advertencia:
      'Ejecuta redes de visión previamente compiladas para el chip Hailo. No corre modelos de lenguaje: eso se queda en la CPU.',
  },
  {
    id: 'rock-5b',
    nombre: 'Radxa ROCK 5B (16 GB)',
    fabricante: 'Radxa',
    categoriaId: 'sbc-economico',
    formato: 'Placa de desarrollo',
    precioUsd: 190,
    tdpW: 15,
    memoriaGb: 16,
    memoriaTipo: 'LPDDR5 compartida',
    topsInt8: 6,
    procesador: 'Rockchip RK3588 (cuatro Cortex-A76 + cuatro A55)',
    rangoTermico: '-20 a 70 °C',
    destacado:
      'Trae acelerador de IA integrado, así que no necesita accesorio, y salida de vídeo mucho más capaz que la Raspberry.',
    advertencia:
      'El ecosistema de software es bastante menor que el de Raspberry Pi: más trabajo de puesta a punto.',
  },
  {
    id: 'lattepanda-mu',
    nombre: 'LattePanda Mu (N100)',
    fabricante: 'DFRobot',
    categoriaId: 'sbc-economico',
    formato: 'Módulo SOM',
    precioUsd: 139,
    tdpW: 15,
    memoriaGb: 8,
    memoriaTipo: 'LPDDR5 compartida',
    topsInt8: null,
    procesador: 'Intel N100 (cuatro núcleos x86)',
    rangoTermico: '0 a 60 °C',
    destacado:
      'La única placa económica de la lista con arquitectura x86: corre el software de automatización que no existe para ARM.',
  },
  {
    id: 'cm5',
    nombre: 'Raspberry Pi Compute Module 5',
    fabricante: 'Raspberry Pi',
    categoriaId: 'sbc-economico',
    formato: 'Módulo SOM',
    precioUsd: 95,
    tdpW: 12,
    memoriaGb: 8,
    memoriaTipo: 'LPDDR4X compartida',
    topsInt8: null,
    procesador: 'Broadcom BCM2712 (cuatro Cortex-A76 a 2,4 GHz)',
    rangoTermico: '-20 a 85 °C',
    destacado:
      'La misma Raspberry Pi 5 en formato de módulo, con rango térmico ampliado. Es la que se usa cuando el producto pasa a producción.',
    advertencia: 'Necesita placa base, propia o comercial: súmalo al costo del proyecto.',
  },

  /* ============== Procesadores con NPU (AI PC) ================== */
  /*
   * Los TOPS de esta sección son los de PLATAFORMA —NPU más GPU integrada más
   * CPU—, porque es la cifra que publican Intel y AMD y la que usa la fila de
   * la matriz. Cada ficha dice cuánto de ese total sale de la NPU, que es la
   * parte que trabaja con un vatio y medio. Apple solo declara su Neural
   * Engine, así que ahí la cifra es únicamente esa.
   */
  {
    id: 'mac-mini-m4',
    nombre: 'Apple Mac mini (M4, 16 GB)',
    fabricante: 'Apple',
    categoriaId: 'cpu-npu',
    formato: 'Mini PC',
    precioUsd: 599,
    tdpW: 30,
    memoriaGb: 16,
    memoriaTipo: 'LPDDR5X unificada, 120 GB/s',
    topsInt8: 38,
    procesador: 'Apple M4 (10 núcleos de CPU, 10 de GPU, Neural Engine de 16 núcleos)',
    rangoTermico: '10 a 35 °C',
    destacado:
      'La entrada más barata a 38 TOPS con memoria unificada y refrigeración casi silenciosa. Por 599 dólares corre Ollama sobre Metal a velocidad conversacional.',
    advertencia:
      'macOS queda fuera de casi todo el software de automatización, y ni la memoria ni el disco se pueden ampliar después: la configuración se decide al comprar.',
  },
  {
    id: 'mac-studio-m4-max',
    nombre: 'Apple Mac Studio (M4 Max, 36 GB)',
    fabricante: 'Apple',
    categoriaId: 'cpu-npu',
    formato: 'Mini PC',
    precioUsd: 1999,
    tdpW: 90,
    memoriaGb: 36,
    memoriaTipo: 'LPDDR5X unificada, 410 GB/s',
    topsInt8: 38,
    procesador: 'Apple M4 Max (14 núcleos de CPU, 32 de GPU, Neural Engine de 16 núcleos)',
    rangoTermico: '10 a 35 °C',
    destacado:
      'Sus 410 GB/s de ancho de banda son casi el cuádruple que los del Mac mini, y en modelos de lenguaje eso es exactamente la velocidad de respuesta. Escala hasta 128 GB unificados.',
    advertencia:
      'El Neural Engine sigue declarando los mismos 38 TOPS que el M4 básico: lo que se compra aquí es memoria y ancho de banda, no más acelerador.',
  },
  {
    id: 'nuc-15-pro',
    nombre: 'ASUS NUC 15 Pro (Core Ultra 7 255H)',
    fabricante: 'ASUS · Intel',
    categoriaId: 'cpu-npu',
    formato: 'Mini PC',
    precioUsd: 1099,
    tdpW: 65,
    memoriaGb: 32,
    memoriaTipo: 'DDR5 SO-DIMM ampliable, no unificada',
    topsInt8: 99,
    procesador: 'Intel Core Ultra 7 255H (16 núcleos, GPU Arc integrada, NPU de 13 TOPS)',
    rangoTermico: '0 a 35 °C',
    destacado:
      'Windows y x86 sin recompilar nada, con memoria y disco ampliables. De sus 99 TOPS de plataforma solo 13 son de la NPU: el resto sale de la GPU integrada y de la CPU.',
    advertencia:
      'La ruta de software es OpenVINO, no CUDA. Funciona bien, pero media documentación de IA que encuentres asume una GPU NVIDIA y no se aplica tal cual.',
  },
  {
    id: 'beelink-ser9',
    nombre: 'Beelink SER9 (Ryzen AI 9 HX 370)',
    fabricante: 'Beelink · AMD',
    categoriaId: 'cpu-npu',
    formato: 'Mini PC',
    precioUsd: 1099,
    tdpW: 54,
    memoriaGb: 32,
    memoriaTipo: 'LPDDR5X-7500 unificada, soldada',
    topsInt8: 80,
    procesador: 'AMD Ryzen AI 9 HX 370 (12 núcleos Zen 5, Radeon 890M, NPU XDNA 2 de 50 TOPS)',
    rangoTermico: '0 a 35 °C',
    destacado:
      'La NPU más capaz de esta lista en un equipo de 54 W: 50 de sus 80 TOPS de plataforma salen del acelerador dedicado, que es el que puede quedarse inferiendo todo el turno sin calentar.',
    advertencia:
      'La memoria va soldada. Y el soporte de ROCm en las GPU integradas llega más tarde y con menos modelos probados que en las tarjetas dedicadas.',
  },
  {
    id: 'framework-desktop-395',
    nombre: 'Framework Desktop (Ryzen AI Max+ 395, 128 GB)',
    fabricante: 'Framework · AMD',
    categoriaId: 'cpu-npu',
    formato: 'Mini PC',
    precioUsd: 1999,
    tdpW: 120,
    memoriaGb: 128,
    memoriaTipo: 'LPDDR5X-8000 unificada, 256 GB/s, soldada',
    topsInt8: 126,
    procesador:
      'AMD Ryzen AI Max+ 395 (16 núcleos Zen 5, GPU Radeon 8060S de 40 CU, NPU XDNA 2 de 50 TOPS)',
    rangoTermico: '0 a 35 °C',
    destacado:
      'El equipo con más memoria para modelos de toda la matriz: de sus 128 GB unificados se pueden asignar 96 al acelerador, así que carga un modelo de 70 000 millones de parámetros que no entra en ninguna GPU de esta lista.',
    advertencia:
      'Que quepa no es que vaya rápido: con 256 GB/s ese 70 B responde a ritmo de lectura, no de conversación. Y la memoria es soldada, así que la configuración es definitiva.',
  },
  {
    id: 'ark-3534',
    nombre: 'Advantech ARK-3534 (Core Ultra 7 165H)',
    fabricante: 'Advantech · Intel',
    categoriaId: 'cpu-npu',
    formato: 'Equipo industrial',
    precioUsd: null,
    tdpW: 90,
    memoriaGb: 32,
    memoriaTipo: 'DDR5 SO-DIMM, ECC opcional',
    topsInt8: 34,
    procesador: 'Intel Core Ultra 7 165H (16 núcleos, GPU Arc integrada, NPU de 11 TOPS)',
    rangoTermico: '-20 a 60 °C',
    destacado:
      'Es la versión de esta fila que sí puede ir en un armario: montaje en rack o riel, alimentación de 9 a 36 V, entradas digitales aisladas y años de suministro garantizado.',
    advertencia:
      'Su NPU es de la generación anterior y declara bastante menos que un mini PC actual. Se compra por el grado industrial y por el ciclo de vida largo, no por los TOPS. Precio solo por cotización.',
  },

  /* ==================== Edge AI Integrado ======================= */
  {
    id: 'orin-nano-super',
    nombre: 'Jetson Orin Nano Super Developer Kit',
    fabricante: 'NVIDIA',
    categoriaId: 'edge-ai-integrado',
    formato: 'Kit de desarrollo',
    precioUsd: 249,
    tdpW: 25,
    memoriaGb: 8,
    memoriaTipo: 'LPDDR5 unificada',
    topsInt8: 67,
    procesador: 'GPU Ampere de 1024 núcleos + seis Cortex-A78AE',
    rangoTermico: '-25 a 80 °C',
    destacado:
      'La entrada más barata a CUDA en el borde. Por 249 dólares tienes toda la pila de NVIDIA: TensorRT, DeepStream, Isaac y Ollama con GPU.',
    advertencia:
      'Es un kit de desarrollo, no un equipo de planta: sin caja, con ventilador y con alimentación de escritorio.',
  },
  {
    id: 'orin-nx-8gb',
    nombre: 'Jetson Orin NX 8 GB',
    fabricante: 'NVIDIA',
    categoriaId: 'edge-ai-integrado',
    formato: 'Módulo SOM',
    precioUsd: 499,
    tdpW: 20,
    memoriaGb: 8,
    memoriaTipo: 'LPDDR5 unificada',
    topsInt8: 70,
    procesador: 'GPU Ampere de 1024 núcleos + seis Cortex-A78AE',
    rangoTermico: '-25 a 90 °C',
    destacado: 'Formato de módulo con rango térmico industrial, para integrar en un producto propio.',
    advertencia: 'Necesita placa base. Diseñarla o comprarla es una partida aparte.',
  },
  {
    id: 'orin-nx-16gb',
    nombre: 'Jetson Orin NX 16 GB',
    fabricante: 'NVIDIA',
    categoriaId: 'edge-ai-integrado',
    formato: 'Módulo SOM',
    precioUsd: 699,
    tdpW: 25,
    memoriaGb: 16,
    memoriaTipo: 'LPDDR5 unificada',
    topsInt8: 157,
    procesador: 'GPU Ampere de 1024 núcleos + ocho Cortex-A78AE',
    rangoTermico: '-25 a 90 °C',
    destacado:
      'El techo de esta fila de la matriz. 16 GB dan para visión en tiempo real y un modelo de lenguaje al mismo tiempo.',
    advertencia:
      'Es un módulo: necesita placa base y disipador. Si no quieres diseñarlos, mira el reComputer J4012 más abajo.',
  },
  {
    id: 'recomputer-j4012',
    nombre: 'reComputer J4012',
    fabricante: 'Seeed Studio',
    categoriaId: 'edge-ai-integrado',
    formato: 'Equipo industrial',
    precioUsd: 899,
    tdpW: 25,
    memoriaGb: 16,
    memoriaTipo: 'LPDDR5 unificada',
    topsInt8: 157,
    procesador: 'Jetson Orin NX 16 GB en caja de aluminio',
    rangoTermico: '-10 a 60 °C',
    destacado:
      'Un Orin NX ya montado con caja, disipador, almacenamiento y conectores. Es el camino corto: se enchufa y funciona.',
    advertencia:
      'Cuesta 200 dólares más que el módulo suelto, pero te ahorra diseñar la placa base y la disipación.',
  },
  {
    id: 'boxer-8641ai',
    nombre: 'BOXER-8641AI',
    fabricante: 'AAEON',
    categoriaId: 'edge-ai-integrado',
    formato: 'Equipo industrial',
    precioUsd: 1400,
    tdpW: 30,
    memoriaGb: 16,
    memoriaTipo: 'LPDDR5 unificada',
    topsInt8: 157,
    procesador: 'Jetson Orin NX 16 GB, sin ventilador',
    rangoTermico: '-25 a 60 °C',
    destacado:
      'Equipo industrial de verdad: sin ventilador, montaje en riel DIN, alimentación de 12 a 24 V y entradas digitales aisladas.',
  },

  /* ================= Edge AI de Alta Potencia =================== */
  {
    id: 'agx-orin-32',
    nombre: 'Jetson AGX Orin 32 GB',
    fabricante: 'NVIDIA',
    categoriaId: 'edge-ai-potencia',
    formato: 'Módulo SOM',
    precioUsd: 1199,
    tdpW: 40,
    memoriaGb: 32,
    memoriaTipo: 'LPDDR5 unificada',
    topsInt8: 200,
    procesador: 'GPU Ampere de 1792 núcleos + ocho Cortex-A78AE',
    rangoTermico: '-25 a 90 °C',
    destacado: 'La entrada a la gama alta del borde, a 400 dólares menos que la de 64 GB.',
    advertencia: 'Módulo suelto: hay que sumarle placa base y diseño térmico.',
  },
  {
    id: 'agx-orin-64',
    nombre: 'Jetson AGX Orin 64 GB',
    fabricante: 'NVIDIA',
    categoriaId: 'edge-ai-potencia',
    formato: 'Módulo SOM',
    precioUsd: 1799,
    tdpW: 60,
    memoriaGb: 64,
    memoriaTipo: 'LPDDR5 unificada',
    topsInt8: 275,
    procesador: 'GPU Ampere de 2048 núcleos + doce Cortex-A78AE',
    rangoTermico: '-25 a 90 °C',
    destacado:
      'El equipo representativo de esta fila. 64 GB unificados: varias cámaras 4K y un modelo de 70 000 millones de parámetros a la vez.',
    advertencia:
      'Módulo suelto. A 60 W en un gabinete cerrado, el diseño térmico deja de ser un detalle y pasa a ser el problema principal.',
  },
  {
    id: 'agx-orin-devkit',
    nombre: 'Jetson AGX Orin Developer Kit',
    fabricante: 'NVIDIA',
    categoriaId: 'edge-ai-potencia',
    formato: 'Kit de desarrollo',
    precioUsd: 1999,
    tdpW: 60,
    memoriaGb: 64,
    memoriaTipo: 'LPDDR5 unificada',
    topsInt8: 275,
    procesador: 'GPU Ampere de 2048 núcleos + doce Cortex-A78AE',
    rangoTermico: '0 a 50 °C',
    destacado: 'El AGX Orin con placa base, caja y conectores, listo para desarrollar sin diseñar nada.',
    advertencia: 'Para desarrollo. El rango térmico del kit es mucho menor que el del módulo.',
  },
  {
    id: 'agx-orin-industrial',
    nombre: 'Jetson AGX Orin Industrial',
    fabricante: 'NVIDIA',
    categoriaId: 'edge-ai-potencia',
    formato: 'Módulo SOM',
    precioUsd: 2400,
    tdpW: 60,
    memoriaGb: 64,
    memoriaTipo: 'LPDDR5 unificada con corrección de errores',
    topsInt8: 248,
    procesador: 'GPU Ampere de 2048 núcleos + doce Cortex-A78AE',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'La versión con corrección de errores en memoria y garantía de suministro a largo plazo, para equipos que deben durar años en planta.',
    advertencia:
      'Módulo suelto, con placa base aparte. Declara menos TOPS que el AGX Orin normal: la fiabilidad se paga con algo de rendimiento.',
  },

  /* ================ GPUs para IPC / Edge Server ================= */
  {
    id: 'rtx-2000-ada',
    nombre: 'RTX 2000 Ada Generation',
    fabricante: 'NVIDIA',
    categoriaId: 'gpu-ipc',
    formato: 'Tarjeta PCIe',
    precioUsd: 650,
    tdpW: 70,
    memoriaGb: 16,
    memoriaTipo: 'GDDR6 con corrección de errores',
    topsInt8: 191,
    procesador: 'GPU Ada Lovelace de 2816 núcleos',
    rangoTermico: null,
    destacado:
      'La forma más barata de meter CUDA en un PC industrial. 70 W significa que no hace falta cable de alimentación extra.',
  },
  {
    id: 'rtx-4000-ada-sff',
    nombre: 'RTX 4000 Ada SFF',
    fabricante: 'NVIDIA',
    categoriaId: 'gpu-ipc',
    formato: 'Tarjeta PCIe',
    precioUsd: 1250,
    tdpW: 70,
    memoriaGb: 20,
    memoriaTipo: 'GDDR6 con corrección de errores',
    topsInt8: 306,
    procesador: 'GPU Ada Lovelace de 6144 núcleos',
    rangoTermico: null,
    destacado:
      'El equipo representativo de esta fila. De bajo perfil y 70 W: cabe en gabinetes donde no entra una tarjeta normal.',
  },
  {
    id: 'nvidia-l4',
    nombre: 'NVIDIA L4',
    fabricante: 'NVIDIA',
    categoriaId: 'gpu-ipc',
    formato: 'Tarjeta PCIe',
    precioUsd: 2500,
    tdpW: 72,
    memoriaGb: 24,
    memoriaTipo: 'GDDR6 con corrección de errores',
    topsInt8: 485,
    procesador: 'GPU Ada Lovelace de 7424 núcleos',
    rangoTermico: null,
    destacado:
      'Diseñada para vídeo: lleva codificadores dedicados que descargan a la GPU del trabajo de descomprimir cada cámara.',
    advertencia:
      'No tiene ventilador: espera el flujo de aire de un chasis de servidor. En un gabinete cerrado sin ventilación forzada se ahoga.',
  },
  {
    id: 'rtx-4500-ada',
    nombre: 'RTX 4500 Ada Generation',
    fabricante: 'NVIDIA',
    categoriaId: 'gpu-ipc',
    formato: 'Tarjeta PCIe',
    precioUsd: 2400,
    tdpW: 210,
    memoriaGb: 24,
    memoriaTipo: 'GDDR6 con corrección de errores',
    topsInt8: 397,
    procesador: 'GPU Ada Lovelace de 7680 núcleos',
    rangoTermico: null,
    destacado: 'Cuando 70 W se quedan cortos pero todavía no se quiere una tarjeta de 300 W.',
  },
  {
    id: 'arc-pro-b50',
    nombre: 'Intel Arc Pro B50',
    fabricante: 'Intel',
    categoriaId: 'gpu-ipc',
    formato: 'Tarjeta PCIe',
    precioUsd: 375,
    tdpW: 70,
    memoriaGb: 16,
    memoriaTipo: 'GDDR6, sin corrección de errores',
    topsInt8: 170,
    procesador: 'GPU Intel Arc de arquitectura Xe2 (16 núcleos Xe)',
    rangoTermico: null,
    destacado:
      'Bajo perfil, 70 W y 16 GB por menos de 400 dólares: es la forma más barata de meter una tarjeta de IA con memoria decente en un PC industrial.',
    advertencia:
      'La cadena de herramientas es OpenVINO y su comunidad es mucho menor que la de CUDA. Sin memoria con corrección de errores, tampoco es la opción para operar 24/7 sin vigilancia.',
  },
  {
    id: 'hailo-10h',
    nombre: 'Hailo-10H',
    fabricante: 'Hailo',
    categoriaId: 'gpu-ipc',
    formato: 'Accesorio',
    precioUsd: 250,
    tdpW: 3.5,
    memoriaGb: 8,
    memoriaTipo: 'LPDDR4 propia del módulo',
    topsInt8: 40,
    procesador: 'Acelerador Hailo-10H en formato M.2',
    rangoTermico: '-40 a 85 °C',
    destacado:
      'Un módulo M.2 de 3,5 W que ejecuta modelos de lenguaje pequeños con su propia memoria. Convierte un PC industrial cualquiera en un equipo de IA.',
    advertencia:
      'No es una GPU: no sirve para gráficos ni para entrenar, y su cadena de herramientas es propia de Hailo.',
  },

  /* ================ GPUs Enterprise / High-End ================== */
  {
    id: 'rtx-4090',
    nombre: 'GeForce RTX 4090',
    fabricante: 'NVIDIA',
    categoriaId: 'gpu-enterprise',
    formato: 'Tarjeta PCIe',
    precioUsd: 1900,
    tdpW: 450,
    memoriaGb: 24,
    memoriaTipo: 'GDDR6X sin corrección de errores',
    topsInt8: 1321,
    procesador: 'GPU Ada Lovelace de 16384 núcleos',
    rangoTermico: null,
    destacado: 'La relación potencia/precio más alta de la lista, con diferencia.',
    advertencia:
      'Es una tarjeta de consumo: sin memoria con corrección de errores, sin garantía de operación continua y con licencia pensada para escritorio, no para centro de datos.',
  },
  {
    id: 'rtx-5090',
    nombre: 'GeForce RTX 5090',
    fabricante: 'NVIDIA',
    categoriaId: 'gpu-enterprise',
    formato: 'Tarjeta PCIe',
    precioUsd: 2300,
    tdpW: 575,
    memoriaGb: 32,
    memoriaTipo: 'GDDR7 sin corrección de errores',
    topsInt8: 1800,
    procesador: 'GPU Blackwell de 21760 núcleos',
    rangoTermico: null,
    destacado: 'La generación siguiente: 32 GB y más ancho de banda de memoria.',
    advertencia:
      'Sus 575 W exigen replantear la fuente y la refrigeración del equipo entero, no solo añadir la tarjeta.',
  },
  {
    id: 'rtx-6000-ada',
    nombre: 'RTX 6000 Ada Generation',
    fabricante: 'NVIDIA',
    categoriaId: 'gpu-enterprise',
    formato: 'Tarjeta PCIe',
    precioUsd: 6800,
    tdpW: 300,
    memoriaGb: 48,
    memoriaTipo: 'GDDR6 con corrección de errores',
    topsInt8: 1457,
    procesador: 'GPU Ada Lovelace de 18176 núcleos',
    rangoTermico: null,
    destacado:
      'El equipo representativo de esta fila. 48 GB con corrección de errores y 300 W: casi la potencia de una 4090 con la mitad del consumo y el doble de memoria.',
  },
  {
    id: 'l40s',
    nombre: 'NVIDIA L40S',
    fabricante: 'NVIDIA',
    categoriaId: 'gpu-enterprise',
    formato: 'Tarjeta PCIe',
    precioUsd: 8000,
    tdpW: 350,
    memoriaGb: 48,
    memoriaTipo: 'GDDR6 con corrección de errores',
    topsInt8: 1466,
    procesador: 'GPU Ada Lovelace de 18176 núcleos',
    rangoTermico: null,
    destacado: 'La versión de centro de datos: pensada para funcionar en rack sin parar.',
    advertencia: 'Sin ventilador, como la L4: necesita el flujo de aire de un chasis de servidor.',
  },
  {
    id: 'radeon-ai-pro-r9700',
    nombre: 'AMD Radeon AI PRO R9700',
    fabricante: 'AMD',
    categoriaId: 'gpu-enterprise',
    formato: 'Tarjeta PCIe',
    precioUsd: 1299,
    tdpW: 300,
    memoriaGb: 32,
    memoriaTipo: 'GDDR6 con corrección de errores',
    topsInt8: 766,
    procesador: 'GPU AMD RDNA 4 de 4096 procesadores de flujo',
    rangoTermico: null,
    destacado:
      '32 GB con corrección de errores por 1.300 dólares: la mitad del precio de una NVIDIA con memoria equivalente, y a 300 W admite hasta cuatro tarjetas en un mismo equipo.',
    advertencia:
      'El precio se paga en software: ROCm ha mejorado mucho, pero sigue soportando menos modelos, menos versiones de kernel y menos ejemplos que CUDA. Verifica que tu pila concreta funciona antes de comprar.',
  },
  {
    id: 'rtx-pro-6000-blackwell',
    nombre: 'RTX PRO 6000 Blackwell',
    fabricante: 'NVIDIA',
    categoriaId: 'gpu-enterprise',
    formato: 'Tarjeta PCIe',
    precioUsd: 8500,
    tdpW: 600,
    memoriaGb: 96,
    memoriaTipo: 'GDDR7 con corrección de errores',
    topsInt8: 4000,
    procesador: 'GPU Blackwell de 24064 núcleos',
    rangoTermico: null,
    destacado:
      'El techo de lo que cabe en un equipo de sobremesa: 96 GB permiten entrenar modelos que en 48 GB no entran.',
    advertencia:
      '600 W en una sola tarjeta. A partir de aquí el problema deja de ser el precio del equipo y pasa a ser la instalación eléctrica.',
  },
]

export const dispositivoPorId = new Map(DISPOSITIVOS.map((d) => [d.id, d]))

export const dispositivosDe = (categoriaId: string) =>
  DISPOSITIVOS.filter((d) => d.categoriaId === categoriaId)

/** Formatos, para el filtro. */
export const FORMATOS: Formato[] = [
  'Placa de desarrollo',
  'Kit de desarrollo',
  'Módulo SOM',
  'Mini PC',
  'Equipo industrial',
  'Tarjeta PCIe',
  'Accesorio',
]

export const EXPLICACION_FORMATO: Record<Formato, string> = {
  'Placa de desarrollo': 'Placa suelta, lista para conectar y programar. Para prototipo y series cortas.',
  'Kit de desarrollo': 'Placa con caja, fuente y accesorios. Para desarrollar, no para instalar en planta.',
  'Módulo SOM': 'Módulo que se enchufa sobre una placa base que diseñas o compras. Para producto propio.',
  'Mini PC':
    'Computador completo de sobremesa, con su sistema operativo y sus puertos. Se enchufa y funciona, pero no está pensado para un armario de planta: rango térmico de oficina y ventilador.',
  'Equipo industrial': 'Ya montado, con caja, montaje en riel y alimentación industrial. Se instala y funciona.',
  'Tarjeta PCIe': 'Se instala dentro de un PC industrial. Necesita ese PC.',
  Accesorio: 'No funciona solo: acelera o complementa a otro equipo de la lista.',
}
