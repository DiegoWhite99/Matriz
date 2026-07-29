/**
 * Buscador de hardware: escribes lo que necesitas y devuelve datos.
 *
 * Reparto de trabajo entre las dos piezas, que es lo que hace fiable el
 * resultado:
 *
 * - **Google Programmable Search descubre** las páginas. Es lo que un buscador
 *   hace bien: encontrar dónde está el dato.
 * - **Claude lee esas páginas y extrae** los campos, con `web_fetch` limitado
 *   a los dominios que Google devolvió. No puede irse a otro sitio, y el
 *   esquema JSON obliga a que cada dato traiga su URL.
 *
 * Por eso el modo `requisito` no consulta Google: traducir "20 cámaras en
 * gabinete cerrado" a restricciones técnicas no necesita la web, solo la
 * matriz. Devuelve además los términos con los que buscar después, así el
 * cupo diario se gasta solo cuando hace falta.
 */

import Anthropic from '@anthropic-ai/sdk'
import { getApps, initializeApp } from 'firebase-admin/app'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { MODELO, REGION, anthropicApiKey, googleSearchApiKey, googleSearchCx } from './config'
import {
  ESQUEMA_ESPECIFICACIONES,
  ESQUEMA_PRECIOS,
  ESQUEMA_REQUISITO,
  SISTEMA_EXTRACCION,
  SISTEMA_REQUISITO,
  type ModoBusqueda,
} from './esquemas'
import { buscarEnGoogle, cuotaRestante, type ResultadoBusqueda } from './googleSearch'

if (getApps().length === 0) initializeApp()

/** Horas de caché por modo: las especificaciones no cambian, los precios sí. */
const CACHE_HORAS: Record<Exclude<ModoBusqueda, 'requisito'>, number> = {
  especificaciones: 24 * 7,
  precios: 12,
}

interface Peticion {
  modo: ModoBusqueda
  consulta: string
  /** Resumen de la matriz local. Solo lo usa el modo `requisito`. */
  matriz?: { id: string; categoria: string; representativo: string }[]
  casos?: { id: string; nombre: string }[]
}

/**
 * Pide una respuesta que cumpla un esquema JSON.
 *
 * Cuando hay herramientas de servidor, un turno puede terminar en
 * `pause_turn`: el bucle lo reanuda reenviando la conversación, con un tope
 * para que un fallo de la herramienta no se convierta en un bucle infinito.
 */
async function pedirJson<T>(
  client: Anthropic,
  opciones: {
    sistema: string
    mensaje: string
    esquema: Record<string, unknown>
    dominios?: string[]
    esfuerzo?: 'medium' | 'high'
  },
): Promise<T> {
  const { sistema, mensaje, esquema, dominios, esfuerzo = 'medium' } = opciones

  const tools = dominios?.length
    ? [
        {
          type: 'web_fetch_20260209' as const,
          name: 'web_fetch' as const,
          max_uses: 6,
          allowed_domains: dominios,
          max_content_tokens: 30_000,
        },
      ]
    : undefined

  const mensajes: Anthropic.MessageParam[] = [{ role: 'user', content: mensaje }]

  const pedir = () =>
    client.messages.create({
      model: MODELO,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: esfuerzo, format: { type: 'json_schema', schema: esquema } },
      system: [{ type: 'text', text: sistema, cache_control: { type: 'ephemeral' } }],
      tools,
      messages: mensajes,
    })

  let respuesta = await pedir()

  let continuaciones = 0
  while (respuesta.stop_reason === 'pause_turn' && continuaciones < 4) {
    mensajes.push({ role: 'assistant', content: respuesta.content })
    respuesta = await pedir()
    continuaciones++
  }

  if (respuesta.stop_reason === 'refusal') {
    throw new HttpsError('failed-precondition', 'El modelo declinó la solicitud.')
  }
  if (respuesta.stop_reason === 'pause_turn') {
    throw new HttpsError(
      'deadline-exceeded',
      'La lectura de las páginas no terminó a tiempo. Prueba con una consulta más concreta.',
    )
  }
  if (respuesta.stop_reason === 'max_tokens') {
    throw new HttpsError(
      'resource-exhausted',
      'La respuesta se cortó por longitud. Acota la consulta a uno o dos equipos.',
    )
  }

  const texto = respuesta.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  if (!texto) throw new HttpsError('internal', 'El modelo no devolvió contenido.')

  try {
    return JSON.parse(texto) as T
  } catch {
    console.error('JSON inválido del modelo:', texto.slice(0, 800))
    throw new HttpsError('internal', 'La respuesta del modelo no era JSON válido.')
  }
}

const listaFuentes = (r: ResultadoBusqueda[]) =>
  r
    .map((x, i) => `${i + 1}. ${x.titulo}\n   ${x.url}\n   ${x.fragmento}`)
    .join('\n')

export const buscarHardware = onCall<Peticion>(
  {
    region: REGION,
    secrets: [anthropicApiKey, googleSearchApiKey, googleSearchCx],
    timeoutSeconds: 300,
    memory: '512MiB',
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Se requiere una sesión para buscar.')
    }

    const { modo, consulta, matriz, casos } = request.data ?? {}

    if (!modo || !['especificaciones', 'precios', 'requisito'].includes(modo)) {
      throw new HttpsError('invalid-argument', '`modo` no es válido.')
    }
    const texto = (consulta ?? '').toString().trim()
    if (texto.length < 3) {
      throw new HttpsError('invalid-argument', 'Escribe al menos tres caracteres.')
    }
    if (texto.length > 1000) {
      throw new HttpsError('invalid-argument', 'La consulta no puede pasar de 1.000 caracteres.')
    }

    const client = new Anthropic({ apiKey: anthropicApiKey.value() })

    /* ---------------- Modo requisito: sin consumir cuota --------------- */

    if (modo === 'requisito') {
      if (!matriz?.length) {
        throw new HttpsError('invalid-argument', 'Falta el resumen de la matriz.')
      }

      const datos = await pedirJson<object>(client, {
        sistema: SISTEMA_REQUISITO,
        esfuerzo: 'high',
        esquema: ESQUEMA_REQUISITO,
        mensaje: [
          'Requisito del proyecto, tal como lo escribió el usuario:',
          '',
          texto,
          '',
          'Categorías disponibles en la matriz (usa uno de estos ids exactos en categoriaRecomendada):',
          '',
          JSON.stringify(matriz, null, 2),
          '',
          'Casos de uso definidos en la aplicación (usa uno de estos ids en casoUsoSugerido, o null):',
          '',
          JSON.stringify(casos ?? [], null, 2),
        ].join('\n'),
      })

      return { modo, datos, fuentes: [], deCache: false, cuota: await cuotaRestante() }
    }

    /* ------------- Modos con búsqueda: Google descubre, Claude lee ----- */

    // Se añaden términos que empujan a Google hacia páginas de fabricante y
    // hojas de datos, en vez de foros y comparativas de blog.
    const sufijo =
      modo === 'precios'
        ? 'price USD buy datasheet'
        : 'specifications datasheet TOPS TDP technical specs'

    const busqueda = await buscarEnGoogle(
      `${texto} ${sufijo}`,
      googleSearchApiKey.value(),
      googleSearchCx.value(),
      CACHE_HORAS[modo],
    )

    if (busqueda.resultados.length === 0) {
      throw new HttpsError(
        'not-found',
        'Google no devolvió resultados. Prueba con el nombre exacto del modelo, en inglés.',
      )
    }

    const dominios = [...new Set(busqueda.resultados.map((r) => r.dominio))]

    const instruccion =
      modo === 'precios'
        ? [
            `Busca el precio actual de: ${texto}`,
            '',
            'Lee las páginas de la lista con web_fetch y extrae los precios que encuentres. Un precio sin proveedor identificable no sirve: descártalo. Si una página no da precio en USD, no la reportes.',
            'En notas, advierte de lo que haga incomparables los precios entre sí: kit contra módulo suelto, cantidades mínimas, precios sin impuestos ni envío, o páginas sin fecha.',
          ].join('\n')
        : [
            `Documenta las especificaciones de: ${texto}`,
            '',
            'Lee las páginas de la lista con web_fetch y rellena los campos. Recuerda: lo que no esté en las fuentes va en null y en datosFaltantes.',
            'En categoriaSugerida indica en qué categoría de esta matriz encajaría, por su id: mcu-basico, mcu-edge-ai, sbc-economico, cpu-npu, edge-ai-integrado, edge-ai-potencia, gpu-ipc, gpu-enterprise. Si no encaja en ninguna, escribe "nueva".',
          ].join('\n')

    const datos = await pedirJson<object>(client, {
      sistema: SISTEMA_EXTRACCION,
      esquema: modo === 'precios' ? ESQUEMA_PRECIOS : ESQUEMA_ESPECIFICACIONES,
      dominios,
      mensaje: [
        instruccion,
        '',
        'Resultados que devolvió Google para esta consulta:',
        '',
        listaFuentes(busqueda.resultados),
      ].join('\n'),
    })

    return {
      modo,
      datos,
      fuentes: busqueda.resultados,
      deCache: busqueda.deCache,
      cuota: await cuotaRestante(),
    }
  },
)
