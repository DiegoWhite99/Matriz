# Matriz de Hardware IA

Sistema web de comparación de hardware para inteligencia artificial industrial, con un
agente que redacta informes de selección según el caso de uso. Construido sobre la
matriz de siete categorías de `Matriz de hardware IA.xlsx`.

---

## Qué tecnologías se usan y por qué

Estas son las decisiones que ya están tomadas en el repositorio. Cada una responde a
una restricción concreta del proyecto, no a una preferencia.

| Capa | Tecnología | Por qué esta y no otra |
|---|---|---|
| Build | **Vite 6** | Arranque instantáneo en desarrollo y salida estática, que es exactamente lo que Firebase Hosting sirve. |
| UI | **React 19 + TypeScript** | La matriz tiene ocho criterios por siete equipos por ocho casos de uso: los tipos evitan que un `criterioId` mal escrito pase silencioso. |
| Estilos | **Tailwind CSS 4** | La paleta de visualización vive en variables CSS y Tailwind las consume con `@theme inline`, así que gráficos e interfaz comparten un único origen de color. |
| Gráficos | **Recharts 3** | Declarativa sobre SVG y basada en React. Nada de canvas: los ejes y etiquetas quedan en el DOM, accesibles y buscables. |
| Hosting | **Firebase Hosting** | CDN, HTTPS y despliegue en un comando. La app es estática. |
| Base de datos | **Cloud Firestore** | Guarda el historial de informes por usuario. El modelo de documentos encaja: un informe es un documento. |
| Sesión | **Firebase Auth (anónima)** | Separa el historial por usuario sin pedir registro. Suficiente para que las reglas aten cada informe a su `uid`. |
| Agente | **Cloud Functions v2 + Claude Opus 5** | La clave de la API no puede estar en el navegador. La función es el único lugar que la ve. |

### Lo que se decidió *no* usar

- **Ningún estado global (Redux, Zustand).** Toda la aplicación se deriva de dos
  valores: el caso de uso activo y la selección de equipos. `useState` basta.
- **Ninguna librería de Markdown.** `src/components/Markdown.tsx` construye nodos de
  React en vez de inyectar HTML, así que el texto del modelo nunca se interpreta como
  marcado.
- **El modelo no calcula.** Ver la sección siguiente.

### La decisión de arquitectura que importa

El agente **no hace aritmética**. El motor de puntuación (`src/lib/scoring.ts`)
calcula el ranking en el navegador y le pasa a Claude los hechos ya resueltos; el
modelo solo interpreta y redacta.

Esto tiene dos consecuencias prácticas: el informe y los gráficos no pueden
contradecirse, porque salen del mismo cálculo; y ese cálculo es reproducible y
auditable línea por línea, algo que la salida de un modelo no es.

---

## Métricas y gráficos

**Cifras de encabezado** (`StatTiles`) — rango de inversión, salto de capacidad de IA
entre el techo más bajo y el más alto, líder en TOPS/W y líder en TOPS por 100 USD.
Cada una es un solo número, así que no lleva gráfico.

**Métricas derivadas** (`src/data/hardware.ts`)

- `topsPorWatt` — TOPS INT8 por watt. Decide si el equipo funciona con batería o
  refrigeración pasiva.
- `topsPorCien` — TOPS por 100 USD. Rendimiento de inferencia por dólar.
- `precioMedio` / `tdpMedio` — punto medio de los rangos que la hoja expresa en prosa.

**Gráficos**

| Gráfico | Forma | Qué responde |
|---|---|---|
| Ranking por caso de uso | Barras horizontales | Cuál gana y por cuánto. Los descartados por restricción aparecen apagados y etiquetados. |
| De dónde salen los puntos | Barras horizontales | Por qué ganó: peso del criterio × calificación del equipo. |
| Perfil de capacidades | Radar, máximo 3 series | En qué es fuerte cada equipo en los ocho criterios. |
| Eficiencia frente a precio | Dispersión, eje X logarítmico | Qué equipo da más TOPS/W sin pagar de más. |

### Cómo se eligieron los colores

La paleta de `src/index.css` está **validada como conjunto**, no elegida a ojo. Pasa
los cinco checks en ambos modos: banda de luminosidad, piso de croma, separación para
daltonismo, piso de visión normal y contraste contra la superficie.

- Modo claro: peor par adyacente ΔE 9.1 para daltonismo, 19.6 en visión normal.
- Modo oscuro: 8.4 y 19.3.

Tres reglas que se siguen en todo el código y que conviene no romper al modificarlo:

1. **El orden de los slots categóricos es parte de la validación**, no cosmética.
   Reordenarlos invalida los resultados de separación.
2. **El color sigue a la entidad, nunca a su puesto en el ranking.** Cambiar de caso de
   uso reordena las barras pero no repinta a nadie.
3. **Toda vista de gráfico tiene su tabla.** Tres slots del modo claro quedan bajo 3:1
   de contraste, y la regla de alivio exige etiquetas visibles o tabla. Además, ningún
   valor debe ser accesible solo por tooltip.

Los gráficos de una sola medida usan **un solo color**: colorear cada barra distinto
duplicaría la longitud en el canal de color sin añadir información.

---

## Dispositivos concretos

`src/data/dispositivos.ts` es el catálogo: **46 equipos con nombre de producto**,
precio orientativo, consumo, memoria, procesador y rango térmico.

Existe porque la matriz sola no bastaba: te decía «necesitas un Edge AI Integrado» y
te dejaba ahí, que es justo donde no se puede comprar nada.

Cada dispositivo se ancla a una fila con `categoriaId`, así que **hereda su
análisis**: si la matriz dice que esa fila gana en visión de envasado, vale para
todos sus dispositivos. El punto de color es el mismo en las dos vistas, así que el
puente es visual y no hay que explicarlo.

| Categoría | Equipos | Rango de precio |
|---|---|---|
| Microcontroladores Básicos | 6 | $7 – $45 |
| Microcontroladores Edge AI | 6 | $25 – $180 |
| SBCs Económicos | 7 | $60 – $190 |
| Procesadores con NPU (AI PC) | 6 | $599 – $1.999 |
| Edge AI Integrado | 5 | $249 – $1.400 |
| Edge AI de Alta Potencia | 4 | $1.199 – $2.400 |
| GPUs para IPC / Edge Server | 6 | $250 – $2.500 |
| GPUs Enterprise / High-End | 6 | $1.299 – $8.500 |

Filtros en una sola fila: categoría, formato, presupuesto por unidad, y solo con
acelerador de IA. Ordenable por precio, capacidad de IA, memoria o consumo.

### Una lista, y la ficha al pulsar

Antes eran 46 tarjetas con la ficha completa desplegada, tres por fila. Cada tarjeta
estaba bien y **el conjunto no servía**: ocupaba nueve pantallas, así que comparar el
precio del séptimo equipo con el del trigésimo era imposible, y encontrar uno
concreto, un ejercicio de desplazamiento.

Ahora la unidad es la línea —nombre, fabricante, precio, consumo, memoria y TOPS— con
las cifras alineadas en columna, que es la única forma de que un número se pueda
comparar con el de arriba. La ficha técnica sigue completa, pero se abre al pulsar y
solo la del equipo que se está mirando: una a la vez, o la vista vuelve al muro de
tarjetas que la lista vino a sustituir.

Tres detalles que la hacen usable:

- **El aviso se ve antes de abrir.** Los 30 equipos con `advertencia` llevan un ⚠ al
  lado del nombre: sin eso habría que desplegar los 46 para saber cuáles tienen letra
  pequeña.
- **La ficha repite las cuatro cifras de la línea**, a propósito. En móvil la línea
  solo muestra el precio, y una ficha técnica incompleta obliga a cerrarla para
  consultar el dato que falta.
- **Misma mecánica que la matriz**: acordeón con `grid-template-rows`, `inert`
  mientras está plegado y la barra de color de la categoría a la izquierda de la
  ficha. Lo aprendido en una vista sirve en la otra.

**El campo más útil de cada ficha es `advertencia`**, no las especificaciones: que la
Raspberry Pi 5 opera solo hasta 50 °C y un gabinete cerrado en verano lo supera; que
un módulo SOM necesita placa base que hay que diseñar o comprar; que la L4 no lleva
ventilador y se ahoga sin flujo de aire; que una RTX 4090 no tiene memoria con
corrección de errores ni licencia para centro de datos.

**Los precios son orientativos**, de lista y sin impuestos ni envío. Envejecen
rápido. Están para ordenar magnitudes, no para cotizar — refréscalos con el buscador
de precios.

### Los formatos importan tanto como las especificaciones

| Formato | Qué implica |
|---|---|
| Placa de desarrollo | Se conecta y se programa. Prototipo y series cortas. |
| Kit de desarrollo | Con caja y fuente, pero para desarrollar, no para planta. |
| Módulo SOM | Necesita placa base propia o comercial. **Partida de trabajo aparte.** |
| Equipo industrial | Ya montado, riel DIN, alimentación industrial. Se instala y funciona. |
| Tarjeta PCIe | Necesita un PC industrial que la hospede. |
| Accesorio | No funciona solo: acelera a otro equipo de la lista. |

---

## El tablero de conceptos, encima de la matriz

`TableroConceptos` es lo único que va **delante** de la tabla. La razón es que una
cabecera de columna son dos palabras —«Modelo · máx. INT4»— y las celdas están
llenas de siglas: quien llega a la matriz sin conocer la jerga la lee mal, y lo hace
antes de llegar al glosario del final o a las clases de equipo que están justo
debajo.

Menú vertical con acordeón a la izquierda, panel a la derecha. **67 conceptos en cinco
grupos**, en orden de lectura:

| Grupo | Qué contiene |
|---|---|
| Empieza aquí | 8 preguntas sin una sola sigla: para qué sirve esto, qué es un modelo, en qué se diferencia entrenar de inferir, qué decide si algo cabe, qué va a costar de verdad |
| Las columnas de la tabla | Las 11 cabeceras, marcadas según si salen de la hoja original o las añadieron los otros módulos |
| Unidades y rendimiento | Las entradas del glosario de esa categoría |
| Arquitectura y formatos | Ídem |
| Automatización industrial | Ídem |

### Está diseñado para quien no sabe nada del tema

Tres decisiones salen de ahí, y las tres tienen contrapartida:

1. **Empieza por preguntas, no por siglas.** Explicar «TOPS» a quien no sabe qué es
   inferir no explica nada. Cada concepto de base lleva una comparación cotidiana:
   la memoria es el tamaño de la mesa —si el plano no se despliega, no hay nada que
   discutir— y los TOPS son la rapidez de las manos que trabajan encima.
2. **Menú vertical y no una nube de pastillas.** Una pregunta entera no cabe en una
   pastilla, y el menú deja ver la estructura. Cuesta 300 px de ancho.
3. **Se puede recorrer sin decidir nada.** «Anterior» y «Siguiente» llevan por los 67
   conceptos en orden, abriendo el grupo que toque y nombrando el siguiente en el
   propio botón. Quien no sabe qué buscar no tiene que elegir; quien sí sabe tiene el
   buscador, que filtra sin tildes y abre solos los grupos con resultados.

Cada columna se explica en cuatro campos. El primero es para quien llega de fuera y
el último es el que importa:

- **En palabras llanas** — la columna sin una sola sigla. En TDP: «el calor y la luz
  que gasta; 0,5 W es una lucecita de aviso y 450 W una plancha encendida».

- **Qué mide** — la definición.
- **Cómo se lee** — el umbral práctico. En TDP: por debajo de 25 W cabe
  refrigeración pasiva, a partir de 70 W hay que ventilar el gabinete, por encima de
  300 W la instalación eléctrica entra en el presupuesto.
- **Ojo con** — la lectura equivocada que hay que desactivar. Que más TOPS no es un
  modelo más listo. Que el «Precio» de la hoja no es un equipo completo. Que
  «Modelo máx.» es un techo que no cuenta la caché KV.

**Las cifras del panel no están escritas a mano.** Cada columna muestra su rango real
—`de $20 a $7000 por unidad`, `6 de las 8 filas admiten NVMe M.2`— calculado en
`src/data/conceptos.ts` a partir de los mismos datos que pinta la tabla. Una cifra
copiada a mano quedaría desfasada en la primera fila que se añada, y quedaría
desfasada en silencio.

Los textos son cadenas y no JSX a propósito: se pintan con `TextoConGlosario`, así
que las siglas que aparezcan dentro se marcan solas y una entrada nueva del glosario
queda explicada sin tocar este archivo. Las columnas con unidad —TDP, TFLOPS, TOPS,
TOPS/W— llevan además un enlace que salta a su término, cambiando de grupo si hace
falta.

### Las animaciones, y sus reglas

Están en `src/index.css`, no repartidas por los componentes, y siguen tres reglas:
nada dura más de 300 ms, nada se mueve más de 8 px y solo se animan `opacity` y
`transform` —las dos únicas propiedades que no obligan al navegador a recalcular el
diseño entero a 60 fps—.

- El panel entra con `anim-aparecer` y se reanima en cada concepto porque el `div`
  lleva `key={id}`: React lo remonta y la animación vuelve a empezar.
- Los ítems del menú entran en cascada con `animationDelay` por índice, tope de 12
  para que abrir un grupo de 19 no se convierta en una espera.
- El acordeón interpola `grid-template-rows` de `0fr` a `1fr`. Así se despliega a la
  altura real de su contenido sin medirlo con JavaScript ni inventar un `max-height`
  que recorte cuando el texto crezca. Mientras está plegado va con `inert`, o el
  tabulador recorrería 67 botones invisibles.
- Todo se apaga con `prefers-reduced-motion`, incluido el `scrollIntoView` del panel,
  que pasa a `behavior: 'auto'`. No es cortesía: para quien tiene sensibilidad
  vestibular, un panel que entra deslizándose marea de verdad.

```bash
npm run test:conceptos
```

Comprueba lo que puede desfasarse sin romper nada: que `enLaMatriz` siga citando los
números reales de `hardware.ts`, `memoria.ts`, `dispositivos.ts` y `useCases.ts`, que
ningún `terminoId` apunte a un término que ya no existe, que el primer paso del
recorrido guiado no arranque con siglas, que `llano` siga siendo breve, y que todos
los textos pasen por el segmentador sin alterarse.

---

## La matriz, y cómo se relaciona con todo lo demás

`MatrixTable` es el centro de la aplicación y cruza los cuatro módulos de datos.
Una línea vertical separa las dos mitades:

**Izquierda — la hoja de cálculo original**

Categoría (con su equipo representativo debajo), precio, consumo, TFLOPS FP32,
TOPS INT8 y TOPS/W.

**Derecha — lo que añaden los otros módulos**

| Columna | De dónde sale | Qué responde |
|---|---|---|
| Memoria | `memoria.ts` | Cuánta hay y de qué tipo |
| Modelo máx. (INT4) | `modelos.ts` | El modelo más grande que cabe |
| Programas | `software.ts` | Cuántos de los 18 corren ahí |
| Dispositivos | `dispositivos.ts` | Cuántos equipos reales hay y desde qué precio |
| Uso recomendado | `scoring.ts` | En qué casos queda primero |

### Los tres enlaces vivos

1. **«Ver N equipos»** filtra el catálogo por esa fila y sube hasta él.
2. **Una etiqueta de uso** cambia el caso activo y baja al análisis.
3. **El punto de color** es el mismo en la matriz, el catálogo y el radar: la
   entidad se reconoce sin leer.

### Un detalle que salió al cruzar los datos

La columna de precio de la hoja y el «desde» del catálogo **no coinciden**, y eso es
información, no un error. El precio de la hoja es el del equipo representativo; el
«desde» es el equipo más barato que existe de verdad en esa fila. En
«Microcontroladores Básicos» la hoja dice $20–35 y el catálogo arranca en $7: la
Raspberry Pi Pico 2 W es más barata y tiene el doble de memoria que el Arduino Uno.

---

## Qué modelos de IA soporta cada equipo

`src/data/memoria.ts` añade, por categoría, la memoria del equipo representativo y los
modelos que ejecuta en la práctica. **No sale de la hoja de cálculo** — la matriz no
trae memoria — así que vive en su propio archivo para no mezclarse con la
transcripción.

La idea que organiza toda la sección son dos preguntas que se confunden siempre:

| Pregunta | La responde |
|---|---|
| **¿Cabe el modelo?** | La memoria: `memoria útil ÷ bytes por parámetro` |
| **¿Va rápido?** | Los TOPS |

Un equipo de 275 TOPS y 8 GB no ejecuta un modelo de 70 000 millones de parámetros
por muchos TOPS que tenga: no hay dónde ponerlo. Y al revés, 64 GB con pocos TOPS lo
cargan y responden con lentitud.

La tercera pieza es la **cuantización**: FP16 son 2 bytes por parámetro, INT8 uno,
INT4 medio. Bajar de FP16 a INT4 cuadruplica el modelo que cabe en la misma memoria.
El selector del gráfico recalcula los techos con cada formato.

Techos calculados (`npm run test:modelos` los imprime):

| Categoría | Memoria | FP16 | INT8 | INT4 |
|---|---|---|---|---|
| Microcontroladores Básicos | 250 KB | 75 k | 150 k | 300 k |
| Microcontroladores Edge AI | 4 MB | 1.2 M | 2.4 M | 4.8 M |
| SBCs Económicos | 8 GB | 2.4 B | 4.8 B | 9.6 B |
| Edge AI Integrado | 16 GB | 5.6 B | 11 B | 22 B |
| Edge AI de Alta Potencia | 64 GB | 22 B | 45 B | 90 B |
| GPUs para IPC / Edge Server | 24 GB | 10 B | 20 B | 41 B |
| GPUs Enterprise / High-End | 48 GB | 20 B | 41 B | 82 B |

**Tres advertencias que la interfaz también muestra:**

1. **Es un techo, no una recomendación.** Un modelo que llena el 95 % de la memoria
   cabe y funciona mal. Para trabajar cómodo, apunta a la mitad.
2. **La caché KV no está contada.** Un modelo de lenguaje guarda el estado de la
   conversación aparte de sus pesos, y crece con la longitud del contexto: varios GB
   más en contextos largos.
3. **Las listas de modelos envejecen.** Cambian cada pocos meses. Verifícalas con el
   buscador o con el fabricante antes de comprometer un diseño.

El gráfico es un **diagrama de puntos sobre eje logarítmico, no barras**: los techos
recorren seis órdenes de magnitud, y una barra mide desde el cero, que en escala
logarítmica no existe.

---

## Buscador de hardware en la web

Escribes lo que necesitas y trae los datos. Tres modos, en `BuscadorPanel`:

| Modo | Qué hace | ¿Gasta cupo? |
|---|---|---|
| **Traducir un requisito** | «20 cámaras 4K en gabinete cerrado, 8.000 USD» → restricciones técnicas, categoría de la matriz que encaja, riesgos y términos con los que buscar después | No |
| **Buscar especificaciones** | Nombre del equipo → TOPS, TDP, precio, rango térmico, con la fuente de cada dato | Sí |
| **Buscar precios** | Nombre del equipo → precios con proveedor, disponibilidad y enlace | Sí |

**El reparto de trabajo es lo que lo hace fiable:** Google Programmable Search
*descubre* las páginas (es lo que un buscador hace bien) y Claude las *lee y extrae*
con `web_fetch` limitado a los dominios que Google devolvió. No puede irse a otro
sitio, y el esquema JSON obliga a que cada cifra traiga su URL. Lo que no esté en la
fuente vuelve como `null` y aparece en «no se encontró», nunca rellenado de memoria.

El modo requisito no consulta Google a propósito: traducir un requisito a
restricciones no necesita la web, solo la matriz. Devuelve los términos de búsqueda
para que gastes cupo solo cuando haga falta.

### El cupo de Google

La API regala **100 consultas al día**. Con un buscador en la interfaz se agotan en
una tarde de pruebas, así que hay dos protecciones en `functions/src/googleSearch.ts`:

- **Caché en Firestore** por consulta normalizada: 7 días para especificaciones (no
  cambian), 12 horas para precios (sí cambian). Repetir una búsqueda no gasta cupo.
- **Contador diario** con techo de 90, en una transacción para que dos peticiones
  simultáneas no se lo salten. Al llegar, falla con un mensaje claro en vez de
  generar cargos.

La interfaz muestra el consumo (`43/90 hoy`) en cada resultado: es un recurso finito
y hay que verlo antes de agotarlo, no después.

### Añadir un equipo a la matriz

Cada ficha encontrada trae un botón **«Copiar para hardware.ts»** que genera el
bloque listo para pegar — con las ocho calificaciones a cero y un comentario
recordando que hay que rellenarlas. Deliberadamente no las inventa: son un juicio de
ingeniería, no un dato que se lea de una hoja técnica.

---

## Qué software de IA corre en cada equipo

`src/data/software.ts` cruza las 7 categorías con **18 programas** (TFLite Micro,
Edge Impulse, OpenMV, LiteRT, ONNX Runtime, OpenCV, Hailo RT, Frigate, Ollama,
llama.cpp, ROS 2, TensorRT, DeepStream, Isaac ROS, PyTorch, Triton/vLLM, Omniverse,
Arduino/CMSIS-NN) y con **11 tareas** (control, señales, visión, verificación,
multicámara, robótica, voz, lenguaje, entrenamiento, simulación).

Cada celda es Sí / Con límites / No, y **todo «con límites» explica cuál es el
límite** — hay un test que lo exige. Cada programa trae qué es y para qué se usa.

### La frontera no está en los TOPS

Está entre las dos primeras filas —los microcontroladores, **sin sistema
operativo**— y el resto, que corren Linux. Todo lo que se instala con un comando
vive al otro lado de esa línea.

**Por eso un Arduino no puede usar Ollama.** No es cuestión de potencia: Ollama es
un programa de escritorio que necesita sistema operativo, disco para modelos de
varios GB y esa memoria libre. Un Arduino Uno tiene 32 KB y ejecuta un único
programa que tú compilas y grabas. No hay dónde instalarlo. El primer equipo de la
matriz donde Ollama arranca de verdad es la Raspberry Pi 5 — y aun ahí va en CPU y
despacio; con aceleración real hay que subir al Jetson.

Programas soportados por categoría (`npm run test:software` lo imprime):

| Categoría | Sí | Con límites | No |
|---|---|---|---|
| Microcontroladores Básicos | 2 | 1 | 15 |
| Microcontroladores Edge AI | 4 | 1 | 13 |
| SBCs Económicos | 7 | 3 | 8 |
| Edge AI Integrado | 10 | 3 | 5 |
| Edge AI de Alta Potencia | 11 | 1 | 6 |
| GPUs para IPC / Edge Server | 12 | 1 | 5 |
| GPUs Enterprise / High-End | 13 | 0 | 5 |

La tabla va **traspuesta** —programas en las filas, equipos en las columnas— porque
la pregunta que trae aquí a la gente es «¿dónde puedo usar Ollama?», no «¿qué corre
este equipo?». El nivel se codifica con glifo **y** color, nunca con color solo.

---

## Glosario

La matriz está llena de siglas que no se explican en ninguna parte: TOPS, TDP, SOM,
AMR, OPC-UA, INT8. `src/data/glosario.ts` tiene las 48 con su definición y, cuando
importa, **qué implica al elegir** — que es la parte útil. Expandir "TOPS = Tera
Operaciones Por Segundo" no ayuda a decidir; decir que más TOPS es más cadencia y no
un modelo más listo, sí.

Aparecen en la interfaz de cuatro formas:

1. **Marcador de definición.** Los términos llevan subrayado punteado y un `i`
   volado. Al pasar el cursor, enfocar con teclado o pulsar, se abre la definición.
   Es un `<button>` real, así que funciona con teclado, y se cierra con `Escape`.
2. **Marcado automático de prosa.** `<TextoConGlosario texto={...} />` busca los
   términos en cualquier texto y marca la **primera** aparición de cada uno. Los
   contextos de los casos de uso pasan por aquí sin tener que editarlos a mano.
3. **Panel completo** al final de la página: las 48 entradas como texto plano.
   Ninguna definición está disponible solo al pasar el cursor.
4. **Tablero de conceptos** encima de la matriz: los 48 términos en el menú, con la
   definición y la implicación en el panel, y buscador sin tildes. Es la vía por
   delante, para quien todavía no ha leído la tabla.

El buscador tiene dos reglas que conviene conocer antes de añadir términos:

- **Las formas largas ganan a las cortas.** `TOPS/W` se marca antes que `TOPS`, y
  `Edge AI` antes que `Edge`. Lo garantiza el orden de `FORMAS_ORDENADAS`.
- **Las siglas se comparan respetando mayúsculas.** Sin eso, `SOM` marcaría "somos"
  y `AMR` cualquier palabra que lo contenga.

```bash
npm test              # las seis suites: 220 comprobaciones
npm run test:glosario # solo el segmentador
```

Sin framework, con el stripping de tipos de Node: integridad de los datos, que el
texto se reconstruya idéntico (nada se pierde ni se duplica), prioridad de forma
larga, falsos positivos y rendimiento. La lógica está en `src/lib/glosarioTexto.ts`,
separada del componente justamente para poder probarla.

---

## Los ocho criterios y las calificaciones

La hoja tiene las columnas de *Puntos Fuertes* y *Limitaciones* en prosa, que no se
pueden ordenar ni ponderar. Se traducen a ocho criterios en escala 0–100:

`iaThroughput` · `computoGeneral` · `eficienciaEnergetica` · `costo` ·
`latenciaDeterminista` · `gradoIndustrial` · `ecosistemaSoftware` · `escalabilidadVideo`

**Estas calificaciones son una interpretación de la matriz, no un dato de fábrica.**
Cada valor lleva su justificación en el comentario de su línea en
`src/data/hardware.ts`. Si no estás de acuerdo con una, cámbiala ahí: todos los
gráficos, el ranking y el informe se recalculan solos.

Cada caso de uso en `src/data/useCases.ts` define dos cosas:

- **Restricciones duras** (watts disponibles, presupuesto por unidad, TOPS mínimos).
  Se evalúan contra el *mínimo* del rango: si ni la configuración más austera entra,
  el equipo queda fuera del ranking con el motivo escrito.
- **Pesos por criterio**, con la justificación de esa proporción. No tienen que sumar
  1; el motor los normaliza.

---

## Puesta en marcha

### Local, sin nada más

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>. Funcionan completos la matriz, la capacidad de modelos,
el soporte de software, los gráficos y el glosario: todo eso es cálculo puro en el
navegador. El agente usa una plantilla determinista local, sin llamadas a la API ni
costo.

**El buscador web no**, y no es un fallo: la clave de Google no puede viajar en el
bundle del navegador, así que necesita un servidor. La aplicación te lo dice con los
pasos exactos en pantalla.

### Local con buscador, sin cuenta de Firebase

El emulador de Firebase corre las Cloud Functions en tu máquina. **No hace falta
cuenta, ni proyecto, ni plan Blaze**: solo las claves de API, que son inevitables.

```bash
npm install -g firebase-tools
cp functions/.secret.local.example functions/.secret.local   # pega aquí tus claves
cd functions && npm install && cd ..

npm run emuladores     # una terminal
npm run dev:emulado    # otra terminal
```

Las dos claves de Google: activa **Custom Search API** en
<https://console.cloud.google.com> y crea la clave; después crea un motor en
<https://programmablesearchengine.google.com> con **«Buscar en toda la web»** y copia
su ID (el `cx`). `functions/.secret.local` está en `.gitignore`.

El emulador arranca con el proyecto `demo-matriz-hardware`. El prefijo `demo-` es lo
que le dice a Firebase que no hay proyecto real detrás y que no toque ningún servicio
en la nube.

### Desplegado en Firebase

**1. Crear el proyecto**

En <https://console.firebase.google.com>, crear proyecto y habilitar:

- **Hosting**
- **Firestore** (modo producción)
- **Authentication** → método **Anónimo**
- **Functions** — requiere el plan **Blaze**. Las Cloud Functions v2 no están
  disponibles en el plan gratuito.

**2. Conectar el repositorio**

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # elige tu proyecto y dale el alias "default"
```

**3. Configurar el cliente**

```bash
cp .env.example .env.local
```

Pega en `.env.local` los valores de *Configuración del proyecto → Tus apps →
Configuración del SDK*. Son públicos por diseño: viajan en el bundle. La seguridad
está en `firestore.rules`.

**4. Configurar los secretos del servidor**

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY     # console.anthropic.com
firebase functions:secrets:set GOOGLE_SEARCH_API_KEY # console.cloud.google.com
firebase functions:secrets:set GOOGLE_SEARCH_CX      # programmablesearchengine.google.com
```

Quedan en Secret Manager; nunca en el repositorio ni en el navegador.

Para las dos de Google: habilita **Custom Search API** en Google Cloud y crea la
clave; después crea un motor en Programmable Search Engine con **«Buscar en toda la
web»** activado y copia su ID (el `cx`). Sin los dos secretos, el buscador falla con
un mensaje explícito; el resto de la aplicación sigue funcionando.

**5. Desplegar**

```bash
cd functions && npm install && cd ..
npm run deploy
```

O por partes: `npm run deploy:hosting`, `npm run deploy:functions`.

### Emuladores

```bash
firebase emulators:start
```

---

## Estructura

```
src/
  data/
    hardware.ts        Matriz normalizada + calificaciones justificadas
    useCases.ts        Ocho casos de uso con pesos y restricciones
    dispositivos.ts    46 equipos concretos anclados a las filas de la matriz
    dispositivos.test.ts  Rangos cruzados contra la fila de cada uno
    memoria.ts         Memoria y modelos que ejecuta cada equipo (NO sale del xlsx)
    software.ts        18 programas × 7 categorías × 11 tareas
    software.test.ts   Ninguna celda de la matriz sin decidir
    glosario.ts        48 términos con definición e implicación
    glosario.test.ts   Comprobaciones del segmentador
    conceptos.ts       8 conceptos de base + las 11 columnas, con su rango real
    conceptos.test.ts  Que las cifras del texto sigan a los datos
  lib/
    scoring.ts         Motor de puntuación (toda la aritmética vive aquí)
    scoring.test.ts    Ranking, restricciones y consejos
    modelos.ts         Techo de parámetros por equipo y cuantización
    modelos.test.ts    La aritmética de memoria, con sus unidades
    glosarioTexto.ts   Localiza términos en prosa (sin JSX, para poder probarlo)
    buscador.ts        Cliente del buscador web
    agent.ts           Cliente del agente + plantilla local de respaldo
    firebase.ts        Inicialización, degrada a modo local sin configuración
  theme/palette.ts     Tokens de visualización leídos del CSS
  components/
    viz/               Gráficos, tooltip y contenedor con vista de tabla
    TableroConceptos.tsx  Menú de los 67 conceptos y recorrido guiado, encima de la matriz
    MatrixTable.tsx    La matriz completa; también el control de selección
    ConceptosCategorias.tsx  Qué es cada clase de equipo de la primera columna
    StatTiles.tsx      Cifras de encabezado
    Glosario.tsx       Marcador de definición, marcado de prosa y panel
    CatalogoDispositivos.tsx  Los 46 equipos en lista, con ficha al pulsar
    CapacidadModelos.tsx  Qué modelos soporta cada equipo, y por qué
    SoporteSoftware.tsx   Qué software corre en cada uno
    BuscadorPanel.tsx  Buscador web en tres modos
    AgentPanel.tsx     Panel del agente
    Markdown.tsx       Renderizador sin dependencias
functions/
  src/config.ts        Región y secretos compartidos
  src/index.ts         El agente: prompt, validación y llamada a Claude
  src/buscador.ts      Buscador: Google descubre, Claude lee y extrae
  src/googleSearch.ts  Cliente de Google CSE con caché y control de cuota
  src/esquemas.ts      Esquemas JSON y prompts de los tres modos
firestore.rules        Cada informe pertenece a su sesión; sin reescritura
```

---

## El agente

`functions/src/index.ts` expone `generarInforme`, una función *callable* que exige
sesión autenticada.

**Tres tipos de informe**, cada uno con su propia instrucción:

- **Ejecutivo** — una página para quien aprueba el presupuesto. Traduce TOPS a
  cadencia de inspección y watts a costo de gabinete.
- **Técnico** — para quien lo instala. Integración, disipación, compatibilidad de
  arquitectura y plan de validación por etapas.
- **Comparativo** — las tres primeras opciones y los **puntos de cruce**: en qué
  umbral de presupuesto o de watts conviene cambiar de una a otra.

**Restricciones que el prompt de sistema impone al modelo:** no recalcular ni inventar
cifras, decir explícitamente cuando falta un dato en vez de rellenarlo, recomendar
solo entre las opciones viables, y nombrar las limitaciones del equipo recomendado
—un informe que solo trae ventajas no sirve para decidir.

Detalles de implementación: `claude-opus-5` con razonamiento adaptativo y esfuerzo
`medium`; el prompt de sistema va con `cache_control` porque es idéntico en cada
llamada; la respuesta llega por streaming para no chocar con el tiempo límite de la
conexión HTTP en informes largos.

---

## Notas de mantenimiento

- **`npm audit` en `functions/` reporta 8 vulnerabilidades moderadas.** Vienen de
  `uuid` y `gaxios` dentro de la cadena de dependencias de `firebase-admin`, que
  `firebase-functions` arrastra de forma obligatoria. No están en el código de este
  proyecto y no se pueden resolver sin romper `firebase-functions`. Se corregirán
  cuando Google actualice su SDK.
- **Verificación pendiente:** el proyecto compila sin errores de tipos y el bundle se
  genera correctamente, pero los gráficos no se han revisado en un navegador real.
  Ejecuta `npm run dev` y comprueba en ambos modos de tema que las etiquetas de los
  ejes no se solapen y que ningún texto se corte en pantallas estrechas.
- Si añades una octava categoría de hardware, la paleta tiene un slot más y sigue
  siendo válida. **Una novena no**: se dobla en "Otros" o se separa en gráficos
  pequeños. Generar un color nuevo rompe la validación de daltonismo.
- Al añadir un término al glosario, corre `npm run test:glosario`. La prueba de
  formas duplicadas y la de falsos positivos existen porque las dos fallaron de
  verdad la primera vez.
# Matriz
