import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import { apiUrl } from '../../utils/api'
import { useSiteLogo } from '../../utils/toolStatus'

export default function AdminLayout() {
  const siteLogo = useSiteLogo()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }

    fetch(apiUrl('/api/auth/verify'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401 || !res.ok) {
          localStorage.removeItem('token')
          localStorage.removeItem('adminUser')
          navigate('/admin/login', { replace: true })
        }
      })
      .catch(() => {
        // Allow transient network drop without immediate logout
      })
  }, [token, navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('adminUser')
    navigate('/admin/login')
  }

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '📈' },
    { to: '/admin/messages', label: 'Messages', icon: '📬' },
    { to: '/admin/ads', label: 'Ad Manager', icon: '📢' },
    { to: '/admin/compressions', label: 'Compressions', icon: '📄' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📊' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ]

  if (!token) {
    return null
  }

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col md:flex-row">
      <SEOHead
        title="Admin Control Center — PDFCompress Pro"
        description="Administrative portal for PDFCompress Pro analytics, advertisement placements, and system telemetry."
        canonical="/admin"
      />

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-900 text-white sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2 font-bold text-base tracking-tight">
          {siteLogo && siteLogo !== '/logo.png' && siteLogo.length > 50 ? (
            <img src={siteLogo} alt="Logo" className="h-7 max-h-7 w-auto max-w-[110px] object-contain rounded-lg bg-white/10 p-0.5" />
          ) : (
            <span className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-xs text-white">P</span>
          )}
          <span>Admin Portal</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-surface-800 text-surface-200 hover:text-white"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-surface-900 text-surface-300 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-surface-800">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
              {siteLogo && siteLogo !== '/logo.png' && siteLogo.length > 50 ? (
                <img src={siteLogo} alt="Logo" className="h-8 max-h-8 w-auto max-w-[130px] object-contain rounded-lg bg-white/10 p-0.5" />
              ) : (
                <span className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-sm font-black shadow-md">
                  P
                </span>
              )}
              <span>PDFCompress<span className="text-primary-400">Pro</span></span>
            </Link>
            <div className="mt-2 text-xs text-surface-500 font-mono">
              Admin Workspace v2.4
            </div>
          </div>

          {/* Nav items */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to === '/admin/dashboard' && location.pathname === '/admin')
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-900/30'
                      : 'text-surface-400 hover:text-white hover:bg-surface-800'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-surface-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-surface-400 hover:text-white hover:bg-surface-800 transition-all"
          >
            <span>🌐</span>
            <span>View Public Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-danger-400 hover:text-white hover:bg-danger-600/20 transition-all text-left"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
