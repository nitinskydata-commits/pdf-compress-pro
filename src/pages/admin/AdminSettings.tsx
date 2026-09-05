import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { tools } from '../../data/tools'
import { apiUrl } from '../../utils/api'

export default function AdminSettings() {
  const navigate = useNavigate()
  const [logo, setLogo] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [favicon, setFavicon] = useState(() => localStorage.getItem('pcp_site_favicon') || '/favicon.svg')
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [savingFavicon, setSavingFavicon] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem('pcp_admin_email') || '')
  const [disabledTools, setDisabledTools] = useState<string[]>([])
  
  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState('465')
  const [smtpUser, setSmtpUser] = useState(() => localStorage.getItem('pcp_smtp_user') || '')
  const [smtpPass, setSmtpPass] = useState(() => localStorage.getItem('pcp_smtp_pass') || '')
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [smtpConfigured, setSmtpConfigured] = useState(false)
  const [smtpHasSavedPassword, setSmtpHasSavedPassword] = useState(false)
  
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingSmtp, setSavingSmtp] = useState(false)
  const [testingSmtp, setTestingSmtp] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingLogo, setSavingLogo] = useState(false)
  const [syncingTools, setSyncingTools] = useState(false)

  const getAuthToken = () => {
    return localStorage.getItem('token') || ''
  }

  const handleUnauthorized = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('adminUser')
    navigate('/admin/login', { replace: true })
  }

  useEffect(() => {
    loadSettings()
    try {
      const stored = JSON.parse(localStorage.getItem('pcp_disabled_tools') || '[]')
      setDisabledTools(stored)
    } catch (_) {}
  }, [])

  const loadSettings = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        handleUnauthorized()
        return
      }

      const res = await fetch(apiUrl('/api/admin/settings'), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (res.ok) {
        const data = await res.json()
        if (data?.success) {
          if (data?.settings?.logo && data.settings.logo !== 'data:image/png;base64,' && data.settings.logo.length > 30) {
            setLogo(data.settings.logo)
            localStorage.setItem('pcp_site_logo', data.settings.logo)
          }
          if (data?.settings?.favicon && data.settings.favicon.length > 20) {
            setFavicon(data.settings.favicon)
            localStorage.setItem('pcp_site_favicon', data.settings.favicon)
          }
          if (data?.settings?.disabledTools && Array.isArray(data.settings.disabledTools)) {
            setDisabledTools(data.settings.disabledTools)
            localStorage.setItem('pcp_disabled_tools', JSON.stringify(data.settings.disabledTools))
          }
          if (data?.settings?.adminEmail) {
            setAdminEmail(data.settings.adminEmail)
            localStorage.setItem('pcp_admin_email', data.settings.adminEmail)
          }
          if (data?.settings?.smtp) {
            setSmtpConfigured(Boolean(data.settings.smtp.configured))
            if (data.settings.smtp.host) setSmtpHost(data.settings.smtp.host)
            if (data.settings.smtp.port) setSmtpPort(String(data.settings.smtp.port))
            const loadedUser = data.settings.smtp.rawUser || data.settings.smtp.user
            if (loadedUser) {
              setSmtpUser(loadedUser)
              localStorage.setItem('pcp_smtp_user', loadedUser)
            }
            if (data.settings.smtp.pass) {
              setSmtpPass(data.settings.smtp.pass)
              localStorage.setItem('pcp_smtp_pass', data.settings.smtp.pass)
              setSmtpHasSavedPassword(true)
            } else if (data.settings.smtp.hasPassword) {
              setSmtpHasSavedPassword(true)
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be under 5MB.')
        return
      }
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
      setMessage('')
      setError('')
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) return
    setSavingLogo(true)
    setMessage('')
    setError('')

    const formData = new FormData()
    formData.append('logo', logoFile)

    try {
      const token = getAuthToken()
      const res = await fetch(apiUrl('/api/admin/logo'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)
      if (res.ok && data?.success && data?.logoUrl && data.logoUrl.length > 30) {
        setLogo(data.logoUrl)
        setLogoPreview(null)
        setLogoFile(null)
        localStorage.setItem('pcp_site_logo', data.logoUrl)
        window.dispatchEvent(new CustomEvent('pcp_logo_changed', { detail: data.logoUrl }))
        setMessage('✓ Website logo updated successfully! Applied to header & footer.')
      } else {
        setError(data?.error || data?.message || 'Failed to update logo. Please try another image.')
      }
    } catch (err: any) {
      setError('Connection error updating logo: ' + (err?.message || 'Check network'))
    } finally {
      setSavingLogo(false)
    }
  }

  const handleResetLogo = async () => {
    setSavingLogo(true)
    setMessage('')
    setError('')
    try {
      const token = getAuthToken()
      const res = await fetch(apiUrl('/api/admin/logo'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        handleUnauthorized()
        return
      }
      setLogo('/logo.png')
      setLogoPreview(null)
      setLogoFile(null)
      localStorage.setItem('pcp_site_logo', '/logo.png')
      window.dispatchEvent(new CustomEvent('pcp_logo_changed', { detail: '/logo.png' }))
      setMessage('✓ Logo reset to default badge.')
    } catch (err: any) {
      setError('Failed to reset logo: ' + err.message)
    } finally {
      setSavingLogo(false)
    }
  }

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        setError('Favicon file size must be under 2MB.')
        return
      }
      setFaviconFile(file)
      setFaviconPreview(URL.createObjectURL(file))
    }
  }

  const handleFaviconUpload = async () => {
    if (!faviconFile) return
    setSavingFavicon(true)
    setError('')
    setMessage('')

    const formData = new FormData()
    formData.append('favicon', faviconFile)

    try {
      const res = await fetch(apiUrl('/api/admin/favicon'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: formData
      })
      const data = await res.json()

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (res.ok && data?.success && data?.faviconUrl) {
        setFavicon(data.faviconUrl)
        setFaviconPreview(null)
        setFaviconFile(null)
        localStorage.setItem('pcp_site_favicon', data.faviconUrl)
        window.dispatchEvent(new CustomEvent('pcp_favicon_changed', { detail: data.faviconUrl }))
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
        if (link) link.href = data.faviconUrl
        setMessage('✓ Website favicon updated successfully! Browser tab icon updated.')
      } else {
        setError(data?.error || data?.message || 'Failed to update favicon. Please try another image.')
      }
    } catch (err: any) {
      setError('Connection error updating favicon: ' + (err?.message || 'Check network'))
    } finally {
      setSavingFavicon(false)
    }
  }

  const handleResetFavicon = async () => {
    setSavingFavicon(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(apiUrl('/api/admin/favicon'), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      })
      const data = await res.json()

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (res.ok && data?.success) {
        setFavicon('/favicon.svg')
        setFaviconPreview(null)
        setFaviconFile(null)
        localStorage.setItem('pcp_site_favicon', '/favicon.svg')
        window.dispatchEvent(new CustomEvent('pcp_favicon_changed', { detail: '/favicon.svg' }))
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
        if (link) link.href = '/favicon.svg'
        setMessage('✓ Favicon reset to default (/favicon.svg).')
      }
    } catch (_) {
      setError('Connection error resetting favicon')
    } finally {
      setSavingFavicon(false)
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
    setSavingPassword(true)

    try {
      const token = getAuthToken()
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminPassword: newPassword }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        setMessage('✓ Admin password updated successfully! Keep your new password safe.')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data?.message || 'Failed to update password')
      }
    } catch {
      setError('Connection error updating password')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminEmail || !adminEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setMessage('')
    setError('')
    setSavingEmail(true)

    try {
      const token = getAuthToken()
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminEmail: adminEmail.trim().toLowerCase() }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        localStorage.setItem('pcp_admin_email', adminEmail.trim().toLowerCase())
        setMessage(`✓ Admin authentication email updated to: ${adminEmail.trim().toLowerCase()}. All login OTPs will be sent here.`)
      } else {
        setError(data?.message || 'Failed to update email.')
      }
    } catch {
      setError('Connection error updating email.')
    } finally {
      setSavingEmail(false)
    }
  }

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUser = smtpUser.trim()
    const cleanPass = smtpPass.replace(/\s+/g, '').trim()

    if (!cleanUser) {
      setError('Please provide your sender email address.')
      return
    }

    if (!cleanPass && !smtpConfigured && !smtpHasSavedPassword) {
      setError('Please provide your 16-character SMTP application password.')
      return
    }

    setMessage('')
    setError('')
    setSavingSmtp(true)

    try {
      const token = getAuthToken()
      const payload: any = {
        host: smtpHost,
        port: Number(smtpPort) || 465,
        user: cleanUser,
        secure: Number(smtpPort) === 465,
      }
      if (cleanPass) {
        payload.pass = cleanPass
      }

      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ smtpConfig: payload }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        setSmtpConfigured(true)
        setSmtpHasSavedPassword(true)
        if (cleanPass) {
          setSmtpPass(cleanPass) // Keep clean code in state so user sees it is saved!
          localStorage.setItem('pcp_smtp_pass', cleanPass)
        }
        if (cleanUser) {
          localStorage.setItem('pcp_smtp_user', cleanUser)
        }
        setMessage('✓ SMTP configuration and 16-character password saved successfully! Password is secure on server.')
      } else {
        setError(data?.message || 'Failed to save SMTP settings.')
      }
    } catch {
      setError('Connection error saving SMTP configuration.')
    } finally {
      setSavingSmtp(false)
    }
  }

  const handleTestSmtp = async () => {
    setMessage('')
    setError('')
    setTestingSmtp(true)

    try {
      const token = getAuthToken()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000)

      const payload: any = {}
      if (smtpHost) payload.host = smtpHost
      if (smtpPort) payload.port = Number(smtpPort) || 465
      if (smtpUser) payload.user = smtpUser.trim()
      if (smtpPass) payload.pass = smtpPass.replace(/\s+/g, '').trim()
      payload.secure = Number(smtpPort) === 465
      payload.targetEmail = (adminEmail || smtpUser).trim().toLowerCase()

      const res = await fetch(apiUrl('/api/admin/smtp/test'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        setMessage(data.message || '✓ Test verification email successfully delivered to your inbox!')
      } else {
        setError(data?.message || 'Test email failed. Please check your SMTP host, port, and App Password.')
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('SMTP test timed out after 12 seconds. Tip: If using port 465, try port 587 (or verify your SMTP host & password).')
      } else {
        setError('Unable to reach backend to send test email: ' + (err?.message || 'Network error'))
      }
    } finally {
      setTestingSmtp(false)
    }
  }

  const saveDisabledToolsToServer = async (toolsList: string[]) => {
    try {
      const token = getAuthToken()
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ disabledTools: toolsList }),
      })
      if (res.status === 401) {
        handleUnauthorized()
        return false
      }
      return res.ok
    } catch {
      return false
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
    const success = await saveDisabledToolsToServer(updated)
    if (success) {
      setMessage(`✓ Updated: "${toolObj?.name || slug}" is now ${isNowDisabled ? 'Disabled' : 'Online'} (saved to server).`)
      setError('')
    } else {
      setMessage(`Updated locally: "${toolObj?.name || slug}" is now ${isNowDisabled ? 'Disabled' : 'Online'}.`)
      setError('Notice: Server sync pending. Click "Sync to Live Site" to force update.')
    }
    setTimeout(() => setMessage(''), 4000)
  }

  const handleSetAllToolsStatus = async (enableAll: boolean) => {
    const updated = enableAll ? [] : tools.map((t) => t.slug)
    setDisabledTools(updated)
    localStorage.setItem('pcp_disabled_tools', JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('pcp_tools_changed', { detail: updated }))
    const success = await saveDisabledToolsToServer(updated)
    if (success) {
      setMessage(enableAll ? '✓ All 22 tools are now Online!' : '✓ All tools are now marked Disabled.')
    } else {
      setMessage('Updated locally. Syncing...')
    }
  }

  const handleManualSync = async () => {
    setSyncingTools(true)
    setMessage('')
    setError('')
    const success = await saveDisabledToolsToServer(disabledTools)
    setSyncingTools(false)
    if (success) {
      setMessage('✓ All tool availability settings successfully synced to live server!')
    } else {
      setError('Failed to sync settings to server. Please check internet connection.')
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-surface-900 tracking-tight">System &amp; Security Settings</h1>
        <p className="text-xs text-surface-500 mt-0.5">Manage two-factor email OTP, SMTP delivery, branding, and tool switches</p>
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

      {/* 🔐 Admin Email & 2-Step OTP Authentication Settings */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-surface-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔐</span>
            <h2 className="text-base font-bold text-surface-900">Admin Email &amp; OTP Two-Step Authentication</h2>
          </div>
          <p className="text-xs text-surface-500 mt-0.5">
            Every login attempt sends a 6-digit one-time password (OTP) to this authorized email address before granting access.
          </p>
        </div>

        <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1.5">
              Authorized Administrator Email
            </label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => {
                setAdminEmail(e.target.value)
                localStorage.setItem('pcp_admin_email', e.target.value)
              }}
              placeholder="support.pdfcompresspro@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={savingEmail}
            className="btn-primary px-5 py-2.5 text-xs font-bold shadow-md shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {savingEmail ? 'Saving...' : 'Update OTP Email'}
          </button>
        </form>
      </div>

      {/* 📧 SMTP Email Delivery Settings */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📧</span>
              <h2 className="text-base font-bold text-surface-900">SMTP Server Configuration (Email Dispatch)</h2>
            </div>
            <p className="text-xs text-surface-500 mt-0.5">
              Configure your mail transport (e.g. Gmail SMTP with App Password) to deliver verification OTPs directly to inboxes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
              smtpConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {smtpConfigured ? '● SMTP Connected' : '○ Console Fallback Mode'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-blue-950">
            <span>💡</span>
            <span>Notice for Render Free Tier Hosting</span>
          </p>
          <p className="leading-relaxed text-blue-800">
            Render's <strong>Free Tier</strong> automatically blocks outgoing raw SMTP ports <strong>465 &amp; 587</strong> to prevent spam, causing connection timeouts with direct Gmail SMTP.
          </p>
          <p className="leading-relaxed text-blue-800">
            <strong>100% Free Solution:</strong> Paste a free <strong>Resend API Key</strong> (starts with <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">re_...</code> from <a href="https://resend.com" target="_blank" rel="noreferrer" className="underline font-bold text-blue-900 hover:text-blue-950">resend.com</a>) or <strong>Brevo API Key</strong> (<code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">xkeysib-...</code>) into the Password field below. It sends over unblocked HTTPS (Port 443) with zero timeouts!
          </p>
        </div>

        <form onSubmit={handleSaveSmtp} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-surface-700 mb-1.5">SMTP Host</label>
              <input
                type="text"
                required
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1.5">Port</label>
              <input
                type="number"
                required
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="465"
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <span className="text-[10px] text-surface-400 block mt-1">465 (SSL) or 587 (TLS)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1.5">Sender Email Address (User)</label>
            <input
              type="email"
              required
              value={smtpUser}
              onChange={(e) => {
                setSmtpUser(e.target.value)
                localStorage.setItem('pcp_smtp_user', e.target.value)
              }}
              placeholder="support.pdfcompresspro@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1.5 flex items-center justify-between">
              <span>SMTP App Password or Resend / Brevo API Key</span>
              {(smtpPass || smtpHasSavedPassword) && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✓ {smtpPass ? `${smtpPass.length} chars entered` : 'Active on server'}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="smtp_app_password"
                name="smtp_app_password"
                autoComplete="new-password"
                type={showSmtpPass ? 'text' : 'password'}
                value={smtpPass}
                onChange={(e) => {
                  const v = e.target.value.replace(/\s+/g, '')
                  setSmtpPass(v)
                  localStorage.setItem('pcp_smtp_pass', v)
                }}
                placeholder={smtpHasSavedPassword ? '•••••••••••••••• (Active on server — type new to change)' : 'Paste 16-char App Password OR Resend API Key (re_...)'}
                className="w-full pl-4 pr-24 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSmtpPass(!showSmtpPass)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs text-surface-600 hover:text-surface-900 font-medium rounded-lg hover:bg-surface-100 transition-all border border-surface-200 bg-surface-50"
              >
                {showSmtpPass ? '🙈 Hide' : '👁️ Show'}
              </button>
            </div>
            {smtpPass ? (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                ✓ {smtpPass.length} characters entered {smtpPass.startsWith('re_') ? '(Resend HTTP API Key detected — uses unblocked Port 443!)' : smtpPass.length === 16 ? '(Exact 16-character Gmail App Password format)' : ''}
              </p>
            ) : smtpHasSavedPassword ? (
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                🔒 Credentials saved on server. Leave blank to keep, or paste a new password / API key to update.
              </p>
            ) : (
              <p className="text-[11px] text-surface-400 mt-1 leading-relaxed">
                <strong>Tip for Render Free:</strong> Paste a free Resend API key (starts with <code>re_</code>) to bypass blocked SMTP ports on Render free tier.
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={savingSmtp || testingSmtp}
              className="btn-primary px-5 py-2.5 text-xs font-bold shadow-md shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {savingSmtp ? 'Saving...' : 'Save SMTP Settings'}
            </button>

            {(smtpConfigured || (smtpUser && smtpPass)) && (
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testingSmtp || savingSmtp}
                className="px-4 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-xl text-xs font-bold border border-surface-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingSmtp ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    <span>Testing Dispatch...</span>
                  </>
                ) : (
                  <span>✉️ Send Test OTP Email to {adminEmail || smtpUser || 'Admin Email'}</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tool Availability Switcher (All 22 Tools) */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-100">
          <div>
            <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <span>🛠️</span>
              <span>Tool Availability Switchboard (22 Utilities)</span>
            </h2>
            <p className="text-xs text-surface-500 mt-0.5">Toggle tools active or inactive in real-time. Inactive tools are hidden across the homepage, navigation, and blocked from usage.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              {tools.length - disabledTools.length} of {tools.length} Online
            </span>
            <button
              type="button"
              onClick={() => handleSetAllToolsStatus(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              🟢 Enable All
            </button>
            <button
              type="button"
              onClick={() => handleSetAllToolsStatus(false)}
              className="px-3 py-1.5 bg-danger-50 hover:bg-danger-100 text-danger-800 border border-danger-200 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              🔴 Disable All
            </button>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncingTools}
              className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{syncingTools ? 'Syncing...' : '💾 Sync to Live Site'}</span>
            </button>
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
              disabled={savingLogo || !logoFile}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-40"
            >
              {savingLogo ? 'Uploading...' : 'Save & Publish Logo'}
            </button>
            {logo && logo !== '/logo.png' && (
              <button
                type="button"
                onClick={handleResetLogo}
                disabled={savingLogo}
                className="px-4 py-2.5 bg-surface-100 hover:bg-danger-50 text-surface-600 hover:text-danger-700 rounded-xl text-xs font-bold transition-all border border-surface-200 disabled:opacity-50"
              >
                Reset Default
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Website Favicon Section */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌐</span>
              <h2 className="text-base font-bold text-surface-900">Website Favicon Icon</h2>
            </div>
            <p className="text-xs text-surface-500 mt-0.5">
              The icon displayed in browser tabs, bookmarks, and mobile home screen shortcuts.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-surface-500 bg-surface-100 px-3 py-1 rounded-full self-start sm:self-auto">
            Recommended: 32x32, 64x64 or SVG
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Active Favicon Preview */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-50 border border-surface-200 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                <img
                  src={favicon}
                  alt="Active Favicon"
                  className="w-8 h-8 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.svg' }}
                />
              </div>
              <div className="text-[10px] font-bold text-surface-400 mt-1 uppercase">Active Icon</div>
            </div>

            {/* Mock Browser Tab Preview */}
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold text-surface-400 mb-1 uppercase">Live Browser Tab Preview</div>
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-t-xl bg-surface-100 border border-surface-200 text-xs font-semibold text-surface-700 shadow-xs">
                <img
                  src={faviconPreview || favicon}
                  alt="Tab Icon"
                  className="w-4 h-4 object-contain flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.svg' }}
                />
                <span className="truncate max-w-[140px]">PDFCompress Pro</span>
                <span className="text-[10px] text-surface-400 ml-1">✕</span>
              </div>
            </div>

            {/* Pending Upload Preview */}
            {faviconPreview && (
              <div className="text-center animate-scale-in">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 border-2 border-primary-500 flex items-center justify-center overflow-hidden p-2 shadow-sm">
                  <img src={faviconPreview} alt="New Favicon Preview" className="w-8 h-8 object-contain" />
                </div>
                <div className="text-[10px] font-bold text-primary-600 mt-1 uppercase">New Preview</div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <input
              type="file"
              id="adminFaviconUpload"
              accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp"
              onChange={handleFaviconChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => document.getElementById('adminFaviconUpload')?.click()}
              className="w-full sm:w-auto px-4 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Choose New Favicon
            </button>
            <button
              type="button"
              onClick={handleFaviconUpload}
              disabled={savingFavicon || !faviconFile}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-40"
            >
              {savingFavicon ? 'Uploading...' : 'Save & Publish Favicon'}
            </button>
            {favicon && favicon !== '/favicon.svg' && (
              <button
                type="button"
                onClick={handleResetFavicon}
                disabled={savingFavicon}
                className="w-full sm:w-auto px-4 py-2.5 bg-surface-100 hover:bg-danger-50 text-surface-600 hover:text-danger-700 rounded-xl text-xs font-bold transition-all border border-surface-200 disabled:opacity-50"
              >
                Reset Default
              </button>
            )}
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
              disabled={savingPassword}
              className="btn-primary px-6 py-2.5 text-xs font-bold shadow-md shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {savingPassword ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
