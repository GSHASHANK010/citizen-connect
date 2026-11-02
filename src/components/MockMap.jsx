import { Minus, Plus } from 'lucide-react'
import { findIssueCategory } from '../lib/issues'

// The preview is a hand-drawn fallback, so this extent only covers the central
// sample area. OpenStreetMap is the real no-key map used by default.
const PREVIEW_EXTENT = {
  north: 13.015,
  south: 12.925,
  east: 77.675,
  west: 77.535,
}

export default function MockMap({
  issues,
  selectedId,
  onSelect,
  userPosition,
}) {
  return (
    <div
      className="mock-map absolute inset-0 overflow-hidden bg-[#e8e6df]"
      aria-label="Bengaluru issue map preview"
    >
      <PreviewMapBackground />

      {issues.map((issue) => (
        <PreviewIssuePin
          key={issue.id}
          issue={issue}
          isSelected={issue.id === selectedId}
          onSelect={onSelect}
        />
      ))}

      {userPosition && <PreviewUserPin position={userPosition} />}

      <FakeZoomControls />

      <div className="absolute bottom-3 left-3 rounded-md bg-white/80 px-2 py-1 text-[9px] font-bold text-ink/45 backdrop-blur">
        Preview map · Add key for Google Maps
      </div>
    </div>
  )
}

function PreviewMapBackground() {
  return (
    <>
      <div className="map-grid absolute inset-0 opacity-70" />
      <div className="map-park absolute left-[8%] top-[12%] h-[25%] w-[19%] -rotate-6 rounded-[42%] bg-[#ccd9c4]" />
      <div className="map-park absolute bottom-[6%] right-[13%] h-[18%] w-[24%] rotate-12 rounded-[45%] bg-[#d4dfca]" />

      <div className="absolute left-[14%] top-[48%] h-3 w-[72%] -rotate-6 rounded-full bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,.05)]" />
      <div className="absolute left-[53%] top-[-10%] h-[120%] w-2 rotate-[18deg] rounded-full bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,.05)]" />
      <div className="absolute left-[27%] top-0 h-full w-1 -rotate-[9deg] bg-[#f8c86a]/60" />

      <div className="absolute left-[18%] top-[28%] font-display text-3xl text-ink/[.08]">
        Bengaluru
      </div>

      <span className="map-label left-[59%] top-[25%]">Indiranagar</span>
      <span className="map-label left-[46%] top-[62%]">Domlur</span>
      <span className="map-label left-[75%] top-[53%]">Kodihalli</span>
      <span className="map-label left-[23%] top-[72%]">Shantinagar</span>
    </>
  )
}

function PreviewIssuePin({ issue, isSelected, onSelect }) {
  const category = findIssueCategory(issue.category)
  const markerColor = issue.status === 'resolved'
    ? '#478060'
    : category.color
  const markerSymbol = issue.status === 'resolved' ? '✓' : '!'
  const sizeClasses = isSelected
    ? 'h-11 w-11 -translate-x-1/2 -translate-y-1/2 scale-110'
    : 'h-8 w-8 -translate-x-1/2 -translate-y-1/2 hover:scale-110'

  return (
    <button
      type="button"
      className={`issue-pin absolute z-20 grid place-items-center rounded-full border-[3px] border-white text-white shadow-lg transition ${sizeClasses}`}
      style={{
        ...positionToPercent(issue.position),
        background: markerColor,
      }}
      onClick={() => onSelect(issue.id)}
      title={issue.title}
    >
      <span className="text-[10px] font-black">{markerSymbol}</span>
    </button>
  )
}

function PreviewUserPin({ position }) {
  return (
    <div
      className="user-dot absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-blue-500"
      style={positionToPercent(position)}
      title="Your location"
    />
  )
}

function FakeZoomControls() {
  return (
    <div className="absolute bottom-24 right-4 z-30 flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-soft">
      <button
        type="button"
        className="grid h-10 w-10 place-items-center border-b border-black/5 text-ink/60 hover:bg-paper"
        aria-label="Zoom in"
      >
        <Plus size={17} />
      </button>

      <button
        type="button"
        className="grid h-10 w-10 place-items-center text-ink/60 hover:bg-paper"
        aria-label="Zoom out"
      >
        <Minus size={17} />
      </button>
    </div>
  )
}

function positionToPercent(position) {
  const horizontalRange = PREVIEW_EXTENT.east - PREVIEW_EXTENT.west
  const verticalRange = PREVIEW_EXTENT.north - PREVIEW_EXTENT.south

  const horizontalPercent =
    ((position.lng - PREVIEW_EXTENT.west) / horizontalRange) * 100
  const verticalPercent =
    ((PREVIEW_EXTENT.north - position.lat) / verticalRange) * 100

  return {
    left: `${horizontalPercent}%`,
    top: `${verticalPercent}%`,
  }
}
