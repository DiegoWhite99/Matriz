/**
 * Punto de entrada de las Cloud Functions.
 *
 * Dos funciones, ambas *callable* y ambas exigiendo sesión autenticada:
 *
 * - `generarInforme` — redacta el informe de selección a partir del ranking
 *   que ya calculó el cliente.
 * - `buscarHardware` — busca datos en la web (ver `buscador.ts`).
 *
 * Las dos viven en el servidor por la misma razón: las claves de API no pueden
 * estar en el bundle del navegador.
 */

import Anthropic from '@anthropic-ai/sdk'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { MODELO, REGION, anthropicApiKey } from './config'

export { buscarHardware } from './buscador'

type TipoInforme = 'ejecutivo' | 'tecnico' | 'comparativo'

const INSTRUCCIONES: Record<TipoInforme, string> = {
  ejecutivo: `Escribe un resumen ejecutivo de una página para quien aprueba el presupuesto y no es especialista en hardware.
Estructura: título; recomendación en una frase con el costo; por qué esa opción y no la siguiente; qué riesgo se asume; qué se necesita para ejecutarla.
Traduce cada dato técnico a su consecuencia de negocio: los TOPS son cadencia de inspección, los watts son costo de gabinete y de energía, el grado industrial es tiempo entre fallos.
No incluyas tablas de especificaciones.`,

  tecnico: `Escribe un informe técnico para el ingeniero que va a integrar el equipo.
Estructura: título; equipo seleccionado con sus cifras; requisitos de integración (alimentación, disipación, forma de montaje, buses de E/S); pila de software y compatibilidad de arquitectura; riesgos de implementación con su mitigación; plan de validación por etapas.
Sé concreto sobre las limitaciones que trae la matriz: si el equipo es ARM, di qué software se rompe; si necesita placa carrier o PC hospedadora, dilo como partida de trabajo.
Incluye la tabla comparativa completa al final.`,

  comparativo: `Escribe un análisis comparativo de las tres primeras opciones viables.
Estructura: título; tabla comparativa; una sección por opción con el escenario en que gana; los puntos de cruce, es decir en qué condición conviene cambiar de una a otra (umbral de presupuesto, de watts disponibles, de número de cámaras); recomendación final condicionada.
El objetivo es que el lector pueda decidir solo cuando cambien sus supuestos, no que memorice un veredicto.`,
}

const SISTEMA = `Eres un ingeniero de automatización industrial que redacta informes de selección de hardware para IA en planta.

Reglas que no puedes romper:

1. Los números están calculados y son correctos. Cítalos tal cual. No los recalcules, no los promedies, no los redondees a algo distinto, no inventes cifras que no estén en los datos (ni benchmarks, ni consumos, ni precios de otros modelos).
2. Si un dato no está en la entrada, di que falta. Nunca lo rellenes con conocimiento general.
3. Recomienda solo entre las opciones marcadas como viables. Los descartados se mencionan explicando qué restricción incumplen, no como alternativas.
4. Nombra las limitaciones del equipo recomendado. Un informe que solo trae ventajas no sirve para decidir.
5. Español técnico neutro. Frases directas. Sin relleno de consultoría, sin "en el mundo actual", sin listas de viñetas de una palabra.
6. Devuelve solo Markdown, empezando por un encabezado de nivel 1. Nada de preámbulo ni de comentarios sobre lo que vas a hacer.
7. Las cifras de dinero en USD con separador de miles; los watts con la unidad; los TOPS indicando que son INT8.`

interface Peticion {
  datos: unknown
  tipo: TipoInforme
  notas?: string
}

export const generarInforme = onCall<Peticion>(
  {
    region: REGION,
    secrets: [anthropicApiKey],
    // El modelo razona antes de redactar: hay que darle margen de reloj.
    timeoutSeconds: 300,
    memory: '512MiB',
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Se requiere una sesión para generar informes.')
    }

    const { datos, tipo, notas } = request.data ?? {}

    if (!datos || typeof datos !== 'object') {
      throw new HttpsError('invalid-argument', 'Falta el objeto `datos` con el ranking evaluado.')
    }
    if (!tipo || !(tipo in INSTRUCCIONES)) {
      throw new HttpsError(
        'invalid-argument',
        `\`tipo\` debe ser uno de: ${Object.keys(INSTRUCCIONES).join(', ')}.`,
      )
    }

    const client = new Anthropic({ apiKey: anthropicApiKey.value() })

    const notasLimpias = (notas ?? '').toString().slice(0, 2000).trim()

    const mensaje = [
      INSTRUCCIONES[tipo as TipoInforme],
      '',
      'Datos de la evaluación (calculados por el motor de puntuación, no los modifiques):',
      '',
      '```json',
      JSON.stringify(datos, null, 2),
      '```',
      ...(notasLimpias
        ? [
            '',
            'Restricciones adicionales que declaró el solicitante. Incorpóralas al análisis; si alguna cambia la recomendación frente al ranking, dilo de forma explícita:',
            '',
            notasLimpias,
          ]
        : []),
    ].join('\n')

    try {
      // Streaming para no chocar con el tiempo límite de la conexión HTTP en
      // informes largos; `finalMessage()` devuelve el mensaje completo.
      const stream = client.messages.stream({
        model: MODELO,
        max_tokens: 8000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium' },
        system: [
          {
            type: 'text',
            text: SISTEMA,
            // El prompt de sistema es idéntico en cada llamada: se cachea.
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: mensaje }],
      })

      const respuesta = await stream.finalMessage()

      if (respuesta.stop_reason === 'refusal') {
        throw new HttpsError(
          'failed-precondition',
          'El modelo declinó la solicitud. Revisa el contenido de las notas del proyecto.',
        )
      }

      const markdown = respuesta.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim()

      if (!markdown) {
        throw new HttpsError('internal', 'El modelo devolvió una respuesta vacía.')
      }

      return { markdown, modelo: MODELO }
    } catch (e) {
      if (e instanceof HttpsError) throw e
      if (e instanceof Anthropic.RateLimitError) {
        throw new HttpsError('resource-exhausted', 'Límite de peticiones alcanzado. Reintenta en un minuto.')
      }
      if (e instanceof Anthropic.AuthenticationError) {
        throw new HttpsError(
          'permission-denied',
          'La clave ANTHROPIC_API_KEY no es válida. Revisa el secreto de Firebase.',
        )
      }
      console.error('Fallo al generar el informe:', e)
      throw new HttpsError('internal', 'No se pudo generar el informe.')
    }
  },
)
