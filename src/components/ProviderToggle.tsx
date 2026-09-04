type ProviderId = 'google' | 'anthropic'

const PROVIDER_LABELS: Record<ProviderId, string> = {
  google: 'Google Gemini',
  anthropic: 'Claude',
}

interface ProviderToggleProps {
  available: string[]
  selected: string
  onChange: (id: ProviderId) => void
}

function ProviderToggle({ available, selected, onChange }: ProviderToggleProps) {
  if (available.length === 0) {
    return (
      <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
        Sin proveedor configurado -- las respuestas serán simuladas
      </p>
    )
  }

  return (
    <div className="flex gap-2">
      {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((id) => {
        const isAvailable = available.includes(id)
        const isSelected = selected === id
        return (
          <button
            key={id}
            type="button"
            disabled={!isAvailable}
            onClick={() => onChange(id)}
            title={
              isAvailable
                ? undefined
                : `Configura ${id === 'google' ? 'GOOGLE_API_KEY' : 'ANTHROPIC_API_KEY'} en el backend para activar esta opción`
            }
            className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
              isSelected
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:enabled:bg-slate-100'
            }`}
          >
            {PROVIDER_LABELS[id]}
          </button>
        )
      })}
    </div>
  )
}

export default ProviderToggle
