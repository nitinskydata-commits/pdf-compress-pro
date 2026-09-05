const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.endsWith('.local'))

export const BACKEND_URL = isLocalhost
  ? ''
  : (import.meta.env.VITE_BACKEND_URL || 'https://pdf-compress-backend.onrender.com').replace(/\/$/, '')

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BACKEND_URL}${cleanPath}`
}
