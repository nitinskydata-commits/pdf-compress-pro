import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { tools, categories, searchTools, type ToolInfo } from '../data/tools'
import ToolVisualBadge from './ToolVisualBadge'

interface UniversalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialCategory?: string
}

export default function UniversalSearchModal({ isOpen, onClose, initialCategory = 'all' }: UniversalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setSelectedCategory(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      setSelectedIndex(0)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filteredTools: ToolInfo[] = searchTools(query, selectedCategory).slice(0, 50)

  const handleSelect = (tool: ToolInfo) => {
    onClose()
    navigate(`/${tool.slug}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < filteredTools.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredTools.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTools[selectedIndex]) {
        handleSelect(filteredTools[selectedIndex])
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-14 sm:pt-20 px-4 bg-slate-950/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-surface-200 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-surface-100 flex items-center gap-3 bg-surface-50/50">
          <span className="text-xl text-surface-400">🔎</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search 1,000+ tools (e.g. compress pdf, jpg to png, bmi, gst, format json)..."
            className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg text-surface-900 placeholder:text-surface-400"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="p-1 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-200 text-xs transition-colors"
              title="Clear search"
            >
              ✕
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-1 text-[11px] font-semibold text-surface-500 bg-surface-200/70 border border-surface-300 rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 p-3 px-4 border-b border-surface-100 overflow-x-auto no-scrollbar bg-white text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            All (1,000+)
          </button>
          {categories.slice(0, 10).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.shortLabel || cat.label}</span>
            </button>
          ))}
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-surface-100 max-h-[500px]">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={tool.slug}
                  onClick={() => handleSelect(tool)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary-50 text-primary-950 border border-primary-100 shadow-xs'
                      : 'hover:bg-surface-50 text-surface-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ToolVisualBadge category={tool.category} slug={tool.slug} name={tool.name} icon={tool.icon} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base truncate">{tool.name}</span>
                        {tool.isPopular && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-surface-500 truncate max-w-md">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="hidden sm:inline-block text-[11px] font-medium text-surface-400 bg-surface-100 px-2.5 py-1 rounded-full">
                      {tool.categoryLabel}
                    </span>
                    <span className="text-primary-600 font-bold text-sm">→</span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-12 text-center">
              <span className="text-4xl mb-3 block">🔍</span>
              <p className="text-surface-700 font-semibold text-base mb-1">No tools matched "{query}"</p>
              <p className="text-xs text-surface-400 max-w-sm mx-auto">
                Try searching for general terms like "pdf", "image", "calculate", "json", "convert", or switch category filters.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 px-4 bg-surface-50 border-t border-surface-100 flex items-center justify-between text-xs text-surface-500">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong>{filteredTools.length}</strong> of <strong>{tools.length}</strong> tools
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span>Navigate <kbd className="px-1.5 py-0.5 bg-surface-200 border rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-surface-200 border rounded">↓</kbd></span>
            <span>Select <kbd className="px-1.5 py-0.5 bg-surface-200 border rounded">↵</kbd></span>
          </div>
        </div>
      </div>
    </div>
  )
}
