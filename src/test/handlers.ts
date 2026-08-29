import { http, HttpResponse } from 'msw'

const BASE_URL = 'http://127.0.0.1:8010'

type Doc = {
  id: number
  filename: string
  content_type: string
  char_count: number
  chunk_count: number
  uploaded_at: string
}

const seedDocuments: Doc[] = [
  {
    id: 1,
    filename: 'manual_empresa.txt',
    content_type: 'text/plain',
    char_count: 502,
    chunk_count: 1,
    uploaded_at: '2026-08-17T20:36:00',
  },
]

let documents: Doc[] = [...seedDocuments]
let nextId = 2

export function resetDocuments() {
  documents = [...seedDocuments]
  nextId = 2
}

export const handlers = [
  http.get(`${BASE_URL}/documents`, () => {
    return HttpResponse.json(documents)
  }),

  http.post(`${BASE_URL}/documents`, async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return HttpResponse.json({ detail: 'Field required' }, { status: 422 })
    }
    const doc: Doc = {
      id: nextId++,
      filename: file.name,
      content_type: file.type,
      char_count: 42,
      chunk_count: 1,
      uploaded_at: '2026-08-18T12:00:00',
    }
    documents.push(doc)
    return HttpResponse.json(doc, { status: 201 })
  }),

  http.delete(`${BASE_URL}/documents/:id`, ({ params }) => {
    const id = Number(params.id)
    documents = documents.filter((doc) => doc.id !== id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${BASE_URL}/documents/:id/chunks`, () => {
    return HttpResponse.json([{ index: 0, text: 'Contenido del chunk de prueba.', char_count: 31 }])
  }),

  http.get(`${BASE_URL}/providers`, () => {
    return HttpResponse.json({
      generation: { default: 'google', available: ['google', 'anthropic'] },
      embeddings: { active: 'google' },
    })
  }),

  http.post(`${BASE_URL}/ask`, async ({ request }) => {
    const body = (await request.json()) as { question: string; provider?: string }
    const providerClass =
      body.provider === 'google'
        ? 'GoogleLLMProvider'
        : body.provider === 'anthropic'
          ? 'AnthropicLLMProvider'
          : 'MockLLMProvider'
    return HttpResponse.json({
      answer: `Respuesta simulada para: "${body.question}"`,
      sources: [
        {
          chunk_id: 'doc-1-chunk-0',
          document_id: 1,
          chunk_index: 0,
          text: 'Manual del empleado - Sección de teletrabajo.',
          similarity: 0.71,
        },
      ],
      provider: providerClass,
    })
  }),
]
