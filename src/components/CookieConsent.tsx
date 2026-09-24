import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('pdf_cookie_consent')
      if (!consent) {
        // Small delay to prevent layout pop
        const timer = setTimeout(() => setShowBanner(true), 800)
        return () => clearTimeout(timer)
      }
    } catch {
      // LocalStorage access restricted in some iframes/modes
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem('pdf_cookie_consent', 'accepted')
    } catch {
      // Ignore storage errors
    }
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <aside
      aria-label="Cookie Consent Banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-5 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-surface-200 text-surface-800 text-xs sm:text-sm animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">🍪</span>
        <div className="flex-1 space-y-2">
          <p className="font-bold text-surface-900 text-sm">
            Cookie & Privacy Notice
          </p>
          <p className="text-surface-600 text-xs leading-relaxed">
            We and our partners (including Google AdSense) use cookies to analyze web traffic, remember preferences, and serve personalized ads. Read our{' '}
            <Link to="/privacy" className="text-primary-600 font-semibold underline hover:text-primary-700">
              Privacy & Cookie Policy
            </Link>{' '}
            for full details.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAccept}
              className="flex-1 py-2 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Accept & Continue
            </button>
            <Link
              to="/privacy"
              onClick={handleAccept}
              className="py-2 px-3 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium text-xs transition-colors"
            >
              Manage
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
