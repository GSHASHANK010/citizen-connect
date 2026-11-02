import { Component } from 'react'

// A class component is the only way to catch render errors in React.
// Instead of a blank page, people see a short message and a reload button.
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Citizen Connect crashed:', error)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="grid min-h-dvh place-items-center bg-paper p-6 text-center text-ink">
        <div>
          <h1 className="font-display text-3xl">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink/60">
            Please reload the page. If it keeps happening, the API may be down.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-moss px-5 py-3 text-sm font-extrabold text-white"
          >
            Reload
          </button>
        </div>
      </main>
    )
  }
}
