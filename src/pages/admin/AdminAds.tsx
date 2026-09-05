import { useState, useEffect } from 'react'

const AD_SLOTS = [
  // Home Page
  { id: 'home-hero', label: 'Home Page: Hero Section', desc: 'Prominent display directly beneath the main welcome banner.', category: 'Home Page' },
  { id: 'home-features', label: 'Home Page: Tools Grid', desc: 'Interstitial banner between tool categories.', category: 'Home Page' },
  { id: 'home-faq', label: 'Home Page: FAQ Section', desc: 'In-content placement between questions.', category: 'Home Page' },
  { id: 'home-footer', label: 'Home Page: Above Footer', desc: 'Wide leaderboard ad before the site footer.', category: 'Home Page' },
  // Compress Page
  { id: 'compress-top', label: 'Compress Tool: Above Uploader', desc: 'High visibility leaderboard directly above the drop zone.', category: 'Compress Page' },
  { id: 'compress-tool', label: 'Compress Tool: Processed State', desc: 'Ad positioned right above download action.', category: 'Compress Page' },
  { id: 'compress-sidebar', label: 'Compress Tool: Sidebar Slot', desc: 'Sticky skyscraper or square banner on desktop.', category: 'Compress Page' },
  { id: 'compress-footer', label: 'Compress Tool: Footer Banner', desc: 'Bottom placement on tool pages.', category: 'Compress Page' },
]

export default function AdminAds() {
  const [ads, setAds] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [savingSlot, setSavingSlot] = useState<string | null>(null)

  useEffect(() => {
    loadAds()
  }, [])

  const loadAds = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/ads', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.success && data?.ads) {
          setAds(data.ads)
        }
      }
    } catch (err) {
      console.error('Error loading ads:', err)
    }
  }

  const handleSave = async (position: string) => {
    setSavingSlot(position)
    setMessage('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/ads/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          position,
          code: ads[position] || '',
        }),
      })
      if (res.ok) {
        setMessage(`Saved slot: ${position}`)
        setTimeout(() => setMessage(''), 3500)
      }
    } catch {
      setMessage('Failed to save ad slot.')
    } finally {
      setSavingSlot(null)
    }
  }

  const categories = ['Home Page', 'Compress Page']

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-surface-900 tracking-tight">Advertisement Placements</h1>
        <p className="text-xs text-surface-500 mt-0.5">Configure AdSense, affiliate scripts, or custom HTML banners across 8 dedicated zones.</p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <span>✓</span>
          <span>{message}</span>
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat} className="space-y-4">
          <h2 className="text-base font-bold text-surface-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
            <span>{cat} Slots</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {AD_SLOTS.filter((s) => s.category === cat).map((slot) => (
              <div key={slot.id} className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-surface-900 text-sm">{slot.label}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-100 text-surface-600">
                      #{slot.id}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mb-4">{slot.desc}</p>

                  <textarea
                    rows={4}
                    value={ads[slot.id] || ''}
                    onChange={(e) => setAds({ ...ads, [slot.id]: e.target.value })}
                    placeholder={`Paste ad code snippet for ${slot.id} (e.g. <script async src="...">)...`}
                    className="w-full p-3 font-mono text-xs bg-surface-50 border border-surface-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleSave(slot.id)}
                    disabled={savingSlot === slot.id}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {savingSlot === slot.id ? 'Saving...' : 'Save Placement'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
