import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'

// Gracefully prevent benign third-party browser extension disconnect errors from polluting console
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg =
      event.reason?.message ||
      (typeof event.reason === 'string' ? event.reason : '')
    if (
      typeof errorMsg === 'string' &&
      (errorMsg.includes('Could not establish connection. Receiving end does not exist') ||
       errorMsg.includes('message channel closed before a response was received') ||
       errorMsg.includes('The message port closed before a response was received'))
    ) {
      event.preventDefault()
    }
  })

  // Reset cache-buster migration flag and clean query string
  try {
    sessionStorage.removeItem('__spa_upgraded')
  } catch (_) {}
  if (window.location.search.includes('spa=')) {
    const cleanSearch = window.location.search
      .replace(/[?&]spa=[^&]+/g, '')
      .replace(/^&/, '?')
    const newUrl = window.location.pathname + (cleanSearch && cleanSearch !== '?' ? cleanSearch : '') + window.location.hash
    window.history.replaceState({}, '', newUrl)
  }

  // Unregister any stale legacy service workers to ensure fresh SPA load
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
      }
    }).catch(() => {})
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
