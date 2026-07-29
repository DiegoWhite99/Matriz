/**
 * Lo que hay que saber antes de leer la matriz.
 *
 * Dos bloques, y el orden importa:
 *
 * 1. `CONCEPTOS_BASE` — para quien no ha visto un equipo de IA en su vida.
 *    Ocho preguntas en el orden en que se hacen de verdad: para qué sirve
 *    esto, qué es un modelo, en qué se diferencia entrenar de inferir, qué
 *    decide si algo cabe, qué va a costar de verdad. Sin siglas: cada una
 *    lleva una comparación con algo cotidiano, porque explicar TOPS a quien no
 *    sabe qué es inferir no explica nada.
 *
 * 2. `CONCEPTOS_COLUMNA` — las once cabeceras de la tabla. El glosario define
 *    las siglas; esto explica las columnas, que es otra pregunta. «TOPS» no
 *    dice que más TOPS sean más cadencia y no un modelo más listo; «Precio» no
 *    dice que casi ninguna fila sea un equipo completo; «Modelo máx.» no dice
 *    que sea un techo que no cuenta la caché KV.
 *
 * Los textos son cadenas y no JSX a propósito: se pintan con
 * `TextoConGlosario`, que marca los términos del glosario por sí solo. Así una
 * sigla nueva queda explicada sin volver a tocar este archivo, y el contenido
 * se puede comprobar en `conceptos.test.ts`.
 */

import { DISPOSITIVOS } from './dispositivos.ts'
import { MEMORIA } from './memoria.ts'
import { CASOS_USO } from './useCases.ts'
import { HARDWARE, abrev, topsPorWatt } from './hardware.ts'
import { formatearMemoria, formatearParametros, parametrosMaximos } from '../lib/modelos.ts'
import { metricasGlobales } from '../lib/scoring.ts'

/* ------------------------------------------------------------------ */
/* Bloque 1: la base, para quien no sabe nada                          */
/* ------------------------------------------------------------------ */

export interface ConceptoBase {
  id: string
  /** El título es la pregunta, tal como la haría alguien de fuera. */
  pregunta: string
  /** La respuesta en una frase. Si no cabe en una frase, está mal escrita. */
  enUnaFrase: string
  /** La comparación con algo cotidiano. Es la parte que se recuerda. */
  analogia: string
  /** El detalle, ya con las palabras del sector. */
  detalle: string
}

export const CONCEPTOS_BASE: ConceptoBase[] = [
  {
    id: 'para-que',
    pregunta: '¿Para qué sirve esta página?',
    enUnaFrase:
      'Para elegir qué computador comprar cuando quieres que una máquina vea, escuche o mida algo y decida sola.',
    analogia:
      'Es el comparador de un concesionario. La tabla de abajo tiene ocho tipos de vehículo, del ciclomotor al camión, y cada columna es una característica. Nadie compra «un vehículo»: compras el que hace tu recorrido.',
    detalle:
      'Cada fila es una clase de equipo con su precio, su consumo y lo que es capaz de hacer. Más abajo la página evalúa ocho situaciones reales de planta y dice qué fila queda primera en cada una, con los puntos que aporta cada criterio.',
  },
  {
    id: 'que-es-modelo',
    pregunta: '¿Qué es un modelo de IA?',
    enUnaFrase:
      'Un archivo lleno de números que aprendió a reconocer algo a base de ver miles de ejemplos.',
    analogia:
      'Es un inspector nuevo al que le enseñas diez mil piezas buenas y mil defectuosas hasta que acierta solo. Cuando ya sabe, lo que queda es un archivo: se copia a un equipo y responde en milisegundos, sin cansarse ni cambiar de criterio.',
    detalle:
      'Esos números son los parámetros, y cuántos hay es la medida de su tamaño: «8 B» son ocho mil millones. El tamaño decide cuánta memoria hace falta para ejecutarlo, y de ahí sale casi toda la decisión de compra.',
  },
  {
    id: 'entrenar-inferir',
    pregunta: 'Entrenar e inferir no es lo mismo',
    enUnaFrase: 'Entrenar es enseñarle; inferir es preguntarle. Y se hacen en equipos distintos.',
    analogia:
      'Entrenar es la carrera universitaria: cara, lenta y una sola vez. Inferir es el trabajo de cada día: rápido, barato y un millón de veces. Nadie monta una universidad en la nave para que alguien fiche a las siete.',
    detalle:
      'El entrenamiento pide una GPU de 450 W en una sala técnica con su instalación eléctrica. La inferencia, que es lo que pasa en planta, cabe en un equipo de 15 W dentro de la máquina. Pagar por entrenar cuando solo vas a inferir es el error más caro que permite esta matriz.',
  },
  {
    id: 'el-borde',
    pregunta: '¿Qué es «el borde»?',
    enUnaFrase:
      'Procesar los datos dentro de la propia máquina, en vez de mandarlos a un servidor o a la nube.',
    analogia:
      'Es la diferencia entre que el portero decida en la puerta o que llame por teléfono a la central para preguntar. Si la llamada tarda medio segundo, la pieza defectuosa ya pasó.',
    detalle:
      'Se elige por tres razones: la red no llega a tiempo para cerrar un lazo de control, el enlace se puede caer y la línea no puede parar, o los datos de proceso no deben salir de la planta. Casi toda la matriz es hardware de borde.',
  },
  {
    id: 'cabe-o-corre',
    pregunta: '¿Qué decide si un equipo puede con la tarea?',
    enUnaFrase:
      'Primero la memoria: si el modelo no cabe, no funciona. Después los TOPS: deciden a qué velocidad.',
    analogia:
      'La memoria es el tamaño de la mesa. Si el plano no se puede desplegar encima, no hay nada que discutir. Los TOPS son la rapidez de las manos que trabajan sobre esa mesa.',
    detalle:
      'Son dos preguntas distintas y se confunden constantemente. Un equipo con muchos TOPS y poca memoria no ejecuta un modelo grande por muchos TOPS que tenga: no hay dónde ponerlo. Y al revés, uno con mucha memoria y pocos TOPS lo carga y contesta a ritmo de tortuga.',
  },
  {
    id: 'lo-que-cuesta',
    pregunta: '¿Qué me va a costar de verdad?',
    enUnaFrase: 'El precio de la columna casi nunca es el precio del proyecto.',
    analogia:
      'Es el precio del motor, no el del coche terminado. Falta la carrocería, las ruedas y la matriculación.',
    detalle:
      'Según la fila, hay que sumar: la placa carrier del módulo, el PC industrial que hospeda la tarjeta, el disco —que casi nunca viene incluido—, el gabinete con su refrigeración y la obra eléctrica cuando el consumo pasa de unos cientos de watts. La columna «Equipos» da precios de producto terminado, que se parecen bastante más a la factura final.',
  },
  {
    id: 'leer-una-fila',
    pregunta: 'Cómo se lee una fila, paso a paso',
    enUnaFrase:
      'De izquierda a derecha: qué es, qué cuesta, qué consume, qué tan rápido decide, qué modelo le cabe y para qué se usa.',
    analogia:
      'Como la etiqueta de un electrodoméstico: nombre, precio, consumo y para qué sirve. Con la diferencia de que aquí una fila es una familia entera, no un producto.',
    detalle:
      'Pulsa el nombre de la categoría y se abren los equipos concretos que puedes comprar en esa fila. Marca la casilla de la izquierda en dos o tres filas y más abajo el radar las compara criterio por criterio. Pasa el cursor por cualquier cifra y sale su detalle.',
  },
  {
    id: 'y-ahora-que',
    pregunta: '¿Y ahora qué hago?',
    enUnaFrase: 'Empieza por tu caso, no por el equipo.',
    analogia: 'Elegir el equipo primero es comprar la escalera antes de medir la altura del techo.',
    detalle:
      'Baja al selector de «Caso de uso», elige el que más se parezca a tu problema y mira qué fila gana y con qué puntos. Después usa el catálogo para ver equipos con nombre y precio, y el panel del agente para sacar un informe con todo lo que salió.',
  },
]

/* ------------------------------------------------------------------ */
/* Bloque 2: las columnas de la tabla                                  */
/* ------------------------------------------------------------------ */

export interface ConceptoColumna {
  id: string
  /** Como aparece en la cabecera de la tabla. */
  titulo: string
  /** La unidad o el formato de la segunda línea de la cabecera. */
  unidad?: string
  /** Término del glosario que define la unidad, si lo hay. */
  terminoId?: string
  /** Si la columna está a la derecha de la línea: no sale de la hoja original. */
  añadida?: boolean
  /** La columna sin una sola sigla, para quien llega de fuera. */
  llano: string
  queMide: string
  comoSeLee: string
  /** La lectura equivocada que hay que desactivar. Es la parte útil. */
  ojo: string
  /** El rango real de la columna, leído de los datos. */
  enLaMatriz: string
}

/* ------------------------------------------------------------------ */
/* Cifras reales de cada columna                                       */
/* ------------------------------------------------------------------ */

/*
  No se escriben a mano. Una cifra copiada aquí quedaría desfasada en la
  primera fila que alguien añada a la matriz, y quedaría desfasada en silencio:
  nadie revisa un texto de ayuda al meter un equipo nuevo.
*/

const m = metricasGlobales()
const memorias = Object.values(MEMORIA)
const conIa = HARDWARE.filter((h) => h.topsMax > 0)

const num = (n: number, decimales = 0) =>
  n.toLocaleString('es', { maximumFractionDigits: decimales })

const tflopsMin = Math.min(...HARDWARE.map((h) => h.tflopsFp32))
const tflopsMax = Math.max(...HARDWARE.map((h) => h.tflopsFp32))
const topsMin = Math.min(...conIa.map((h) => h.topsMax))
const topsMax = Math.max(...conIa.map((h) => h.topsMax))
const memoriaMin = Math.min(...memorias.map((e) => e.totalGb))
const memoriaMax = Math.max(...memorias.map((e) => e.totalGb))
const modeloMax = Math.max(...memorias.map((e) => parametrosMaximos(e, 'int4')))
const conNvme = memorias.filter((e) => e.almacenamiento.includes('NVMe')).length
const fabricantes = new Set(DISPOSITIVOS.map((d) => d.fabricante)).size

export const CONCEPTOS_COLUMNA: ConceptoColumna[] = [
  {
    id: 'categoria',
    titulo: 'Categoría',
    llano:
      'La familia del equipo, como «furgoneta» o «camión». Dentro de cada familia hay muchos productos distintos.',
    queMide:
      'La clase de equipo, no un producto. Cada fila agrupa una familia entera —microcontroladores, SBC, módulos SOM, tarjetas gráficas— y debajo, en gris, va el equipo representativo con el que se tomaron las cifras.',
    comoSeLee:
      'De arriba abajo crece la potencia y se pierde algo en cada escalón: primero la latencia determinista, después la eficiencia, al final la compatibilidad x86. Pulsa el nombre y se despliegan dentro de la tabla los equipos concretos de esa fila.',
    ojo: 'No se compra una fila, se compra uno de sus equipos. Qué es cada clase, y qué gana y qué cede, está justo debajo de la tabla en «Qué es cada clase de equipo».',
    enLaMatriz: `${m.total} filas · ${DISPOSITIVOS.length} equipos concretos`,
  },
  {
    id: 'precio',
    titulo: 'Precio',
    unidad: 'USD',
    llano: 'Lo que cuesta la pieza suelta, en dólares, por unidad.',
    queMide:
      'El rango de precio por unidad del equipo representativo de la fila, tal como lo trae la hoja de cálculo.',
    comoSeLee:
      'Es el precio de la pieza sola. Pasa el cursor por la celda para ver los dos extremos del rango.',
    ojo: 'Casi ninguna fila es un equipo completo: un módulo SOM necesita placa carrier, una GPU de bajo perfil necesita el IPC que la hospede y casi ninguna trae disco. La columna «Equipos» sí da precios de producto terminado.',
    enLaMatriz: `de $${num(m.precioMin)} a $${num(m.precioMax)} por unidad`,
  },
  {
    id: 'tdp',
    titulo: 'TDP',
    unidad: 'W',
    terminoId: 'tdp',
    llano:
      'El calor y la luz que gasta, en watts. Como una bombilla: 0,5 W es una lucecita de aviso y 450 W es una plancha encendida.',
    queMide:
      'El calor que hay que sacar del equipo cuando trabaja de forma sostenida. Se usa como aproximación de su consumo eléctrico máximo.',
    comoSeLee:
      'Por debajo de 25 W hay refrigeración pasiva posible; a partir de 70 W hay que ventilar el gabinete; por encima de 300 W la instalación eléctrica entra en el presupuesto.',
    ojo: 'No es la factura de la luz, es si el equipo cabe en un armario cerrado de planta. Ese es el costo que aparece después de la compra.',
    enLaMatriz: `de ${num(m.tdpMin, 1)} a ${num(m.tdpMax)} W`,
  },
  {
    id: 'tflops',
    titulo: 'TFLOPS',
    unidad: 'FP32',
    terminoId: 'tflops',
    llano:
      'Lo bueno que es para cálculo corriente —simular, entrenar, dibujar en 3D—, que no es lo mismo que reconocer imágenes.',
    queMide:
      'Cómputo decimal de propósito general: simulación, física, entrenamiento de modelos.',
    comoSeLee:
      'Es la columna que separa inferir de entrenar. Los microcontroladores aparecen en notación exponencial porque su escala es un millón de veces menor: están en MFLOPS.',
    ojo: 'Para inspeccionar piezas en una línea esta columna casi no interviene. La que manda ahí es TOPS.',
    enLaMatriz: `de ${tflopsMin.toExponential(0)} a ${num(tflopsMax)} TFLOPS`,
  },
  {
    id: 'tops',
    titulo: 'TOPS',
    unidad: 'INT8',
    terminoId: 'tops',
    llano:
      'La velocidad para mirar y decidir. El doble de TOPS es mirar el doble de veces por segundo, no acertar más.',
    queMide:
      'Billones de operaciones con enteros por segundo: la capacidad de inferencia de IA del equipo. Es la cifra que se compara cuando el trabajo es visión artificial.',
    comoSeLee:
      'Un guion significa que la fila no tiene acelerador de IA. El resto multiplica cadencia: el doble de TOPS son el doble de inspecciones por segundo, o el doble de cámaras a la vez.',
    ojo: 'Más TOPS no es un modelo más inteligente, y tampoco dice si el modelo cabe. Si cabe o no lo decide la columna «Memoria»; los TOPS solo deciden a qué velocidad corre una vez dentro.',
    enLaMatriz: `de ${num(topsMin, 1)} a ${num(topsMax)} en las ${m.conIa} filas con acelerador`,
  },
  {
    id: 'tops-watt',
    titulo: 'TOPS/W',
    terminoId: 'tops-watt',
    llano:
      'Cuánto rinde por cada watt que gasta. Es lo que importa si el equipo va con batería o encerrado en un armario sin ventilador.',
    queMide: 'Cuánta inferencia entrega el equipo por cada watt que consume.',
    comoSeLee:
      'Es la columna de la batería y del gabinete sellado: un valor alto significa mucha IA sin obra eléctrica ni ventiladores.',
    ojo: 'Se calcula sobre el punto medio del consumo declarado, así que sirve para ordenar filas entre sí, no como dato de ficha técnica. Y un equipo eficiente pero pequeño sigue teniendo el techo de TOPS que tiene.',
    enLaMatriz: `hasta ${num(topsPorWatt(m.liderEficiencia), 1)} en ${abrev(m.liderEficiencia)}`,
  },
  {
    id: 'memoria',
    titulo: 'Memoria',
    añadida: true,
    llano:
      'El tamaño de la mesa de trabajo. Si el modelo no cabe encima, no se puede usar en ese equipo.',
    queMide:
      'La memoria del equipo representativo de la fila. Es lo que decide qué modelo cabe, y no sale de la hoja de cálculo: viene de la ficha del fabricante.',
    comoSeLee:
      'Pasa el cursor para ver el tipo. En memoria unificada el sistema operativo come del mismo banco que el modelo; en una GPU con memoria dedicada, casi toda es para el modelo, y encima con ECC.',
    ojo: 'Es un techo duro: si el modelo no cabe, no corre. No corre más lento, no corre. Por eso esta columna se lee antes que la de TOPS.',
    enLaMatriz: `de ${formatearMemoria(memoriaMin)} a ${formatearMemoria(memoriaMax)}`,
  },
  {
    id: 'almacenamiento',
    titulo: 'Almacenamiento',
    unidad: 'compatible',
    añadida: true,
    llano:
      'El disco: donde se guardan los modelos, los vídeos de las cámaras y el histórico. Aquí dice el que admite, no el que trae.',
    queMide:
      'El disco que la categoría admite, no el que trae puesto. En este bloque de la matriz el almacenamiento casi nunca viene incluido.',
    comoSeLee:
      'Un modelo de 8 000 millones de parámetros en INT4 son unos 4,5 GB en disco antes de cargarse en memoria. Aquí se decide si caben varios modelos instalados, si se guarda vídeo para revisar un falso rechazo y si el histórico cabe sin salir a la red.',
    ojo: 'Arrancar de microSD es la causa más frecuente de fallo en planta: se corrompe con los cortes de luz. Pasar a eMMC o NVMe es una partida aparte del presupuesto, y hay que preverla.',
    enLaMatriz: `${conNvme} de las ${memorias.length} filas admiten NVMe M.2`,
  },
  {
    id: 'modelo-max',
    titulo: 'Modelo',
    unidad: 'máx. INT4',
    añadida: true,
    llano:
      'El modelo más grande que le cabe. «8 B» son ocho mil millones de números aprendidos; cuanto más grande, más sabe y más memoria pide.',
    queMide:
      'El modelo de lenguaje más grande que cabe en esa memoria si se cuantiza a INT4, medio byte por parámetro.',
    comoSeLee:
      '«8 B» son ocho mil millones de parámetros. Sale de dividir la memoria útil entre medio byte, con la fracción que se lleva el sistema operativo ya descontada.',
    ojo: 'Es un techo, no una recomendación. No cuenta la caché KV, que crece con la longitud de la conversación, y un modelo que ocupa el 95 % de la memoria cabe y funciona mal. Caber no es ir rápido.',
    enLaMatriz: `hasta ${formatearParametros(modeloMax)} de parámetros`,
  },
  {
    id: 'equipos',
    titulo: 'Equipos',
    unidad: 'desde',
    añadida: true,
    llano:
      'Cuántos productos reales existen en esa familia y desde qué precio empiezan. Esto sí se puede pedir a un proveedor.',
    queMide:
      'Cuántos dispositivos concretos hay en el catálogo para esa fila, y el precio del más barato que existe de verdad.',
    comoSeLee:
      'Pulsa el número y el catálogo de más abajo se filtra por esa fila. Pulsa el nombre de la categoría y los equipos se despliegan aquí mismo, sin perder de vista los números que los justifican.',
    ojo: 'No coincide con la columna «Precio», y eso es información, no un error: «Precio» es el equipo representativo de la hoja y este es el suelo real del mercado. Algunos equipos van por cotización y no cuentan para el «desde».',
    enLaMatriz: `${DISPOSITIVOS.length} equipos de ${fabricantes} fabricantes`,
  },
  {
    id: 'uso',
    titulo: 'Uso recomendado',
    añadida: true,
    llano:
      'Para qué sirve mejor esa fila, según la evaluación de más abajo. Pulsa una etiqueta y la página recalcula todo con ese caso.',
    queMide:
      'Los casos de uso en los que esa fila queda primera al evaluarla, no todos los que aguanta.',
    comoSeLee:
      'Pulsa una etiqueta y el análisis de abajo se recalcula con ese caso. «Alternativa en N casos» significa que cumple las restricciones pero otra fila puntúa más alto; «Fuera de restricciones», que no pasa algún límite duro de precio, consumo o TOPS.',
    ojo: 'El ganador depende de los pesos del caso, que están escritos y son discutibles. Es una recomendación auditable, no un veredicto: abre el análisis y mira qué criterio aporta cada punto.',
    enLaMatriz: `${CASOS_USO.length} casos de uso evaluados`,
  },
]

export const conceptoBasePorId = new Map(CONCEPTOS_BASE.map((c) => [c.id, c]))
export const conceptoColumnaPorId = new Map(CONCEPTOS_COLUMNA.map((c) => [c.id, c]))
