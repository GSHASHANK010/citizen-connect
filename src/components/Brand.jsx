import { MapPin } from 'lucide-react'

export default function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-moss text-white shadow-soft">
        <MapPin size={19} strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[21px] tracking-tight text-ink">
            Citizen Connect
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-[.22em] text-moss/60">
            Bengaluru, together
          </div>
        </div>
      )}
    </div>
  )
}
