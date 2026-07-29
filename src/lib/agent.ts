/**
 * Cliente del agente de informes.
 *
 * El agente vive en una Cloud Function porque la clave de la API de Claude
 * nunca puede viajar al navegador. El navegador manda hechos ya calculados
 * (`DatosInforme`) y recibe el informe redactado.
 *
 * Sin Firebase configurado, `generarInformeLocal` produce un informe
 * determinista con los mismos datos. No es tan buena prosa, pero permite
 * demostrar el flujo completo sin backend ni costo de API.
 */

import { httpsCallable } from 'firebase/functions'
import { doc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { asegurarSesion, db, functions, firebaseHabilitado } from './firebase'
import type { DatosInforme } from './scoring'

export type TipoInforme = 'ejecutivo' | 'tecnico' | 'comparativo'

export interface Informe {
  id: string
  casoId: string
  casoNombre: string
  tipo: TipoInforme
  /** Cuerpo en Markdown. */
  markdown: string
  creadoEn: string
  /** 'claude' si lo redactó el modelo, 'local' si es la plantilla determinista. */
  origen: 'claude' | 'local'
  modelo?: string
}

interface RespuestaFuncion {
  markdown: string
  modelo: string
}

const ETIQUETA_TIPO: Record<TipoInforme, string> = {
  ejecutivo: 'Resumen ejecutivo',
  tecnico: 'Informe técnico',
  comparativo: 'Análisis comparativo',
}

export async function generarInforme(
  datos: DatosInforme,
  tipo: TipoInforme,
  notasUsuario: string,
): Promise<Informe> {
  const base = {
    id: crypto.randomUUID(),
    casoId: datos.caso.id,
    casoNombre: datos.caso.nombre,
    tipo,
    creadoEn: new Date().toISOString(),
  }

  if (!firebaseHabilitado || !functions) {
    return { ...base, markdown: generarInformeLocal(datos, tipo, notasUsuario), origen: 'local' }
  }

  const fn = httpsCallable<
    { datos: DatosInforme; tipo: TipoInforme; notas: string },
    RespuestaFuncion
  >(functions, 'generarInforme')

  const { data } = await fn({ datos, tipo, notas: notasUsuario })
  const informe: Informe = { ...base, markdown: data.markdown, origen: 'claude', modelo: data.modelo }
  await guardarInforme(informe).catch((e) => {
    // Un fallo de guardado no debe perder el informe que el usuario ya tiene.
    console.warn('No se pudo guardar el informe en Firestore:', e)
  })
  return informe
}

export async function guardarInforme(informe: Informe): Promise<void> {
  if (!db) return
  const uid = await asegurarSesion()
  if (!uid) return
  await setDoc(doc(db, 'informes', informe.id), { ...informe, uid })
}

export async function historialInformes(max = 20): Promise<Informe[]> {
  if (!db) return []
  const uid = await asegurarSesion()
  if (!uid) return []
  const q = query(
    collection(db, 'informes'),
    where('uid', '==', uid),
    orderBy('creadoEn', 'desc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Informe)
}

/* ------------------------------------------------------------------ */
/* Plantilla determinista de respaldo                                  */
/* ------------------------------------------------------------------ */

function generarInformeLocal(datos: DatosInforme, tipo: TipoInforme, notas: string): string {
  const viables = datos.ranking.filter((r) => r.viable)
  const descartados = datos.ranking.filter((r) => !r.viable)
  const ganador = viables[0]
  const alterno = viables[1]

  const l: string[] = []
  l.push(`# ${ETIQUETA_TIPO[tipo]}: ${datos.caso.nombre}`)
  l.push('')
  l.push(`> Generado localmente el ${new Date().toLocaleString('es')} sin llamada al modelo.`)
  l.push('')
  l.push('## Contexto')
  l.push(datos.caso.contexto)
  if (notas.trim()) {
    l.push('')
    l.push(`**Notas del solicitante:** ${notas.trim()}`)
  }
  l.push('')
  l.push('## Criterios de decisión')
  l.push(datos.caso.justificacionPesos)
  l.push('')
  for (const c of datos.caso.criteriosPonderados) {
    l.push(`- **${c.criterio}** — ${c.pesoPorcentaje} % del puntaje`)
  }

  if (ganador) {
    l.push('')
    l.push('## Recomendación')
    l.push(
      `**${ganador.categoria}** (${ganador.representativo}) obtiene ${ganador.puntaje}/100, el puntaje más alto entre las ${viables.length} opciones viables.`,
    )
    l.push('')
    l.push('Lo que decide el resultado:')
    for (const a of ganador.criteriosQueMasAportan) {
      l.push(
        `- ${a.criterio}: califica ${a.calificacion}/100 con un peso del ${a.pesoPorcentaje} %, aportando ${a.puntosAportados} puntos.`,
      )
    }
    l.push('')
    l.push(
      `Costo por unidad $${ganador.precioUsd} USD, consumo ${ganador.consumoW} W, techo de ${ganador.topsInt8} TOPS INT8 (${ganador.topsPorWatt} TOPS/W).`,
    )
    l.push('')
    l.push('**A tener en cuenta:**')
    for (const lim of ganador.limitaciones) l.push(`- ${lim}`)
  }

  if (alterno) {
    l.push('')
    l.push('## Alternativa')
    l.push(
      `**${alterno.categoria}** (${alterno.representativo}) queda en ${alterno.puntaje}/100, a ${(ganador!.puntaje - alterno.puntaje).toFixed(1)} puntos. Es la opción a considerar si cambian el presupuesto o el sobre térmico.`,
    )
  }

  l.push('')
  l.push('## Tabla comparativa')
  l.push('')
  l.push('| # | Categoría | Puntaje | Precio USD | Consumo W | TOPS | TOPS/W |')
  l.push('|---|---|---|---|---|---|---|')
  for (const r of datos.ranking) {
    l.push(
      `| ${r.viable ? r.posicion : '—'} | ${r.categoria} | ${r.puntaje} | ${r.precioUsd} | ${r.consumoW} | ${r.topsInt8} | ${r.topsPorWatt} |`,
    )
  }

  if (descartados.length) {
    l.push('')
    l.push('## Descartados por restricciones')
    for (const d of descartados) {
      l.push(`- **${d.categoria}**: ${d.motivosDescarte.join(' ')}`)
    }
  }

  return l.join('\n')
}
