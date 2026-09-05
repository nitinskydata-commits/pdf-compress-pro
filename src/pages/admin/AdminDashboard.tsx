import { useState, useEffect } from 'react'
import { formatFileSize } from '../../utils/fileUtils'

interface CompressionRecord {
  fileName?: string
  originalName?: string
  originalSize?: number
  compressedSize?: number
  reductionPercent?: number | string
  compressionLevel?: string
  timestamp?: string
  date?: string
}

interface StatsData {
  totalCompressions?: number
  totalSizeSaved?: number
  monthlyTotal?: number
  monthlyAvgReduction?: number
  recentCompressions?: CompressionRecord[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData>({})
  const [recent, setRecent] = useState<CompressionRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.success && data?.stats) {
          setStats(data.stats)
          setRecent(data.stats.recentCompressions || [])
        }
      }
    } catch {
      // Offline / default mock for initial empty state
      setStats({
        totalCompressions: 0,
        totalSizeSaved: 0,
        monthlyTotal: 0,
        monthlyAvgReduction: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-surface-900 tracking-tight">System Overview</h1>
          <p className="text-xs text-surface-500 mt-0.5">Real-time platform usage and compression performance</p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-surface-50 border border-surface-200 rounded-xl text-xs font-bold text-surface-700 shadow-sm transition-all active:scale-95"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Total Compressions</span>
            <span className="p-2 rounded-xl bg-primary-50 text-primary-600 text-lg">🗜️</span>
          </div>
          <div className="text-3xl font-black text-surface-900 mt-3">
            {stats.totalCompressions?.toLocaleString() ?? 0}
          </div>
          <div className="text-xs text-surface-500 mt-1">Processed across all tiers</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Total Bandwidth Saved</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 text-lg">💾</span>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-3">
            {formatFileSize(stats.totalSizeSaved || 0)}
          </div>
          <div className="text-xs text-surface-500 mt-1">Disk storage prevented</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Monthly Volume</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 text-lg">📅</span>
          </div>
          <div className="text-3xl font-black text-surface-900 mt-3">
            {stats.monthlyTotal?.toLocaleString() ?? 0}
          </div>
          <div className="text-xs text-surface-500 mt-1">Requests in current cycle</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Avg Reduction</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 text-lg">⚡</span>
          </div>
          <div className="text-3xl font-black text-indigo-600 mt-3">
            {stats.monthlyAvgReduction || 0}%
          </div>
          <div className="text-xs text-surface-500 mt-1">Efficiency benchmark</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-surface-900">Recent Optimizations</h2>
            <p className="text-xs text-surface-500 mt-0.5">Live stream of incoming compression requests</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-surface-500 text-xs font-semibold uppercase tracking-wider border-b border-surface-100">
              <tr>
                <th className="px-6 py-3.5">Document Name</th>
                <th className="px-6 py-3.5">Reduction</th>
                <th className="px-6 py-3.5">Level</th>
                <th className="px-6 py-3.5">Processed Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-surface-700">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-surface-400 text-xs">
                    No recent compressions recorded yet.
                  </td>
                </tr>
              ) : (
                recent.map((item, idx) => {
                  const fname = item.fileName || item.originalName || 'Untitled.pdf'
                  return (
                    <tr key={idx} className="hover:bg-surface-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-surface-900 max-w-xs truncate" title={fname}>
                        📄 {fname}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-emerald-600">
                        -{item.reductionPercent}%
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-100 text-surface-700 border border-surface-200">
                          {item.compressionLevel || 'medium'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-surface-500">
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
