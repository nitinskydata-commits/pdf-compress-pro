export interface ToolUsageEvent {
  id: string
  toolId: string
  toolName: string
  category: string
  action: string
  details?: string
  originalSize?: number
  compressedSize?: number
  sizeSaved?: number
  reductionPercent?: number | string
  method?: string
  timestamp: string
}

const STORAGE_KEY = 'pcp_tool_activity'
const MAX_LOCAL_EVENTS = 250

export function trackToolUsage(params: {
  toolId: string
  toolName: string
  category: string
  action: string
  details?: string
  originalSize?: number
  compressedSize?: number
  sizeSaved?: number
  reductionPercent?: number | string
  method?: string
}) {
  const event: ToolUsageEvent = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    ...params,
    timestamp: new Date().toISOString(),
  }

  // 1. Save locally for instant real-time admin sync
  try {
    const existing: ToolUsageEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    existing.unshift(event)
    if (existing.length > MAX_LOCAL_EVENTS) {
      existing.length = MAX_LOCAL_EVENTS
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    // Trigger in-window custom event so admin dashboard updates immediately
    window.dispatchEvent(new CustomEvent('pcp_tool_activity_updated', { detail: event }))
  } catch (err) {
    console.debug('Local telemetry write error:', err)
  }

  // 2. Fire and forget to backend for server-side persistence
  try {
    fetch('/api/telemetry/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {
      // Backend may be cold-starting; client-side cache keeps stats accurate
    })
  } catch (_) {}

  return event
}

export function getLocalToolEvents(): ToolUsageEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function clearLocalToolEvents() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('pcp_tool_activity_updated', { detail: null }))
  } catch {}
}

export function getLocalToolStats() {
  const events = getLocalToolEvents()
  const counts: Record<string, number> = {}
  let totalSaved = 0
  let totalReductions = 0
  let reductionCount = 0

  for (const ev of events) {
    counts[ev.toolId] = (counts[ev.toolId] || 0) + 1
    if (ev.sizeSaved && ev.sizeSaved > 0) {
      totalSaved += ev.sizeSaved
    }
    if (ev.reductionPercent !== undefined) {
      const p = Number(ev.reductionPercent)
      if (!isNaN(p) && p > 0) {
        totalReductions += p
        reductionCount++
      }
    }
  }

  return {
    totalOperations: events.length,
    totalSaved,
    counts,
    avgReduction: reductionCount > 0 ? Number((totalReductions / reductionCount).toFixed(1)) : 0,
    recentEvents: events.slice(0, 60),
  }
}
