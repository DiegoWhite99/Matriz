/**
 * Glosario de términos técnicos de la matriz.
 *
 * Cada entrada explica el término y, cuando importa, su consecuencia práctica
 * al elegir hardware. Una definición que solo expande la sigla ("TOPS = Tera
 * Operaciones Por Segundo") no ayuda a decidir; hace falta decir qué implica.
 *
 * `sigla` es lo que se muestra como título; `expansion` es de dónde sale la
 * abreviatura, si la hay.
 */

export type CategoriaGlosario = 'unidades' | 'arquitectura' | 'industrial'

export interface EntradaGlosario {
  id: string
  /** Formas que se buscan en el texto. La primera es el título. */
  formas: string[]
  expansion?: string
  definicion: string
  /** Qué implica al comparar equipos. Se omite cuando el término es neutro. */
  implicacion?: string
  categoria: CategoriaGlosario
}

export const GLOSARIO: EntradaGlosario[] = [
  /* ---------------------------- Unidades ---------------------------- */
  {
    id: 'tops',
    formas: ['TOPS'],
    expansion: 'Tera Operaciones Por Segundo',
    definicion:
      'Billones de operaciones con números enteros por segundo. Es la unidad con la que se mide la capacidad de inferencia de IA: cuántas veces por segundo el equipo puede pasar una imagen o una señal por un modelo ya entrenado.',
    implicacion:
      'Más TOPS es más cadencia o más cámaras a la vez, no un modelo "más inteligente". Un equipo de 40 TOPS no da mejores resultados que uno de 20: da el doble de inspecciones por segundo.',
    categoria: 'unidades',
  },
  {
    id: 'tflops',
    formas: ['TFLOPS'],
    expansion: 'Tera FLoating-point Operations Per Second',
    definicion:
      'Billones de operaciones con números decimales por segundo. Mide cómputo de propósito general: simulación, física, entrenamiento de modelos.',
    implicacion:
      'Los TFLOPS pesan cuando hay que entrenar o simular. Para inferencia en planta, la cifra que manda son los TOPS.',
    categoria: 'unidades',
  },
  {
    id: 'mflops',
    formas: ['MFLOPS'],
    expansion: 'Mega FLOPS',
    definicion:
      'Millones de operaciones decimales por segundo, un millón de veces menos que un TFLOPS. Es la escala en la que trabajan los microcontroladores.',
    categoria: 'unidades',
  },
  {
    id: 'int8',
    formas: ['INT8'],
    expansion: 'Entero de 8 bits',
    definicion:
      'Formato numérico de 8 bits usado para ejecutar modelos ya entrenados. Al reducir la precisión, el mismo chip hace muchas más operaciones por watt.',
    implicacion:
      'Casi toda la inferencia industrial corre en INT8. Por eso los TOPS se declaran en este formato: es el número que verás en producción.',
    categoria: 'unidades',
  },
  {
    id: 'fp32',
    formas: ['FP32'],
    expansion: 'Coma flotante de 32 bits',
    definicion:
      'Formato decimal de precisión completa. Es el que se usa para entrenar modelos y para cálculo científico, donde redondear cambia el resultado.',
    categoria: 'unidades',
  },
  {
    id: 'tdp',
    formas: ['TDP'],
    expansion: 'Thermal Design Power',
    definicion:
      'Potencia térmica de diseño: el calor que el sistema de refrigeración tiene que sacar cuando el equipo trabaja de forma sostenida. Se usa como aproximación del consumo eléctrico máximo.',
    implicacion:
      'El TDP no es solo la factura de luz: define si el equipo cabe en un gabinete cerrado o si hay que añadir ventilación forzada, y eso es una partida de obra.',
    categoria: 'unidades',
  },
  {
    id: 'tops-watt',
    formas: ['TOPS/W', 'TOPS por watt'],
    definicion:
      'Cuánta inferencia entrega el equipo por cada watt que consume. Es la métrica de eficiencia del cómputo en el borde.',
    implicacion:
      'Decide dos cosas que no se pueden negociar después: si el equipo puede ir con refrigeración pasiva y, en un vehículo, cuánto turno aguanta la batería.',
    categoria: 'unidades',
  },
  {
    id: 'vram',
    formas: ['VRAM'],
    expansion: 'Video RAM',
    definicion:
      'Memoria propia de la tarjeta gráfica. Determina el tamaño máximo del modelo o de la escena que puede cargarse de una vez.',
    implicacion:
      'Es un techo duro: si el modelo no cabe en la VRAM, no corre. Ni más rápido ni más lento: no corre.',
    categoria: 'unidades',
  },
  {
    id: 'ecc',
    formas: ['ECC'],
    expansion: 'Error-Correcting Code',
    definicion:
      'Memoria capaz de detectar y corregir errores de bit por sí sola, en vez de propagarlos al cálculo.',
    implicacion:
      'Es lo que distingue una tarjeta pensada para funcionar 24/7 de una de escritorio. Sin ECC, un bit alterado sale como una inspección aprobada que no debía aprobarse.',
    categoria: 'unidades',
  },

  {
    id: 'parametros',
    formas: ['parámetros', 'parámetro'],
    definicion:
      'Los números que un modelo aprendió durante el entrenamiento. Es la medida estándar de su tamaño: "un modelo de 8 B" son ocho mil millones de parámetros.',
    implicacion:
      'Multiplicados por los bytes de la cuantización dan lo que ocupa en memoria. Ese producto, no los TOPS, es lo que decide si el modelo cabe en el equipo.',
    categoria: 'unidades',
  },
  {
    id: 'cuantizacion',
    formas: ['cuantización', 'cuantizado'],
    definicion:
      'Guardar cada parámetro con menos bits de los que tenía al entrenarse: de 16 a 8, o a 4. El modelo pesa la mitad o la cuarta parte y pierde algo de precisión.',
    implicacion:
      'Es la palanca que mete un modelo de 8 000 millones en un equipo de borde. La pérdida es pequeña en visión y notable en tareas de razonamiento.',
    categoria: 'unidades',
  },
  {
    id: 'cache-kv',
    formas: ['caché KV', 'cache KV'],
    definicion:
      'Memoria que un modelo de lenguaje usa para recordar lo que ya procesó de la conversación. Es aparte de los pesos y crece con la longitud del contexto.',
    implicacion:
      'Es lo que hace que un modelo que "cabía justo" se quede sin memoria a mitad de una conversación larga. Al dimensionar, deja margen por encima del tamaño de los pesos.',
    categoria: 'unidades',
  },

  /* --------------------------- Arquitectura -------------------------- */
  {
    id: 'edge',
    formas: ['Edge AI', 'Edge', 'computación en el borde', 'en el borde'],
    definicion:
      'Procesar los datos donde se generan —en la máquina, en la celda, en el vehículo— en vez de mandarlos a un servidor o a la nube. Edge AI es ejecutar la inferencia en ese mismo sitio.',
    implicacion:
      'Se elige por tres razones: la latencia de red no permite cerrar un lazo de control, el enlace se puede caer y la línea no puede parar, o los datos no deben salir de la planta.',
    categoria: 'arquitectura',
  },
  {
    id: 'edge-server',
    formas: ['Edge Server', 'servidor de borde', 'servidor en planta'],
    definicion:
      'Servidor instalado en la propia planta —en el cuarto de control, no en la nube— que concentra el trabajo de IA de varias máquinas o cámaras a la vez. Es el escalón intermedio: ni un equipo por máquina, ni un centro de datos remoto.',
    implicacion:
      'Se elige cuando hay muchas fuentes de datos y poner un equipo en cada una sale más caro que centralizar. En la matriz es la fila de GPU para IPC: una tarjeta dentro de un PC industrial que atiende de 10 a 30 cámaras.',
    categoria: 'arquitectura',
  },
  {
    id: 'ai-pc',
    formas: ['AI PC', 'PC con NPU'],
    definicion:
      'Computador de propósito general cuyo procesador ya trae una NPU integrada, además de la CPU y la GPU. Es lo que venden hoy Intel (Core Ultra), AMD (Ryzen AI) y Apple (familia M) en un solo chip.',
    implicacion:
      'Su ventaja no son los TOPS, es que corre sin recompilar el software x86 que la planta ya tiene. Su límite es que no hay CUDA: la pila de NVIDIA se cambia por OpenVINO, ROCm o Core ML, y media documentación de IA deja de aplicarse tal cual.',
    categoria: 'arquitectura',
  },
  {
    id: 'inferencia',
    formas: ['inferencia'],
    definicion:
      'Ejecutar un modelo ya entrenado para obtener un resultado: clasificar una pieza, detectar un defecto, estimar una posición.',
    implicacion:
      'Es lo que ocurre en planta millones de veces al día. El entrenamiento se hace una vez, en otra máquina.',
    categoria: 'arquitectura',
  },
  {
    id: 'entrenamiento',
    formas: ['entrenamiento', 'entrenar'],
    definicion:
      'Proceso de ajustar un modelo con datos de ejemplo hasta que aprende la tarea. Consume mucho más cómputo y memoria que ejecutarlo después.',
    implicacion:
      'Es la única carga de la matriz que justifica una GPU de 450 W. Si solo vas a inferir, estás pagando por potencia que no usarás.',
    categoria: 'arquitectura',
  },
  {
    id: 'mcu',
    formas: ['microcontrolador', 'microcontroladores', 'MCU'],
    definicion:
      'Chip que integra procesador, memoria y entradas/salidas en una sola pieza, y ejecuta un único programa sin sistema operativo.',
    implicacion:
      'Al no haber sistema operativo no hay nada que decida ejecutar otra cosa: el tiempo de respuesta es predecible. Ese es su valor, y también su límite.',
    categoria: 'arquitectura',
  },
  {
    id: 'sbc',
    formas: ['SBC', 'Single Board Computer'],
    expansion: 'Single Board Computer',
    definicion:
      'Computador completo en una sola placa del tamaño de una tarjeta de crédito: procesador, memoria, red, USB y salida de vídeo van soldados juntos. Se le pone una microSD con Linux y arranca como cualquier PC. Una Raspberry Pi es el ejemplo típico.',
    implicacion:
      'Da todo el ecosistema de software de un PC a precio de placa, a cambio de dos cosas: pierde el determinismo del microcontrolador y no tiene grado industrial, así que el chasis y la disipación corren por tu cuenta.',
    categoria: 'arquitectura',
  },
  {
    id: 'som',
    formas: ['SOM', 'System On Module'],
    expansion: 'System On Module',
    definicion:
      'Módulo que trae el procesador, la memoria y la alimentación resueltos, y se enchufa sobre una placa base que diseña el integrador.',
    implicacion:
      'Permite el rango térmico industrial y un formato compacto, pero la placa base es trabajo de ingeniería propio: súmalo al costo del proyecto.',
    categoria: 'arquitectura',
  },
  {
    id: 'carrier',
    formas: ['placa carrier', 'placa base/carrier', 'carrier'],
    definicion:
      'Placa que recibe un módulo SOM y le da los conectores, la alimentación y la refrigeración que el proyecto necesita.',
    implicacion:
      'Un módulo de $250 sin placa carrier no se instala en nada. Diseñarla o comprarla es una partida aparte del presupuesto.',
    categoria: 'arquitectura',
  },
  {
    id: 'ipc',
    formas: ['IPC', 'PC hospedadora'],
    expansion: 'Industrial PC',
    definicion:
      'Computador de arquitectura x86 construido para planta y no para una oficina: sin ventiladores frágiles, con montaje en riel DIN o en rack, alimentación de 24 V, rango térmico ampliado y años de suministro garantizado. Por dentro es un PC normal y corre el mismo software.',
    implicacion:
      'Es lo que hospeda una GPU de bajo perfil, y por eso la fila de GPU para IPC no es un equipo completo: sin el IPC, la tarjeta no tiene dónde ir. Al presupuestar, son dos compras.',
    categoria: 'arquitectura',
  },
  {
    id: 'npu',
    formas: ['NPU'],
    expansion: 'Neural Processing Unit',
    definicion:
      'Circuito dedicado exclusivamente a ejecutar redes neuronales, mucho más eficiente en esa tarea que un procesador de propósito general.',
    implicacion:
      'Es lo que convierte una placa de 0,1 TFLOPS en algo capaz de 26 TOPS. La potencia de IA no viene del procesador principal.',
    categoria: 'arquitectura',
  },
  {
    id: 'gpu',
    formas: ['GPU'],
    expansion: 'Graphics Processing Unit',
    definicion:
      'Procesador con miles de núcleos que ejecutan la misma operación sobre muchos datos a la vez. Nació para gráficos y hoy es la base del cómputo de IA.',
    categoria: 'arquitectura',
  },
  {
    id: 'hat',
    formas: ['HAT AI', 'HAT'],
    expansion: 'Hardware Attached on Top',
    definicion:
      'Placa de expansión que se monta encima de una Raspberry Pi. Un HAT de IA le añade una NPU.',
    implicacion:
      'Los TOPS de la Raspberry Pi 5 son del HAT, no de la placa. Sin él, la cifra de IA es cero.',
    categoria: 'arquitectura',
  },
  {
    id: 'arm',
    formas: ['ARM'],
    definicion:
      'Arquitectura de procesador dominante en móviles y sistemas embebidos, elegida por su consumo. Es la de los módulos Jetson.',
    implicacion:
      'El software x86 no corre en ARM sin recompilar. Si el proyecto arrastra un ejecutable antiguo del que no hay fuentes, esto lo bloquea.',
    categoria: 'arquitectura',
  },
  {
    id: 'x86',
    formas: ['x86'],
    definicion:
      'Arquitectura de los procesadores Intel y AMD. Es la de los PC industriales y la de casi todo el software de automatización existente.',
    implicacion:
      'Su ventaja no es la velocidad: es que el software que ya tienes funciona sin tocarlo.',
    categoria: 'arquitectura',
  },
  {
    id: 'tinyml',
    formas: ['TinyML'],
    definicion:
      'Modelos de aprendizaje automático reducidos hasta caber en un microcontrolador, con kilobytes de memoria y menos de un watt.',
    implicacion:
      'Sirve para clasificar una señal de vibración o un sonido. No sirve para video: la resolución que cabe es mínima.',
    categoria: 'arquitectura',
  },
  {
    id: 'refrigeracion-pasiva',
    formas: ['refrigeración pasiva', 'refrigeración activa'],
    definicion:
      'Pasiva es disipar calor solo con metal, sin ventiladores. Activa necesita ventiladores o líquido.',
    implicacion:
      'La pasiva no tiene piezas móviles: no falla, no aspira polvo y no hace ruido. En un gabinete sellado de planta suele ser la única opción viable.',
    categoria: 'arquitectura',
  },
  {
    id: 'criptoprocesador',
    formas: ['criptoprocesador', 'seguridad de hardware'],
    definicion:
      'Chip dedicado que guarda claves y verifica firmas sin que salgan de él, para que el equipo solo arranque software autorizado.',
    implicacion:
      'Es el requisito habitual cuando el nodo manda datos a la nube y hay que garantizar que nadie lo reemplazó ni le cambió el firmware.',
    categoria: 'arquitectura',
  },
  {
    id: 'on-premises',
    formas: ['on-premises', 'on-site'],
    definicion:
      'Ejecutado en servidores propios, dentro de las instalaciones, en vez de en la nube de un proveedor.',
    implicacion:
      'Se elige por confidencialidad de los datos de proceso o por costo, cuando la carga es constante y alquilarla sale más caro que comprarla.',
    categoria: 'arquitectura',
  },

  /* ---------------------------- Industrial --------------------------- */
  {
    id: 'latencia-determinista',
    formas: ['latencia determinista', 'determinista'],
    definicion:
      'Garantía de que la respuesta llega siempre dentro de un tiempo máximo conocido, no solo "casi siempre rápido".',
    implicacion:
      'En un lazo de control lo que importa es el peor caso, no el promedio. Un sistema operativo de propósito general no lo garantiza; un microcontrolador sí.',
    categoria: 'industrial',
  },
  {
    id: 'grado-industrial',
    formas: ['grado industrial'],
    definicion:
      'Equipo especificado para trabajar de -40 °C a 85 °C, con tolerancia a vibración, polvo y humedad, y con años de suministro garantizado.',
    implicacion:
      'Una placa de consumo puede funcionar en el banco de pruebas y fallar en el primer verano dentro de un gabinete a 60 °C.',
    categoria: 'industrial',
  },
  {
    id: 'vision-artificial',
    formas: ['visión artificial', 'control de calidad local'],
    definicion:
      'Uso de cámaras y procesamiento de imagen para inspeccionar, medir o identificar piezas de forma automática.',
    implicacion:
      'La cadencia de la línea fija los TOPS que necesitas: cuántas piezas por minuto pasan multiplicado por el costo de cada modelo.',
    categoria: 'industrial',
  },
  {
    id: 'mantenimiento-predictivo',
    formas: ['mantenimiento predictivo'],
    definicion:
      'Detectar el deterioro de una máquina por su vibración, sonido o temperatura, para intervenir antes de que falle en vez de por calendario.',
    implicacion:
      'El nodo debe vivir años sin que nadie lo toque. Por eso pesa más la eficiencia energética que la potencia de cálculo.',
    categoria: 'industrial',
  },
  {
    id: 'amr',
    formas: ['AMR', 'AMRs'],
    expansion: 'Autonomous Mobile Robot',
    definicion:
      'Robot móvil que navega decidiendo su propia ruta con sus sensores, sin guías físicas en el suelo.',
    implicacion:
      'Toda la percepción va a bordo y con batería: es el caso donde los TOPS por watt mandan sobre los TOPS totales.',
    categoria: 'industrial',
  },
  {
    id: 'agv',
    formas: ['AGV', 'AGVs'],
    expansion: 'Automated Guided Vehicle',
    definicion:
      'Vehículo automatizado que sigue una ruta fija marcada con cinta magnética, láser o líneas en el suelo.',
    implicacion:
      'Necesita menos cómputo que un AMR, pero cambiar su recorrido significa cambiar la instalación física.',
    categoria: 'industrial',
  },
  {
    id: 'hmi',
    formas: ['HMI', 'HMIs'],
    expansion: 'Human-Machine Interface',
    definicion:
      'La pantalla desde la que el operario ve el estado del proceso y actúa sobre él.',
    implicacion:
      'Es carga de interfaz gráfica, no de IA. Se resuelve con Linux y una pantalla, no con TOPS.',
    categoria: 'industrial',
  },
  {
    id: 'opc-ua',
    formas: ['OPC-UA', 'OPC UA'],
    expansion: 'Open Platform Communications Unified Architecture',
    definicion:
      'Protocolo industrial estándar, cifrado y con modelo de datos propio, para que máquinas de distintos fabricantes se entiendan.',
    implicacion:
      'Es el idioma habitual entre planta y sistemas de gestión. La librería está madura en Linux, y ahí gana el SBC.',
    categoria: 'industrial',
  },
  {
    id: 'modbus',
    formas: ['Modbus'],
    definicion:
      'Protocolo industrial de los años 70, simple y presente en casi cualquier equipo de planta. Sin cifrado ni modelo de datos.',
    implicacion:
      'Sigue siendo el mínimo común denominador: si algo habla un protocolo, habla Modbus. Casi siempre hay que soportarlo.',
    categoria: 'industrial',
  },
  {
    id: 'plc',
    formas: ['PLC'],
    expansion: 'Programmable Logic Controller',
    definicion:
      'Controlador industrial que ejecuta la lógica de la máquina en ciclos de tiempo garantizado. Es la pieza que de verdad manda en la planta.',
    implicacion:
      'El hardware de IA casi nunca reemplaza al PLC: le aporta una decisión (pieza buena o mala) y el PLC actúa.',
    categoria: 'industrial',
  },
  {
    id: 'scada',
    formas: ['SCADA'],
    expansion: 'Supervisory Control And Data Acquisition',
    definicion:
      'Sistema que supervisa y registra el proceso completo de la planta, agregando los datos de los PLC.',
    implicacion:
      'Suele ser software x86 y ya está instalado. Integrarse con él, y no reemplazarlo, es lo que hace pesar la compatibilidad x86.',
    categoria: 'industrial',
  },
  {
    id: 'gemelo-digital',
    formas: ['gemelos digitales', 'gemelo digital'],
    definicion:
      'Réplica virtual de una máquina o una planta, alimentada con datos reales, sobre la que se simula un cambio antes de aplicarlo.',
    implicacion:
      'Es la carga más exigente de la matriz: simular física en tiempo real necesita TFLOPS y VRAM, no TOPS.',
    categoria: 'industrial',
  },
  {
    id: 'omniverse',
    formas: ['NVIDIA Omniverse', 'Omniverse'],
    definicion:
      'Plataforma de NVIDIA para construir y simular gemelos digitales con física y renderizado realista.',
    categoria: 'industrial',
  },
  {
    id: 'iot',
    formas: ['IoT industrial', 'IoT'],
    expansion: 'Internet of Things',
    definicion:
      'Sensores y dispositivos conectados que envían medidas a un sistema central. En su versión industrial, con grado de planta y protocolos de automatización.',
    categoria: 'industrial',
  },
  {
    id: 'gateway',
    formas: ['gateways', 'gateway'],
    definicion:
      'Equipo que traduce entre dos mundos: toma los protocolos de planta (Modbus, OPC-UA) y los publica hacia la nube.',
    implicacion:
      'Su trabajo es de protocolos y drivers, no de cálculo. Gana el que tenga el mejor ecosistema de software.',
    categoria: 'industrial',
  },
  {
    id: '4k',
    formas: ['4K'],
    definicion:
      'Resolución de vídeo de unos 3.840 × 2.160 píxeles, cuatro veces la de 1080p.',
    implicacion:
      'Cuadruplica los píxeles a decodificar y a inferir. Varios flujos 4K simultáneos suelen topar antes en el decodificador de vídeo que en los TOPS.',
    categoria: 'industrial',
  },
  {
    id: 'camara-ip',
    formas: ['cámaras IP', 'cámara IP'],
    definicion:
      'Cámara que entrega vídeo comprimido por red Ethernet, en vez de una señal analógica.',
    implicacion:
      'El servidor tiene que descomprimir cada flujo antes de inferir. Ese trabajo, no el modelo, es lo que limita cuántas cámaras caben.',
    categoria: 'industrial',
  },
]

const PRIORIDAD_CATEGORIA: Record<CategoriaGlosario, number> = {
  unidades: 0,
  arquitectura: 1,
  industrial: 2,
}

export const NOMBRE_CATEGORIA: Record<CategoriaGlosario, string> = {
  unidades: 'Unidades y rendimiento',
  arquitectura: 'Arquitectura y formatos',
  industrial: 'Automatización industrial',
}

export const glosarioPorId = new Map(GLOSARIO.map((e) => [e.id, e]))

export const tituloDe = (e: EntradaGlosario) => e.formas[0]

/**
 * Índice de búsqueda: cada forma con su entrada, ordenado de la forma más
 * larga a la más corta para que "Edge AI" gane sobre "Edge" y "TOPS/W" sobre
 * "TOPS".
 */
export const FORMAS_ORDENADAS: { forma: string; id: string; sensible: boolean }[] = GLOSARIO.flatMap(
  (e) =>
    e.formas.map((forma) => ({
      forma,
      id: e.id,
      // Las siglas se buscan respetando mayúsculas: sin eso, "SOM" cazaría
      // "somos" y "AMR" cualquier cosa.
      sensible: forma === forma.toUpperCase() && /^[A-Z0-9/\-.]+$/.test(forma),
    })),
).sort((a, b) => b.forma.length - a.forma.length)

export const GLOSARIO_AGRUPADO = (['unidades', 'arquitectura', 'industrial'] as const).map(
  (categoria) => ({
    categoria,
    nombre: NOMBRE_CATEGORIA[categoria],
    entradas: GLOSARIO.filter((e) => e.categoria === categoria).sort((a, b) =>
      tituloDe(a).localeCompare(tituloDe(b), 'es'),
    ),
  }),
)

export const ordenCategoria = (c: CategoriaGlosario) => PRIORIDAD_CATEGORIA[c]
