import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import AdSlot from './AdSlot'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <AdSlot id="global-tool-bottom" className="max-w-5xl mx-auto px-4 w-full" />
      <Footer />
    </div>
  )
}
