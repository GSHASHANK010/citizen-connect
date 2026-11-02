import { useState } from 'react'
import {
  Filter,
  Info,
  List,
  LocateFixed,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  WifiOff,
  X,
} from 'lucide-react'
import { CATEGORIES } from '../data/issues'
import { STATUS_FILTERS } from '../lib/issues'

export default function MapOverlays({
  search,
  notice,
  loadState = 'ready',
  loadError = '',
  activeCategory = 'all',
  activeStatus = 'active',
  onCategoryChange,
  onStatusChange,
  onSearchChange,
  onOpenReport,
  onLocate,
  onOpenList,
  onRetryLoad,
}) {
  const [mobileFiltersAreOpen, setMobileFiltersAreOpen] = useState(false)

  return (
    <>
      <MobileSearch
        search={search}
        filtersAreOpen={mobileFiltersAreOpen}
        onSearchChange={onSearchChange}
        onToggleFilters={() => setMobileFiltersAreOpen((isOpen) => !isOpen)}
      />

      {mobileFiltersAreOpen && (
        <MobileFilterSheet
          activeCategory={activeCategory}
          activeStatus={activeStatus}
          onCategoryChange={onCategoryChange}
          onStatusChange={onStatusChange}
          onClose={() => setMobileFiltersAreOpen(false)}
        />
      )}

      <IssueLegend />

      {notice && (
        <div
          role="status"
          className="absolute left-1/2 top-4 z-40 -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white shadow-soft"
        >
          {notice}
        </div>
      )}

      {loadState === 'error' && (
        <LoadErrorBanner message={loadError} onRetry={onRetryLoad} />
      )}

      <MobileActions
        onOpenReport={onOpenReport}
        onLocate={onLocate}
        onOpenList={onOpenList}
      />
      <PilotNotice />
    </>
  )
}

function MobileSearch({ search, filtersAreOpen, onSearchChange, onToggleFilters }) {
  return (
    <div className="absolute left-3 right-3 top-3 z-30 flex items-center gap-2 md:hidden">
      <label className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 shadow-soft">
        <Search size={17} className="text-ink/35" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent py-3.5 text-xs font-semibold outline-none"
          placeholder="Search Bengaluru reports"
        />

        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </label>

      <button
        type="button"
        onClick={onToggleFilters}
        className={`grid h-11 w-11 place-items-center rounded-2xl shadow-soft ${
          filtersAreOpen ? 'bg-moss text-white' : 'bg-white text-moss'
        }`}
        aria-label="Mobile filters"
        aria-expanded={filtersAreOpen}
      >
        <Filter size={17} />
      </button>
    </div>
  )
}

// On phones the sidebar is hidden, so filters live in this small sheet.
function MobileFilterSheet({
  activeCategory,
  activeStatus,
  onCategoryChange,
  onStatusChange,
  onClose,
}) {
  return (
    <div className="absolute left-3 right-3 top-[68px] z-30 rounded-2xl bg-white p-4 shadow-lift md:hidden">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink/35">
          Filter reports
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-ink/40"
          aria-label="Close filters"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((status) => (
          <ChipButton
            key={status}
            label={status.replace('-', ' ')}
            isActive={activeStatus === status}
            onClick={() => onStatusChange(status)}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-black/[.06] pt-3">
        <ChipButton
          label="All issues"
          isActive={activeCategory === 'all'}
          onClick={() => onCategoryChange('all')}
        />
        {CATEGORIES.map((category) => (
          <ChipButton
            key={category.id}
            label={category.label}
            color={category.color}
            isActive={activeCategory === category.id}
            onClick={() => onCategoryChange(category.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ChipButton({ label, color, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold capitalize ${
        isActive ? 'bg-moss text-white' : 'bg-paper text-ink/45'
      }`}
    >
      {color && (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      )}
      {label}
    </button>
  )
}

function LoadErrorBanner({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="absolute left-1/2 top-[72px] z-40 flex w-[min(92vw,460px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-alert/30 bg-white px-4 py-3 shadow-lift md:top-20"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 text-alert">
        <WifiOff size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-ink">Could not load reports</p>
        <p className="truncate text-[11px] text-ink/50">{message}</p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-xl bg-moss px-3 py-2 text-xs font-extrabold text-white"
      >
        <RefreshCw size={13} />
        Retry
      </button>
    </div>
  )
}

function IssueLegend() {
  return (
    <div className="absolute left-4 top-20 z-30 hidden rounded-xl bg-white/95 p-2 shadow-soft backdrop-blur md:block">
      <div className="flex items-center gap-2 px-1 pb-1 text-[9px] font-extrabold uppercase tracking-wider text-ink/35">
        <Info size={11} />
        Live issue key
      </div>

      <div className="flex gap-3 px-1.5 py-1 text-[10px] font-bold text-ink/55">
        <LegendItem colorClass="bg-alert" label="Open" />
        <LegendItem colorClass="bg-amber-500" label="Acknowledged" />
        <LegendItem colorClass="bg-emerald-600" label="Fixed" />
      </div>
    </div>
  )
}

function LegendItem({ colorClass, label }) {
  return (
    <span className="flex items-center gap-1">
      <i className={`h-2 w-2 rounded-full ${colorClass}`} />
      {label}
    </span>
  )
}

function MobileActions({ onOpenReport, onLocate, onOpenList }) {
  return (
    <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 md:hidden">
      <button
        type="button"
        onClick={onOpenList}
        className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-moss shadow-lift"
        aria-label="Show report list"
      >
        <List size={18} />
      </button>

      <button
        type="button"
        onClick={onOpenReport}
        className="flex items-center gap-2 whitespace-nowrap rounded-2xl bg-moss px-5 py-3.5 text-sm font-extrabold text-white shadow-lift"
      >
        <Plus size={18} />
        Report issue
      </button>

      <button
        type="button"
        onClick={onLocate}
        className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-moss shadow-lift"
        aria-label="Use my location"
      >
        <LocateFixed size={18} />
      </button>
    </div>
  )
}

function PilotNotice() {
  return (
    <div className="absolute bottom-4 left-4 z-30 hidden items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-soft backdrop-blur lg:flex">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-leaf text-moss">
        <ShieldCheck size={17} />
      </div>

      <div>
        <p className="text-xs font-extrabold">Bengaluru-only pilot</p>
        <p className="text-[10px] text-ink/40">
          Community reports are public. Personal data is not.
        </p>
      </div>
    </div>
  )
}
