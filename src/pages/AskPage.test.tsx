import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/mswServer'
import AskPage from './AskPage'

const BASE_URL = 'http://127.0.0.1:8010'

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AskPage />
    </QueryClientProvider>,
  )
}

describe('AskPage', () => {
  it('submits a question and renders the answer with the Gemini badge by default', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(
      screen.getByPlaceholderText('¿Cuántos días de vacaciones tengo?'),
      '¿Cuántos días puedo teletrabajar?',
    )
    await user.click(screen.getByRole('button', { name: 'Preguntar' }))

    expect(
      await screen.findByText('Respuesta simulada para: "¿Cuántos días puedo teletrabajar?"'),
    ).toBeInTheDocument()
    expect(screen.getByText('Respuesta generada por Gemini')).toBeInTheDocument()
    expect(screen.getByText(/71% similitud/)).toBeInTheDocument()
  })

  it('shows the mock badge when no provider is configured, without sending provider "mock"', async () => {
    let receivedBody: { provider?: string } | undefined
    server.use(
      http.get(`${BASE_URL}/providers`, () =>
        HttpResponse.json({ generation: { default: 'mock', available: [] }, embeddings: { active: 'local' } }),
      ),
      http.post(`${BASE_URL}/ask`, async ({ request }) => {
        receivedBody = (await request.json()) as { provider?: string }
        return HttpResponse.json({
          answer: 'Respuesta simulada honesta',
          sources: [],
          provider: 'MockLLMProvider',
        })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/las respuestas serán simuladas/)).toBeInTheDocument()
    })
    await user.type(screen.getByPlaceholderText('¿Cuántos días de vacaciones tengo?'), 'algo')
    await user.click(screen.getByRole('button', { name: 'Preguntar' }))

    expect(await screen.findByText('Respuesta simulada (sin API key)')).toBeInTheDocument()
    // Regression: "mock" isn't a value AskRequest.provider accepts (only
    // "google" | "anthropic" | null) -- sending it verbatim 422s for real,
    // caught by testing against the live backend, not just MSW.
    expect(receivedBody?.provider).toBeUndefined()
  })

  it('disables the toggle option for a provider without a configured key', async () => {
    server.use(
      http.get(`${BASE_URL}/providers`, () =>
        HttpResponse.json({ generation: { default: 'google', available: ['google'] }, embeddings: { active: 'google' } }),
      ),
    )
    renderPage()

    expect(await screen.findByRole('button', { name: 'Claude' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Google Gemini' })).toBeEnabled()
  })

  it('sends the selected provider and shows the Claude badge after toggling', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Claude' }))
    await user.type(screen.getByPlaceholderText('¿Cuántos días de vacaciones tengo?'), 'algo')
    await user.click(screen.getByRole('button', { name: 'Preguntar' }))

    expect(await screen.findByText('Respuesta generada por Claude')).toBeInTheDocument()
  })

  it('disables the submit button while the question is empty', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Preguntar' })).toBeDisabled()
  })
})
