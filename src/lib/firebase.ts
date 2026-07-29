/**
 * Inicialización de Firebase, con tres modos de funcionamiento.
 *
 * 1. **Sin configurar** — la aplicación funciona igual: el comparador, los
 *    gráficos y la capacidad de modelos son cálculo puro en el navegador. Se
 *    pierden el buscador web, el agente con modelo y el historial.
 *
 * 2. **Emuladores** (`VITE_USE_EMULATORS=true`) — todo corre en tu máquina.
 *    No hace falta cuenta de Firebase, ni proyecto, ni plan de pago: el
 *    emulador acepta un id de proyecto que empiece por `demo-` y no toca
 *    ningún servicio real. Es el camino para probar el buscador sin desplegar.
 *
 * 3. **Proyecto real** — con las variables `VITE_FIREBASE_*` puestas.
 *
 * Las claves de API de Google y Anthropic nunca aparecen aquí. Viven en el
 * servidor, y esa es justamente la razón de que el buscador necesite backend.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInAnonymously, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions'

export const usandoEmuladores = import.meta.env.VITE_USE_EMULATORS === 'true'

/**
 * Con emuladores basta una configuración ficticia. El prefijo `demo-` es lo
 * que le dice a las herramientas de Firebase que no hay proyecto detrás.
 */
const configDemo = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-matriz-hardware.firebaseapp.com',
  projectId: 'demo-matriz-hardware',
  storageBucket: 'demo-matriz-hardware.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000000000',
}

const configReal = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hayConfigReal = Boolean(configReal.apiKey && configReal.projectId)

export const firebaseHabilitado = usandoEmuladores || hayConfigReal

let app: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null
let functionsInstance: Functions | null = null

if (firebaseHabilitado) {
  app = initializeApp(usandoEmuladores ? configDemo : configReal)
  authInstance = getAuth(app)
  dbInstance = getFirestore(app)
  // La región debe coincidir con REGION en functions/src/config.ts.
  functionsInstance = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION || 'us-central1')

  if (usandoEmuladores) {
    // Los puertos son los de firebase.json.
    const host = '127.0.0.1'
    connectAuthEmulator(authInstance, `http://${host}:9099`, { disableWarnings: true })
    connectFirestoreEmulator(dbInstance, host, 8080)
    connectFunctionsEmulator(functionsInstance, host, 5001)
    console.info(
      '[matriz-hardware] Emuladores de Firebase activos. Arráncalos con: firebase emulators:start --project demo-matriz-hardware',
    )
  }
}

export const auth = authInstance
export const db = dbInstance
export const functions = functionsInstance

/**
 * Sesión anónima. Basta para separar el historial de informes por usuario
 * sin pedir registro; las reglas de Firestore atan cada documento a su uid.
 */
export async function asegurarSesion(): Promise<string | null> {
  if (!auth) return null
  if (auth.currentUser) return auth.currentUser.uid
  const cred = await signInAnonymously(auth)
  return cred.user.uid
}
