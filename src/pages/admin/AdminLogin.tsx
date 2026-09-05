import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import { apiUrl } from '../../utils/api'

export default function AdminLogin() {
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS')
  const [email, setEmail] = useState('')
  const [targetEmail, setTargetEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [expiresInSeconds, setExpiresInSeconds] = useState(900) // 15 mins
  const navigate = useNavigate()

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Expiration timer for active OTP
  useEffect(() => {
    if (step !== 'OTP' || expiresInSeconds <= 0) return
    const timer = setInterval(() => {
      setExpiresInSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [step, expiresInSeconds])

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Step 1: Submit Credentials & Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter both your admin email and password.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(apiUrl('/api/auth/request-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok && data?.success && data?.step === 'OTP_REQUIRED') {
        const dest = data.email || email.trim()
        setTargetEmail(dest)
        setMaskedEmail(data.maskedEmail || dest)
        setStep('OTP')
        setOtp('')
        setExpiresInSeconds(900)
        setResendCooldown(45)
        setInfoMessage(data.message || `A 6-digit access code was sent to ${data.maskedEmail || dest}.`)
        return
      }

      setError(data?.message || 'Invalid admin credentials.')
    } catch {
      setError('Unable to communicate with authentication server. Please verify your connection.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')

    const cleanOtp = otp.trim().replace(/\D/g, '')
    if (cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit numeric verification code.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(apiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail || email.trim(), otp: cleanOtp }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok && data?.success && data?.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('adminUser', JSON.stringify(data.user || { email: targetEmail || email.trim() }))
        navigate('/admin/dashboard', { replace: true })
        return
      }

      setError(data?.message || 'Invalid or expired verification code.')
    } catch {
      setError('Connection error verifying OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return
    setError('')
    setInfoMessage('')
    setLoading(true)

    try {
      const res = await fetch(apiUrl('/api/auth/resend-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok && data?.success) {
        setResendCooldown(60)
        setExpiresInSeconds(600)
        setInfoMessage(data.message || 'A fresh verification code has been dispatched!')
      } else {
        setError(data?.message || 'Failed to resend code. Please try again in a moment.')
      }
    } catch {
      setError('Connection error while resending code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4">
      <SEOHead
        title="Admin Sign In — PDFCompress Pro"
        description="Secure two-step authentication portal for PDFCompress Pro administrators."
        canonical="/admin/login"
      />

      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span className="w-10 h-10 rounded-2xl bg-primary-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
              P
            </span>
            <span className="text-2xl font-black text-surface-900 tracking-tight">
              PDFCompress<span className="text-primary-600">Pro</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-surface-800">Admin Control Center</h1>
          <p className="text-xs text-surface-500 mt-1">
            {step === 'CREDENTIALS'
              ? 'Authorized access only • Protected by 2-step email verification'
              : 'Enter the verification code sent to your authorized email'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-surface-900/5 border border-surface-200">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-danger-50 border border-danger-200 text-xs font-semibold text-danger-700 flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <span className="mt-0.5">{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-start gap-2">
              <span className="text-base leading-none">✓</span>
              <span className="mt-0.5">{infoMessage}</span>
            </div>
          )}

          {step === 'CREDENTIALS' ? (
            /* STEP 1: Email & Password Form */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1.5">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="support.pdfcompresspro@gmail.com"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin text-base">⚙</span>
                      <span>Verifying &amp; Sending OTP...</span>
                    </>
                  ) : (
                    <span>Next: Send Email OTP →</span>
                  )}
                </button>
              </div>

              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200/60 text-[11px] text-surface-500 flex items-center gap-2">
                <span>🛡️</span>
                <span>An OTP code will be sent to the administrator email to finalize sign-in.</span>
              </div>
            </form>
          ) : (
            /* STEP 2: 6-Digit OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center pb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-100 mb-2">
                  <span>✉️</span>
                  <span>Sent to: {maskedEmail}</span>
                </div>
                <p className="text-xs text-surface-500">
                  Code expires in{' '}
                  <span className={`font-mono font-bold ${expiresInSeconds < 60 ? 'text-danger-600' : 'text-surface-700'}`}>
                    {formatTimer(expiresInSeconds)}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1.5 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 text-center font-mono text-2xl font-black tracking-widest text-surface-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6 || expiresInSeconds <= 0}
                  className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin text-base">⚙</span>
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Verify &amp; Sign In to Admin →</span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('CREDENTIALS')
                    setOtp('')
                    setError('')
                    setInfoMessage('')
                  }}
                  className="font-medium text-surface-500 hover:text-surface-800 transition-colors"
                >
                  ← Change Email/Pass
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResendOtp}
                  className={`font-semibold transition-colors ${
                    resendCooldown > 0
                      ? 'text-surface-400 cursor-not-allowed'
                      : 'text-primary-600 hover:text-primary-700 hover:underline'
                  }`}
                >
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : '↻ Resend code'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-surface-100 text-center">
            <Link to="/" className="text-xs font-semibold text-surface-500 hover:text-surface-700 transition-colors">
              ← Return to PDFCompress Pro Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
