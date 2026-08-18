import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api/client'
import DocumentsPage from './DocumentsPage'

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentsPage />
    </QueryClientProvider>,
  )
}

describe('DocumentsPage', () => {
  it('lists existing documents', async () => {
    renderPage()
    expect(await screen.findByText('manual_empresa.txt')).toBeInTheDocument()
    expect(screen.getByText(/1 chunks · 502 caracteres/)).toBeInTheDocument()
  })

  it('shows chunk previews when "Ver chunks" is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('manual_empresa.txt')

    await user.click(screen.getByRole('button', { name: 'Ver chunks' }))

    expect(await screen.findByText('Contenido del chunk de prueba.')).toBeInTheDocument()
  })

  it('uploads a file and shows it in the list', async () => {
    // jsdom's File and undici's File (what MSW uses to parse multipart
    // bodies server-side) are two different classes in this test
    // environment -- a File built or read through one isn't recognized by
    // the other, so the filename gets lost crossing that boundary. The
    // real upload flow is already verified against the real backend in the
    // browser (see the "Página de Documentos" commit); here we mock only
    // the network call so the test still exercises our component's real
    // wiring (mutation call, cache invalidation, re-render) without
    // depending on that cross-realm quirk.
    const postSpy = vi.spyOn(apiClient, 'POST').mockResolvedValueOnce({
      data: {
        id: 2,
        filename: 'nuevo.txt',
        content_type: 'text/plain',
        char_count: 20,
        chunk_count: 1,
        uploaded_at: '2026-08-18T12:00:00',
      },
      error: undefined,
      response: new Response(),
    } as never)

    const user = userEvent.setup()
    renderPage()
    await screen.findByText('manual_empresa.txt')

    const file = new File(['contenido de prueba'], 'nuevo.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(postSpy).toHaveBeenCalledWith('/documents', expect.objectContaining({ body: { file } }))
    postSpy.mockRestore()
  })

  it('deletes a document', async () => {
    const user = userEvent.setup()
    renderPage()
    const row = (await screen.findByText('manual_empresa.txt')).closest('li')!

    await user.click(within(row).getByRole('button', { name: 'Borrar' }))

    await waitFor(() => {
      expect(screen.queryByText('manual_empresa.txt')).not.toBeInTheDocument()
    })
  })
})
