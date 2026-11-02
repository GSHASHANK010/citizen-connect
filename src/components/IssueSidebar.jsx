import { ListFilter, LoaderCircle, Search, SlidersHorizontal, WifiOff, X } from 'lucide-react'
import { CATEGORIES } from '../data/issues'
import { STATUS_FILTERS } from '../lib/issues'
import IssueCard from './IssueCard'

export default function IssueSidebar({
  issues,
  loadState = 'ready',
  isMobileOpen = false,
  onCloseMobile,
  selectedIssueId,
  pendingIssueIds = new Set(),
  search,
  activeCategory,
  activeStatus,
  filtersAreOpen,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onToggleFilters,
  onClearFilters,
  onSelectIssue,
  onVote,
}) {
  // On phones the list is hidden behind the map until the "List" button
  // opens it as a full-screen overlay. From md upwards it is always docked.
  const mobileClasses = isMobileOpen ? 'absolute inset-0 z-40 flex' : 'hidden'

  return (
    <aside
      className={`${mobileClasses} w-full flex-col border-r border-black/[.06] bg-paper md:relative md:z-20 md:flex md:w-[380px] md:shrink-0 xl:w-[420px]`}
    >
      <div className="border-b border-black/[.06] p-5">
        <div className="flex items-start justify-between gap-3">
          <SidebarHeading issueCount={issues.length} />

          <button
            type="button"
            onClick={onCloseMobile}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-ink/60 md:hidden"
            aria-label="Close list"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <SearchBox search={search} onSearchChange={onSearchChange} />

          <button
            type="button"
            onClick={onToggleFilters}
            className={getFilterButtonClasses(filtersAreOpen)}
            aria-label="Filters"
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>

        {filtersAreOpen && (
          <StatusFilters
            activeStatus={activeStatus}
            onStatusChange={onStatusChange}
          />
        )}

        <CategoryFilters
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
        />
      </div>

      <div className="scrollbar-thin flex-1 space-y-2.5 overflow-y-auto p-4">
        {loadState === 'loading' && <LoadingIssueList />}

        {loadState === 'error' && <FailedIssueList />}

        {loadState === 'ready' && issues.length === 0 && (
          <EmptyIssueList onClearFilters={onClearFilters} />
        )}

        {loadState === 'ready' &&
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              selected={issue.id === selectedIssueId}
              isPending={pendingIssueIds.has(issue.id)}
              onSelect={onSelectIssue}
              onVote={onVote}
            />
          ))}
      </div>
    </aside>
  )
}

function SidebarHeading({ issueCount }) {
  return (
    <div className="flex flex-1 items-end justify-between">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-moss/55">
          Community pulse
        </p>
        <h1 className="mt-1 font-display text-[28px] leading-tight">
          What needs fixing?
        </h1>
      </div>

      <div className="mb-1 text-right">
        <strong className="block text-lg leading-none">{issueCount}</strong>
        <span className="text-[10px] font-semibold text-ink/35">
          nearby reports
        </span>
      </div>
    </div>
  )
}

function SearchBox({ search, onSearchChange }) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-black/[.07] bg-white px-3 text-ink/35 focus-within:border-moss">
      <Search size={16} />
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent py-3 text-xs font-semibold text-ink outline-none placeholder:text-ink/30"
        placeholder="Search area or issue"
      />
    </label>
  )
}

function StatusFilters({ activeStatus, onStatusChange }) {
  return (
    <div className="mt-3 rounded-xl bg-white p-3">
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-ink/35">
        Status
      </p>

      <div className="flex gap-1">
        {STATUS_FILTERS.map((status) => {
          const isActive = activeStatus === status

          return (
            <button
              key={status}
              type="button"
              onClick={() => onStatusChange(status)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold capitalize ${
                isActive ? 'bg-moss text-white' : 'bg-paper text-ink/45'
              }`}
            >
              {status.replace('-', ' ')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CategoryFilters({ activeCategory, onCategoryChange }) {
  const visibleCategories = CATEGORIES.slice(0, 5)

  return (
    <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-0.5">
      <CategoryButton
        label="All issues"
        isActive={activeCategory === 'all'}
        onClick={() => onCategoryChange('all')}
      />

      {visibleCategories.map((category) => (
        <CategoryButton
          key={category.id}
          label={category.label}
          color={category.color}
          isActive={activeCategory === category.id}
          onClick={() => onCategoryChange(category.id)}
        />
      ))}
    </div>
  )
}

function CategoryButton({ label, color, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-extrabold ${
        isActive
          ? 'bg-ink text-white'
          : 'border border-black/[.07] bg-white text-ink/45'
      }`}
    >
      {color && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
        />
      )}
      {label}
    </button>
  )
}

function LoadingIssueList() {
  return (
    <div className="grid h-48 place-items-center text-center text-ink/40">
      <div>
        <LoaderCircle className="mx-auto animate-spin" />
        <p className="mt-3 text-sm font-extrabold">Loading reports…</p>
      </div>
    </div>
  )
}

function FailedIssueList() {
  return (
    <div className="grid h-48 place-items-center text-center text-ink/40">
      <div>
        <WifiOff className="mx-auto" />
        <p className="mt-3 text-sm font-extrabold">Reports unavailable</p>
        <p className="mt-1 text-xs">Start the API and use Retry on the map.</p>
      </div>
    </div>
  )
}

function EmptyIssueList({ onClearFilters }) {
  return (
    <div className="grid h-48 place-items-center text-center">
      <div>
        <ListFilter className="mx-auto text-ink/20" />
        <p className="mt-3 text-sm font-extrabold">No matching reports</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-2 text-xs font-bold text-moss"
        >
          Clear filters
        </button>
      </div>
    </div>
  )
}

function getFilterButtonClasses(filtersAreOpen) {
  const activeClasses = 'border-moss bg-leaf text-moss'
  const inactiveClasses = 'border-black/[.07] bg-white text-ink/45'

  return `grid w-11 place-items-center rounded-xl border transition ${
    filtersAreOpen ? activeClasses : inactiveClasses
  }`
}
