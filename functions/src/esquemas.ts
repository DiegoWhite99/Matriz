/**
 * Esquemas JSON y prompts de los tres modos del buscador.
 *
 * Los esquemas se pasan en `output_config.format`, así que la respuesta del
 * modelo llega ya validada contra la forma esperada: el cliente no parsea
 * prosa ni adivina campos.
 *
 * Todos los campos numéricos admiten `null` a propósito. Un dato que no está
 * en la fuente debe volver como `null` y aparecer en `datosFaltantes`; lo que
 * no puede pasar es que el modelo lo rellene con lo que recuerda.
 */

export type ModoBusqueda = 'especificaciones' | 'precios' | 'requisito'

const num = { type: ['number', 'null'] } as const
const txt = { type: 'string' } as const
const txtNulo = { type: ['string', 'null'] } as const
const lista = (items: unknown) => ({ type: 'array', items })

/* ---------------------- Modo: especificaciones ---------------------- */

export const ESQUEMA_ESPECIFICACIONES = {
  type: 'object',
  properties: {
    equipos: lista({
      type: 'object',
      properties: {
        nombre: txt,
        fabricante: txt,
        categoriaSugerida: {
          type: 'string',
          description:
            'Id de la categoría de la matriz donde encajaría, o "nueva" si no encaja en ninguna.',
        },
        precioUsdMin: num,
        precioUsdMax: num,
        tdpMinW: num,
        tdpMaxW: num,
        tflopsFp32: num,
        topsInt8Max: num,
        rangoTermico: txtNulo,
        arquitectura: txtNulo,
        fortalezas: lista(txt),
        limitaciones: lista(txt),
        datosFaltantes: {
          ...lista(txt),
          description: 'Campos que no se encontraron en ninguna fuente leída.',
        },
        fuentes: lista({
          type: 'object',
          properties: { dato: txt, url: txt },
          required: ['dato', 'url'],
          additionalProperties: false,
        }),
      },
      required: [
        'nombre',
        'fabricante',
        'categoriaSugerida',
        'precioUsdMin',
        'precioUsdMax',
        'tdpMinW',
        'tdpMaxW',
        'tflopsFp32',
        'topsInt8Max',
        'rangoTermico',
        'arquitectura',
        'fortalezas',
        'limitaciones',
        'datosFaltantes',
        'fuentes',
      ],
      additionalProperties: false,
    }),
    resumen: txt,
  },
  required: ['equipos', 'resumen'],
  additionalProperties: false,
} as const

/* -------------------------- Modo: precios --------------------------- */

export const ESQUEMA_PRECIOS = {
  type: 'object',
  properties: {
    hallazgos: lista({
      type: 'object',
      properties: {
        equipo: txt,
        precioUsd: num,
        proveedor: txt,
        disponibilidad: {
          type: 'string',
          description: 'En stock, agotado, bajo pedido o desconocida.',
        },
        fechaObservada: {
          ...txtNulo,
          description: 'Fecha que declara la página, si la declara. No inventarla.',
        },
        url: txt,
      },
      required: ['equipo', 'precioUsd', 'proveedor', 'disponibilidad', 'fechaObservada', 'url'],
      additionalProperties: false,
    }),
    notas: {
      ...txt,
      description: 'Advertencias sobre la comparabilidad de los precios encontrados.',
    },
  },
  required: ['hallazgos', 'notas'],
  additionalProperties: false,
} as const

/* ------------------------- Modo: requisito -------------------------- */

export const ESQUEMA_REQUISITO = {
  type: 'object',
  properties: {
    restriccionesDetectadas: {
      type: 'object',
      properties: {
        presupuestoMaxUsd: num,
        tdpMaxW: num,
        topsMin: num,
        numeroCamaras: num,
        notas: {
          ...txt,
          description: 'Restricciones que el texto expresa pero no son numéricas.',
        },
      },
      required: ['presupuestoMaxUsd', 'tdpMaxW', 'topsMin', 'numeroCamaras', 'notas'],
      additionalProperties: false,
    },
    categoriaRecomendada: {
      ...txt,
      description: 'Id exacto de una de las categorías de la matriz recibida.',
    },
    casoUsoSugerido: {
      ...txtNulo,
      description: 'Id del caso de uso de la lista recibida que más se parece, o null.',
    },
    razon: { ...txt, description: 'Por qué esa categoría, en dos o tres frases.' },
    riesgos: {
      ...lista(txt),
      description: 'Qué puede salir mal con esa elección dado el requisito.',
    },
    terminosDeBusqueda: {
      ...lista(txt),
      description:
        'Entre dos y cuatro consultas concretas y en inglés para buscar modelos específicos.',
    },
  },
  required: [
    'restriccionesDetectadas',
    'categoriaRecomendada',
    'casoUsoSugerido',
    'razon',
    'riesgos',
    'terminosDeBusqueda',
  ],
  additionalProperties: false,
} as const

/* ---------------------------- Prompts ------------------------------- */

export const SISTEMA_EXTRACCION = `Eres un ingeniero de automatización que documenta hardware para IA industrial a partir de fuentes web.

Reglas que no puedes romper:

1. Solo puedes reportar datos que hayas leído en las páginas que te dieron. Está prohibido completar un campo con lo que recuerdes del modelo: si el dato no aparece en ninguna fuente leída, el campo va en null y el nombre del campo entra en datosFaltantes.
2. Cada dato numérico que reportes debe tener su URL en fuentes. Si no puedes citar de dónde salió, no lo reportes.
3. No confundas cifras. Los TOPS son de IA en INT8 y los TFLOPS son FP32: si la fuente da una sola cifra sin decir el formato, dilo en datosFaltantes en vez de asignarla al azar.
4. Los precios son de lista en USD y sin impuestos. Si la página muestra otra moneda, no la conviertas: pon null y anótalo.
5. Un módulo y su kit de desarrollo son productos distintos con precios distintos. No mezcles sus cifras.
6. Español técnico neutro en los campos de texto. Frases directas y sin relleno.`

export const SISTEMA_REQUISITO = `Eres un ingeniero de automatización que traduce un requisito de planta escrito en lenguaje corriente a restricciones técnicas y lo mapea contra un catálogo de hardware existente.

Reglas que no puedes romper:

1. Solo puedes recomendar una categoría cuyo id esté en la matriz que te dan. No inventes categorías ni ids.
2. Extrae únicamente las restricciones que el texto expresa. Si no menciona presupuesto, presupuestoMaxUsd va en null: no supongas una cifra razonable.
3. Cuando el requisito dé un número de cámaras o una cadencia, estima los TOPS necesarios y explica de dónde sale la estimación en las notas. Marca que es una estimación, no un dato.
4. Nombra los riesgos de la elección. Un requisito con presupuesto ajustado y sobre térmico cerrado suele tener un conflicto: dilo.
5. Los términos de búsqueda van en inglés y con nombres de producto o especificaciones concretas, porque es lo que indexan las páginas de fabricante.
6. Español técnico neutro. Sin relleno.`
