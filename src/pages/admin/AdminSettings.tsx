import { useState, useEffect } from 'react'
import { tools } from '../../data/tools'
import { apiUrl } from '../../utils/api'

export default function AdminSettings() {
  const [logo, setLogo] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [disabledTools, setDisabledTools] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSettings()
    try {
      const stored = JSON.parse(localStorage.getItem('pcp_disabled_tools') || '[]')
      setDisabledTools(stored)
    } catch (_) {}
  }, [])

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token') || 'local-admin-token'
      const res = await fetch(apiUrl('/api/admin/settings'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.success && data?.settings?.logo) {
          setLogo(data.settings.logo)
        }
        if (data?.settings?.disabledTools) {
          setDisabledTools(data.settings.disabledTools)
          localStorage.setItem('pcp_disabled_tools', JSON.stringify(data.settings.disabledTools))
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
      setMessage('')
      setError('')
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) return
    setLoading(true)
    setMessage('')
    setError('')

    const formData = new FormData()
    formData.append('logo', logoFile)

    try {
      const token = localStorage.getItem('token') || 'local-admin-token'
      const res = await fetch(apiUrl('/api/admin/logo'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        setLogo(data.logoUrl)
        setLogoPreview(null)
        setLogoFile(null)
        setMessage('Website logo updated successfully!')
      } else {
        setError(data?.message || 'Failed to update logo')
      }
    } catch {
      setError('Connection error updating logo')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) return

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setMessage('')
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token') || 'local-admin-token'
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminPassword: newPassword }),
      })

      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        setMessage('Admin password updated successfully!')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data?.message || 'Failed to update password')
      }
    } catch {
      setError('Connection error updating password')
    } finally {
      setLoading(false)
    }
  }

  const toggleToolStatus = async (slug: string) => {
    let updated: string[]
    const isNowDisabled = !disabledTools.includes(slug)
    if (disabledTools.includes(slug)) {
      updated = disabledTools.filter((s) => s !== slug)
    } else {
      updated = [...disabledTools, slug]
    }
    setDisabledTools(updated)
    localStorage.setItem('pcp_disabled_tools', JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('pcp_tools_changed', { detail: updated }))

    const toolObj = tools.find((t) => t.slug === slug)
    setMessage(`Updated: "${toolObj?.name || slug}" is now ${isNowDisabled ? 'Disabled' : 'Online'}.`)
    setTimeout(() => setMessage(''), 4000)

    try {
      const token = localStorage.getItem('token') || 'local-admin-token'
      await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ disabledTools: updated }),
      })
    } catch (_) {}
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-surface-900 tracking-tight">System &amp; Platform Settings</h1>
        <p className="text-xs text-surface-500 mt-0.5">Manage branding assets, tool availability switches, and administrative authentication</p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <span>✓</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-danger-50 border border-danger-200 text-xs font-bold text-danger-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tool Availability Switcher (All 22 Tools) */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <span>🛠️</span>
              <span>Tool Availability Switchboard (22 Utilities)</span>
            </h2>
            <p className="text-xs text-surface-500 mt-0.5">Toggle tools active or inactive in real-time. Inactive tools are hidden from the homepage.</p>
          </div>
          <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {tools.length - disabledTools.length} of {tools.length} Tools Online
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((t) => {
            const isOnline = !disabledTools.includes(t.slug)
            return (
              <div
                key={t.slug}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isOnline
                    ? 'bg-surface-50/50 border-surface-200'
                    : 'bg-danger-50/30 border-danger-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="text-xl">{t.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-surface-900 truncate">{t.shortName}</div>
                    <div className="text-[10px] text-surface-400 capitalize">{t.category}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleToolStatus(t.slug)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-xs ${
                    isOnline
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-surface-200 text-surface-600 hover:bg-surface-300'
                  }`}
                >
                  {isOnline ? 'Online' : 'Disabled'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Website Logo Section */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-surface-900">Website Logo</h2>
          <p className="text-xs text-surface-500 mt-0.5">Recommended format: SVG or PNG with transparent background (512x512)</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-surface-50 border border-surface-200 flex items-center justify-center overflow-hidden p-2">
                {logo ? (
                  <img src={logo} alt="Active Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-2xl font-black text-primary-600">P</span>
                )}
              </div>
              <div className="text-[10px] font-bold text-surface-400 mt-1 uppercase">Active</div>
            </div>

            {logoPreview && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary-50 border-2 border-primary-500 flex items-center justify-center overflow-hidden p-2 animate-scale-in">
                  <img src={logoPreview} alt="New Preview" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="text-[10px] font-bold text-primary-600 mt-1 uppercase">New Preview</div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="file"
              id="adminLogoUpload"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => document.getElementById('adminLogoUpload')?.click()}
              className="px-4 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Choose New Image
            </button>
            <button
              type="button"
              onClick={handleLogoUpload}
              disabled={loading || !logoFile}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-40"
            >
              {loading ? 'Uploading...' : 'Save & Publish Logo'}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-surface-900">Change Admin Password</h2>
          <p className="text-xs text-surface-500 mt-0.5">Ensure you use a strong, unpredictable password</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new admin password"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new admin password"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-2.5 text-xs font-bold shadow-md shadow-primary-500/20 active:scale-95 transition-all"
            >
              {loading ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
