import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { findIssueCategory } from '../lib/issues'

const TILE_URL =
  import.meta.env.VITE_OSM_TILE_URL ||
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const STARTING_CENTER = [12.9716, 77.6412]
const STARTING_ZOOM = 14
const BENGALURU_MAP_BOUNDS = [
  [12.68, 77.28],
  [13.23, 77.92],
]

export default function OpenStreetMap({
  issues,
  selectedId,
  onSelect,
  userPosition,
}) {
  // Leaflet manages its own objects outside React, so refs hold those objects.
  const mapContainer = useRef(null)
  const leafletMap = useRef(null)
  const issueMarkerLayer = useRef(null)
  const userMarkerLayer = useRef(null)
  const [mapIsReady, setMapIsReady] = useState(false)

  // Create the Leaflet map once when the component first appears.
  useEffect(() => {
    if (!mapContainer.current || leafletMap.current) {
      return undefined
    }

    const map = L.map(mapContainer.current, {
      zoomControl: false,
      minZoom: 10,
      maxZoom: 19,
      maxBounds: BENGALURU_MAP_BOUNDS,
      maxBoundsViscosity: 0.65,
    }).setView(STARTING_CENTER, STARTING_ZOOM)

    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    issueMarkerLayer.current = L.layerGroup().addTo(map)
    userMarkerLayer.current = L.layerGroup().addTo(map)
    leafletMap.current = map
    setMapIsReady(true)

    // Leaflet must be explicitly removed when React removes this component.
    return () => {
      map.remove()
      leafletMap.current = null
    }
  }, [])

  // Rebuild issue markers whenever visible issues or selection changes.
  useEffect(() => {
    if (!mapIsReady || !issueMarkerLayer.current) {
      return
    }

    issueMarkerLayer.current.clearLayers()

    issues.forEach((issue) => {
      const marker = createIssueMarker(issue, selectedId)

      marker.on('click', () => onSelect(issue.id))
      marker.addTo(issueMarkerLayer.current)
    })
  }, [mapIsReady, issues, selectedId, onSelect])

  // The live-location marker has a separate layer so it can be updated alone.
  useEffect(() => {
    if (!mapIsReady || !userMarkerLayer.current) {
      return
    }

    userMarkerLayer.current.clearLayers()

    if (!userPosition) {
      return
    }

    const marker = createUserLocationMarker(userPosition)
    marker.addTo(userMarkerLayer.current)

    leafletMap.current.flyTo(
      [userPosition.lat, userPosition.lng],
      16,
      { duration: 0.8 },
    )
  }, [mapIsReady, userPosition])

  return (
    <div
      ref={mapContainer}
      className="h-full w-full"
      aria-label="OpenStreetMap of Bengaluru civic issues"
    />
  )
}

function createIssueMarker(issue, selectedId) {
  const category = findIssueCategory(issue.category)
  const markerColor = issue.status === 'resolved'
    ? '#478060'
    : category.color
  const selectedClass = issue.id === selectedId ? ' is-selected' : ''
  const markerSymbol = issue.status === 'resolved' ? '✓' : '!'
  const safeTitle = escapeHtml(issue.title)

  const markerHtml = `
    <button
      class="leaflet-issue-pin${selectedClass}"
      style="--pin-color:${markerColor}"
      aria-label="${safeTitle}"
    >
      ${markerSymbol}
    </button>
  `

  return L.marker([issue.position.lat, issue.position.lng], {
    title: issue.title,
    keyboard: true,
    icon: L.divIcon({
      className: '',
      html: markerHtml,
      iconSize: [40, 46],
      iconAnchor: [20, 42],
    }),
  })
}

function createUserLocationMarker(position) {
  return L.marker([position.lat, position.lng], {
    title: 'Your location',
    zIndexOffset: 1000,
    icon: L.divIcon({
      className: '',
      html: '<div class="leaflet-user-dot"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    }),
  })
}

function escapeHtml(value) {
  const replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }

  return value.replace(/[&<>"']/g, (character) => replacements[character])
}
