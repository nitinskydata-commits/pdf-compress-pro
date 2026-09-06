import { useState, useEffect } from 'react'
import { apiUrl } from './api'

let globalSettingsPromise: Promise<any> | null = null

export function fetchGlobalSettings() {
  if (!globalSettingsPromise) {
    globalSettingsPromise = new Promise((resolve) => {
      const doFetch = () => {
        fetch(apiUrl('/api/settings'))
          .then((res) => res.json())
          .then((data) => resolve(data))
          .catch(() => {
            globalSettingsPromise = null
            resolve(null)
          })
      }

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(doFetch, { timeout: 1500 })
      } else {
        setTimeout(doFetch, 200)
      }
    })
  }
  return globalSettingsPromise
}

export function getDisabledTools(): string[] {
  try {
    return JSON.parse(localStorage.getItem('pcp_disabled_tools') || '[]')
  } catch {
    return []
  }
}

export function isToolDisabled(slug: string): boolean {
  return getDisabledTools().includes(slug)
}

export function useIsToolDisabled(slug: string): boolean {
  const [disabled, setDisabled] = useState<boolean>(() => isToolDisabled(slug))

  useEffect(() => {
    fetchGlobalSettings().then((data) => {
      if (data?.settings?.disabledTools && Array.isArray(data.settings.disabledTools)) {
        localStorage.setItem('pcp_disabled_tools', JSON.stringify(data.settings.disabledTools))
        setDisabled(data.settings.disabledTools.includes(slug))
      }
    })

    const handleCustomEvent = (e: any) => {
      if (Array.isArray(e.detail)) {
        setDisabled(e.detail.includes(slug))
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'pcp_disabled_tools') {
        try {
          const list = JSON.parse(e.newValue || '[]')
          setDisabled(list.includes(slug))
        } catch (_) {}
      }
    }

    window.addEventListener('pcp_tools_changed', handleCustomEvent)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener('pcp_tools_changed', handleCustomEvent)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [slug])

  return disabled
}

export function useDisabledToolsList(): string[] {
  const [list, setList] = useState<string[]>(getDisabledTools)

  useEffect(() => {
    fetchGlobalSettings().then((data) => {
      if (data?.settings?.disabledTools && Array.isArray(data.settings.disabledTools)) {
        localStorage.setItem('pcp_disabled_tools', JSON.stringify(data.settings.disabledTools))
        setList(data.settings.disabledTools)
      }
    })

    const handleCustomEvent = (e: any) => {
      if (Array.isArray(e.detail)) {
        setList(e.detail)
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'pcp_disabled_tools') {
        try {
          setList(JSON.parse(e.newValue || '[]'))
        } catch (_) {}
      }
    }

    window.addEventListener('pcp_tools_changed', handleCustomEvent)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener('pcp_tools_changed', handleCustomEvent)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [])

  return list
}

export function getSiteLogo(): string {
  try {
    const stored = localStorage.getItem('pcp_site_logo')
    // Clear legacy multi-megabyte base64 strings from localStorage to keep performance pristine
    if (stored && stored.startsWith('data:') && stored.length > 5000) {
      localStorage.removeItem('pcp_site_logo')
      return '/logo.png'
    }
    if (stored && stored !== 'data:image/png;base64,' && stored.length > 5) {
      return stored.startsWith('/api/') ? apiUrl(stored) : stored
    }
    return '/logo.png'
  } catch {
    return '/logo.png'
  }
}

export function useSiteLogo(): string {
  const [logo, setLogo] = useState<string>(getSiteLogo)

  useEffect(() => {
    fetchGlobalSettings().then((data) => {
      if (data?.settings?.logo) {
        let cleanLogo =
          data.settings.logo === 'data:image/png;base64,' || data.settings.logo.length < 5
            ? '/logo.png'
            : data.settings.logo
        if (cleanLogo.startsWith('/api/')) {
          cleanLogo = apiUrl(cleanLogo)
        }
        localStorage.setItem('pcp_site_logo', cleanLogo)
        setLogo(cleanLogo)
      }
    })

    const handleCustomEvent = (e: any) => {
      if (typeof e.detail === 'string') {
        let cleanLogo = e.detail
        if (cleanLogo.startsWith('/api/')) {
          cleanLogo = apiUrl(cleanLogo)
        }
        setLogo(cleanLogo)
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'pcp_site_logo') {
        let cleanLogo = e.newValue || '/logo.png'
        if (cleanLogo.startsWith('/api/')) {
          cleanLogo = apiUrl(cleanLogo)
        }
        setLogo(cleanLogo)
      }
    }

    window.addEventListener('pcp_logo_changed', handleCustomEvent)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener('pcp_logo_changed', handleCustomEvent)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [])

  return logo
}

export function updateFaviconInDom(url: string) {
  try {
    if (!url || typeof document === 'undefined') return
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    // Only touch DOM if different to avoid triggering browser reload animations
    if (link.getAttribute('href') !== url && link.href !== url) {
      link.href = url
    }
  } catch (_) {}
}

export function getSiteFavicon(): string {
  try {
    const stored = localStorage.getItem('pcp_site_favicon')
    // Clear legacy multi-megabyte base64 strings from localStorage
    if (stored && stored.startsWith('data:') && stored.length > 5000) {
      localStorage.removeItem('pcp_site_favicon')
      return '/favicon.svg'
    }
    if (stored && stored !== 'data:image/svg+xml;base64,' && stored.length > 5) {
      return stored.startsWith('/api/') ? apiUrl(stored) : stored
    }
    return '/favicon.svg'
  } catch {
    return '/favicon.svg'
  }
}

export function useSiteFavicon(): string {
  const [favicon, setFavicon] = useState<string>(getSiteFavicon)

  useEffect(() => {
    updateFaviconInDom(favicon)

    fetchGlobalSettings().then((data) => {
      if (data?.settings?.favicon) {
        let cleanFavicon =
          data.settings.favicon === 'data:image/svg+xml;base64,' || data.settings.favicon.length < 5
            ? '/favicon.svg'
            : data.settings.favicon
        if (cleanFavicon.startsWith('/api/')) {
          cleanFavicon = apiUrl(cleanFavicon)
        }
        localStorage.setItem('pcp_site_favicon', cleanFavicon)
        setFavicon(cleanFavicon)
        updateFaviconInDom(cleanFavicon)
      }
    })

    const handleCustomEvent = (e: any) => {
      if (typeof e.detail === 'string') {
        let next = e.detail
        if (next.startsWith('/api/')) {
          next = apiUrl(next)
        }
        setFavicon(next)
        updateFaviconInDom(next)
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'pcp_site_favicon') {
        let next = e.newValue || '/favicon.svg'
        if (next.startsWith('/api/')) {
          next = apiUrl(next)
        }
        setFavicon(next)
        updateFaviconInDom(next)
      }
    }

    window.addEventListener('pcp_favicon_changed', handleCustomEvent)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener('pcp_favicon_changed', handleCustomEvent)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, []) // Empty dependency array: runs once on mount!

  return favicon
}
