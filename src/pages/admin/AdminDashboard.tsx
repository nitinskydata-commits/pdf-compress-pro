import { useState, useEffect } from 'react'
import { formatFileSize } from '../../utils/fileUtils'
import { getLocalToolStats, getLocalToolEvents, trackToolUsage, clearLocalToolEvents } from '../../utils/telemetry'
import { tools, type ToolInfo } from '../../data/tools'
import { useDisabledToolsList } from '../../utils/toolStatus'
import { apiUrl } from '../../utils/api'

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
  const disabledTools = useDisabledToolsList()
  const [backendStats, setBackendStats] = useState<any>(null)
  const [localStats, setLocalStats] = useState(getLocalToolStats())
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [testNotice, setTestNotice] = useState('')

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    const local = getLocalToolStats()
    setLocalStats(local)

    try {
      const token = localStorage.getItem('token') || 'local-admin-token'
      const res = await fetch(apiUrl('/api/admin/dashboard'), {
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
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadData(true)

    // Listen for telemetry events dispatched anywhere in this tab or other tabs
    const handleUpdate = () => {
      loadData(false)
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pcp_tool_activity') {
        loadData(false)
      }
    }

    window.addEventListener('pcp_tool_activity_updated', handleUpdate)
    window.addEventListener('storage', handleStorage)

    // Poll backend every 3.5 seconds
    const interval = setInterval(() => {
      loadData(false)
    }, 3500)

    return () => {
      window.removeEventListener('pcp_tool_activity_updated', handleUpdate)
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  // Deduplicated counts calculation:
  const localPendingEvents = localStats.recentEvents.filter(
    (le) => !backendStats?.recentActivity?.some((be: any) => be.id === le.id)
  )

  const totalOps = backendStats
    ? (backendStats.totalOperations || 0) + localPendingEvents.length
    : localStats.totalOperations

  const totalSavedBytes = backendStats
    ? (backendStats.totalSizeSavedMB ? backendStats.totalSizeSavedMB * 1024 * 1024 : 0) +
      localPendingEvents.reduce((s, e) => s + (e.sizeSaved || 0), 0)
    : localStats.totalSaved

  const avgReduction = backendStats?.monthlyAvgReduction || localStats.avgReduction || 64.5

  // Map counts per tool accurately
  const toolCounts: Record<string, number> = { ...(backendStats?.toolBreakdown || {}) }
  if (backendStats) {
    for (const ev of localPendingEvents) {
      toolCounts[ev.toolId] = (toolCounts[ev.toolId] || 0) + 1
    }
  } else {
    for (const [tId, cnt] of Object.entries(localStats.counts)) {
      toolCounts[tId] = cnt
    }
  }

  // Handle clearing all local test logs
  const handleClearLogs = async () => {
    clearLocalToolEvents()
    try {
      const token = localStorage.getItem('token') || 'local-admin-token'
      await fetch(apiUrl('/api/admin/compressions'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (_) {}
    setTestNotice('🗑️ Test logs cleared. Run counts reset to baseline.')
    setTimeout(() => setTestNotice(''), 3000)
    loadData(false)
  }

  // Handle single tool test simulation
  const handleTestRun = (t: ToolInfo, e: React.MouseEvent) => {
    e.stopPropagation()
    trackToolUsage({
      toolId: t.slug,
      toolName: t.name,
      category: t.category,
      action: `Test Run: ${t.shortName}`,
      details: `Live execution simulation by Admin`,
      sizeSaved: t.category === 'pdf' ? 1024 * 380 : t.category === 'image' ? 1024 * 195 : 0,
      reductionPercent: t.category === 'pdf' ? 72 : t.category === 'image' ? 65 : 0,
      method: 'Admin Live Trigger',
    })
    setTestNotice(`✅ Test run recorded for "${t.shortName}". Run count incremented!`)
    setTimeout(() => setTestNotice(''), 3000)
    loadData(false)
  }

  // Handle batch simulation of all 22 tools
  const handleBatchSimulate = () => {
    tools.forEach((t, index) => {
      setTimeout(() => {
        trackToolUsage({
          toolId: t.slug,
          toolName: t.name,
          category: t.category,
          action: `Simulated User Action: ${t.shortName}`,
          details: `Processed mock payload successfully`,
          sizeSaved: t.category === 'pdf' ? 1024 * 250 : t.category === 'image' ? 1024 * 120 : 0,
          reductionPercent: t.category === 'pdf' || t.category === 'image' ? 60 : 0,
          method: 'Simulation Suite',
        })
        loadData(false)
      }, index * 40)
    })
    setTestNotice(`🚀 Simulated live runs across all ${tools.length} utilities! Watch matrix update.`)
    setTimeout(() => setTestNotice(''), 4000)
  }

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
            Real-Time Live Sync Active
          </div>
          <h1 className="text-2xl font-black text-surface-900 tracking-tight">System Control &amp; Tool Analytics</h1>
          <p className="text-xs text-surface-500 mt-0.5">Real-time metrics, optimization performance, and usage stream across all 22 utilities</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleClearLogs}
            className="px-3.5 py-2 bg-surface-100 hover:bg-surface-200 border border-surface-200 rounded-xl text-xs font-bold text-surface-600 transition-all active:scale-95 shadow-xs"
            title="Clear all test logs and reset activity counter"
          >
            🗑️ Reset Logs
          </button>
          <button
            onClick={handleBatchSimulate}
            className="px-3.5 py-2 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl text-xs font-bold text-primary-700 transition-all active:scale-95 shadow-xs"
          >
            ⚡ Simulate All 22 Tools
          </button>
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="px-4 py-2 bg-white hover:bg-surface-50 border border-surface-200 rounded-xl text-xs font-bold text-surface-700 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>{loading ? 'Syncing...' : '🔄 Refresh Data'}</span>
          </button>
        </div>
      </div>

      {testNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <span>{testNotice}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Total Operations</span>
            <span className="p-2 rounded-xl bg-primary-50 text-primary-600 text-lg">⚡</span>
          </div>
          <div className="text-3xl font-black text-surface-900 mt-3">
            {totalOps.toLocaleString()}
          </div>
          <div className="text-xs text-surface-500 mt-1">Runs across all 22 tools</div>
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
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Active Utilities</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 text-lg">🛠️</span>
          </div>
          <div className="text-3xl font-black text-indigo-600 mt-3">
            {tools.filter((t) => t.isActive).length} <span className="text-sm font-normal text-surface-400">/ {tools.length}</span>
          </div>
          <div className="text-xs text-surface-500 mt-1">All responsive &amp; accelerated</div>
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
            <p className="text-xs text-surface-500 mt-0.5">Real-time run counts. Click "+1 Test" to simulate and verify live counter increments.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredTools.map((t) => {
            const count = toolCounts[t.slug] || 0
            const isOnline = !disabledTools.includes(t.slug)
            return (
              <div
                key={t.slug}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between group ${
                  isOnline
                    ? 'border-surface-200 bg-surface-50/50 hover:bg-white hover:border-primary-300'
                    : 'border-danger-200 bg-danger-50/30 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">{t.icon}</span>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                          isOnline
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-danger-50 text-danger-700 border-danger-200'
                        }`}
                      >
                        {isOnline ? 'Online' : 'Disabled'}
                      </span>
                      <button
                        onClick={(e) => handleTestRun(t, e)}
                        title={`Simulate 1 run for ${t.shortName}`}
                        className="opacity-75 group-hover:opacity-100 px-1.5 py-0.5 rounded bg-primary-100 hover:bg-primary-600 text-[10px] font-bold text-primary-700 hover:text-white transition-all"
                      >
                        +1
                      </button>
                    </div>
                  </div>
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
            <p className="text-xs text-surface-500 mt-0.5">Real-time audit log of operations streaming from all tools</p>
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
                    No recent operations recorded in this category yet. Click "+1 Test" above or launch any tool to stream actions live!
                  </td>
                </tr>
              ) : (
                filteredActivities.slice(0, 30).map((act, idx) => {
                  const t = tools.find((x) => x.slug === act.toolId)
                  return (
                    <tr key={idx} className="hover:bg-surface-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-surface-900 flex items-center gap-2 whitespace-nowrap">
                        <span>{t?.icon || '⚙️'}</span>
                        <span>{act.toolName || t?.shortName || act.toolId}</span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-surface-600 max-w-xs truncate" title={act.details || act.action}>
                        {act.action || act.details || act.fileName || 'Execution complete'}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
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
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-surface-100 text-surface-700 border border-surface-200">
                          {act.method || 'Client / GS'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-surface-500 whitespace-nowrap">
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
