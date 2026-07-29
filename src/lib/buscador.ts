/**
 * Cliente del buscador de hardware.
 *
 * Los tipos reflejan los esquemas JSON de `functions/src/esquemas.ts`. Si
 * cambias un esquema allí, cambia el tipo aquí: son las dos mitades del mismo
 * contrato y nada lo verifica en tiempo de compilación.
 *
 * Todo campo numérico puede venir `null` a propósito: significa "no se
 * encontró en las fuentes", que es distinto de cero.
 */

import { httpsCallable } from 'firebase/functions'
import { functions, firebaseHabilitado } from './firebase'
import { HARDWARE } from '../data/hardware'
import { CASOS_USO } from '../data/useCases'

export type ModoBusqueda = 'especificaciones' | 'precios' | 'requisito'

export interface Fuente {
  titulo: string
  url: string
  dominio: string
  fragmento: string
}

export interface EquipoEncontrado {
  nombre: string
  fabricante: string
  categoriaSugerida: string
  precioUsdMin: number | null
  precioUsdMax: number | null
  tdpMinW: number | null
  tdpMaxW: number | null
  tflopsFp32: number | null
  topsInt8Max: number | null
  rangoTermico: string | null
  arquitectura: string | null
  fortalezas: string[]
  limitaciones: string[]
  datosFaltantes: string[]
  fuentes: { dato: string; url: string }[]
}

export interface DatosEspecificaciones {
  equipos: EquipoEncontrado[]
  resumen: string
}

export interface HallazgoPrecio {
  equipo: string
  precioUsd: number | null
  proveedor: string
  disponibilidad: string
  fechaObservada: string | null
  url: string
}

export interface DatosPrecios {
  hallazgos: HallazgoPrecio[]
  notas: string
}

export interface DatosRequisito {
  restriccionesDetectadas: {
    presupuestoMaxUsd: number | null
    tdpMaxW: number | null
    topsMin: number | null
    numeroCamaras: number | null
    notas: string
  }
  categoriaRecomendada: string
  casoUsoSugerido: string | null
  razon: string
  riesgos: string[]
  terminosDeBusqueda: string[]
}

export interface Respuesta {
  modo: ModoBusqueda
  datos: DatosEspecificaciones | DatosPrecios | DatosRequisito
  fuentes: Fuente[]
  /** true si Google no se consultó porque la búsqueda estaba en caché. */
  deCache: boolean
  cuota: { usadas: number; techo: number }
}

export const ETIQUETA_MODO: Record<ModoBusqueda, string> = {
  requisito: 'Traducir un requisito',
  especificaciones: 'Buscar especificaciones',
  precios: 'Buscar precios',
}

export const AYUDA_MODO: Record<ModoBusqueda, string> = {
  requisito:
    'Describe el problema en tus palabras. Devuelve las restricciones técnicas, la categoría de la matriz que encaja y los términos con los que buscar después. No consulta Google, así que no gasta cupo.',
  especificaciones:
    'Escribe el nombre del equipo. Busca en Google, lee las páginas de fabricante y extrae TOPS, TDP, precio y rango térmico, con la fuente de cada dato.',
  precios:
    'Escribe el nombre del equipo. Devuelve los precios que encuentre con su proveedor y su enlace. Los precios de la matriz envejecen; esto los refresca.',
}

/**
 * El buscador es la única parte de la aplicación que no puede funcionar sin
 * servidor, y conviene ser explícito sobre por qué: una clave de API en el
 * bundle del navegador es una clave pública. Cualquiera abre las herramientas
 * de desarrollo, la copia y gasta tu cuota.
 *
 * El error lleva los pasos exactos porque un mensaje que solo dice "falta
 * configuración" obliga a ir a buscar el README.
 */
export class SinBackend extends Error {
  readonly pasos: string[]

  constructor() {
    super('El buscador necesita un servidor: la clave de Google no puede vivir en el navegador.')
    this.name = 'SinBackend'
    this.pasos = [
      'Consigue las dos claves de Google: activa «Custom Search API» en console.cloud.google.com y crea un motor en programmablesearchengine.google.com con «Buscar en toda la web».',
      'Escríbelas en functions/.secret.local (hay una plantilla en functions/.secret.local.example).',
      'Arranca los emuladores en otra terminal: npm run emuladores',
      'Arranca la aplicación con: npm run dev:emulado',
    ]
  }
}

/** Resumen de la matriz que necesita el modo `requisito`. */
const resumenMatriz = () =>
  HARDWARE.map((h) => ({
    id: h.id,
    categoria: h.categoria,
    representativo: h.representativo,
  }))

const resumenCasos = () => CASOS_USO.map((c) => ({ id: c.id, nombre: c.nombre }))

export async function buscar(modo: ModoBusqueda, consulta: string): Promise<Respuesta> {
  if (!firebaseHabilitado || !functions) throw new SinBackend()

  const fn = httpsCallable<
    {
      modo: ModoBusqueda
      consulta: string
      matriz?: ReturnType<typeof resumenMatriz>
      casos?: ReturnType<typeof resumenCasos>
    },
    Respuesta
  >(functions, 'buscarHardware')

  const { data } = await fn({
    modo,
    consulta,
    // Solo el modo `requisito` los usa; enviarlos siempre engordaría la
    // petición sin motivo.
    ...(modo === 'requisito' ? { matriz: resumenMatriz(), casos: resumenCasos() } : {}),
  })

  return data
}

/**
 * Convierte un equipo encontrado en el bloque que se pega en
 * `src/data/hardware.ts`.
 *
 * Deliberadamente no escribe nada en el archivo: las calificaciones 0–100 son
 * un juicio de ingeniería que debe poner una persona, no un dato que se pueda
 * leer de una hoja técnica. El bloque sale con las calificaciones a `null`
 * para que sea imposible olvidarse de rellenarlas.
 */
export function comoBloqueMatriz(e: EquipoEncontrado): string {
  const n = (v: number | null) => (v === null ? 'null /* sin dato */' : String(v))
  const s = (v: string | null) => (v === null ? 'null' : JSON.stringify(v))
  const arr = (v: string[]) =>
    v.length === 0 ? '[]' : `[\n${v.map((x) => `      ${JSON.stringify(x)},`).join('\n')}\n    ]`

  return `{
    id: ${JSON.stringify(e.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))},
    categoria: ${JSON.stringify(e.fabricante ? `${e.fabricante} — ${e.nombre}` : e.nombre)},
    representativo: ${JSON.stringify(e.nombre)},
    precioMin: ${n(e.precioUsdMin)},
    precioMax: ${n(e.precioUsdMax)},
    tdpMin: ${n(e.tdpMinW)},
    tdpMax: ${n(e.tdpMaxW)},
    tflopsFp32: ${n(e.tflopsFp32)},
    topsMin: ${n(e.topsInt8Max)},
    topsMax: ${n(e.topsInt8Max)},
    rendimientoTexto: ${s(
      [
        e.tflopsFp32 !== null ? `~${e.tflopsFp32} TFLOPS FP32` : null,
        e.topsInt8Max !== null ? `${e.topsInt8Max} TOPS (INT8)` : null,
      ]
        .filter(Boolean)
        .join(' · ') || null,
    )},
    fortalezas: ${arr(e.fortalezas)},
    limitaciones: ${arr(e.limitaciones)},
    aplicaciones: '',
    // Rellena estas ocho calificaciones a mano (0–100) y justifica cada una.
    // No se pueden leer de una hoja técnica: son un juicio de ingeniería.
    calificaciones: {
      iaThroughput: 0,
      computoGeneral: 0,
      eficienciaEnergetica: 0,
      costo: 0,
      latenciaDeterminista: 0,
      gradoIndustrial: 0,
      ecosistemaSoftware: 0,
      escalabilidadVideo: 0,
    },
  },`
}
