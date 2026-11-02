// Keep one shared Promise so multiple components never add Google's script
// more than once.
let googleMapsLoadPromise

export function loadGoogleMaps(apiKey) {
  const googleIsAlreadyLoaded = window.google?.maps?.importLibrary

  if (googleIsAlreadyLoaded) {
    return Promise.resolve(window.google.maps)
  }

  if (googleMapsLoadPromise) {
    return googleMapsLoadPromise
  }

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    const callbackName = `__citizenConnectMapsReady_${Date.now()}`
    const scriptElement = document.createElement('script')

    const queryParameters = new URLSearchParams({
      key: apiKey,
      loading: 'async',
      callback: callbackName,
      v: 'weekly',
    })

    scriptElement.src =
      `https://maps.googleapis.com/maps/api/js?${queryParameters}`
    scriptElement.async = true

    scriptElement.onerror = () => {
      reject(new Error('Google Maps could not be loaded.'))
    }

    window[callbackName] = () => {
      delete window[callbackName]
      resolve(window.google.maps)
    }

    document.head.appendChild(scriptElement)
  })

  return googleMapsLoadPromise
}
