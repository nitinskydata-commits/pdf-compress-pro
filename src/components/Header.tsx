import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { categories, SITE_NAME } from '../data/tools'
import { useDisabledToolsList, useSiteLogo, useSiteFavicon } from '../utils/toolStatus'
import UniversalSearchModal from './UniversalSearchModal'

export default function Header() {
  const disabledTools = useDisabledToolsList()
  const siteLogo = useSiteLogo()
  useSiteFavicon()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [toolsDropdown, setToolsDropdown] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchCategory, setSearchCategory] = useState('all')
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

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const openSearchWithCategory = (catId: string) => {
    setSearchCategory(catId)
    setIsSearchOpen(true)
    setToolsDropdown(false)
    setIsOpen(false)
  }

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-md shadow-black/[0.04]' : 'bg-white/90 backdrop-blur-md'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0" aria-label={SITE_NAME}>
              {siteLogo && siteLogo !== '/logo.png' && siteLogo.length > 50 ? (
                <img src={siteLogo} alt={SITE_NAME} width="36" height="36" className="h-9 max-h-9 w-auto max-w-[150px] object-contain rounded-lg" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow">
                  P
                </div>
              )}
              <span className="text-xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">PDFCompress</span>
                <span className="text-surface-800">Pro</span>
              </span>
            </Link>

            {/* Quick Search Bar (Desktop Trigger) */}
            <div className="hidden md:flex items-center flex-1 max-w-sm mx-2">
              <button
                type="button"
                onClick={() => {
                  setSearchCategory('all')
                  setIsSearchOpen(true)
                }}
                className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-surface-100/80 hover:bg-surface-200/70 border border-surface-200 text-surface-500 hover:text-surface-800 text-xs font-medium transition-all group shadow-2xs"
                aria-label="Search all 1,000+ tools"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-surface-400 group-hover:text-primary-600 transition-colors">🔎</span>
                  <span>Search 1,000+ tools...</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-surface-400 bg-white border border-surface-200 rounded shadow-2xs">
                  Ctrl K
                </kbd>
              </button>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/' ? 'text-primary-700 bg-primary-50 font-semibold' : 'text-surface-700 hover:text-primary-600 hover:bg-surface-50'
                }`}
              >
                Home
              </Link>

              {/* Tools Mega Dropdown */}
              <div className="relative" onMouseEnter={() => setToolsDropdown(true)} onMouseLeave={() => setToolsDropdown(false)}>
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    toolsDropdown ? 'text-primary-700 font-semibold bg-surface-50' : 'text-surface-700 hover:text-primary-600 hover:bg-surface-50'
                  }`}
                  aria-label="All Tools Menu"
                  aria-expanded={toolsDropdown}
                  aria-haspopup="true"
                >
                  <span>1,000+ Tools</span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${toolsDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {toolsDropdown && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl border border-surface-200 p-5 w-[760px] max-h-[80vh] overflow-y-auto">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-100">
                        <div>
                          <h3 className="font-extrabold text-surface-900 text-sm">Master Tool Catalog</h3>
                          <p className="text-xs text-surface-500">1,000+ free online utilities across 25 categories</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchCategory('all')
                            setIsSearchOpen(true)
                            setToolsDropdown(false)
                          }}
                          className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <span>🔎</span>
                          <span>Universal Search (Ctrl+K)</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        {categories.map(cat => (
                          <div
                            key={cat.id}
                            onClick={() => openSearchWithCategory(cat.id)}
                            className="p-2.5 rounded-xl border border-surface-100 hover:border-primary-200 hover:bg-primary-50/40 cursor-pointer transition-all flex items-start gap-2.5 group"
                          >
                            <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{cat.icon}</span>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-surface-800 group-hover:text-primary-700 truncate">
                                {cat.label}
                              </h4>
                              <p className="text-[10px] text-surface-400 font-medium">
                                {cat.countBadge}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Featured core tools footer */}
                      <div className="mt-4 pt-3 border-t border-surface-100 flex flex-wrap items-center justify-between text-xs text-surface-500 gap-2">
                        <span className="font-semibold text-surface-700">Quick Access:</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to="/pdf-compressor" className="hover:text-primary-600 font-medium">Compress PDF</Link>
                          <span>•</span>
                          <Link to="/compress-pdf-to-200kb" className="hover:text-primary-600 font-medium">PDF to 200KB</Link>
                          <span>•</span>
                          <Link to="/pdf-merger" className="hover:text-primary-600 font-medium">Merge PDF</Link>
                          <span>•</span>
                          <Link to="/image-compressor" className="hover:text-primary-600 font-medium">Image Compressor</Link>
                          <span>•</span>
                          <Link to="/json-formatter" className="hover:text-primary-600 font-medium">JSON Formatter</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Guides / Learning Center */}
              <Link
                to="/guides"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname.startsWith('/guides')
                    ? 'text-primary-700 bg-primary-50 font-semibold'
                    : 'text-surface-700 hover:text-primary-600 hover:bg-surface-50'
                }`}
              >
                <span>📚</span>
                <span>PDF Guides</span>
              </Link>

              {/* Help Center */}
              <Link
                to="/help"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/help'
                    ? 'text-primary-700 bg-primary-50 font-semibold'
                    : 'text-surface-700 hover:text-primary-600 hover:bg-surface-50'
                }`}
              >
                Help
              </Link>
            </div>

            {/* Right Action */}
            <div className="hidden lg:flex items-center gap-3">
              {!disabledTools.includes('pdf-compressor') && (
                <Link
                  to="/pdf-compressor"
                  className="btn-primary !text-xs px-4 py-2 font-bold shadow-sm shrink-0"
                >
                  🗜️ Compress PDF
                </Link>
              )}
            </div>

            {/* Mobile search & hamburger */}
            <div className="flex items-center gap-1 lg:hidden">
              <button
                type="button"
                onClick={() => {
                  setSearchCategory('all')
                  setIsSearchOpen(true)
                }}
                className="p-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-surface-50 transition-colors"
                aria-label="Search tools"
              >
                <span className="text-lg">🔎</span>
              </button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-50 transition-colors"
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
              {/* Mobile Search Button */}
              <div className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(true)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-100 hover:bg-surface-200 border border-surface-200 text-surface-600 text-sm font-medium transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>🔎</span>
                    <span>Search 1,000+ Tools...</span>
                  </span>
                  <span className="text-xs bg-white px-2 py-0.5 rounded border border-surface-200 font-bold text-surface-400">Ctrl K</span>
                </button>
              </div>

              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-base font-semibold text-surface-800 hover:bg-surface-50 transition-colors"
              >
                <span>🏠</span>
                <span>Home</span>
              </Link>

              <Link
                to="/guides"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-base font-semibold text-primary-600 bg-primary-50/50 hover:bg-primary-50 transition-colors"
              >
                <span>📚</span>
                <span>PDF Guides & Tutorials</span>
              </Link>

              <Link
                to="/help"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-base font-semibold text-surface-800 hover:bg-surface-50 transition-colors"
              >
                <span>🛠️</span>
                <span>Help Center & FAQ</span>
              </Link>

              {!disabledTools.includes('pdf-compressor') && (
                <div className="px-4 py-2">
                  <Link
                    to="/pdf-compressor"
                    onClick={() => setIsOpen(false)}
                    className="btn-primary w-full !text-sm py-3 block text-center font-bold"
                  >
                    🗜️ Compress PDF Now
                  </Link>
                </div>
              )}
              
              <div className="pt-4">
                <p className="px-4 text-xs font-bold uppercase tracking-wider text-surface-400 mb-2">Browse Categories (1,000+ Tools)</p>
                <div className="grid grid-cols-2 gap-1.5 px-4">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => openSearchWithCategory(cat.id)}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-surface-700 bg-surface-50 hover:bg-primary-50 hover:text-primary-700 text-left transition-colors"
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="truncate">{cat.shortLabel || cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Universal Search Modal */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        initialCategory={searchCategory}
      />
    </>
  )
}

