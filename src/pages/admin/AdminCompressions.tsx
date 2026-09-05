import { useState, useEffect } from 'react'
import { formatFileSize } from '../../utils/fileUtils'

interface DetailedCompression {
  fileName?: string
  originalName?: string
  originalSize?: number
  compressedSize?: number
  reductionPercent?: number | string
  compressionLevel?: string
  level?: string
  method?: string
  optimized?: boolean
  timestamp?: string
  date?: string
}

export default function AdminCompressions() {
  const [compressions, setCompressions] = useState<DetailedCompression[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  const loadCompressions = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.success && data?.stats) {
          setCompressions(data.stats.recentCompressions || [])
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompressions()
  }, [])

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear ALL compression logs? This action cannot be reversed.')) {
      return
    }

    setClearing(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/compressions', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setCompressions([])
      }
    } catch (err) {
      console.error('Failed to clear history:', err)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-surface-900 tracking-tight">Compression History Logs</h1>
          <p className="text-xs text-surface-500 mt-0.5">Comprehensive audit trail of optimized documents</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCompressions}
            disabled={loading}
            className="px-4 py-2 bg-white hover:bg-surface-50 border border-surface-200 rounded-xl text-xs font-bold text-surface-700 shadow-sm transition-all"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <button
            onClick={handleClearHistory}
            disabled={clearing || compressions.length === 0}
            className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-40"
          >
            {clearing ? 'Clearing...' : '🗑️ Clear All History'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-surface-500 text-xs font-semibold uppercase tracking-wider border-b border-surface-100">
              <tr>
                <th className="px-6 py-3.5">File Name</th>
                <th className="px-6 py-3.5">Original</th>
                <th className="px-6 py-3.5">Result</th>
                <th className="px-6 py-3.5">Reduction</th>
                <th className="px-6 py-3.5">Level</th>
                <th className="px-6 py-3.5">Engine</th>
                <th className="px-6 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-surface-700">
              {compressions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-surface-400">
                    No compression records logged yet.
                  </td>
                </tr>
              ) : (
                compressions.map((item, idx) => {
                  const fname = item.fileName || item.originalName || 'Untitled.pdf'
                  return (
                    <tr key={idx} className="hover:bg-surface-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-surface-900 max-w-xs truncate" title={fname}>
                        📄 {fname}
                      </td>
                      <td className="px-6 py-3.5 text-surface-600">{formatFileSize(item.originalSize || 0)}</td>
                      <td className="px-6 py-3.5 text-surface-900 font-semibold">{formatFileSize(item.compressedSize || 0)}</td>
                      <td className="px-6 py-3.5 font-bold text-emerald-600">
                        -{item.reductionPercent}%
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-100 text-surface-700 border border-surface-200">
                          {item.compressionLevel || item.level || 'medium'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary-50 text-primary-700 border border-primary-100">
                          {item.method || (item.optimized ? 'Ghostscript' : 'PDF-Lib')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-surface-500">
                        {item.timestamp || item.date ? new Date(item.timestamp || item.date!).toLocaleString() : 'Recent'}
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
