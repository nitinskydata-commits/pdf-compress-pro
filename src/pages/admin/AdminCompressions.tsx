import { useState, useEffect } from 'react'
import { formatFileSize } from '../../utils/fileUtils'
import { getLocalToolEvents, clearLocalToolEvents } from '../../utils/telemetry'
import { tools } from '../../data/tools'
import { apiUrl } from '../../utils/api'

interface ActivityRecord {
  id?: string
  toolId?: string
  toolName?: string
  category?: string
  action?: string
  details?: string
  fileName?: string
  originalSize?: number
  compressedSize?: number
  reductionPercent?: number | string
  level?: string
  compressionLevel?: string
  method?: string
  timestamp?: string
  createdAt?: string
  date?: string
}

export default function AdminCompressions() {
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [selectedTool, setSelectedTool] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const localEvents = getLocalToolEvents()

    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(apiUrl('/api/admin/compressions'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/admin/login'
        return
      }
      if (res.ok) {
        const data = await res.json()
        const backendList = data?.compressions || data?.stats?.recentCompressions || []
        const merged = [...backendList]
        for (const loc of localEvents) {
          if (!merged.some((m) => m.id === loc.id)) {
            merged.push(loc)
          }
        }
        merged.sort((a, b) => new Date(b.timestamp || b.date || 0).getTime() - new Date(a.timestamp || a.date || 0).getTime())
        setActivities(merged)
      } else {
        setActivities(localEvents)
      }
    } catch {
      setActivities(localEvents)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const handleUpdate = () => {
      loadData()
    }
    window.addEventListener('pcp_tool_activity_updated', handleUpdate)
    window.addEventListener('storage', (e) => {
      if (e.key === 'pcp_tool_activity') loadData()
    })

    return () => {
      window.removeEventListener('pcp_tool_activity_updated', handleUpdate)
    }
  }, [])

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear ALL tool operations and compression history? This action cannot be reversed.')) {
      return
    }

    setClearing(true)
    clearLocalToolEvents()

    try {
      const token = localStorage.getItem('token') || ''
      await fetch(apiUrl('/api/admin/compressions'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (err) {
      console.error('Clear history error:', err)
    } finally {
      setActivities([])
      setClearing(false)
    }
  }

  const filteredList = activities.filter((item) => {
    // Tool filter
    if (selectedTool !== 'all' && item.toolId !== selectedTool) return false

    // Category filter
    if (selectedCategory !== 'all') {
      const itemCat = item.category || 'pdf'
      if (selectedCategory === 'utility') {
        if (itemCat !== 'utility' && itemCat !== 'developer' && itemCat !== 'text') return false
      } else if (itemCat !== selectedCategory) {
        return false
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const text = `${item.toolName || ''} ${item.action || ''} ${item.details || ''} ${item.fileName || ''}`.toLowerCase()
      if (!text.includes(q)) return false
    }

    return true
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-surface-900 tracking-tight">All Tools Operations &amp; Compression Logs</h1>
          <p className="text-xs text-surface-500 mt-0.5">Audit log and activity history across all 22 platform tools</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-white hover:bg-surface-50 border border-surface-200 rounded-xl text-xs font-bold text-surface-700 shadow-sm transition-all"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Logs'}
          </button>
          <button
            onClick={handleClearHistory}
            disabled={clearing || activities.length === 0}
            className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-40"
          >
            {clearing ? 'Clearing...' : '🗑️ Clear All History'}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-5 border border-surface-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search by filename or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-surface-50 border border-surface-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'pdf', label: 'PDF Suite' },
            { id: 'image', label: 'Image Suite' },
            { id: 'calculator', label: 'Calculators' },
            { id: 'utility', label: 'Utilities' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Tool Dropdown Filter */}
        <div className="w-full md:w-auto ml-auto">
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="w-full md:w-56 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="all">Every Tool (22 Tools)</option>
            {tools.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-surface-500 text-xs font-semibold uppercase tracking-wider border-b border-surface-100">
              <tr>
                <th className="px-6 py-3.5">Tool Name</th>
                <th className="px-6 py-3.5">Action &amp; Target Details</th>
                <th className="px-6 py-3.5">Original</th>
                <th className="px-6 py-3.5">Output / Size</th>
                <th className="px-6 py-3.5">Reduction</th>
                <th className="px-6 py-3.5">Engine</th>
                <th className="px-6 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-surface-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-surface-400 text-xs">
                    No matching operation logs found. Try selecting another category or run a tool to generate telemetry.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const t = tools.find((x) => x.slug === item.toolId)
                  return (
                    <tr key={idx} className="hover:bg-surface-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-surface-900 flex items-center gap-2 whitespace-nowrap">
                        <span>{t?.icon || '⚙️'}</span>
                        <span>{item.toolName || t?.shortName || item.toolId || 'Utility'}</span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-surface-600 max-w-sm truncate" title={item.details || item.action || item.fileName}>
                        {item.action || item.details || item.fileName || 'Processed successfully'}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-surface-500">
                        {item.originalSize ? formatFileSize(item.originalSize) : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-semibold text-surface-900">
                        {item.compressedSize ? formatFileSize(item.compressedSize) : 'Complete'}
                      </td>
                      <td className="px-6 py-3.5">
                        {item.reductionPercent && Number(item.reductionPercent) > 0 ? (
                          <span className="font-bold text-emerald-600 text-xs">-{item.reductionPercent}%</span>
                        ) : (
                          <span className="text-xs text-surface-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-surface-100 text-surface-700 border border-surface-200 whitespace-nowrap">
                          {item.method || item.level || 'Client / GS'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-surface-500 whitespace-nowrap">
                        {item.timestamp || item.date ? new Date(item.timestamp || item.date!).toLocaleString() : 'Just now'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
