import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { components } from '../api/schema'

type DocumentRead = components['schemas']['DocumentRead']
type ChunkPreview = components['schemas']['ChunkPreview']

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/documents')
      if (error) throw error
      return data
    },
  })
}

function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      // openapi-fetch no construye FormData automáticamente a partir del body
      // tipado -- el tipo generado marca `file` como string (formato binario,
      // así lo describe OpenAPI) pero en runtime hay que serializarlo a mano
      // o la petición llega sin el campo `file` y el backend responde 422.
      const { data, error } = await apiClient.POST('/documents', {
        body: { file: file as unknown as string },
        bodySerializer: () => {
          const formData = new FormData()
          formData.append('file', file)
          return formData
        },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/documents/{document_id}', {
        params: { path: { document_id: id } },
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

function useChunkPreview(documentId: number | null) {
  return useQuery({
    queryKey: ['documents', documentId, 'chunks'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/documents/{document_id}/chunks', {
        params: { path: { document_id: documentId! } },
      })
      if (error) throw error
      return data
    },
    enabled: documentId !== null,
  })
}

function ChunkList({ chunks }: { chunks: ChunkPreview[] }) {
  return (
    <ul className="mt-2 space-y-2 border-t border-slate-200 pt-2">
      {chunks.map((chunk) => (
        <li key={chunk.index} className="rounded-md bg-slate-50 p-2 text-sm text-slate-700">
          <span className="mb-1 block text-xs font-medium text-slate-400">
            Chunk {chunk.index} · {chunk.char_count} caracteres
          </span>
          {chunk.text}
        </li>
      ))}
    </ul>
  )
}

function DocumentRow({ document }: { document: DocumentRead }) {
  const [expanded, setExpanded] = useState(false)
  const deleteDocument = useDeleteDocument()
  const chunkPreview = useChunkPreview(expanded ? document.id : null)

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-slate-900">{document.filename}</p>
          <p className="text-sm text-slate-500">
            {document.chunk_count} chunks · {document.char_count} caracteres · subido{' '}
            {formatDate(document.uploaded_at)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {expanded ? 'Ocultar chunks' : 'Ver chunks'}
          </button>
          <button
            type="button"
            onClick={() => deleteDocument.mutate(document.id)}
            disabled={deleteDocument.isPending}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Borrar
          </button>
        </div>
      </div>
      {expanded && chunkPreview.data && <ChunkList chunks={chunkPreview.data} />}
      {expanded && chunkPreview.isLoading && (
        <p className="mt-2 text-sm text-slate-400">Cargando chunks…</p>
      )}
    </li>
  )
}

function DocumentsPage() {
  const documents = useDocuments()
  const uploadDocument = useUploadDocument()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    uploadDocument.mutate(file)
    event.target.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Documentos</h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadDocument.isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {uploadDocument.isPending ? 'Subiendo…' : 'Subir documento'}
          </button>
        </div>
      </div>

      {uploadDocument.isError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          No se pudo subir el documento. Comprueba el formato e inténtalo de nuevo.
        </p>
      )}

      {documents.isLoading && <p className="text-slate-500">Cargando documentos…</p>}
      {documents.isError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          No se pudieron cargar los documentos. ¿Está el backend corriendo?
        </p>
      )}
      {documents.data && documents.data.length === 0 && (
        <p className="text-slate-500">Todavía no has subido ningún documento.</p>
      )}
      {documents.data && documents.data.length > 0 && (
        <ul className="space-y-3">
          {documents.data.map((document) => (
            <DocumentRow key={document.id} document={document} />
          ))}
        </ul>
      )}
    </div>
  )
}

export default DocumentsPage
