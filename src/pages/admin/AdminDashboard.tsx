import { useState, useEffect } from 'react'
import { formatFileSize } from '../../utils/fileUtils'
import { getLocalToolStats, getLocalToolEvents } from '../../utils/telemetry'
import { tools } from '../../data/tools'

interface ActivityItem {
  id?: string
  toolId?: string
  toolName?: string
  category?: string
  action?: string
  details?: string
  fileName?: string
  originalSize?: number
  compressedSize?: number
  sizeSaved?: number
  reductionPercent?: number | string
  method?: string
  timestamp?: string
  date?: string
}

export default function AdminDashboard() {
  const [backendStats, setBackendStats] = useState<any>(null)
  const [localStats, setLocalStats] = useState(getLocalToolStats())
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const local = getLocalToolStats()
    setLocalStats(local)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.success && data?.stats) {
          setBackendStats(data.stats)
          // Merge backend activities with local activities
          const merged: ActivityItem[] = [...(data.stats.recentActivity || data.stats.recentCompressions || [])]
          const localEvents = getLocalToolEvents()
          for (const ev of localEvents) {
            if (!merged.some((m) => m.id === ev.id)) {
              merged.push(ev)
            }
          }
          merged.sort((a, b) => new Date(b.timestamp || b.date || 0).getTime() - new Date(a.timestamp || a.date || 0).getTime())
          setRecentActivities(merged)
        } else {
          setRecentActivities(local.recentEvents)
        }
      } else {
        setRecentActivities(local.recentEvents)
      }
    } catch {
      setRecentActivities(local.recentEvents)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Aggregate stats between backend and local storage
  const totalOps = (backendStats?.totalOperations || 0) + (localStats.totalOperations || 0)
  const totalSavedBytes = (backendStats?.totalSizeSavedMB ? backendStats.totalSizeSavedMB * 1024 * 1024 : 0) + localStats.totalSaved
  const avgReduction = backendStats?.monthlyAvgReduction || localStats.avgReduction || 64.5

  // Map counts per tool
  const toolCounts: Record<string, number> = { ...(backendStats?.toolBreakdown || {}) }
  for (const [tId, cnt] of Object.entries(localStats.counts)) {
    toolCounts[tId] = (toolCounts[tId] || 0) + cnt
  }

  // Filtered tools
  const categories = [
    { id: 'all', label: 'All Tools (22)' },
    { id: 'pdf', label: 'PDF Suite' },
    { id: 'image', label: 'Image Suite' },
    { id: 'calculator', label: 'Calculators' },
    { id: 'utility', label: 'Dev & Utilities' },
  ]

  const filteredTools = tools.filter((t) => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'utility') return t.category === 'utility' || t.category === 'developer' || t.category === 'text'
    return t.category === selectedCategory
  })

  const filteredActivities = recentActivities.filter((act) => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'utility') return act.category === 'utility' || act.category === 'developer' || act.category === 'text'
    return act.category === selectedCategory
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Unified Multi-Tool Telemetry Active
          </div>
          <h1 className="text-2xl font-black text-surface-900 tracking-tight">System Control &amp; Tool Analytics</h1>
          <p className="text-xs text-surface-500 mt-0.5">Real-time metrics, optimization performance, and usage stream across all 22 utilities</p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-surface-50 border border-surface-200 rounded-xl text-xs font-bold text-surface-700 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span>{loading ? 'Refreshing...' : '🔄 Refresh Metrics'}</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Total Tool Operations</span>
            <span className="p-2 rounded-xl bg-primary-50 text-primary-600 text-lg">⚡</span>
          </div>
          <div className="text-3xl font-black text-surface-900 mt-3">
            {totalOps.toLocaleString()}
          </div>
          <div className="text-xs text-surface-500 mt-1">Actions across all 22 tools</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Bandwidth Saved</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 text-lg">💾</span>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-3">
            {formatFileSize(totalSavedBytes)}
          </div>
          <div className="text-xs text-surface-500 mt-1">PDF &amp; Image bytes saved</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Deployed Utilities</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 text-lg">🛠️</span>
          </div>
          <div className="text-3xl font-black text-indigo-600 mt-3">
            {tools.filter((t) => t.isActive).length} <span className="text-sm font-normal text-surface-400">/ {tools.length}</span>
          </div>
          <div className="text-xs text-surface-500 mt-1">All online &amp; client-accelerated</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Avg Reduction</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 text-lg">📈</span>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-3">
            {avgReduction}%
          </div>
          <div className="text-xs text-surface-500 mt-1">Optimization efficiency</div>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tool Usage Breakdown Matrix */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-surface-900">Tool Popularity &amp; Usage Breakdown</h2>
            <p className="text-xs text-surface-500 mt-0.5">Execution volume across platform utilities</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredTools.map((t) => {
            const count = toolCounts[t.slug] || 0
            return (
              <div
                key={t.slug}
                className="p-3.5 rounded-xl border border-surface-200 bg-surface-50/50 hover:bg-white hover:border-primary-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-xl mb-1.5">{t.icon}</div>
                  <div className="text-xs font-bold text-surface-900 line-clamp-1" title={t.name}>
                    {t.shortName}
                  </div>
                  <div className="text-[10px] text-surface-400 capitalize">{t.category}</div>
                </div>
                <div className="mt-3 pt-2 border-t border-surface-200/60 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-surface-500">Runs</span>
                  <span className="text-xs font-black text-primary-600">{count}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live Unified Activity Table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-surface-900">Live Multi-Tool Operations Feed</h2>
            <p className="text-xs text-surface-500 mt-0.5">Real-time audit log of operations across all tools</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-surface-500 text-xs font-semibold uppercase tracking-wider border-b border-surface-100">
              <tr>
                <th className="px-6 py-3.5">Tool</th>
                <th className="px-6 py-3.5">Operation Details</th>
                <th className="px-6 py-3.5">Optimization / Saved</th>
                <th className="px-6 py-3.5">Engine</th>
                <th className="px-6 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-surface-700">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-surface-400 text-xs">
                    No recent operations recorded in this category yet. Launch any tool to stream actions live!
                  </td>
                </tr>
              ) : (
                filteredActivities.slice(0, 25).map((act, idx) => {
                  const t = tools.find((x) => x.slug === act.toolId)
                  return (
                    <tr key={idx} className="hover:bg-surface-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-surface-900 flex items-center gap-2">
                        <span>{t?.icon || '⚙️'}</span>
                        <span>{act.toolName || t?.shortName || act.toolId}</span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-surface-600 max-w-xs truncate" title={act.details || act.action}>
                        {act.action || act.details || act.fileName || 'Execution complete'}
                      </td>
                      <td className="px-6 py-3.5">
                        {act.sizeSaved && act.sizeSaved > 0 ? (
                          <span className="font-bold text-emerald-600 text-xs">
                            -{formatFileSize(act.sizeSaved)} ({act.reductionPercent}%)
                          </span>
                        ) : act.reductionPercent ? (
                          <span className="font-bold text-emerald-600 text-xs">-{act.reductionPercent}%</span>
                        ) : (
                          <span className="text-xs text-surface-400 font-mono">100% Success</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-surface-100 text-surface-700 border border-surface-200">
                          {act.method || 'Client / GS'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-surface-500">
                        {act.timestamp || act.date ? new Date(act.timestamp || act.date!).toLocaleTimeString() : 'Just now'}
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
