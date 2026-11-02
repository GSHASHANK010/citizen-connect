// This rectangle is an early frontend check, not an official GBA boundary.
// A production backend should check the point against an official polygon.
export const BENGALURU_BOUNDS = {
  north: 13.18,
  south: 12.73,
  east: 77.86,
  west: 77.34,
}

export const DEFAULT_CENTER = {
  lat: 12.9716,
  lng: 77.5946,
}

export function isInsideBengaluru(position) {
  const isBelowNorthEdge = position.lat <= BENGALURU_BOUNDS.north
  const isAboveSouthEdge = position.lat >= BENGALURU_BOUNDS.south
  const isLeftOfEastEdge = position.lng <= BENGALURU_BOUNDS.east
  const isRightOfWestEdge = position.lng >= BENGALURU_BOUNDS.west

  return (
    isBelowNorthEdge &&
    isAboveSouthEdge &&
    isLeftOfEastEdge &&
    isRightOfWestEdge
  )
}

export function getCurrentPosition() {
  // The browser geolocation API uses callbacks. Wrapping it in a Promise lets
  // the rest of the app use the easier async/await syntax.
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported by this browser.'))
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    }

    function handleSuccess(browserPosition) {
      const { coords, timestamp } = browserPosition

      resolve({
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        capturedAt: timestamp || Date.now(),
      })
    }

    function handleError() {
      reject(
        new Error(
          'We could not access your location. Check browser permissions and try again.',
        ),
      )
    }

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      options,
    )
  })
}
