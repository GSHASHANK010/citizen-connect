import { ArrowUp, ChevronRight, MapPin } from 'lucide-react'
import { findIssueCategory, formatRelativeTime } from '../lib/issues'
import StatusPill from './StatusPill'

export default function IssueCard({
  issue,
  selected,
  isPending = false,
  onSelect,
  onVote,
}) {
  const category = findIssueCategory(issue.category)

  const selectedClasses = 'border-moss bg-white shadow-soft'
  const normalClasses =
    'border-black/[.07] bg-white/70 hover:border-moss/30 hover:bg-white'

  function handleCardClick() {
    onSelect(issue.id)
  }

  function handleVoteClick(event) {
    // Without this, the click would also bubble up and open the card.
    event.stopPropagation()
    onVote(issue.id)
  }

  return (
    <article
      className={`group cursor-pointer rounded-2xl border p-4 transition-all ${
        selected ? selectedClasses : normalClasses
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        <CategoryDot color={category.color} />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-2">
            <StatusPill status={issue.status} />
            <span className="text-[11px] font-semibold text-ink/40">
              {formatRelativeTime(issue.createdAt)}
            </span>
          </div>

          <h3 className="line-clamp-1 text-sm font-extrabold tracking-tight text-ink">
            {issue.title}
          </h3>

          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-ink/45">
            <MapPin size={12} />
            <span className="truncate">{issue.address}</span>
          </p>

          <div className="mt-3 flex items-center justify-between">
            <VoteButton
              issue={issue}
              isPending={isPending}
              onClick={handleVoteClick}
            />

            <span className="flex items-center gap-1 text-[11px] font-bold text-ink/35 transition group-hover:text-moss">
              View report
              <ChevronRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

// The button looks "filled" once this neighbour has voted. Clicking again
// removes the vote, so one person can never count more than once.
function VoteButton({ issue, isPending, onClick }) {
  const hasVoted = issue.viewerHasVoted
  const colorClasses = hasVoted
    ? 'bg-moss text-white hover:bg-[#254d38]'
    : 'bg-paper text-moss hover:bg-leaf'

  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition disabled:opacity-50 ${colorClasses}`}
      onClick={onClick}
      disabled={isPending}
      aria-pressed={hasVoted}
      aria-label={
        hasVoted
          ? `Remove your vote from ${issue.title}`
          : `Upvote ${issue.title}`
      }
      title={hasVoted ? 'You are affected · click to undo' : 'This affects me'}
    >
      <ArrowUp size={13} strokeWidth={2.5} />
      {issue.votes}
    </button>
  )
}

function CategoryDot({ color }) {
  return (
    <div
      className="mt-0.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white"
      style={{
        background: color,
        boxShadow: `0 0 0 1px ${color}40`,
      }}
    />
  )
}
