import { useCallback, useEffect, useMemo, useState } from 'react'
import AppHeader from './components/AppHeader'
import IssueDetail from './components/IssueDetail'
import IssueSidebar from './components/IssueSidebar'
import MapOverlays from './components/MapOverlays'
import MapView from './components/MapView'
import HowItWorksModal from './components/HowItWorksModal'
import ReportModal from './components/ReportModal'
import {
  confirmResolved,
  createIssue,
  fetchIssues,
  flagIssue,
  toggleAffectedVote,
} from './lib/api'
import { lookupCivicDirectory } from './lib/civicDirectory'
import { filterIssues, replaceIssue } from './lib/issues'
import { getCurrentPosition, isInsideBengaluru } from './lib/location'

const ISSUE_QUERY_PARAM = 'issue'

export default function App() {
  // State is information that can change while the app is open.
  const [issues, setIssues] = useState([])
  const [loadState, setLoadState] = useState('loading') // loading | ready | error
  const [loadError, setLoadError] = useState('')
  const [selectedIssueId, setSelectedIssueId] = useState(readIssueIdFromUrl)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false)
  const [isMobileListOpen, setIsMobileListOpen] = useState(false)
  const [areFiltersOpen, setAreFiltersOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeStatus, setActiveStatus] = useState('active')
  const [searchText, setSearchText] = useState('')
  const [userPosition, setUserPosition] = useState(null)
  const [notice, setNotice] = useState('')
  const [civicDirectory, setCivicDirectory] = useState(null)

  // IDs of reports whose vote request is still travelling to the server.
  // Buttons for these are disabled so a fast double-click cannot send twice.
  const [pendingIssueIds, setPendingIssueIds] = useState(() => new Set())

  // Re-render once a minute so "18 min ago" labels stay fresh.
  const [, setClockTick] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTick((tick) => tick + 1)
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [])

  // Fetches every report. State is only updated inside the promise
  // callbacks, i.e. after the network reply arrives.
  const loadIssues = useCallback(() => {
    return fetchIssues().then(
      (serverIssues) => {
        setIssues(serverIssues)
        setLoadState('ready')
      },
      (error) => {
        setLoadError(error.message)
        setLoadState('error')
      },
    )
  }, [])

  // Load every report from the API when the app opens.
  useEffect(() => {
    loadIssues()
  }, [loadIssues])

  function retryLoad() {
    setLoadState('loading')
    setLoadError('')
    loadIssues()
  }

  // visibleIssues is calculated from state. It does not need its own state.
  const visibleIssues = useMemo(() => {
    return filterIssues(issues, {
      category: activeCategory,
      status: activeStatus,
      search: searchText,
    })
  }, [issues, activeCategory, activeStatus, searchText])

  const selectedIssue = issues.find(
    (issue) => issue.id === selectedIssueId,
  )

  // Keep ?issue=ID in the address bar so a report link can be shared.
  useEffect(() => {
    writeIssueIdToUrl(selectedIssueId)
  }, [selectedIssueId])

  // useCallback keeps the same function between renders. This prevents map
  // marker effects from rebuilding only because the App component rendered.
  const handleSelectIssue = useCallback((issueId) => {
    setSelectedIssueId(issueId)
  }, [])

  // Whenever a different report is selected, ask the civic-directory adapter
  // which ward, MLA, MP, and authority are responsible for its coordinate.
  const selectedLat = selectedIssue?.position?.lat
  const selectedLng = selectedIssue?.position?.lng

  useEffect(() => {
    let shouldUseResult = true

    async function loadDirectoryForSelectedIssue() {
      if (selectedLat === undefined || selectedLng === undefined) {
        return
      }

      const directory = await lookupCivicDirectory({
        lat: selectedLat,
        lng: selectedLng,
      })

      if (shouldUseResult) {
        setCivicDirectory(directory)
      }
    }

    loadDirectoryForSelectedIssue()

    // React calls this cleanup before starting a new lookup. It prevents an
    // older, slower response from replacing a newer selection.
    return () => {
      shouldUseResult = false
    }
  }, [selectedLat, selectedLng])

  function showNotice(message, durationMs = 2600) {
    setNotice(message)

    if (durationMs > 0) {
      window.setTimeout(() => {
        setNotice((current) => (current === message ? '' : current))
      }, durationMs)
    }
  }

  function markPending(issueId, isPending) {
    setPendingIssueIds((current) => {
      const next = new Set(current)

      if (isPending) {
        next.add(issueId)
      } else {
        next.delete(issueId)
      }

      return next
    })
  }

  // Shared by both vote buttons: send the request, swap in the fresh issue.
  async function sendVote(issueId, voteRequest) {
    if (pendingIssueIds.has(issueId)) {
      return
    }

    markPending(issueId, true)

    try {
      const updatedIssue = await voteRequest(issueId)
      setIssues((currentIssues) => replaceIssue(currentIssues, updatedIssue))
    } catch (error) {
      showNotice(error.message, 3600)
    } finally {
      markPending(issueId, false)
    }
  }

  async function handleLocateUser() {
    showNotice('Locating…', 0)

    try {
      const position = await getCurrentPosition()

      if (!isInsideBengaluru(position)) {
        showNotice('Outside Bengaluru coverage')
        return
      }

      setUserPosition(position)
      showNotice('Location found')
    } catch (error) {
      showNotice(error.message, 3600)
    }
  }

  // Called by ReportModal. Throws so the modal can show the server's message.
  async function handleCreateIssue(reportForm) {
    const newIssue = await createIssue(reportForm)

    setIssues((currentIssues) => [newIssue, ...currentIssues])
    setUserPosition(newIssue.position)
    setSelectedIssueId(newIssue.id)
    showNotice(`Published ${newIssue.id}`)
  }

  function handleAffectedVote(issueId) {
    sendVote(issueId, toggleAffectedVote)
  }

  function handleResolutionVote(issueId) {
    sendVote(issueId, confirmResolved)
  }

  async function handleFlag(issueId) {
    await sendVote(issueId, flagIssue)
    showNotice('Thanks. A moderator will review this report.')
  }

  function clearAllFilters() {
    setSearchText('')
    setActiveCategory('all')
    setActiveStatus('active')
  }

  function openReportModal() {
    setIsReportModalOpen(true)
  }

  function closeReportModal() {
    setIsReportModalOpen(false)
  }

  return (
    <main className="flex h-dvh min-h-[620px] flex-col overflow-hidden bg-paper text-ink">
      <AppHeader
        onOpenReport={openReportModal}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      <section className="relative flex min-h-0 flex-1">
        <IssueSidebar
          issues={visibleIssues}
          loadState={loadState}
          isMobileOpen={isMobileListOpen}
          onCloseMobile={() => setIsMobileListOpen(false)}
          selectedIssueId={selectedIssueId}
          pendingIssueIds={pendingIssueIds}
          search={searchText}
          activeCategory={activeCategory}
          activeStatus={activeStatus}
          filtersAreOpen={areFiltersOpen}
          onSearchChange={setSearchText}
          onCategoryChange={setActiveCategory}
          onStatusChange={setActiveStatus}
          onToggleFilters={() => setAreFiltersOpen((isOpen) => !isOpen)}
          onClearFilters={clearAllFilters}
          onSelectIssue={handleSelectIssue}
          onVote={handleAffectedVote}
        />

        <div className="relative min-w-0 flex-1">
          <MapView
            issues={visibleIssues}
            selectedId={selectedIssueId}
            userPosition={userPosition}
            onSelect={handleSelectIssue}
            onLocate={handleLocateUser}
          />

          <MapOverlays
            search={searchText}
            notice={notice}
            loadState={loadState}
            loadError={loadError}
            activeCategory={activeCategory}
            activeStatus={activeStatus}
            onCategoryChange={setActiveCategory}
            onStatusChange={setActiveStatus}
            onSearchChange={setSearchText}
            onOpenReport={openReportModal}
            onLocate={handleLocateUser}
            onOpenList={() => setIsMobileListOpen(true)}
            onRetryLoad={retryLoad}
          />
        </div>

        <IssueDetail
          issue={selectedIssue}
          directory={civicDirectory || undefined}
          isPending={selectedIssue ? pendingIssueIds.has(selectedIssue.id) : false}
          onClose={() => setSelectedIssueId(null)}
          onVote={handleAffectedVote}
          onResolveVote={handleResolutionVote}
          onFlag={handleFlag}
          onNotice={showNotice}
        />
      </section>

      {isHowItWorksOpen && (
        <HowItWorksModal onClose={() => setIsHowItWorksOpen(false)} />
      )}

      {isReportModalOpen && (
        <ReportModal
          onClose={closeReportModal}
          onSubmit={handleCreateIssue}
          onLocationCaptured={setUserPosition}
        />
      )}
    </main>
  )
}

function readIssueIdFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get(ISSUE_QUERY_PARAM)
}

function writeIssueIdToUrl(issueId) {
  const url = new URL(window.location.href)

  if (issueId) {
    url.searchParams.set(ISSUE_QUERY_PARAM, issueId)
  } else {
    url.searchParams.delete(ISSUE_QUERY_PARAM)
  }

  window.history.replaceState(null, '', url)
}
