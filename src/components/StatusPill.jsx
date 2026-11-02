import { CheckCircle2, Clock3, Radio } from 'lucide-react'

const STATUS_STYLES = {
  open: {
    label: 'Open',
    Icon: Radio,
    colors: 'bg-red-50 text-alert',
  },
  'in-progress': {
    label: 'Acknowledged',
    Icon: Clock3,
    colors: 'bg-amber-50 text-amber-700',
  },
  resolved: {
    label: 'Resolved',
    Icon: CheckCircle2,
    colors: 'bg-emerald-50 text-emerald-700',
  },
}

export default function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.open
  const { label, Icon, colors } = style

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${colors}`}
    >
      <Icon size={11} />
      {label}
    </span>
  )
}
