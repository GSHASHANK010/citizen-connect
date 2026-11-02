import { useState } from 'react'
import { Layers3, LocateFixed } from 'lucide-react'
import GoogleMap from './GoogleMap'
import MockMap from './MockMap'
import OpenStreetMap from './OpenStreetMap'

const GOOGLE_MAPS_IS_CONFIGURED = Boolean(
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
)

const MAP_PROVIDER_STORAGE_KEY = 'citizen-connect-map-provider'
const OLD_MAP_PROVIDER_STORAGE_KEY = 'nammafix-map-provider'

export default function MapView(props) {
  const [selectedProvider, setSelectedProvider] = useState(
    loadSavedProvider,
  )

  const activeProvider = getAvailableProvider(selectedProvider)

  function chooseProvider(nextProvider) {
    const googleWasChosenWithoutAKey =
      nextProvider === 'google' && !GOOGLE_MAPS_IS_CONFIGURED

    if (googleWasChosenWithoutAKey) {
      return
    }

    setSelectedProvider(nextProvider)
    localStorage.setItem(MAP_PROVIDER_STORAGE_KEY, nextProvider)
  }

  return (
    <div className="absolute inset-0">
      <ActiveMap provider={activeProvider} mapProps={props} />

      <MapProviderPicker
        activeProvider={activeProvider}
        googleIsConfigured={GOOGLE_MAPS_IS_CONFIGURED}
        onChooseProvider={chooseProvider}
      />

      {activeProvider !== 'preview' && (
        <button
          type="button"
          onClick={props.onLocate}
          className="absolute bottom-10 right-4 z-[35] hidden h-11 w-11 place-items-center rounded-xl bg-white text-moss shadow-soft transition hover:scale-105 md:grid"
          aria-label="Use my location"
        >
          <LocateFixed size={19} />
        </button>
      )}
    </div>
  )
}

function ActiveMap({ provider, mapProps }) {
  if (provider === 'google') {
    return <GoogleMap {...mapProps} />
  }

  if (provider === 'preview') {
    return <MockMap {...mapProps} />
  }

  return <OpenStreetMap {...mapProps} />
}

function MapProviderPicker({
  activeProvider,
  googleIsConfigured,
  onChooseProvider,
}) {
  return (
    <div className="absolute right-3 top-[72px] z-[35] rounded-2xl bg-white p-1.5 shadow-soft md:right-4 md:top-4">
      <div className="mb-1 flex items-center gap-1.5 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-ink/35">
        <Layers3 size={11} />
        Map layer
      </div>

      <div className="flex gap-1">
        <ProviderButton
          label="OpenStreetMap"
          isActive={activeProvider === 'osm'}
          onClick={() => onChooseProvider('osm')}
        />

        <ProviderButton
          label="Google"
          isActive={activeProvider === 'google'}
          isDisabled={!googleIsConfigured}
          title={
            googleIsConfigured
              ? 'Use Google Maps'
              : 'Add VITE_GOOGLE_MAPS_API_KEY to enable Google Maps'
          }
          onClick={() => onChooseProvider('google')}
        />

        <ProviderButton
          label="Preview"
          isActive={activeProvider === 'preview'}
          extraClasses="hidden sm:block"
          onClick={() => onChooseProvider('preview')}
        />
      </div>
    </div>
  )
}

function ProviderButton({
  label,
  isActive,
  isDisabled = false,
  title,
  extraClasses = '',
  onClick,
}) {
  const colorClasses = isActive
    ? 'bg-moss text-white'
    : 'text-ink/45 hover:bg-paper'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={`rounded-xl px-3 py-2 text-[10px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-30 ${colorClasses} ${extraClasses}`}
    >
      {label}
    </button>
  )
}

function loadSavedProvider() {
  return (
    localStorage.getItem(MAP_PROVIDER_STORAGE_KEY) ||
    localStorage.getItem(OLD_MAP_PROVIDER_STORAGE_KEY) ||
    'osm'
  )
}

function getAvailableProvider(selectedProvider) {
  if (selectedProvider === 'google' && GOOGLE_MAPS_IS_CONFIGURED) {
    return 'google'
  }

  if (selectedProvider === 'preview') {
    return 'preview'
  }

  return 'osm'
}
