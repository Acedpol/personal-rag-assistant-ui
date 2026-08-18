import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import AskPage from './AskPage'

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
  it('submits a question and renders the answer with sources and provider badge', async () => {
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
    expect(screen.getByText('Respuesta simulada (sin API key)')).toBeInTheDocument()
    expect(screen.getByText(/71% similitud/)).toBeInTheDocument()
  })

  it('disables the submit button while the question is empty', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Preguntar' })).toBeDisabled()
  })
})
