import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { components } from '../api/schema'

type AskResponse = components['schemas']['AskResponse']

function useAskQuestion() {
  return useMutation({
    mutationFn: async (question: string) => {
      const { data, error } = await apiClient.POST('/ask', {
        body: { question },
      })
      if (error) throw error
      return data
    },
  })
}

function ProviderBadge({ provider }: { provider: string }) {
  const isMock = provider.toLowerCase().includes('mock')
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isMock ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
      }`}
    >
      {isMock ? 'Respuesta simulada (sin API key)' : 'Respuesta generada por Claude'}
    </span>
  )
}

function AnswerCard({ result }: { result: AskResponse }) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-500">Respuesta</h2>
        <ProviderBadge provider={result.provider} />
      </div>
      <p className="whitespace-pre-wrap text-slate-900">{result.answer}</p>

      {result.sources.length > 0 && (
        <div className="border-t border-slate-200 pt-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">
            Fuentes citadas ({result.sources.length})
          </h3>
          <ul className="space-y-2">
            {result.sources.map((source) => (
              <li
                key={source.chunk_id}
                className="rounded-md bg-slate-50 p-3 text-sm text-slate-700"
              >
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Documento {source.document_id} · chunk {source.chunk_index}
                  </span>
                  <span>{Math.round(source.similarity * 100)}% similitud</span>
                </div>
                {source.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function AskPage() {
  const [question, setQuestion] = useState('')
  const askQuestion = useAskQuestion()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!question.trim()) return
    askQuestion.mutate(question.trim())
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Pregunta a tus documentos</h1>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="¿Cuántos días de vacaciones tengo?"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={askQuestion.isPending || !question.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {askQuestion.isPending ? 'Preguntando…' : 'Preguntar'}
        </button>
      </form>

      {askQuestion.isError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          No se pudo obtener respuesta. ¿Está el backend corriendo?
        </p>
      )}

      {askQuestion.data && <AnswerCard result={askQuestion.data} />}
    </div>
  )
}

export default AskPage
