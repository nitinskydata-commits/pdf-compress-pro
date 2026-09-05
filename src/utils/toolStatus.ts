import { useState, useEffect } from 'react'

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
    // Initial sync with backend
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.disabledTools && Array.isArray(data.settings.disabledTools)) {
          localStorage.setItem('pcp_disabled_tools', JSON.stringify(data.settings.disabledTools))
          setDisabled(data.settings.disabledTools.includes(slug))
        }
      })
      .catch(() => {})

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
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.disabledTools && Array.isArray(data.settings.disabledTools)) {
          localStorage.setItem('pcp_disabled_tools', JSON.stringify(data.settings.disabledTools))
          setList(data.settings.disabledTools)
        }
      })
      .catch(() => {})

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
