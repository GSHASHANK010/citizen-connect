import { MapPin } from 'lucide-react'
import { CATEGORIES } from '../../data/issues'

export default function ReportDetailsStep({
  form,
  photo,
  position,
  isSubmitting = false,
  submitError = '',
  fieldErrors = {},
  onFieldChange,
}) {
  return (
    <div className="space-y-5">
      <CategoryPicker
        selectedCategory={form.category}
        onCategoryChange={(category) => onFieldChange('category', category)}
      />

      <label className="block">
        <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-ink/50">
          Short title
        </span>
        <input
          required
          maxLength={70}
          value={form.title}
          onChange={(event) => onFieldChange('title', event.target.value)}
          placeholder="e.g. Deep pothole in left lane"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition placeholder:text-ink/25 focus:border-moss"
        />
        <FieldError message={fieldErrors.title} />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-ink/50">
          What should people know?
        </span>
        <textarea
          required
          rows="4"
          maxLength={300}
          value={form.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
          placeholder="Describe the hazard and where exactly it is…"
          className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition placeholder:text-ink/25 focus:border-moss"
        />
        <FieldError message={fieldErrors.description} />
      </label>

      <EvidenceSummary photo={photo} position={position} />
      <FieldError message={fieldErrors.position || fieldErrors.photo} />

      {submitError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-alert"
        >
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-moss py-4 text-sm font-extrabold text-white shadow-soft transition hover:bg-[#254d38] disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? 'Publishing…' : 'Publish Bengaluru report'}
      </button>

      <p className="text-center text-[10px] leading-relaxed text-ink/35">
        By publishing, you confirm this is a genuine public-infrastructure
        issue and contains no sensitive personal information.
      </p>
    </div>
  )
}

function FieldError({ message }) {
  if (!message) {
    return null
  }

  return <p className="mt-1.5 text-[11px] font-semibold text-alert">{message}</p>
}

function CategoryPicker({ selectedCategory, onCategoryChange }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-extrabold uppercase tracking-wider text-ink/50">
        What kind of issue is this?
      </legend>

      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={`rounded-2xl border px-2 py-3 text-xs font-extrabold transition ${
                isSelected
                  ? 'border-moss bg-leaf text-moss'
                  : 'border-black/[.07] bg-white text-ink/55 hover:border-moss/30'
              }`}
            >
              <span
                className="mx-auto mb-2 block h-2.5 w-2.5 rounded-full"
                style={{ background: category.color }}
              />
              {category.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function EvidenceSummary({ photo, position }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
      <img
        src={photo}
        alt="Report evidence"
        className="h-14 w-16 rounded-xl object-cover"
      />

      <MapPin size={17} className="ml-1 shrink-0 text-moss" />

      <div className="min-w-0">
        <p className="text-xs font-extrabold text-ink">
          Live photo + precise pin
        </p>
        <p className="truncate text-[11px] text-ink/45">
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </p>
      </div>
    </div>
  )
}
