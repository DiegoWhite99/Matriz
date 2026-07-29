/**
 * Configuración compartida por las funciones.
 *
 * La región y los secretos viven aquí, no en `index.ts`, porque los `import`
 * se evalúan antes que el cuerpo del módulo que los importa: si
 * `setGlobalOptions` se llamara en `index.ts`, las funciones definidas en
 * otros archivos ya se habrían registrado sin esa región. Cada función declara
 * su región explícitamente y así el orden de carga deja de importar.
 */

import { defineSecret } from 'firebase-functions/params'

/** Debe coincidir con VITE_FUNCTIONS_REGION en el cliente. */
export const REGION = 'us-central1'

export const MODELO = 'claude-opus-5'

export const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')
export const googleSearchApiKey = defineSecret('GOOGLE_SEARCH_API_KEY')
export const googleSearchCx = defineSecret('GOOGLE_SEARCH_CX')
