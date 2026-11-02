import { CircleHelp, Plus } from 'lucide-react'
import Brand from './Brand'

export default function AppHeader({ onOpenReport, onOpenHowItWorks }) {
  return (
    <header className="z-50 flex h-[72px] shrink-0 items-center justify-between border-b border-black/[.06] bg-paper px-4 sm:px-6">
      <div className="flex items-center gap-8">
        <Brand />

        <nav className="hidden items-center gap-1 lg:flex">
          <span className="rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-moss shadow-sm">
            Issue map
          </span>
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-ink/45 transition hover:bg-white"
          >
            How it works
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-2 rounded-xl border border-black/[.07] bg-white px-3 py-2.5 text-xs font-extrabold text-ink/60 sm:flex">
          <span className="h-2 w-2 rounded-full bg-moss" />
          Bengaluru only
        </span>

        <button
          type="button"
          onClick={onOpenReport}
          className="flex items-center gap-2 rounded-xl bg-moss px-4 py-2.5 text-xs font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
        >
          <Plus size={16} strokeWidth={2.7} />
          <span className="hidden xs:inline">Report an issue</span>
          <span className="xs:hidden">Report</span>
        </button>

        <button
          type="button"
          onClick={onOpenHowItWorks}
          className="grid h-10 w-10 place-items-center rounded-xl text-ink/45 transition hover:bg-white lg:hidden"
          aria-label="How it works"
        >
          <CircleHelp size={20} />
        </button>
      </div>
    </header>
  )
}
