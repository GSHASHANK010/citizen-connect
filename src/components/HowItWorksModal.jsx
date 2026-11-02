import { Camera, CheckCircle2, MapPin, ShieldCheck, Users, X } from 'lucide-react'

const STEPS = [
  {
    Icon: Camera,
    title: 'Take a live photo',
    text: 'Reports need a fresh camera photo, never a gallery upload. That keeps the map trustworthy.',
  },
  {
    Icon: MapPin,
    title: 'Share your live location',
    text: 'Your phone pins the exact spot. Only locations inside Bengaluru are accepted.',
  },
  {
    Icon: Users,
    title: 'Neighbours confirm it matters',
    text: 'Anyone affected taps “This affects me”. Each neighbour counts once, and a second tap removes the vote.',
  },
  {
    Icon: CheckCircle2,
    title: 'The community closes it',
    text: 'A report is marked fixed only when a majority of affected neighbours (at least three) confirm it.',
  },
]

export default function HowItWorksModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-title"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-paper p-6 shadow-lift sm:max-w-[560px] sm:rounded-[28px] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-moss/55">
              Citizen Connect
            </p>
            <h2 id="how-it-works-title" className="mt-1 font-display text-3xl text-ink">
              How it works
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-ink/60"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <ol className="mt-6 space-y-4">
          {STEPS.map(({ Icon, title, text }, index) => (
            <li key={title} className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf text-moss">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-ink">
                  {index + 1}. {title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink/60">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#eeeae0] p-4 text-xs leading-relaxed text-ink/60">
          <ShieldCheck className="mt-0.5 shrink-0 text-moss" size={16} />
          <p>
            You appear as an anonymous “Neighbour #” number. Reports, photos, and
            locations are public; your identity is not. Please do not photograph
            people or number plates. Use “Flag this report” on anything that
            looks fake or inappropriate.
          </p>
        </div>

        <p className="mt-4 text-[11px] text-ink/40">
          For emergencies call the GBA helpline on 1533. Citizen Connect is a
          community map and does not replace official complaint channels.
        </p>
      </div>
    </div>
  )
}
