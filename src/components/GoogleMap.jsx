import { useEffect, useRef, useState } from 'react'
import { findIssueCategory } from '../lib/issues'
import { loadGoogleMaps } from '../lib/googleMaps'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID'
const BENGALURU_CENTER = { lat: 12.9716, lng: 77.6412 }

export default function GoogleMap({
  issues,
  selectedId,
  onSelect,
  userPosition,
}) {
  const mapContainer = useRef(null)
  const googleMap = useRef(null)
  const markers = useRef([])
  const [mapIsReady, setMapIsReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // First load Google's script and create the map.
  useEffect(() => {
    let shouldCreateMap = true

    async function initializeMap() {
      try {
        const mapsApi = await loadGoogleMaps(API_KEY)
        const { Map } = await mapsApi.importLibrary('maps')

        if (!shouldCreateMap) {
          return
        }

        googleMap.current = new Map(mapContainer.current, {
          center: BENGALURU_CENTER,
          zoom: 14,
          mapId: MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          restriction: {
            latLngBounds: {
              north: 13.18,
              south: 12.73,
              east: 77.86,
              west: 77.34,
            },
            strictBounds: false,
          },
        })

        setMapIsReady(true)
      } catch (error) {
        setErrorMessage(error.message)
      }
    }

    initializeMap()

    return () => {
      shouldCreateMap = false
    }
  }, [])

  // Then add markers. mapIsReady makes the async order explicit.
  useEffect(() => {
    if (!mapIsReady || !googleMap.current) {
      return undefined
    }

    let shouldUseMarkers = true

    async function rebuildMarkers() {
      const markerLibrary = await window.google.maps.importLibrary('marker')
      const { AdvancedMarkerElement } = markerLibrary

      if (!shouldUseMarkers) {
        return
      }

      removeAllMarkers(markers.current)

      const issueMarkers = issues.map((issue) => {
        return createGoogleIssueMarker({
          issue,
          selectedId,
          map: googleMap.current,
          AdvancedMarkerElement,
          onSelect,
        })
      })

      markers.current = issueMarkers

      if (userPosition) {
        const userMarker = createGoogleUserMarker({
          position: userPosition,
          map: googleMap.current,
          AdvancedMarkerElement,
        })

        markers.current.push(userMarker)
        googleMap.current.panTo(userPosition)
      }
    }

    rebuildMarkers()

    return () => {
      shouldUseMarkers = false
    }
  }, [mapIsReady, issues, selectedId, onSelect, userPosition])

  if (errorMessage) {
    return (
      <div className="grid h-full place-items-center bg-paper px-8 text-center text-sm text-alert">
        <p>
          {errorMessage}
          <br />
          Check your key and referrer restrictions.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={mapContainer}
      className="h-full w-full"
      aria-label="Google map of Bengaluru civic issues"
    />
  )
}

function createGoogleIssueMarker({
  issue,
  selectedId,
  map,
  AdvancedMarkerElement,
  onSelect,
}) {
  const category = findIssueCategory(issue.category)
  const pin = document.createElement('button')

  pin.className = issue.id === selectedId
    ? 'google-issue-pin is-selected'
    : 'google-issue-pin'
  pin.style.background = issue.status === 'resolved'
    ? '#478060'
    : category.color
  pin.textContent = issue.status === 'resolved' ? '✓' : '!'
  pin.setAttribute('aria-label', issue.title)
  pin.addEventListener('click', () => onSelect(issue.id))

  return new AdvancedMarkerElement({
    map,
    position: issue.position,
    title: issue.title,
    content: pin,
  })
}

function createGoogleUserMarker({
  position,
  map,
  AdvancedMarkerElement,
}) {
  const blueDot = document.createElement('div')
  blueDot.className = 'google-user-dot'

  return new AdvancedMarkerElement({
    map,
    position,
    title: 'Your location',
    content: blueDot,
    zIndex: 100,
  })
}

function removeAllMarkers(markers) {
  markers.forEach((marker) => {
    marker.map = null
  })
}
