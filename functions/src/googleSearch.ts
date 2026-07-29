/**
 * Cliente de la Google Programmable Search JSON API, con caché y control de
 * cuota.
 *
 * La API regala 100 consultas al día y después cobra por cada mil. Con un
 * buscador expuesto en la interfaz, esas 100 se agotan en una tarde de pruebas
 * si cada pulsación llega a Google. De ahí las dos protecciones:
 *
 * - **Caché en Firestore** por consulta normalizada. Repetir una búsqueda no
 *   gasta cuota mientras la entrada siga viva.
 * - **Contador diario** con techo configurable. Al llegar al techo la función
 *   falla con un mensaje claro en vez de generar cargos silenciosos.
 */

import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/v2/https'
import { createHash } from 'node:crypto'

export interface ResultadoBusqueda {
  titulo: string
  url: string
  dominio: string
  fragmento: string
}

export interface RespuestaBusqueda {
  resultados: ResultadoBusqueda[]
  /** true si vino de la caché: no consumió cuota. */
  deCache: boolean
  consultaEjecutada: string
}

/** Techo diario propio, por debajo del límite gratuito de Google. */
const TECHO_DIARIO = 90

const COLECCION_CACHE = 'cacheBusqueda'
const COLECCION_CUOTA = 'cuotasBusqueda'

const hoy = () => new Date().toISOString().slice(0, 10)

const clave = (consulta: string) =>
  createHash('sha256').update(consulta.trim().toLowerCase()).digest('hex').slice(0, 32)

/**
 * Lee el contador del día y lo incrementa si queda margen.
 *
 * La transacción evita que dos peticiones simultáneas vean el mismo contador
 * y se salten juntas el techo.
 */
async function consumirCuota(): Promise<number> {
  const db = getFirestore()
  const ref = db.collection(COLECCION_CUOTA).doc(hoy())

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const usadas = (snap.data()?.consultas as number | undefined) ?? 0

    if (usadas >= TECHO_DIARIO) {
      throw new HttpsError(
        'resource-exhausted',
        `Se alcanzó el límite de ${TECHO_DIARIO} búsquedas de hoy. Las búsquedas ya hechas siguen disponibles en caché; el contador se reinicia mañana.`,
      )
    }

    tx.set(
      ref,
      { consultas: FieldValue.increment(1), actualizadoEn: FieldValue.serverTimestamp() },
      { merge: true },
    )
    return usadas + 1
  })
}

export async function cuotaRestante(): Promise<{ usadas: number; techo: number }> {
  const snap = await getFirestore().collection(COLECCION_CUOTA).doc(hoy()).get()
  return { usadas: (snap.data()?.consultas as number | undefined) ?? 0, techo: TECHO_DIARIO }
}

/**
 * Busca en Google.
 *
 * @param horasCache Cuánto vive la entrada en caché. Las especificaciones no
 *   cambian, los precios sí: quien llama decide.
 */
export async function buscarEnGoogle(
  consulta: string,
  apiKey: string,
  cx: string,
  horasCache: number,
  maxResultados = 8,
): Promise<RespuestaBusqueda> {
  const db = getFirestore()
  const ref = db.collection(COLECCION_CACHE).doc(`${clave(consulta)}-${horasCache}h`)

  const enCache = await ref.get()
  if (enCache.exists) {
    const datos = enCache.data()!
    const expira = (datos.expiraEn as Timestamp | undefined)?.toMillis() ?? 0
    if (expira > Date.now()) {
      return {
        resultados: datos.resultados as ResultadoBusqueda[],
        deCache: true,
        consultaEjecutada: consulta,
      }
    }
  }

  await consumirCuota()

  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('cx', cx)
  url.searchParams.set('q', consulta)
  url.searchParams.set('num', String(Math.min(maxResultados, 10)))
  url.searchParams.set('hl', 'es')

  const respuesta = await fetch(url, { signal: AbortSignal.timeout(20_000) })

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => '')
    // 403 con "dailyLimitExceeded" es la cuota de Google, no la nuestra.
    if (respuesta.status === 403) {
      throw new HttpsError(
        'permission-denied',
        'Google rechazó la búsqueda. Revisa que la clave sea válida, que la Custom Search API esté habilitada en el proyecto de Google Cloud y que no se haya agotado la cuota de la cuenta.',
      )
    }
    if (respuesta.status === 429) {
      throw new HttpsError('resource-exhausted', 'Google está limitando las peticiones. Reintenta en un minuto.')
    }
    console.error('Google Search falló:', respuesta.status, cuerpo.slice(0, 500))
    throw new HttpsError('unavailable', `La búsqueda de Google devolvió ${respuesta.status}.`)
  }

  const datos = (await respuesta.json()) as {
    items?: { title?: string; link?: string; snippet?: string; displayLink?: string }[]
  }

  const resultados: ResultadoBusqueda[] = (datos.items ?? [])
    .filter((it) => it.link)
    .map((it) => ({
      titulo: it.title ?? '(sin título)',
      url: it.link!,
      dominio: it.displayLink ?? new URL(it.link!).hostname,
      fragmento: it.snippet ?? '',
    }))

  await ref.set({
    consulta,
    resultados,
    creadoEn: FieldValue.serverTimestamp(),
    expiraEn: Timestamp.fromMillis(Date.now() + horasCache * 3_600_000),
  })

  return { resultados, deCache: false, consultaEjecutada: consulta }
}
