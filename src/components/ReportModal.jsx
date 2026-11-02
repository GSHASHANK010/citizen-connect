import { useState } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { isInsideBengaluru } from '../lib/location'
import ReportDetailsStep from './report/ReportDetailsStep'
import ReportEvidenceStep from './report/ReportEvidenceStep'

const EVIDENCE_STEP = 1
const DETAILS_STEP = 2

const EMPTY_FORM = {
  category: 'pothole',
  title: '',
  description: '',
}

export default function ReportModal({
  onClose,
  onSubmit,
  onLocationCaptured,
}) {
  const [currentStep, setCurrentStep] = useState(EVIDENCE_STEP)
  const [form, setForm] = useState(EMPTY_FORM)
  const [photo, setPhoto] = useState('')
  const [position, setPosition] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const isEvidenceStep = currentStep === EVIDENCE_STEP
  const heading = isEvidenceStep
    ? 'Capture what you see'
    : 'Tell neighbours what happened'

  function updateFormField(fieldName, newValue) {
    setForm((currentForm) => ({
      ...currentForm,
      [fieldName]: newValue,
    }))
  }

  async function submitReport(event) {
    event.preventDefault()

    const hasValidEvidence =
      photo && position && isInsideBengaluru(position)

    if (!hasValidEvidence || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setFieldErrors({})

    try {
      // onSubmit sends the report to the API and resolves once it is saved.
      await onSubmit({
        ...form,
        photo,
        position,
        address: `Pinned at ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`,
      })

      onClose()
    } catch (error) {
      setSubmitError(error.message || 'Could not publish the report.')
      setFieldErrors(error.details || {})
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
    >
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-paper shadow-lift sm:max-w-[650px] sm:rounded-[28px]">
        <ModalHeader
          currentStep={currentStep}
          heading={heading}
          onGoBack={() => setCurrentStep(EVIDENCE_STEP)}
          onClose={onClose}
        />

        <form onSubmit={submitReport} className="p-5 sm:p-7">
          {isEvidenceStep ? (
            <ReportEvidenceStep
              photo={photo}
              position={position}
              onPhotoChange={setPhoto}
              onPositionChange={setPosition}
              onLocationCaptured={onLocationCaptured}
              onContinue={() => setCurrentStep(DETAILS_STEP)}
            />
          ) : (
            <ReportDetailsStep
              form={form}
              photo={photo}
              position={position}
              isSubmitting={isSubmitting}
              submitError={submitError}
              fieldErrors={fieldErrors}
              onFieldChange={updateFormField}
            />
          )}
        </form>
      </div>
    </div>
  )
}

function ModalHeader({ currentStep, heading, onGoBack, onClose }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[.06] bg-paper/95 px-5 py-4 backdrop-blur sm:px-7">
      <div className="flex items-center gap-3">
        {currentStep === DETAILS_STEP && (
          <button
            type="button"
            onClick={onGoBack}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white text-ink/60"
            aria-label="Back to evidence"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-moss/55">
            New civic report · Step {currentStep} of 2
          </p>
          <h2 id="report-title" className="font-display text-2xl text-ink">
            {heading}
          </h2>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="grid h-9 w-9 place-items-center rounded-xl text-ink/50 transition hover:bg-white"
        aria-label="Close report"
      >
        <X size={19} />
      </button>
    </header>
  )
}
