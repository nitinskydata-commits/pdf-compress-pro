import { useState, useEffect } from 'react'
import { formatFileSize } from '../../utils/fileUtils'
import { apiUrl } from '../../utils/api'

interface AnalyticsRecord {
  date: string
  totalCompressions: number
  totalSizeSaved: number
  adImpressions: number
  adClicks: number
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(apiUrl('/api/admin/analytics'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/admin/login'
        return
      }
      if (res.ok) {
        const json = await res.json()
        if (json?.success && json?.analytics) {
          setData(json.analytics)
        }
      }
    } catch {
      // Empty mock fallback
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalCompressions = data.reduce((acc, curr) => acc + (curr.totalCompressions || 0), 0)
  const totalSaved = data.reduce((acc, curr) => acc + (curr.totalSizeSaved || 0), 0)
  const totalImpressions = data.reduce((acc, curr) => acc + (curr.adImpressions || 0), 0)
  const totalClicks = data.reduce((acc, curr) => acc + (curr.adClicks || 0), 0)

  // Max value for SVG bar scaling
  const maxComp = Math.max(...data.map((d) => d.totalCompressions || 0), 10)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-surface-900 tracking-tight">Traffic &amp; Telemetry Analytics</h1>
          <p className="text-xs text-surface-500 mt-0.5">Historical breakdown of document compressions and ad metrics</p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-surface-50 border border-surface-200 rounded-xl text-xs font-bold text-surface-700 shadow-sm transition-all active:scale-95"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <div className="text-xs font-semibold text-surface-400">Total Volume</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{totalCompressions}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <div className="text-xs font-semibold text-surface-400">Bandwidth Saved</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{formatFileSize(totalSaved)}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <div className="text-xs font-semibold text-surface-400">Ad Impressions</div>
          <div className="text-2xl font-black text-primary-600 mt-1">{totalImpressions}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <div className="text-xs font-semibold text-surface-400">Ad Clicks</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{totalClicks}</div>
        </div>
      </div>

      {/* Visual Chart Card */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-surface-900 mb-4">Daily Activity Visualization</h2>
        {data.length === 0 ? (
          <div className="py-12 text-center text-xs text-surface-400">
            No activity points available to chart yet. Once files are compressed, daily stats appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(-14).map((row, i) => {
              const pct = Math.min(100, Math.round(((row.totalCompressions || 0) / maxComp) * 100))
              return (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <div className="w-24 font-mono text-surface-500 shrink-0">{row.date}</div>
                  <div className="flex-1 bg-surface-100 rounded-full h-4 overflow-hidden flex">
                    <div
                      className="bg-primary-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                  <div className="w-16 text-right font-bold text-surface-800">
                    {row.totalCompressions} files
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-100">
          <h2 className="text-base font-bold text-surface-900">Historical Breakdown</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-surface-500 text-xs font-semibold uppercase tracking-wider border-b border-surface-100">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Compressions</th>
                <th className="px-6 py-3.5">Bandwidth Saved</th>
                <th className="px-6 py-3.5">Ad Impressions</th>
                <th className="px-6 py-3.5">Ad Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-surface-700">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-xs text-surface-400">
                    No analytics history recorded yet.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-surface-900">
                      {row.date}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-surface-800">
                      {row.totalCompressions}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-emerald-600">
                      {formatFileSize(row.totalSizeSaved || 0)}
                    </td>
                    <td className="px-6 py-3.5 text-surface-600">{row.adImpressions || 0}</td>
                    <td className="px-6 py-3.5 text-surface-600">{row.adClicks || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
