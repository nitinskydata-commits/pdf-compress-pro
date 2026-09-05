import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { tools, categories, SITE_NAME } from '../data/tools'
import { useDisabledToolsList } from '../utils/toolStatus'

export default function Header() {
  const disabledTools = useDisabledToolsList()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [toolsDropdown, setToolsDropdown] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setToolsDropdown(false)
    document.body.style.overflow = ''
  }, [location.pathname])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-black/[0.04]' : 'bg-white/80 backdrop-blur-md'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" aria-label={SITE_NAME}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow">
              P
            </div>
            <span className="text-xl font-extrabold">
              <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">PDFCompress</span>
              <span className="text-surface-800">Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary-600 bg-primary-50' : 'text-surface-600 hover:text-primary-600 hover:bg-surface-50'}`}>
              Home
            </Link>

            {/* Tools Dropdown */}
            <div className="relative" onMouseEnter={() => setToolsDropdown(true)} onMouseLeave={() => setToolsDropdown(false)}>
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 hover:text-primary-600 hover:bg-surface-50 transition-colors flex items-center gap-1">
                All Tools
                <svg className={`w-4 h-4 transition-transform ${toolsDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {toolsDropdown && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
                  <div className="bg-white rounded-2xl shadow-elevated border border-surface-100 p-4 w-[600px] max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      {categories.map(cat => {
                        const catTools = tools.filter(t => t.category === cat.id && t.isActive && !disabledTools.includes(t.slug))
                        if (catTools.length === 0) return null
                        return (
                          <div key={cat.id}>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2 px-2">
                              {cat.icon} {cat.label}
                            </h4>
                            {catTools.map(tool => (
                              <Link
                                key={tool.slug}
                                to={`/${tool.slug}`}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${location.pathname === `/${tool.slug}` ? 'bg-primary-50 text-primary-700' : 'text-surface-600 hover:bg-surface-50 hover:text-surface-800'}`}
                              >
                                <span className="text-base">{tool.icon}</span>
                                <span className="font-medium">{tool.shortName}</span>
                              </Link>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link to="/pdf-compressor" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/pdf-compressor' ? 'text-primary-600 bg-primary-50' : 'text-surface-600 hover:text-primary-600 hover:bg-surface-50'}`}>
              Compress PDF
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-50 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <div className="flex flex-col gap-1.5">
              <span className={`block w-5 h-0.5 bg-surface-700 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-surface-700 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-surface-700 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isOpen
              ? 'max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain pb-16 opacity-100'
              : 'max-h-0 overflow-hidden opacity-0 pointer-events-none'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="pt-2 pb-6 space-y-1 border-t border-surface-100">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-semibold text-surface-800 hover:bg-surface-50 active:bg-primary-50 transition-colors"
            >
              <span>🏠</span>
              <span>Home</span>
            </Link>
            <Link
              to="/pdf-compressor"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-semibold text-primary-600 bg-primary-50/70 hover:bg-primary-50 transition-colors"
            >
              <span>🗜️</span>
              <span>Compress PDF</span>
            </Link>
            
            <div className="pt-3">
              <p className="px-4 text-xs font-bold uppercase tracking-wider text-surface-400 mb-2">All Tools</p>
              {categories.map(cat => {
                const catTools = tools.filter(t => t.category === cat.id && t.isActive && !disabledTools.includes(t.slug))
                if (catTools.length === 0) return null
                return (
                  <div key={cat.id} className="mb-3">
                    <p className="px-4 py-1 text-xs font-bold text-surface-600 flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 mt-0.5">
                      {catTools.map(tool => (
                        <Link
                          key={tool.slug}
                          to={`/${tool.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-6 py-2.5 text-sm font-medium text-surface-600 hover:text-primary-600 hover:bg-surface-50 active:bg-primary-50 rounded-xl transition-colors"
                        >
                          <span className="text-base">{tool.icon}</span>
                          <span>{tool.shortName}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
