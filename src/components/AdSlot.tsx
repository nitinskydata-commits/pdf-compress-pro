import { useEffect, useRef, useState } from 'react'
import { ADSENSE_CLIENT } from '../data/tools'
import { apiUrl } from '../utils/api'

interface AdSlotProps {
  id: string
  className?: string
  slotType?: 'banner' | 'leaderboard' | 'square' | 'sidebar'
}

let cachedAds: Record<string, string> | null = null
let adsPromise: Promise<Record<string, string>> | null = null

async function getAds(): Promise<Record<string, string>> {
  if (cachedAds) return cachedAds
  if (!adsPromise) {
    adsPromise = fetch(apiUrl('/api/ads'))
      .then((res) => (res.ok ? res.json() : { ads: {} }))
      .then((data) => {
        cachedAds = data?.ads || {}
        return cachedAds!
      })
      .catch(() => {
        cachedAds = {}
        return cachedAds
      })
  }
  return adsPromise
}

export default function AdSlot({ id, className = '' }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [adHtml, setAdHtml] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    getAds().then((ads) => {
      if (mounted) {
        if (ads[id] && ads[id].trim().length > 0) {
          setAdHtml(ads[id])
        }
        setLoaded(true)
      }
    })
    return () => {
      mounted = false
    }
  }, [id])

  useEffect(() => {
    if (!adHtml || !containerRef.current) return

    const container = containerRef.current
    container.innerHTML = ''

    // Parse and safely execute any embedded script tags
    const range = document.createRange()
    range.selectNode(container)
    const fragment = range.createContextualFragment(adHtml)
    container.appendChild(fragment)

    // Track impression in background
    try {
      fetch(apiUrl('/api/admin/track-impression'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: id }),
      }).catch(() => {})
    } catch (_) {}
  }, [adHtml, id])

  if (!loaded) return null

  // If custom ad code is configured in Admin, render it
  if (adHtml) {
    return (
      <div className={`ad-placement-wrapper my-6 ${className}`}>
        <div className="text-[10px] uppercase font-bold tracking-wider text-surface-400 text-center mb-1">
          Advertisement
        </div>
        <div ref={containerRef} className="ad-container flex items-center justify-center overflow-hidden" />
      </div>
    )
  }

  // If no custom code is in admin, show standard responsive container
  return (
    <div className={`ad-placeholder-wrapper my-6 ${className}`}>
      <div className="text-[10px] uppercase font-bold tracking-wider text-surface-400 text-center mb-1">
        Sponsored
      </div>
      <div className="w-full bg-surface-50 border border-dashed border-surface-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[90px] text-center">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '60px' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  )
}
