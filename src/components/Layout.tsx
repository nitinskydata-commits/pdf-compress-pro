import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import AdSlot from './AdSlot'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <AdSlot id="global-tool-bottom" className="max-w-5xl mx-auto px-4 w-full" />
      <Footer />
    </div>
  )
}
