import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import App from './App'

function renderApp() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('renders the layout with navigation links', () => {
    renderApp()
    expect(screen.getByText('Personal RAG Assistant')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Preguntar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Documentos' })).toBeInTheDocument()
  })
})
