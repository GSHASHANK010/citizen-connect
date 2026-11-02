import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  Check,
  LocateFixed,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { getCurrentPosition, isInsideBengaluru } from '../../lib/location'

export default function ReportEvidenceStep({
  photo,
  position,
  onPhotoChange,
  onPositionChange,
  onLocationCaptured,
  onContinue,
}) {
  const hasValidLocation = position && isInsideBengaluru(position)
  const canContinue = Boolean(photo && hasValidLocation)

  return (
    <div className="space-y-5">
      <CameraCapture photo={photo} onPhotoChange={onPhotoChange} />

      <LiveLocationCapture
        position={position}
        onPositionChange={onPositionChange}
        onLocationCaptured={onLocationCaptured}
      />

      <PrivacyNotice />

      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className="w-full rounded-2xl bg-moss py-4 text-sm font-extrabold text-white shadow-soft transition hover:bg-[#254d38] disabled:cursor-not-allowed disabled:opacity-35"
      >
        Continue to details
      </button>
    </div>
  )
}

function CameraCapture({ photo, onPhotoChange }) {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')

  // A ref stores a real browser object without causing React to render again.
  const videoElement = useRef(null)
  const cameraStream = useRef(null)

  function stopCamera() {
    if (cameraStream.current) {
      cameraStream.current.getTracks().forEach((track) => track.stop())
      cameraStream.current = null
    }
  }

  // Stop the physical camera if this step disappears or the modal closes.
  useEffect(() => {
    return stopCamera
  }, [])

  async function startCamera() {
    setCameraError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      })

      cameraStream.current = stream
      videoElement.current.srcObject = stream
      await videoElement.current.play()
      setIsCameraActive(true)
    } catch {
      setCameraError(
        'Camera permission is required. On phones, use HTTPS or localhost and allow camera access.',
      )
    }
  }

  function captureCurrentFrame() {
    const video = videoElement.current

    if (!video || !video.videoWidth) {
      return
    }

    const canvas = document.createElement('canvas')
    const maximumWidth = 960
    const scale = Math.min(1, maximumWidth / video.videoWidth)

    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)

    const drawingContext = canvas.getContext('2d')
    drawingContext.drawImage(video, 0, 0, canvas.width, canvas.height)

    const compressedPhoto = canvas.toDataURL('image/jpeg', 0.78)
    onPhotoChange(compressedPhoto)

    stopCamera()
    setIsCameraActive(false)
  }

  function retakePhoto() {
    onPhotoChange('')

    // Wait one render so React can put the <video> element back in the page.
    window.setTimeout(startCamera, 0)
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl bg-[#17201b]">
        <div className="relative aspect-[4/3]">
          {photo ? (
            <img
              src={photo}
              alt="Your captured issue"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoElement}
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              {!isCameraActive && (
                <CameraIntroduction onStartCamera={startCamera} />
              )}
            </>
          )}

          {isCameraActive && (
            <button
              type="button"
              onClick={captureCurrentFrame}
              className="absolute bottom-5 left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-white/25"
              aria-label="Take photo"
            >
              <span className="h-11 w-11 rounded-full bg-white" />
            </button>
          )}

          {photo && (
            <button
              type="button"
              onClick={retakePhoto}
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-ink/80 px-3 py-2 text-xs font-bold text-white backdrop-blur"
            >
              <RotateCcw size={14} />
              Retake
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <p className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-alert">
          {cameraError}
        </p>
      )}
    </>
  )
}

function CameraIntroduction({ onStartCamera }) {
  return (
    <div className="absolute inset-0 grid place-items-center px-8 text-center text-white">
      <div>
        <Camera className="mx-auto mb-3 text-white/70" size={32} />
        <p className="font-display text-2xl">
          A live photo keeps reports trustworthy.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/55">
          We never access your gallery. Your browser will ask before opening
          the camera.
        </p>
        <button
          type="button"
          onClick={onStartCamera}
          className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-ink"
        >
          Open live camera
        </button>
      </div>
    </div>
  )
}

function LiveLocationCapture({
  position,
  onPositionChange,
  onLocationCaptured,
}) {
  const [locationState, setLocationState] = useState('idle')

  async function requestFreshLocation() {
    setLocationState('loading')

    try {
      const freshPosition = await getCurrentPosition()
      const isValid = isInsideBengaluru(freshPosition)

      onPositionChange(freshPosition)
      setLocationState(isValid ? 'ready' : 'outside')

      if (isValid) {
        // Send the position to App immediately so the blue map dot appears.
        onLocationCaptured(freshPosition)
      }
    } catch {
      setLocationState('error')
    }
  }

  const hasReadyLocation = locationState === 'ready'

  return (
    <div className="rounded-2xl border border-black/[.07] bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            hasReadyLocation
              ? 'bg-leaf text-moss'
              : 'bg-paper text-ink/45'
          }`}
        >
          <LocateFixed size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-ink">
            Share a fresh live location
          </p>
          <p className="mt-0.5 text-xs text-ink/45">
            {getLocationMessage(locationState, position)}
          </p>
        </div>

        {hasReadyLocation ? (
          <button
            type="button"
            onClick={requestFreshLocation}
            className="flex items-center gap-1.5 rounded-xl bg-leaf px-3 py-2 text-xs font-extrabold text-moss"
          >
            <Check size={14} />
            Refresh
          </button>
        ) : (
          <button
            type="button"
            onClick={requestFreshLocation}
            disabled={locationState === 'loading'}
            className="rounded-xl bg-moss px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50"
          >
            {locationState === 'loading' ? 'Locating…' : 'Allow location'}
          </button>
        )}
      </div>
    </div>
  )
}

function getLocationMessage(locationState, position) {
  if (locationState === 'ready') {
    return `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)} · live location captured`
  }

  if (locationState === 'outside') {
    return 'This live location appears to be outside Bengaluru.'
  }

  if (locationState === 'error') {
    return 'Live location unavailable. Check browser permission.'
  }

  return 'Required for every report, even if you located yourself earlier.'
}

function PrivacyNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-[#eeeae0] p-3 text-[11px] leading-relaxed text-ink/55">
      <ShieldCheck className="mt-0.5 shrink-0 text-moss" size={15} />
      <span>
        Location is attached to the issue—not your identity. Before public
        launch, photos should be checked automatically for faces and vehicle
        plates.
      </span>
    </div>
  )
}
