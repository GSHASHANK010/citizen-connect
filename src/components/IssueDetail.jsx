import {
  ArrowUp,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Flag,
  MapPin,
  Phone,
  Share2,
  Users,
  X,
} from 'lucide-react'
import { SAMPLE_REPRESENTATIVES } from '../data/issues'
import {
  findIssueCategory,
  formatRelativeTime,
  getResolutionThreshold,
} from '../lib/issues'
import StatusPill from './StatusPill'

export default function IssueDetail({
  issue,
  directory = SAMPLE_REPRESENTATIVES,
  isPending = false,
  onClose,
  onVote,
  onResolveVote,
  onFlag,
  onNotice,
}) {
  // Returning null means “render nothing” when no report is selected.
  if (!issue) {
    return null
  }

  const category = findIssueCategory(issue.category)
  const reporterLabel = issue.isMine ? 'you' : issue.reporter

  return (
    <div className="absolute inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-black/[.07] bg-paper shadow-lift sm:w-[410px]">
      <EvidenceHeader issue={issue} onClose={onClose} />

      <div className="p-5 sm:p-6">
        <IssueSummary issue={issue} category={category} />

        <IssueActions
          issue={issue}
          isPending={isPending}
          onVote={onVote}
          onNotice={onNotice}
        />

        <ResolutionPanel
          issue={issue}
          isPending={isPending}
          onResolveVote={onResolveVote}
        />

        <CivicDirectoryPanel directory={directory} />

        <div className="mt-6 flex items-center justify-between gap-3 text-[10px] text-ink/35">
          <span>
            Reported {formatRelativeTime(issue.createdAt)} by {reporterLabel}
          </span>

          {issue.viewerHasFlagged ? (
            <span className="flex items-center gap-1 font-bold text-amber-700">
              <Flag size={11} />
              Flagged for review
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onFlag?.(issue.id)}
              disabled={isPending}
              className="flex items-center gap-1 font-bold text-ink/45 transition hover:text-alert disabled:opacity-50"
            >
              <Flag size={11} />
              Flag this report
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EvidenceHeader({ issue, onClose }) {
  return (
    <div className="relative h-56 overflow-hidden bg-[#e4e0d6]">
      {issue.photo ? (
        <img
          src={issue.photo}
          alt={`Evidence for ${issue.title}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center">
          <div className="text-center text-ink/25">
            <Camera className="mx-auto mb-2" size={30} />
            <span className="text-xs font-bold">Community photo preview</span>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 top-0 flex justify-between p-4">
        <StatusPill status={issue.status} />

        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-xl bg-white/90 text-ink shadow-soft"
          aria-label="Close details"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

function IssueSummary({ issue, category }) {
  return (
    <>
      <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-ink/40">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: category.color }}
        />
        {category.label}
        <span>·</span>
        {issue.id}
      </div>

      <h2 className="mt-2 font-display text-[30px] leading-[1.05] text-ink">
        {issue.title}
      </h2>

      <p className="mt-3 flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-ink/50">
        <MapPin size={14} className="mt-0.5 shrink-0 text-moss" />
        {formatPlace(issue)}
      </p>

      <p className="mt-5 text-sm font-medium leading-6 text-ink/70">
        {issue.description}
      </p>
    </>
  )
}

// Avoids "12th Main Rd, Indiranagar, Indiranagar" when the address already
// names the locality.
function formatPlace(issue) {
  const address = issue.address || ''
  const locality = issue.locality || ''

  if (!locality || address.toLowerCase().includes(locality.toLowerCase())) {
    return address
  }

  return `${address}, ${locality}`
}

function IssueActions({ issue, isPending, onVote, onNotice }) {
  const hasVoted = issue.viewerHasVoted
  const voteClasses = hasVoted
    ? 'border-2 border-moss bg-leaf text-moss'
    : 'bg-moss text-white'

  async function shareReport() {
    const shareUrl = new URL(window.location.href)
    shareUrl.searchParams.set('issue', issue.id)

    const shareData = {
      title: `${issue.title} · Citizen Connect`,
      text: `${issue.title} — ${issue.address}, ${issue.locality}`,
      url: shareUrl.toString(),
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }

      await navigator.clipboard.writeText(shareData.url)
      onNotice?.('Report link copied')
    } catch (error) {
      // The user closing the share sheet is not an error worth showing.
      if (error?.name !== 'AbortError') {
        onNotice?.('Could not share this report')
      }
    }
  }

  return (
    <div className="mt-5 flex gap-2">
      <button
        type="button"
        onClick={() => onVote(issue.id)}
        disabled={isPending}
        aria-pressed={hasVoted}
        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold transition disabled:opacity-60 ${voteClasses}`}
      >
        {hasVoted ? <Check size={16} /> : <ArrowUp size={16} />}
        {hasVoted ? 'You are affected' : 'This affects me'} · {issue.votes}
      </button>

      <button
        type="button"
        onClick={shareReport}
        className="grid w-12 place-items-center rounded-2xl border border-black/10 bg-white text-ink/55 transition hover:text-moss"
        aria-label="Share report"
      >
        <Share2 size={17} />
      </button>
    </div>
  )
}

function ResolutionPanel({ issue, isPending, onResolveVote }) {
  const threshold = getResolutionThreshold(issue)
  const rawProgress = (issue.resolvedVotes / threshold) * 100
  const progressPercent = Math.min(100, rawProgress)
  const isResolved = issue.status === 'resolved'
  const hasConfirmed = issue.viewerHasConfirmed

  return (
    <section className="mt-7 rounded-2xl border border-black/[.07] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-extrabold text-ink">
            Has this been fixed?
          </p>
          <p className="mt-0.5 text-[11px] text-ink/45">
            Neighbour consensus prevents false closures.
          </p>
        </div>

        <CheckCircle2
          size={22}
          className={isResolved ? 'text-emerald-600' : 'text-ink/20'}
        />
      </div>

      {isResolved ? (
        <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
          Resolved by community majority
          {hasConfirmed ? ', including your confirmation.' : '.'}
        </p>
      ) : (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-ink/40">
            <span>{issue.resolvedVotes} neighbours confirm fixed</span>
            <span>{threshold} needed</span>
          </div>

          {hasConfirmed ? (
            <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5 text-xs font-extrabold text-emerald-700">
              <Check size={14} />
              You confirmed this is fixed
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onResolveVote(issue.id)}
              disabled={isPending}
              className="mt-3 w-full rounded-xl bg-emerald-50 py-2.5 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
            >
              I can confirm it is fixed
            </button>
          )}
        </>
      )}
    </section>
  )
}

function CivicDirectoryPanel({ directory }) {
  const sourceMessage =
    directory.verificationNote ||
    (directory.mode === 'live'
      ? 'Matched from the configured civic directory service. Check each record’s source and verification date.'
      : 'Only the GBA helpline is currently verified. Representative and ward contacts must be sourced from official records before public release.')

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-moss/55">
            Who handles this area
          </p>
          <h3 className="mt-1 font-display text-xl text-ink">
            {directory.locality}
          </h3>
        </div>

        <Building2 className="text-moss/35" size={25} />
      </div>

      <div className="rounded-2xl border border-black/[.07] bg-white p-4">
        <BoundarySummary directory={directory} />

        <div className="divide-y divide-black/[.06]">
          {directory.contacts.map((contact) => (
            <ContactRow key={contact.role} contact={contact} />
          ))}
        </div>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-ink/35">
        {sourceMessage}
      </p>
    </section>
  )
}

function BoundarySummary({ directory }) {
  return (
    <div className="grid grid-cols-2 gap-3 border-b border-black/[.06] pb-4 text-[11px]">
      <div>
        <span className="text-ink/35">Ward</span>
        <p className="mt-0.5 font-extrabold text-ink">
          {directory.ward}
        </p>
      </div>

      <div>
        <span className="text-ink/35">Parliament</span>
        <p className="mt-0.5 font-extrabold text-ink">
          {directory.parliamentaryConstituency}
        </p>
      </div>

      <div>
        <span className="text-ink/35">Assembly</span>
        <p className="mt-0.5 font-extrabold text-ink">
          {directory.assemblyConstituency}
        </p>
      </div>

      <div>
        <span className="text-ink/35">Corporation</span>
        <p className="mt-0.5 font-extrabold text-ink">
          {directory.corporation}
        </p>
      </div>
    </div>
  )
}

function ContactRow({ contact }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-paper text-moss">
        {contact.phone ? <Phone size={15} /> : <Users size={15} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-ink/40">
          {contact.role}
          {contact.verified === false && (
            <span className="ml-1 text-amber-600">· unverified</span>
          )}
        </p>
        <p className="truncate text-xs font-extrabold text-ink">
          {contact.name}
        </p>
        {contact.note && (
          <p className="text-[10px] text-ink/40">{contact.note}</p>
        )}
      </div>

      {contact.phone && (
        <a
          href={`tel:${contact.phone}`}
          className="rounded-lg bg-leaf px-2.5 py-1.5 text-xs font-extrabold text-moss"
        >
          {contact.phone}
        </a>
      )}
    </div>
  )
}
