import createClient from 'openapi-fetch'
import type { paths } from './schema'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8010'

export const apiClient = createClient<paths>({
  baseUrl,
  fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
})
